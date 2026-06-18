const translations = {
  en: {
    "nav.products": "Products",
    "nav.mobile": "Mobile",
    "nav.features": "Features",
    "nav.about": "About",
    "hero.line1": "Elevate Your",
    "hero.line2": "Comfort",
    "hero.subtitle": "Modern 3-blade ceiling fans designed for silence and elegance.",
    "hero.cta": "Discover Our Fans",
    "hero.scroll": "Scroll",
    "products.tag": "Collection",
    "products.title": "Our Fans",
    "products.desc": "Four designs, one promise: silent airflow with timeless style.",
    "products.fan1.name": "Classic White",
    "products.fan1.desc": "Pure minimalism. Blends seamlessly into any interior.",
    "products.fan2.name": "Classic Rounded White",
    "products.fan2.desc": "Soft curves and elegant design. Modern comfort with rounded blades.",
    "products.fan3.name": "Natural Wood with Light",
    "products.fan3.desc": "Warm wood blades with integrated LED light. 3 color temperature settings.",
    "products.fan4.name": "Natural Brown Wood with Light",
    "products.fan4.desc": "Rich brown wood with integrated LED light. 3 color temperature settings.",
    "products.available": "Available on",
    "products.leboncoin": "Leboncoin",
    "products.ebay": "eBay",
    "products.manual": "Download Manual",
    "smart.tag": "Mobile control",
    "smart.title": "Tuya Smart, from anywhere",
    "smart.desc": "Pair your ORAE fan with the Tuya Smart app to adjust speed, timer and lighting from your phone, at home or away depending on your Wi-Fi setup.",
    "smart.point1": "speed levels",
    "smart.point2Value": "Timer",
    "smart.point2": "timer control",
    "smart.point3": "light settings on compatible models",
    "smart.appStore": "App Store",
    "smart.googlePlay": "Google Play",
    "features.tag": "Why Orae",
    "features.title": "Designed for Living",
    "features.f1.title": "Silent Motor",
    "features.f1.desc": "Ultra-quiet DC motor at 23dB. You'll never hear it running, only the gentle breeze at speed 6.",
    "features.f2.title": "3-Blade Design",
    "features.f2.desc": "Aerodynamic 3-blade configuration for optimal air circulation and modern aesthetics.",
    "features.f3.title": "Energy Efficient",
    "features.f3.desc": "Up to 85% less energy consumption compared to traditional AC motor fans.",
    "features.f4.title": "Remote Control",
    "features.f4.desc": "Included remote with 6 speed settings, timer, and reverse function.",
    "about.tag": "Our Story",
    "about.title": "Air, Reimagined",
    "about.text1": "Orae was born from a simple idea: ceiling fans should be beautiful, silent, and efficient. We design every fan with obsessive attention to detail, from the curve of each blade to the precision of the motor.",
    "about.text2": "Available now in France through our Leboncoin and eBay listings, with direct support from ORAE.",
    "footer.rights": "All rights reserved.",
    "footer.contact": "Contact:",
    "footer.availability": "Available through Leboncoin and eBay."
  },
  fr: {
    "nav.products": "Produits",
    "nav.mobile": "Mobile",
    "nav.features": "Avantages",
    "nav.about": "À propos",
    "hero.line1": "Sublimez Votre",
    "hero.line2": "Confort",
    "hero.subtitle": "Ventilateurs de plafond 3 pales modernes, alliant silence et élégance.",
    "hero.cta": "Découvrir Nos Ventilateurs",
    "hero.scroll": "Défiler",
    "products.tag": "Collection",
    "products.title": "Nos Ventilateurs",
    "products.desc": "Quatre designs, une promesse : un flux d'air silencieux au style intemporel.",
    "products.fan1.name": "Blanc Classique",
    "products.fan1.desc": "Minimalisme pur. S'intègre parfaitement à tout intérieur.",
    "products.fan2.name": "Blanc Classique Arrondi",
    "products.fan2.desc": "Courbes douces et design élégant. Confort moderne avec pales arrondies.",
    "products.fan3.name": "Bois Naturel avec Lumière",
    "products.fan3.desc": "Pales en bois chaleureux avec LED intégrée. 3 températures de couleur.",
    "products.fan4.name": "Bois Brun Naturel avec Lumière",
    "products.fan4.desc": "Bois brun riche avec LED intégrée. 3 températures de couleur.",
    "products.available": "Disponible sur",
    "products.leboncoin": "Leboncoin",
    "products.ebay": "eBay",
    "products.manual": "Télécharger le Manuel",
    "smart.tag": "Contrôle mobile",
    "smart.title": "Pilotage Tuya depuis le téléphone",
    "smart.desc": "Associez votre ventilateur ORAE à l'application Tuya Smart pour régler la vitesse, la minuterie et l'éclairage depuis votre téléphone, à la maison ou à distance selon votre configuration Wi-Fi.",
    "smart.point1": "vitesses",
    "smart.point2Value": "Minuterie",
    "smart.point2": "minuterie",
    "smart.point3": "éclairage sur les modèles compatibles",
    "smart.appStore": "App Store",
    "smart.googlePlay": "Google Play",
    "features.tag": "Pourquoi Orae",
    "features.title": "Conçu pour Vivre",
    "features.f1.title": "Moteur Silencieux",
    "features.f1.desc": "Moteur DC ultra-silencieux à 23dB. Vous ne l'entendrez jamais, seulement la brise légère à la vitesse 6.",
    "features.f2.title": "Design 3 Pales",
    "features.f2.desc": "Configuration aérodynamique à 3 pales pour une circulation d'air optimale et une esthétique moderne.",
    "features.f3.title": "Économe en Énergie",
    "features.f3.desc": "Jusqu'à 85% de consommation d'énergie en moins par rapport aux ventilateurs traditionnels.",
    "features.f4.title": "Télécommande",
    "features.f4.desc": "Télécommande incluse avec 6 vitesses, minuterie et fonction réversible.",
    "about.tag": "Notre Histoire",
    "about.title": "L'Air, Réinventé",
    "about.text1": "Orae est né d'une idée simple : les ventilateurs de plafond doivent être beaux, silencieux et efficaces. Nous concevons chaque ventilateur avec une attention obsessionnelle aux détails, de la courbe de chaque pale à la précision du moteur.",
    "about.text2": "Disponible dès maintenant en France via nos annonces Leboncoin et eBay, avec un contact direct ORAE.",
    "footer.rights": "Tous droits réservés.",
    "footer.contact": "Contact :",
    "footer.availability": "Disponible via Leboncoin et eBay."
  }
};

let currentLang = "en";

function detectLanguage() {
  const saved = localStorage.getItem("orae-lang");
  if (saved && translations[saved]) return saved;
  const browserLang = (navigator.language || navigator.userLanguage || "en").slice(0, 2).toLowerCase();
  return translations[browserLang] ? browserLang : "en";
}

function applyTranslations(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  localStorage.setItem("orae-lang", lang);

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  // Update the language toggle button text
  const langBtn = document.querySelector("#langToggle .nav__lang-text");
  if (langBtn) {
    langBtn.textContent = lang === "en" ? "FR" : "EN";
  }

  // Update page title
  document.title = lang === "fr"
    ? "OraeCF - Ventilateurs de Plafond Silencieux Premium | Design Moderne"
    : "OraeCF - Premium Silent 3-Blade Ceiling Fans | Modern Design";
}

function toggleLanguage() {
  const newLang = currentLang === "en" ? "fr" : "en";
  applyTranslations(newLang);
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  currentLang = detectLanguage();
  applyTranslations(currentLang);
  document.getElementById("langToggle").addEventListener("click", toggleLanguage);
});
