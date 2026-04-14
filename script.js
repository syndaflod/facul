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

  window.getHeroAnimationConfig().forEach(({ selector, from, to, position }) => {
    tl.fromTo(selector, from, to, position);
  });
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

const initSectionMap = () => {
  const map = document.querySelector(".section-map");
  const itemsContainer = document.querySelector(".section-map__items");
  const config = window.getSectionMapConfig?.() || [];

  if (!map || !itemsContainer || config.length === 0) return;

  const sections = config
    .map((item) => ({ ...item, element: document.querySelector(item.selector) }))
    .filter((item) => item.element);

  if (sections.length === 0) return;

  const buttons = sections.map((section, index) => {
    const button = document.createElement("button");
    const label = document.createElement("span");

    button.type = "button";
    button.className = "section-map__item";
    button.dataset.index = String(index);
    button.setAttribute("aria-label", `Ir para ${section.label}`);
    button.style.setProperty("--node-size", `${section.size || 26}px`);

    label.className = "section-map__label";
    label.textContent = section.label;
    button.appendChild(label);

    const getScrollTarget = () => {
      const inset = Math.min(window.innerHeight * 0.08, 72);
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      return Math.min(Math.max(section.element.offsetTop - inset, 0), maxScroll);
    };

    button.addEventListener("click", () => {
      window.scrollTo({ top: Math.max(getScrollTarget(), 0), behavior: "smooth" });
    });

    itemsContainer.appendChild(button);
    return button;
  });

  const applyState = (activeIndex) => {
    const states = window.getSectionMapState(activeIndex, buttons.length);

    buttons.forEach((button, index) => {
      button.classList.toggle("is-past", states[index] === "past");
      button.classList.toggle("is-current", states[index] === "current");
      button.classList.toggle("is-upcoming", states[index] === "upcoming");
      button.setAttribute("aria-current", states[index] === "current" ? "true" : "false");
    });
  };

  const getActiveIndex = () => {
    const focusLine = window.innerHeight * 0.5;
    const current = sections.findIndex(({ element }) => {
      const rect = element.getBoundingClientRect();
      return rect.top <= focusLine && rect.bottom >= focusLine;
    });

    if (current >= 0) return current;
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
      return sections.length - 1;
    }

    return 0;
  };

  const update = () => applyState(getActiveIndex());

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
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
  initSectionMap();
  ScrollTrigger.refresh();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
