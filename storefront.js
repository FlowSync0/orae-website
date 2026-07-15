(() => {
  const isLocalPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const CONFIG_URLS = isLocalPreview
    ? ["data/storefront.json"]
    : ["/api/storefront", "data/storefront.json"];
  let storefront = null;

  function getTranslation(lang, key, fallback) {
    if (typeof translations !== "undefined" && translations[lang]?.[key]) {
      return translations[lang][key];
    }
    return fallback;
  }

  function formatPrice(priceCents, currency, lang) {
    const locale = lang === "fr" ? "fr-FR" : "en-GB";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(priceCents / 100);
  }

  function isValidCheckoutUrl(value) {
    if (!value) return false;

    try {
      const url = new URL(value);
      return url.protocol === "https:" && (
        url.hostname === "stripe.com"
        || url.hostname.endsWith(".stripe.com")
      );
    } catch {
      return false;
    }
  }

  function trackCheckout(product) {
    if (typeof window.gtag !== "function") return;

    window.gtag("event", "begin_checkout", {
      currency: storefront.currency,
      value: product.priceCents / 100,
      items: [{
        item_id: product.sku,
        item_name: product.name,
        price: product.priceCents / 100,
        quantity: 1
      }]
    });
  }

  function renderProduct(product, lang) {
    const card = document.querySelector(`[data-product="${product.id}"]`);
    if (!card) return;

    const price = card.querySelector("[data-storefront-price]");
    const stock = card.querySelector("[data-storefront-stock]");
    const button = card.querySelector("[data-checkout-button]");

    if (price) {
      price.textContent = formatPrice(product.priceCents, storefront.currency, lang);
    }

    if (stock) {
      stock.textContent = product.stock > 0
        ? getTranslation(lang, "products.stock", "{count} in stock").replace("{count}", product.stock)
        : getTranslation(lang, "products.soldOut", "Sold out");
    }

    if (!button) return;

    button.onclick = null;
    button.disabled = true;

    if (product.stock <= 0) {
      button.textContent = getTranslation(lang, "products.soldOut", "Sold out");
      return;
    }

    if (!isValidCheckoutUrl(product.checkoutUrl)) {
      button.textContent = getTranslation(lang, "products.unavailable", "Online payment being activated");
      return;
    }

    button.disabled = false;
    button.textContent = getTranslation(lang, "products.buy", "Buy from ORAE");
    button.onclick = () => {
      trackCheckout(product);
      window.location.assign(product.checkoutUrl);
    };
  }

  function renderStorefront(lang = document.documentElement.lang || "en") {
    if (!storefront) return;
    storefront.products.forEach((product) => renderProduct(product, lang));
  }

  async function loadStorefront() {
    try {
      let response;
      for (const url of CONFIG_URLS) {
        try {
          const candidate = await fetch(url, { cache: "no-store" });
          if (candidate.ok) {
            response = candidate;
            break;
          }
        } catch {
          // Continue with the static configuration when the dynamic endpoint is unavailable.
        }
      }
      if (!response) throw new Error("Storefront configuration unavailable");

      const data = await response.json();
      if (!Array.isArray(data.products) || typeof data.currency !== "string") {
        throw new Error("Invalid storefront configuration");
      }

      storefront = data;
      renderStorefront(document.documentElement.lang || "en");
    } catch (error) {
      console.error("Unable to load ORAE storefront", error);
    }
  }

  document.addEventListener("orae:languagechange", (event) => {
    renderStorefront(event.detail?.lang);
  });

  document.addEventListener("DOMContentLoaded", loadStorefront);
})();
