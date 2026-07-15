const STRIPE_API_URL = "https://api.stripe.com/v1";
const CACHE_SECONDS = 60;

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": status === 200
        ? `public, max-age=30, s-maxage=${CACHE_SECONDS}`
        : "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

async function loadStaticStorefront(context) {
  const url = new URL("/data/storefront.json", context.request.url);
  const response = await context.env.ASSETS.fetch(new Request(url));
  if (!response.ok) throw new Error("Storefront configuration unavailable");
  return response.json();
}

async function retrievePaymentLink(secretKey, paymentLinkId) {
  if (!/^plink_[A-Za-z0-9]+$/.test(paymentLinkId)) {
    throw new Error("Invalid payment link identifier");
  }

  const params = new URLSearchParams({ "expand[]": "line_items" });
  const response = await fetch(
    `${STRIPE_API_URL}/payment_links/${paymentLinkId}?${params}`,
    { headers: { Authorization: `Bearer ${secretKey}` } }
  );

  if (!response.ok) throw new Error("Stripe payment link unavailable");
  return response.json();
}

function toPublicProduct(product, paymentLink) {
  const { stripePaymentLinkId, ...publicProduct } = product;
  if (!paymentLink) return publicProduct;

  const completed = paymentLink.restrictions?.completed_sessions?.count ?? 0;
  const limit = paymentLink.restrictions?.completed_sessions?.limit ?? product.stock;
  const stock = Math.max(0, limit - completed);
  const price = paymentLink.line_items?.data?.[0]?.price;
  const isAvailable = paymentLink.active && stock > 0;

  return {
    ...publicProduct,
    priceCents: Number.isInteger(price?.unit_amount) ? price.unit_amount : product.priceCents,
    stock,
    checkoutUrl: isAvailable ? paymentLink.url : null
  };
}

async function buildStorefront(context) {
  const storefront = await loadStaticStorefront(context);
  const secretKey = context.env.STRIPE_READ_KEY;

  if (!secretKey) {
    return {
      ...storefront,
      products: storefront.products.map((product) => toPublicProduct(product))
    };
  }

  const products = await Promise.all(storefront.products.map(async (product) => {
    if (!product.stripePaymentLinkId) return toPublicProduct(product);

    try {
      const paymentLink = await retrievePaymentLink(secretKey, product.stripePaymentLinkId);
      return toPublicProduct(product, paymentLink);
    } catch {
      return toPublicProduct(product);
    }
  }));

  return { ...storefront, products };
}

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return jsonResponse({ error: "Méthode non autorisée" }, 405);
  }

  const cache = caches.default;
  const cached = await cache.match(context.request);
  if (cached) return cached;

  try {
    const response = jsonResponse(await buildStorefront(context));
    context.waitUntil(cache.put(context.request, response.clone()));
    return response;
  } catch {
    return jsonResponse({ error: "Boutique temporairement indisponible" }, 503);
  }
}
