import assert from "node:assert/strict";
import test from "node:test";
import { onRequest } from "../functions/api/storefront.js";

const baseStorefront = {
  currency: "EUR",
  shipping: { country: "FR" },
  products: [
    {
      id: "available",
      priceCents: 15000,
      stock: 3,
      stripePaymentLinkId: "plink_available",
      checkoutUrl: "https://buy.stripe.com/static-available"
    },
    {
      id: "sold",
      priceCents: 16000,
      stock: 3,
      stripePaymentLinkId: "plink_sold",
      checkoutUrl: "https://buy.stripe.com/static-sold"
    }
  ]
};

function createContext({ method = "GET", secretKey } = {}) {
  return {
    request: new Request("https://oraecf.com/api/storefront", { method }),
    env: {
      STRIPE_READ_KEY: secretKey,
      ASSETS: {
        fetch: async () => new Response(JSON.stringify(baseStorefront))
      }
    },
    waitUntil: () => {}
  };
}

test("returns Stripe prices and remaining inventory without exposing link IDs", async () => {
  globalThis.caches = {
    default: {
      match: async () => null,
      put: async () => {}
    }
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const isSold = String(url).includes("plink_sold");
    return new Response(JSON.stringify({
      active: !isSold,
      url: isSold
        ? "https://buy.stripe.com/live-sold"
        : "https://buy.stripe.com/live-available",
      restrictions: {
        completed_sessions: {
          count: isSold ? 3 : 1,
          limit: 3
        }
      },
      line_items: {
        data: [{ price: { unit_amount: isSold ? 16600 : 15600 } }]
      }
    }));
  };

  try {
    const response = await onRequest(createContext({ secretKey: "test-read-only-token" }));
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.products[0].priceCents, 15600);
    assert.equal(payload.products[0].stock, 2);
    assert.equal(payload.products[0].checkoutUrl, "https://buy.stripe.com/live-available");
    assert.equal(payload.products[1].stock, 0);
    assert.equal(payload.products[1].checkoutUrl, null);
    assert.equal("stripePaymentLinkId" in payload.products[0], false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("keeps the static storefront available when no Stripe read key is configured", async () => {
  const response = await onRequest(createContext());
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.products[0].stock, 3);
  assert.equal(payload.products[0].checkoutUrl, "https://buy.stripe.com/static-available");
  assert.equal("stripePaymentLinkId" in payload.products[0], false);
});

test("rejects non-GET requests", async () => {
  const response = await onRequest(createContext({ method: "POST" }));
  assert.equal(response.status, 405);
});
