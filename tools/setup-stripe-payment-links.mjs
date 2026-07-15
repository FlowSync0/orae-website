import { readFile, rename, writeFile } from "node:fs/promises";

const STRIPE_API_URL = "https://api.stripe.com/v1";
const STOREFRONT_URL = new URL("../data/storefront.json", import.meta.url);
const STOREFRONT_TEMP_URL = new URL("../data/storefront.json.tmp", import.meta.url);
const SUCCESS_URL = "https://oraecf.com/commande-confirmee.html";
const LIVE_CONFIRMATION = "CREATE_ORAE_LIVE_PAYMENT_LINKS";

function requireStripeKey() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || !/^(sk|rk)_(test|live)_/.test(key)) {
    throw new Error("STRIPE_SECRET_KEY must contain a valid Stripe secret or restricted key.");
  }

  const isLive = key.includes("_live_");
  if (isLive && process.env.CONFIRM_ORAE_LIVE_SETUP !== LIVE_CONFIRMATION) {
    throw new Error(`Live mode requires CONFIRM_ORAE_LIVE_SETUP=${LIVE_CONFIRMATION}.`);
  }

  return key;
}

function requireInteger(value, name, minimum = 0) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    throw new Error(`${name} must be an integer greater than or equal to ${minimum}.`);
  }
  return parsed;
}

function toParams(values) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, String(value));
  });
  return params;
}

async function stripeRequest(secretKey, path, { method = "GET", params = {} } = {}) {
  const encodedParams = toParams(params);
  const url = method === "GET" && encodedParams.size > 0
    ? `${STRIPE_API_URL}${path}?${encodedParams}`
    : `${STRIPE_API_URL}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {})
    },
    body: method === "POST" ? encodedParams : undefined
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || `Stripe request failed (${response.status}).`);
  }
  return payload;
}

async function listAll(secretKey, path, params = {}) {
  const records = [];
  let startingAfter;

  do {
    const page = await stripeRequest(secretKey, path, {
      params: {
        ...params,
        limit: 100,
        starting_after: startingAfter
      }
    });
    records.push(...page.data);
    startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
  } while (startingAfter);

  return records;
}

async function upsertProduct(secretKey, product, existingProducts) {
  const existing = existingProducts.find(
    (candidate) => candidate.metadata?.orae_product_id === product.id
  );
  const values = {
    name: product.name,
    description: product.description,
    "images[0]": product.image,
    "metadata[orae_product_id]": product.id,
    "metadata[sku]": product.sku,
    "metadata[gtin]": product.gtin
  };

  if (existing) {
    return stripeRequest(secretKey, `/products/${existing.id}`, {
      method: "POST",
      params: values
    });
  }

  return stripeRequest(secretKey, "/products", {
    method: "POST",
    params: values
  });
}

async function ensurePrice(secretKey, storefrontProduct, stripeProduct) {
  const prices = await listAll(secretKey, "/prices", {
    active: true,
    currency: "eur",
    product: stripeProduct.id,
    type: "one_time"
  });
  const matchingPrice = prices.find(
    (price) => price.unit_amount === storefrontProduct.priceCents && price.tax_behavior === "inclusive"
  );

  const price = matchingPrice || await stripeRequest(secretKey, "/prices", {
    method: "POST",
    params: {
      currency: "eur",
      unit_amount: storefrontProduct.priceCents,
      product: stripeProduct.id,
      tax_behavior: "inclusive",
      lookup_key: `orae_${storefrontProduct.id}_${storefrontProduct.priceCents}`,
      nickname: `${storefrontProduct.name} - prix site`,
      "metadata[orae_product_id]": storefrontProduct.id,
      "metadata[sku]": storefrontProduct.sku
    }
  });

  if (stripeProduct.default_price !== price.id) {
    await stripeRequest(secretKey, `/products/${stripeProduct.id}`, {
      method: "POST",
      params: { default_price: price.id }
    });
  }

  return price;
}

async function ensureShippingRate(secretKey, shipping) {
  const rates = await listAll(secretKey, "/shipping_rates", { active: true });
  const matchingRate = rates.find((rate) => (
    rate.metadata?.orae_shipping === "france_standard"
    && rate.fixed_amount?.currency === "eur"
    && rate.fixed_amount?.amount === shipping.amountCents
    && rate.delivery_estimate?.minimum?.value === shipping.minimumBusinessDays
    && rate.delivery_estimate?.maximum?.value === shipping.maximumBusinessDays
  ));

  if (matchingRate) return matchingRate;

  return stripeRequest(secretKey, "/shipping_rates", {
    method: "POST",
    params: {
      display_name: "Livraison France métropolitaine",
      type: "fixed_amount",
      "fixed_amount[amount]": shipping.amountCents,
      "fixed_amount[currency]": "eur",
      tax_behavior: "inclusive",
      tax_code: "txcd_92010001",
      "delivery_estimate[minimum][unit]": "business_day",
      "delivery_estimate[minimum][value]": shipping.minimumBusinessDays,
      "delivery_estimate[maximum][unit]": "business_day",
      "delivery_estimate[maximum][value]": shipping.maximumBusinessDays,
      "metadata[orae_shipping]": "france_standard"
    }
  });
}

function getPaymentLinkPriceId(paymentLink) {
  const price = paymentLink.line_items?.data?.[0]?.price;
  return typeof price === "string" ? price : price?.id;
}

function getPaymentLinkShippingRateId(paymentLink) {
  const rate = paymentLink.shipping_options?.[0]?.shipping_rate;
  return typeof rate === "string" ? rate : rate?.id;
}

async function ensurePaymentLink(secretKey, product, price, shippingRate, existingLinks) {
  const existingSummary = existingLinks.find(
    (candidate) => candidate.metadata?.orae_product_id === product.id
  );

  if (existingSummary) {
    const existing = await stripeRequest(secretKey, `/payment_links/${existingSummary.id}`, {
      params: { "expand[]": "line_items" }
    });
    const isCurrent = (
      getPaymentLinkPriceId(existing) === price.id
      && getPaymentLinkShippingRateId(existing) === shippingRate.id
      && existing.restrictions?.completed_sessions?.limit === product.stock
    );

    if (!isCurrent) {
      throw new Error(`The active Stripe payment link for ${product.name} differs from the storefront configuration.`);
    }
    return existing;
  }

  return stripeRequest(secretKey, "/payment_links", {
    method: "POST",
    params: {
      "line_items[0][price]": price.id,
      "line_items[0][quantity]": 1,
      "after_completion[type]": "redirect",
      "after_completion[redirect][url]": SUCCESS_URL,
      billing_address_collection: "required",
      customer_creation: "always",
      "phone_number_collection[enabled]": true,
      "shipping_address_collection[allowed_countries][0]": "FR",
      "shipping_options[0][shipping_rate]": shippingRate.id,
      "restrictions[completed_sessions][limit]": product.stock,
      submit_type: "pay",
      "custom_text[submit][message]": "Livraison en France métropolitaine. Retours sous 14 jours selon la politique de retours ORAE.",
      "metadata[orae_product_id]": product.id,
      "metadata[sku]": product.sku,
      "metadata[gtin]": product.gtin
    }
  });
}

async function main() {
  const secretKey = requireStripeKey();
  const storefront = JSON.parse(await readFile(STOREFRONT_URL, "utf8"));
  const shipping = {
    ...storefront.shipping,
    amountCents: requireInteger(
      process.env.ORAE_SHIPPING_AMOUNT_CENTS ?? storefront.shipping.amountCents,
      "ORAE_SHIPPING_AMOUNT_CENTS"
    ),
    minimumBusinessDays: requireInteger(
      process.env.ORAE_SHIPPING_MIN_BUSINESS_DAYS ?? storefront.shipping.minimumBusinessDays,
      "ORAE_SHIPPING_MIN_BUSINESS_DAYS",
      1
    ),
    maximumBusinessDays: requireInteger(
      process.env.ORAE_SHIPPING_MAX_BUSINESS_DAYS ?? storefront.shipping.maximumBusinessDays,
      "ORAE_SHIPPING_MAX_BUSINESS_DAYS",
      1
    )
  };

  if (shipping.minimumBusinessDays > shipping.maximumBusinessDays) {
    throw new Error("The minimum shipping time cannot exceed the maximum shipping time.");
  }

  const [existingProducts, existingLinks] = await Promise.all([
    listAll(secretKey, "/products", { active: true }),
    listAll(secretKey, "/payment_links", { active: true })
  ]);
  const shippingRate = await ensureShippingRate(secretKey, shipping);
  const configuredProducts = [];

  for (const product of storefront.products) {
    const stripeProduct = await upsertProduct(secretKey, product, existingProducts);
    const price = await ensurePrice(secretKey, product, stripeProduct);
    const paymentLink = await ensurePaymentLink(
      secretKey,
      product,
      price,
      shippingRate,
      existingLinks
    );

    configuredProducts.push({
      ...product,
      stripePaymentLinkId: paymentLink.id,
      checkoutUrl: paymentLink.url
    });
  }

  const configuredStorefront = {
    ...storefront,
    shipping,
    products: configuredProducts
  };
  await writeFile(STOREFRONT_TEMP_URL, `${JSON.stringify(configuredStorefront, null, 2)}\n`, {
    mode: 0o600
  });
  await rename(STOREFRONT_TEMP_URL, STOREFRONT_URL);

  process.stdout.write(`Configured ${configuredProducts.length} ORAE Stripe payment links.\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
