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
