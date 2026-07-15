# Orae Website

Static marketing website for Orae ceiling fans.

Orae sells modern 3-blade ceiling fans built around a quiet 23 dB DC motor, remote control, reverse mode, and up to 85% lower energy consumption compared with traditional AC motors.

## Structure

- `index.html`, `styles.css`, `main.js`, `i18n.js`: live website files.
- `fan-3d.js`: procedural Three.js ceiling fan rendered in the hero (scroll-reactive spin, pointer parallax, reduced-motion aware).
- `smart-phone-3d.js`: Three.js phone model shown in the Tuya section.

The front-end uses Lenis (smooth scroll), GSAP + ScrollTrigger (reveals, parallax, marquee, counters) and Three.js (hero fan + phone), all loaded from jsDelivr. Typography is Fraunces + Inter.
- `assets/brand/`: Orae logo files used by the site and packaging.
- `assets/products/`: product and collection images used by the website.
- `assets/lifestyle/`: hero and interior lifestyle visuals.
- `assets/icons/`: reusable SVG feature icons.
- `assets/source/upscaled/`: source/upscaled PNGs kept for product image work.
- `manuals/`: downloadable PDF manuals linked from the product cards.
- `docs/`: product, Amazon, SEO, and creative notes.
- `packaging/`: carton design SVGs and PNG previews for suppliers.

## Product Line

1. Classic White
2. Classic Rounded White
3. Natural Wood with Light
4. Natural Brown Wood with Light

The shared product reference is in `docs/products/product-master.md`. Amazon content is in `docs/amazon/product-descriptions.md`.

## Local Development

Open `index.html` directly in a browser, or run a local static server from this folder.

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Deployment

The site is prepared for Cloudflare Pages, with `_headers`, `_redirects`, `robots.txt`, and `sitemap.xml` kept at the repository root.

## Links

- Website: https://oraecf.com
- Leboncoin Classic White: https://www.leboncoin.fr/ad/decoration/3218586543
- Leboncoin Classic Rounded White: https://www.leboncoin.fr/ad/decoration/3218586945
- Leboncoin Natural Wood with Light: https://www.leboncoin.fr/ad/decoration/3218587917
- Leboncoin Natural Brown Wood with Light: https://www.leboncoin.fr/ad/decoration/3218588897
- Contact: contact@oraecf.com

© 2026 Orae. All rights reserved.
