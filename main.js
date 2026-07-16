/* ── ORAE front-end orchestration ─────────────────────────────
   Lenis smooth scroll + GSAP ScrollTrigger reveals & parallax,
   scroll-velocity marquee, counters, custom cursor, magnetic
   buttons. Everything is guarded so the file can load on pages
   that only contain a subset of the elements. */

(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ── Lenis smooth scroll ── */
  let lenis = null;
  if (!reduceMotion && hasGsap && typeof Lenis !== "undefined") {
    lenis = new Lenis({ smoothWheel: true, lerp: 0.1, duration: 1.2 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ── Navigation ── */
  const nav = document.getElementById("nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("nav--scrolled", window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  if (menuBtn && mobileMenu) {
    let menuOpen = false;
    const setMenu = (open) => {
      menuOpen = open;
      menuBtn.classList.toggle("active", open);
      mobileMenu.classList.toggle("active", open);
      menuBtn.setAttribute("aria-expanded", String(open));
      mobileMenu.setAttribute("aria-hidden", String(!open));
      if (open && nav) nav.classList.add("nav--scrolled");
      else if (nav) nav.classList.toggle("nav--scrolled", window.scrollY > 40);
    };
    menuBtn.addEventListener("click", () => setMenu(!menuOpen));
    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });
  }

  /* ── Smooth anchor scrolling ── */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#") {
        e.preventDefault();
        if (lenis) lenis.scrollTo(0);
        else window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        return;
      }
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -70 });
      else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      // Keep fragment navigation semantics: update the URL and move focus
      // to the target so keyboard users (incl. the skip link) land there.
      history.pushState(null, "", href);
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  });

  /* ── Hero intro ── */
  if (hasGsap && !reduceMotion && document.querySelector(".hero")) {
    const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
    heroTl
      .from(".hero__mask > *", { yPercent: 112, duration: 1.1, stagger: 0.12 }, 0.15)
      .from(".hero__eyebrow", { y: 18, opacity: 0, duration: 0.7 }, 0.4)
      .from(".hero__subtitle", { y: 24, opacity: 0, duration: 0.8 }, "-=0.6")
      .from(".hero__actions .btn", { y: 18, opacity: 0, duration: 0.6, stagger: 0.08 }, "-=0.5")
      .from(".hero__footer", { opacity: 0, duration: 0.8 }, "-=0.3");

    gsap.to(".hero__content", {
      y: -60,
      opacity: 0,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "center center",
        end: "bottom top",
        scrub: true,
      },
    });

    gsap.to(".hero__scroll-line", {
      scaleY: 1.6,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
    });
  }

  /* ── Scroll reveals ── */
  if (hasGsap && !reduceMotion) {
    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      gsap.from(el, {
        y: 56,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      });
    });
  }

  /* ── Parallax images ── */
  if (hasGsap && !reduceMotion) {
    gsap.utils.toArray("[data-parallax-frame]").forEach((frame) => {
      const img = frame.querySelector("[data-parallax-img]");
      if (!img) return;
      gsap.fromTo(
        img,
        { yPercent: -12 },
        {
          yPercent: 0,
          ease: "none",
          scrollTrigger: {
            trigger: frame,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    });
  }

  /* ── Marquee (built from i18n, reacts to scroll velocity) ── */
  const marqueeTrack = document.querySelector("[data-marquee]");
  if (marqueeTrack) {
    const FALLBACK =
      "Silent DC motor · 23 dB · 6 speeds · Tuya Smart control · Integrated LED · 85% energy savings · 3-blade design";

    const buildMarquee = () => {
      const source =
        (window.OraeI18n && window.OraeI18n.t("marquee.items")) || FALLBACK;
      const items = source.split("·").map((item) => item.trim()).filter(Boolean);
      marqueeTrack.innerHTML = "";
      // Two identical halves so a -50% translate loops seamlessly; a single
      // set when the track is static (reduced motion wraps it as a list).
      const halves = reduceMotion ? 1 : 2;
      for (let half = 0; half < halves; half++) {
        items.forEach((item) => {
          const span = document.createElement("span");
          span.className = "marquee__item";
          span.textContent = item;
          const dot = document.createElement("span");
          dot.className = "marquee__dot";
          span.appendChild(dot);
          marqueeTrack.appendChild(span);
        });
      }
    };

    buildMarquee();
    document.addEventListener("orae:languagechange", buildMarquee);

    if (hasGsap && !reduceMotion) {
      const marqueeTween = gsap.to(marqueeTrack, {
        xPercent: -50,
        duration: 26,
        repeat: -1,
        ease: "none",
      });
      let speed = 1;
      if (lenis) {
        lenis.on("scroll", (e) => {
          speed = 1 + Math.min(Math.abs(e.velocity) * 0.06, 3);
        });
      }
      gsap.ticker.add(() => {
        const current = marqueeTween.timeScale();
        marqueeTween.timeScale(current + (speed - current) * 0.06);
        speed += (1 - speed) * 0.04;
      });
    }
  }

  /* ── FAQ accordion ── */
  const faqSection = document.querySelector(".faq");
  if (faqSection) {
    const items = Array.from(faqSection.querySelectorAll(".faq-item"));
    // The enhanced class switches the CSS to collapsed-by-default; without
    // JS every answer stays visible so the content is never trapped.
    if (items.length) faqSection.classList.add("faq--enhanced");
    items.forEach((item) => {
      const trigger = item.querySelector(".faq-item__trigger");
      const panel = item.querySelector(".faq-item__panel");
      if (!trigger || !panel) return;
      trigger.setAttribute("aria-expanded", "false");
      panel.setAttribute("inert", "");
      trigger.addEventListener("click", () => {
        const open = item.classList.toggle("is-open");
        trigger.setAttribute("aria-expanded", String(open));
        if (open) panel.removeAttribute("inert");
        else panel.setAttribute("inert", "");
        // Panel height changed: trigger positions below the FAQ are stale.
        if (hasGsap) ScrollTrigger.refresh();
      });
    });
  }

  /* ── Stat counters ── */
  if (hasGsap && !reduceMotion) {
    document.querySelectorAll("[data-counter]").forEach((el) => {
      const end = parseFloat(el.dataset.counter);
      if (Number.isNaN(end)) return;
      const state = { value: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: () => {
          gsap.to(state, {
            value: end,
            duration: 1.8,
            ease: "power2.out",
            onUpdate: () => {
              el.textContent = String(Math.round(state.value));
            },
          });
        },
      });
    });
  }

  /* ── Custom cursor ── */
  if (finePointer && !reduceMotion) {
    const cursor = document.querySelector(".cursor");
    const dot = document.querySelector(".cursor__dot");
    const ring = document.querySelector(".cursor__ring");
    if (cursor && dot && ring) {
      document.documentElement.classList.add("has-cursor");
      const pos = { x: -100, y: -100 };
      const ringPos = { x: -100, y: -100 };
      let visible = false;

      window.addEventListener("pointermove", (e) => {
        pos.x = e.clientX;
        pos.y = e.clientY;
        if (!visible) {
          visible = true;
          ringPos.x = pos.x;
          ringPos.y = pos.y;
          dot.style.opacity = "1";
          ring.style.opacity = "1";
        }
      }, { passive: true });

      const raf = () => {
        ringPos.x += (pos.x - ringPos.x) * 0.16;
        ringPos.y += (pos.y - ringPos.y) * 0.16;
        dot.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
        ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px)`;
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);

      const viewLabel = () =>
        (window.OraeI18n && window.OraeI18n.t("cursor.view")) || "View";

      document.querySelectorAll("[data-cursor], a, button").forEach((el) => {
        el.addEventListener("pointerenter", () => {
          const mode = el.dataset.cursor || "hover";
          cursor.classList.toggle("cursor--view", mode === "view");
          cursor.classList.add("cursor--hover");
          if (mode === "view") ring.setAttribute("data-label", viewLabel());
        });
        el.addEventListener("pointerleave", () => {
          cursor.classList.remove("cursor--hover", "cursor--view");
        });
      });
    }
  }

  /* ── Cookie consent (Google Analytics only loads data after opt-in) ── */
  if (typeof gtag === "function") {
    const CONSENT_KEY = "orae-consent";
    const CONSENT_MAX_AGE = 1000 * 60 * 60 * 24 * 182; // ~6 months
    const tr = (key, fallback) =>
      (window.OraeI18n && window.OraeI18n.t(key)) || fallback;

    let banner = null;

    function readConsent() {
      try {
        const raw = localStorage.getItem(CONSENT_KEY);
        if (!raw) return null;
        const saved = JSON.parse(raw);
        if (!saved.at || Date.now() - saved.at > CONSENT_MAX_AGE) return null;
        return saved.value;
      } catch (error) {
        return null;
      }
    }

    function storeConsent(value) {
      try {
        localStorage.setItem(CONSENT_KEY, JSON.stringify({ value, at: Date.now() }));
      } catch (error) {
        // Choice simply won't persist when storage is unavailable.
      }
    }

    function applyConsent(value) {
      gtag("consent", "update", {
        analytics_storage: value === "granted" ? "granted" : "denied",
      });
    }

    function hideBanner() {
      if (banner) banner.classList.remove("consent--visible");
    }

    function showBanner() {
      if (!banner) {
        banner = document.createElement("div");
        banner.className = "consent";
        banner.setAttribute("role", "region");
        banner.setAttribute("aria-label", "Cookies");
        banner.innerHTML = `
          <p class="consent__text"></p>
          <div class="consent__actions">
            <button type="button" class="consent__btn consent__btn--accept"></button>
            <button type="button" class="consent__btn consent__btn--refuse"></button>
            <a class="consent__more" href="/politique-confidentialite.html"></a>
          </div>`;
        document.body.appendChild(banner);

        banner.querySelector(".consent__btn--accept").addEventListener("click", () => {
          storeConsent("granted");
          applyConsent("granted");
          hideBanner();
        });
        banner.querySelector(".consent__btn--refuse").addEventListener("click", () => {
          storeConsent("denied");
          applyConsent("denied");
          hideBanner();
        });
      }
      const fill = () => {
        banner.querySelector(".consent__text").textContent = tr(
          "consent.text",
          "Nous utilisons des cookies de mesure d'audience uniquement si vous les acceptez."
        );
        banner.querySelector(".consent__btn--accept").textContent = tr("consent.accept", "Accepter");
        banner.querySelector(".consent__btn--refuse").textContent = tr("consent.refuse", "Refuser");
        banner.querySelector(".consent__more").textContent = tr("consent.more", "En savoir plus");
      };
      fill();
      document.addEventListener("orae:languagechange", fill);
      requestAnimationFrame(() => banner.classList.add("consent--visible"));
    }

    const saved = readConsent();
    if (saved === "granted") applyConsent("granted");
    else if (saved === null) showBanner();

    const manageBtn = document.getElementById("manageCookies");
    if (manageBtn) manageBtn.addEventListener("click", showBanner);
  }

  /* ── Product image lightbox ── */
  const mediaEls = document.querySelectorAll(".product-row__media");
  if (mediaEls.length) {
    const lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.hidden = true;
    lightbox.innerHTML = `
      <button type="button" class="lightbox__close" data-i18n-aria="lightbox.close" aria-label="Fermer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
      <figure class="lightbox__figure">
        <img class="lightbox__img" alt="">
        <figcaption class="lightbox__caption"></figcaption>
      </figure>`;
    document.body.appendChild(lightbox);

    const lbImg = lightbox.querySelector(".lightbox__img");
    const lbCaption = lightbox.querySelector(".lightbox__caption");
    const lbClose = lightbox.querySelector(".lightbox__close");
    let lastOpener = null;

    const t = (key, fallback) =>
      (window.OraeI18n && window.OraeI18n.t(key)) || fallback;

    function openLightbox(media) {
      const row = media.closest(".product-row");
      const img = media.querySelector(".product-row__img--product") || media.querySelector("img");
      if (!img) return;
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt || "";
      lbCaption.textContent = row?.querySelector(".product-row__name")?.textContent || "";
      lastOpener = media;
      lightbox.hidden = false;
      requestAnimationFrame(() => lightbox.classList.add("lightbox--open"));
      document.body.style.overflow = "hidden";
      if (lenis) lenis.stop();
      lbClose.focus({ preventScroll: true });
    }

    function closeLightbox() {
      lightbox.classList.remove("lightbox--open");
      lightbox.hidden = true;
      document.body.style.overflow = "";
      if (lenis) lenis.start();
      if (lastOpener) lastOpener.focus({ preventScroll: true });
    }

    lbClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
    });

    mediaEls.forEach((media) => {
      media.setAttribute("role", "button");
      media.setAttribute("tabindex", "0");
      media.setAttribute("aria-label", t("lightbox.view", "Voir l'image en grand"));
      media.addEventListener("click", () => openLightbox(media));
      media.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLightbox(media);
        }
      });
    });

    document.addEventListener("orae:languagechange", () => {
      mediaEls.forEach((media) => {
        media.setAttribute("aria-label", t("lightbox.view", "Voir l'image en grand"));
      });
    });
  }

  /* ── Magnetic elements ── */
  if (finePointer && !reduceMotion && hasGsap) {
    document.querySelectorAll(".magnetic").forEach((el) => {
      const strength = 0.32;
      el.addEventListener("pointermove", (e) => {
        const rect = el.getBoundingClientRect();
        const relX = e.clientX - rect.left - rect.width / 2;
        const relY = e.clientY - rect.top - rect.height / 2;
        gsap.to(el, {
          x: relX * strength,
          y: relY * strength,
          duration: 0.4,
          ease: "power2.out",
        });
      });
      el.addEventListener("pointerleave", () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
      });
    });
  }
})();
