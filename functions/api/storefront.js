import { buildStorefront } from "./storefront-core.js";

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
