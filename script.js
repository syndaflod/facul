gsap.registerPlugin(ScrollTrigger);

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
const lerp = (start, end, amount) => start + (end - start) * amount;
const mix = (from, to, amount) => from.map((value, index) => lerp(value, to[index], amount));
const rgb = (value, alpha = 1) => `rgba(${value[0]}, ${value[1]}, ${value[2]}, ${alpha})`;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const atmosphereStops = [
  { stop: 0.0, top: [243, 213, 169], bottom: [110, 143, 229], glow: [255, 208, 132] },
  { stop: 0.38, top: [186, 140, 118], bottom: [70, 62, 132], glow: [255, 175, 118] },
  { stop: 0.72, top: [18, 28, 68], bottom: [4, 10, 24], glow: [255, 118, 86] },
  { stop: 1.0, top: [0, 0, 0], bottom: [0, 0, 0], glow: [54, 54, 54] }
];

const initCanvasBackground = () => {
  const canvas = document.querySelector(".page-bg-canvas");
  if (!canvas) return;

  const context = canvas.getContext("2d");
  const state = { progress: 0 };

  const resize = () => {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw(state.progress);
  };

  const resolveAtmosphere = (progress) => {
    for (let index = 0; index < atmosphereStops.length - 1; index += 1) {
      const start = atmosphereStops[index];
      const end = atmosphereStops[index + 1];
      if (progress >= start.stop && progress <= end.stop) {
        const local = clamp((progress - start.stop) / (end.stop - start.stop));
        return {
          top: mix(start.top, end.top, local),
          bottom: mix(start.bottom, end.bottom, local),
          glow: mix(start.glow, end.glow, local)
        };
      }
    }

    return atmosphereStops[atmosphereStops.length - 1];
  };

  const draw = (progress) => {
    state.progress = progress;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const atmosphere = resolveAtmosphere(progress);

    context.clearRect(0, 0, width, height);

    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, rgb(atmosphere.top));
    gradient.addColorStop(1, rgb(atmosphere.bottom));
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    const glow = context.createRadialGradient(width * 0.68, height * 0.54, 0, width * 0.68, height * 0.54, Math.max(width, height) * 0.36);
    glow.addColorStop(0, rgb(atmosphere.glow, 0.28));
    glow.addColorStop(0.45, rgb(atmosphere.glow, 0.14));
    glow.addColorStop(1, rgb(atmosphere.glow, 0));
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);

    const haze = context.createRadialGradient(width * 0.2, height * 0.18, 0, width * 0.2, height * 0.18, Math.max(width, height) * 0.42);
    haze.addColorStop(0, "rgba(255,255,255,0.12)");
    haze.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = haze;
    context.fillRect(0, 0, width, height);
  };

  resize();
  window.addEventListener("resize", resize);

  gsap.to(state, {
    progress: 1,
    ease: "none",
    scrollTrigger: {
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: true
    },
    onUpdate: () => draw(state.progress)
  });
};

const initHero = () => {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.05
    }
  });

  tl.fromTo(".js-hero-eyebrow", { y: 0, opacity: 1 }, { y: -22, opacity: 0.3 }, 0)
    .fromTo(".js-hero-title", { y: 0, scale: 1, opacity: 1 }, { y: -54, scale: 0.945, opacity: 0.58 }, 0)
    .fromTo(".js-hero-text", { y: 0, opacity: 1 }, { y: -26, opacity: 0.45 }, 0)
    .fromTo(".js-hero-card-a", { y: 44, opacity: 0.12, scale: 0.96 }, { y: -18, opacity: 1, scale: 1.01 }, 0.1)
    .fromTo(".js-hero-card-b", { y: 58, opacity: 0, scale: 0.94 }, { y: -10, opacity: 0.92, scale: 1.02 }, 0.18)
    .fromTo(".js-hero-glow", { scale: 1, xPercent: 0, yPercent: 0 }, { scale: 1.26, xPercent: -10, yPercent: 8 }, 0);
};

const initPairSection = (sectionClass, prefix) => {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: sectionClass,
      start: "top top",
      end: "bottom bottom",
      scrub: 1
    }
  });

  tl.fromTo(`.js-${prefix}-index`, { y: 24, opacity: 0 }, { y: -12, opacity: 1 }, 0.04)
    .fromTo(`.js-${prefix}-title`, { y: 54, opacity: 0 }, { y: -18, opacity: 1 }, 0.1)
    .fromTo(`.js-${prefix}-text`, { y: 66, opacity: 0 }, { y: -8, opacity: 0.92 }, 0.16)
    .fromTo(`.js-${prefix}-card-1`, { y: 74, opacity: 0, scale: 0.94 }, { y: -12, opacity: 1, scale: 1.015 }, 0.24)
    .fromTo(`.js-${prefix}-card-2`, { y: 90, opacity: 0, scale: 0.92 }, { y: -4, opacity: 1, scale: 1.02 }, 0.3);
};

const initMidnight = () => {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".section-midnight",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.1
    }
  });

  tl.fromTo(".js-midnight-index", { y: 26, opacity: 0 }, { y: -10, opacity: 1 }, 0.04)
    .fromTo(".js-midnight-title", { y: 52, opacity: 0 }, { y: -16, opacity: 1 }, 0.1)
    .fromTo(".js-midnight-text", { y: 62, opacity: 0 }, { y: -6, opacity: 0.88 }, 0.16)
    .fromTo(".js-midnight-card", { y: 80, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1.015 }, 0.24);
};

const initScrollReveal = () => {
  const revealTargets = gsap.utils.toArray([
    ".copy > *",
    ".glass-card",
    ".theme-card"
  ]);

  revealTargets.forEach((element) => element.classList.add("is-reveal"));

  ScrollTrigger.batch(revealTargets, {
    start: "top 84%",
    once: true,
    onEnter: (batch) => {
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.9,
        stagger: 0.1,
        ease: "power3.out",
        onStart: () => batch.forEach((element) => element.classList.add("is-visible"))
      });
    }
  });
};

const revealPanelImmediately = (panel) => {
  if (!panel) return;

  const targets = panel.querySelectorAll(".copy > *, .glass-card, .theme-card");
  if (!targets.length) return;

  const hiddenTargets = Array.from(targets).filter((element) => element.classList.contains("is-reveal"));
  if (!hiddenTargets.length) return;

  gsap.killTweensOf(hiddenTargets);
  gsap.to(hiddenTargets, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.75,
    stagger: 0.08,
    ease: "power3.out",
    onStart: () => hiddenTargets.forEach((element) => element.classList.add("is-visible"))
  });
};

const initParallax = () => {
  gsap.utils.toArray(".theme-card").forEach((card) => {
    gsap.to(card, {
      yPercent: -6,
      ease: "none",
      scrollTrigger: {
        trigger: card,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.8
      }
    });
  });
};

const initCardHover = () => {
  const cards = document.querySelectorAll(".glass-card, .theme-card");

  cards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      if (prefersReducedMotion || window.innerWidth < 920) return;

      const bounds = card.getBoundingClientRect();
      const offsetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 10;
      const offsetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 10;

      gsap.to(card, {
        rotateX: clamp(-offsetY, -4, 4),
        rotateY: clamp(offsetX, -5, 5),
        transformPerspective: 900,
        duration: 0.35,
        ease: "power2.out"
      });
    });

    card.addEventListener("pointerleave", () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.45,
        ease: "power3.out"
      });
    });
  });
};

const initScrollNext = () => {
  const button = document.querySelector(".scroll-next");
  const panels = Array.from(document.querySelectorAll(".panel"));

  if (!button || panels.length === 0) return;

  const getNextPanel = () => {
    const threshold = window.scrollY + window.innerHeight * 0.35;
    return panels.find((panel) => panel.offsetTop > threshold) || null;
  };

  const getScrollTarget = (panel) => {
    if (!panel) return document.documentElement.scrollHeight;

    // Land slightly inside the next panel so sticky content and scroll-based reveals
    // have enough progress to render the new section immediately.
    const offset = Math.min(window.innerHeight * 0.18, 140);
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    return Math.min(panel.offsetTop + offset, maxScroll);
  };

  const updateVisibility = () => {
    const scrollBottom = window.scrollY + window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    button.classList.toggle("is-hidden", scrollBottom >= documentHeight - 24);
  };

  button.addEventListener("click", () => {
    const nextPanel = getNextPanel();

    if (!nextPanel) {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
      return;
    }

    revealPanelImmediately(nextPanel);
    window.scrollTo({ top: getScrollTarget(nextPanel), behavior: "smooth" });
  });

  window.addEventListener("scroll", updateVisibility, { passive: true });
  updateVisibility();
};

const init = () => {
  initCanvasBackground();
  initHero();
  initPairSection(".morning-a", "morning-a");
  initPairSection(".morning-b", "morning-b");
  initPairSection(".morning-c", "morning-c");
  initPairSection(".afternoon-a", "afternoon-a");
  initPairSection(".afternoon-b", "afternoon-b");
  initPairSection(".night-a", "night-a");
  initPairSection(".night-b", "night-b");
  initMidnight();
  if (!prefersReducedMotion) {
    initScrollReveal();
    initParallax();
    initCardHover();
  }
  initScrollNext();
  ScrollTrigger.refresh();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
