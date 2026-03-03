/* ── Lenis + GSAP Setup ── */
gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({
  smoothWheel: true,
  lerp: 0.1,
  duration: 1.2,
});

lenis.on("scroll", ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

/* ── Navigation ── */
const nav = document.getElementById("nav");
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");
let menuOpen = false;

// Navbar background on scroll
ScrollTrigger.create({
  start: "top -80",
  onUpdate: (self) => {
    nav.classList.toggle("nav--scrolled", self.progress > 0);
  },
});

// Mobile menu toggle
menuBtn.addEventListener("click", () => {
  menuOpen = !menuOpen;
  menuBtn.classList.toggle("active", menuOpen);
  mobileMenu.classList.toggle("active", menuOpen);
  menuBtn.setAttribute("aria-expanded", menuOpen);
  mobileMenu.setAttribute("aria-hidden", !menuOpen);
});

// Close mobile menu on link click
mobileMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuOpen = false;
    menuBtn.classList.remove("active");
    mobileMenu.classList.remove("active");
    menuBtn.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
  });
});

/* ── Hero Animations ── */
const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

heroTl
  .from(".hero__title-line", {
    y: 80,
    opacity: 0,
    duration: 1,
    stagger: 0.2,
  })
  .from(".hero__subtitle", { y: 30, opacity: 0, duration: 0.8 }, "-=0.4")
  .from(".hero__cta", { y: 20, opacity: 0, duration: 0.6 }, "-=0.3")
  .from(".hero__scroll-indicator", { opacity: 0, duration: 0.6 }, "-=0.2");

// Hero parallax on scroll
gsap.to(".hero__bg", {
  y: "30%",
  ease: "none",
  scrollTrigger: {
    trigger: ".hero",
    start: "top top",
    end: "bottom top",
    scrub: true,
  },
});

// Hero content fade out on scroll
gsap.to(".hero__content", {
  y: -50,
  opacity: 0,
  ease: "none",
  scrollTrigger: {
    trigger: ".hero",
    start: "center center",
    end: "bottom top",
    scrub: true,
  },
});

/* ── Section Headers ── */
gsap.utils.toArray(".section-tag, .section-title, .section-desc").forEach((el) => {
  gsap.from(el, {
    y: 40,
    opacity: 0,
    duration: 0.8,
    ease: "power2.out",
    scrollTrigger: {
      trigger: el,
      start: "top 85%",
      toggleActions: "play none none none",
    },
  });
});

/* ── Product Cards ── */
// Showcase image
gsap.from(".products__showcase", {
  y: 40,
  opacity: 0,
  scale: 0.97,
  duration: 1,
  ease: "power2.out",
  scrollTrigger: {
    trigger: ".products__showcase",
    start: "top 85%",
    toggleActions: "play none none none",
  },
});

gsap.utils.toArray(".product-card").forEach((card, i) => {
  gsap.from(card, {
    y: 60,
    opacity: 0,
    duration: 0.8,
    delay: i * 0.1,
    ease: "power2.out",
    scrollTrigger: {
      trigger: card,
      start: "top 85%",
      toggleActions: "play none none none",
    },
  });
});

// Fan SVG hover rotation
document.querySelectorAll(".product-card").forEach((card) => {
  const fan = card.querySelector(".product-card__fan-svg");
  if (!fan) return;

  let rotation = { value: 0 };
  let spinTween = null;

  card.addEventListener("mouseenter", () => {
    spinTween = gsap.to(rotation, {
      value: "+=360",
      duration: 2,
      repeat: -1,
      ease: "none",
      onUpdate: () => {
        fan.style.transform = `rotate(${rotation.value}deg)`;
      },
    });
  });

  card.addEventListener("mouseleave", () => {
    if (spinTween) {
      spinTween.kill();
      gsap.to(rotation, {
        value: Math.ceil(rotation.value / 360) * 360,
        duration: 1,
        ease: "power2.out",
        onUpdate: () => {
          fan.style.transform = `rotate(${rotation.value}deg)`;
        },
      });
    }
  });
});

/* ── Feature Cards ── */
// Lifestyle image
gsap.from(".features__image", {
  y: 40,
  opacity: 0,
  scale: 0.97,
  duration: 1,
  ease: "power2.out",
  scrollTrigger: {
    trigger: ".features__image",
    start: "top 85%",
    toggleActions: "play none none none",
  },
});

gsap.utils.toArray(".feature-card").forEach((card, i) => {
  gsap.from(card, {
    y: 50,
    opacity: 0,
    duration: 0.7,
    delay: i * 0.1,
    ease: "power2.out",
    scrollTrigger: {
      trigger: card,
      start: "top 85%",
      toggleActions: "play none none none",
    },
  });
});

/* ── About Section ── */
gsap.from(".about__content", {
  x: -60,
  opacity: 0,
  duration: 1,
  ease: "power2.out",
  scrollTrigger: {
    trigger: ".about",
    start: "top 70%",
    toggleActions: "play none none none",
  },
});

gsap.from(".about__logo-large", {
  x: 60,
  opacity: 0,
  scale: 0.8,
  duration: 1,
  ease: "power2.out",
  scrollTrigger: {
    trigger: ".about",
    start: "top 70%",
    toggleActions: "play none none none",
  },
});

// Slow rotation of the about logo
gsap.to(".about__logo-large svg", {
  rotation: 360,
  duration: 60,
  repeat: -1,
  ease: "none",
  transformOrigin: "center center",
});

/* ── Scroll indicator bounce ── */
gsap.to(".hero__scroll-line", {
  scaleY: 1.5,
  duration: 1,
  repeat: -1,
  yoyo: true,
  ease: "power1.inOut",
});

/* ── Smooth anchor scrolling via Lenis ── */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute("href"));
    if (target) {
      lenis.scrollTo(target, { offset: -80 });
    }
  });
});
