// Google Merchant Center product feed (RSS 2.0 + g: namespace), generated
// from the storefront configuration with live Stripe stock, so availability
// always matches what the site sells.

import { buildStorefront } from "../api/storefront-core.js";

const CACHE_SECONDS = 600;
const SITE = "https://oraecf.com";
// Google taxonomy: Home & Garden > ... > Ceiling Fans
const GOOGLE_CATEGORY = "608";

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function toItem(product) {
  const price = `${(product.priceCents / 100).toFixed(2)} EUR`;
  const availability = product.stock > 0 && product.checkoutUrl ? "in_stock" : "out_of_stock";
  const lifestyleImage = product.image?.replace("-product.webp", "-lifestyle.webp");

  return `    <item>
      <g:id>${escapeXml(product.sku)}</g:id>
      <g:title>${escapeXml(`${product.name} — Ventilateur de plafond silencieux`)}</g:title>
      <g:description>${escapeXml(product.description)}</g:description>
      <g:link>${escapeXml(`${SITE}/#${product.id}`)}</g:link>
      <g:image_link>${escapeXml(product.image)}</g:image_link>
${lifestyleImage && lifestyleImage !== product.image ? `      <g:additional_image_link>${escapeXml(lifestyleImage)}</g:additional_image_link>\n` : ""}      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
      <g:condition>new</g:condition>
      <g:brand>ORAE</g:brand>
      <g:gtin>${escapeXml(product.gtin)}</g:gtin>
      <g:mpn>${escapeXml(product.sku)}</g:mpn>
      <g:identifier_exists>yes</g:identifier_exists>
      <g:google_product_category>${GOOGLE_CATEGORY}</g:google_product_category>
      <g:product_type>Maison et jardin &gt; Ventilateurs de plafond</g:product_type>
      <g:shipping>
        <g:country>FR</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
    </item>`;
}

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return new Response("Méthode non autorisée", { status: 405 });
  }

  const cache = caches.default;
  const cached = await cache.match(context.request);
  if (cached) return cached;

  try {
    const storefront = await buildStorefront(context);
    const items = storefront.products
      .filter((product) => product.sku && product.gtin)
      .map(toItem)
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>ORAE — Ventilateurs de plafond</title>
    <link>${SITE}</link>
    <description>Ventilateurs de plafond ORAE : moteur DC silencieux, télécommande, contrôle Tuya Smart, livraison offerte en France métropolitaine.</description>
${items}
  </channel>
</rss>
`;

    const response = new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": `public, max-age=300, s-maxage=${CACHE_SECONDS}`,
        "X-Content-Type-Options": "nosniff"
      }
    });
    context.waitUntil(cache.put(context.request, response.clone()));
    return response;
  } catch {
    return new Response("Flux temporairement indisponible", { status: 503 });
  }
}
