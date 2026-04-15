gsap.registerPlugin(ScrollTrigger);

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

if (typeof ScrollTrigger.clearScrollMemory === "function") {
  ScrollTrigger.clearScrollMemory();
}

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
const lerp = (start, end, amount) => start + (end - start) * amount;
const mix = (from, to, amount) => from.map((value, index) => lerp(value, to[index], amount));
const rgb = (value, alpha = 1) => `rgba(${value[0]}, ${value[1]}, ${value[2]}, ${alpha})`;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const resetInitialScroll = () => {
  const navigationEntry = performance.getEntriesByType?.("navigation")?.[0];
  const isReload = navigationEntry?.type === "reload";

  if (isReload || window.scrollY !== 0) {
    window.scrollTo(0, 0);
  }
};

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

const initExpandableCards = () => {
  const overlay = document.querySelector(".card-overlay");
  const backdrop = document.querySelector(".card-overlay__backdrop");
  const panel = document.querySelector(".card-overlay__panel");
  const content = document.querySelector(".card-overlay__content");
  const closeButton = document.querySelector(".card-overlay__close");
  const cards = Array.from(document.querySelectorAll("[data-expandable='true']"));

  if (!overlay || !backdrop || !panel || !content || !closeButton || cards.length === 0) return;

  document.body.classList.remove("is-overlay-open");

  const state = {
    activeCard: null,
    activeClone: null,
    activeTimeline: null
  };

  const applyScrollLock = () => {
    document.body.classList.add("is-overlay-open");
  };

  const releaseScrollLock = () => {
    document.body.classList.remove("is-overlay-open");
  };

  const getTargetBounds = () => {
    const margin = window.innerWidth <= 640 ? 12 : window.innerWidth <= 920 ? 20 : 32;
    const topInset = window.innerWidth <= 920 ? 16 : 24;
    const width = window.innerWidth - margin * 2;
    const height = Math.min(window.innerHeight - topInset * 2, Math.max(window.innerHeight * 0.88, 520));
    const top = Math.max((window.innerHeight - height) / 2, topInset);

    return {
      left: margin,
      top,
      width,
      height
    };
  };

  const createPreviewClone = (card) => {
    const clone = card.cloneNode(true);

    clone.classList.add("card-overlay__card", "card-overlay__card--preview");
    clone.removeAttribute("tabindex");
    clone.removeAttribute("data-expandable");
    clone.removeAttribute("role");
    clone.removeAttribute("aria-haspopup");
    clone.setAttribute("aria-hidden", "true");

    return clone;
  };

  const createDetailMarkup = (card) => {
    const title = card.dataset.detailTitle || card.querySelector("h2")?.textContent || "";
    const tag = card.dataset.detailTag || card.querySelector("span")?.textContent || "";
    const text = card.dataset.detailText || card.querySelector("p")?.textContent || "";
    const media = card.querySelector(".card-media");
    const visualMarkup = media ? media.outerHTML : "";

    return `
      <div class="card-overlay__inner">
        <div class="card-overlay__visual">${visualMarkup}</div>
        <div class="card-overlay__copy">
          <span class="card-overlay__eyebrow">${tag}</span>
          <h2 class="card-overlay__title" id="card-overlay-title">${title}</h2>
          <p class="card-overlay__text">${text}</p>
          <div class="card-overlay__hint">Toque fora ou pressione Esc para fechar</div>
        </div>
      </div>
    `;
  };

  const closeOverlay = () => {
    if (!state.activeCard || !state.activeClone) return;

    const sourceCard = state.activeCard;
    const clone = state.activeClone;
    const finalBounds = sourceCard.getBoundingClientRect();
    const currentBounds = clone.getBoundingClientRect();
    const copy = clone.querySelector(".card-overlay__copy");

    state.activeTimeline?.kill();

    if (copy) {
      clone.className = `${sourceCard.className} card-overlay__card card-overlay__card--preview`;
      clone.innerHTML = sourceCard.innerHTML;
      clone.style.left = `${currentBounds.left}px`;
      clone.style.top = `${currentBounds.top}px`;
      clone.style.width = `${currentBounds.width}px`;
      clone.style.height = `${currentBounds.height}px`;
      clone.style.borderRadius = `${window.innerWidth <= 640 ? 26 : 32}px`;
    }

    const tl = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => {
        clone.remove();
        state.activeCard.classList.remove("is-source-hidden");
        state.activeCard.focus({ preventScroll: true });
        overlay.classList.remove("is-open");
        overlay.setAttribute("aria-hidden", "true");
        releaseScrollLock();
        panel.style.pointerEvents = "none";
        state.activeCard = null;
        state.activeClone = null;
        state.activeTimeline = null;
      }
    });

    state.activeTimeline = tl;

    tl.to(closeButton, { opacity: 0, scale: 0.92, duration: 0.18 }, 0)
      .to(backdrop, { opacity: 0, duration: 0.34 }, 0)
      .to(clone, {
        left: finalBounds.left,
        top: finalBounds.top,
        width: finalBounds.width,
        height: finalBounds.height,
        borderRadius: gsap.getProperty(sourceCard, "borderRadius"),
        duration: 0.58
      }, 0);
  };

  const openOverlay = (card) => {
    if (state.activeCard || state.activeTimeline) return;

    const initialBounds = card.getBoundingClientRect();
    const targetBounds = getTargetBounds();
    const clone = createPreviewClone(card);

    clone.style.left = `${initialBounds.left}px`;
    clone.style.top = `${initialBounds.top}px`;
    clone.style.width = `${initialBounds.width}px`;
    clone.style.height = `${initialBounds.height}px`;
    clone.style.borderRadius = getComputedStyle(card).borderRadius;

    content.replaceChildren(clone);
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    panel.style.pointerEvents = "auto";
    applyScrollLock();
    card.classList.add("is-source-hidden");

    gsap.set(backdrop, { opacity: 0 });
    gsap.set(closeButton, { opacity: 0, scale: 0.92 });

    state.activeCard = card;
    state.activeClone = clone;

    const tl = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => {
        clone.className = "card-overlay__card";
        clone.innerHTML = createDetailMarkup(card);
        const copy = clone.querySelector(".card-overlay__copy");
        gsap.set(copy, { opacity: 0, y: 24 });
        closeButton.focus({ preventScroll: true });
        gsap.timeline({
          defaults: { ease: "power2.out" },
          onComplete: () => {
            state.activeTimeline = null;
          }
        })
          .to(closeButton, { opacity: 1, scale: 1, duration: 0.24 }, 0)
          .to(copy, { opacity: 1, y: 0, duration: 0.34 }, 0.04);
      }
    });

    state.activeTimeline = tl;

    tl.to(backdrop, { opacity: 1, duration: 0.38 }, 0)
      .to(clone, {
        left: targetBounds.left,
        top: targetBounds.top,
        width: targetBounds.width,
        height: targetBounds.height,
        borderRadius: window.innerWidth <= 640 ? 26 : 32,
        duration: 0.7
      }, 0);
  };

  cards.forEach((card) => {
    card.setAttribute("role", "button");
    card.setAttribute("aria-haspopup", "dialog");
    card.addEventListener("click", () => openOverlay(card));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openOverlay(card);
      }
    });
  });

  backdrop.addEventListener("click", closeOverlay);
  closeButton.addEventListener("click", closeOverlay);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeOverlay();
    }
  });

  window.addEventListener("resize", () => {
    if (!state.activeClone) return;
    const bounds = getTargetBounds();
    gsap.set(state.activeClone, {
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height
    });
  });
};

const initShowcaseSlider = () => {
  const slider = document.querySelector("[data-showcase-slider]");
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll("[data-showcase-slide]"));
  const dots = Array.from(slider.querySelectorAll("[data-showcase-dot]"));
  const viewport = slider.querySelector(".showcase-slider__viewport");

  if (slides.length === 0 || !viewport) return;

  let activeIndex = 0;
  const lastIndex = slides.length - 1;

  const getMetric = (name, fallback) => {
    const value = getComputedStyle(slider).getPropertyValue(name).trim();
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const getSlots = () => {
    const viewportWidth = viewport.clientWidth;
    const cardWidth = getMetric("--showcase-card-width", 1680);
    const gap = getMetric("--showcase-gap", 14);
    const offsetX = getMetric("--showcase-offset-x", 10);
    const center = ((viewportWidth - cardWidth) / 2) + offsetX;

    return {
      center,
      prev: center - cardWidth - gap,
      next: center + cardWidth + gap,
      hiddenLeft: center - ((cardWidth + gap) * 2),
      hiddenRight: center + ((cardWidth + gap) * 2)
    };
  };

  const applyState = (index) => {
    activeIndex = Math.min(Math.max(index, 0), lastIndex);
    const slots = getSlots();

    slides.forEach((slide, index) => {
      slide.classList.remove("is-side", "is-active");

      if (index === activeIndex) {
        slide.classList.add("is-active");
        slide.style.setProperty("--slide-x", `${slots.center}px`);
        return;
      }

      if (activeIndex > 0 && index === activeIndex - 1) {
        slide.classList.add("is-side");
        slide.style.setProperty("--slide-x", `${slots.prev}px`);
        return;
      }

      if (activeIndex < lastIndex && index === activeIndex + 1) {
        slide.classList.add("is-side");
        slide.style.setProperty("--slide-x", `${slots.next}px`);
        return;
      }

      slide.style.setProperty("--slide-x", `${index < activeIndex ? slots.hiddenLeft : slots.hiddenRight}px`);
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === activeIndex);
      dot.setAttribute("aria-current", index === activeIndex ? "true" : "false");
    });
  };

  const render = (nextIndex) => {
    const targetIndex = Math.min(Math.max(nextIndex, 0), lastIndex);
    if (targetIndex === activeIndex) {
      applyState(targetIndex);
      return;
    }

    applyState(targetIndex);
  };

  slides.forEach((slide, index) => {
    slide.addEventListener("click", () => {
      if (index === activeIndex) {
        return;
      }

      render(index);
    });
  });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      render(index);
    });
  });

  slider.classList.add("is-initializing");
  applyState(0);
  requestAnimationFrame(() => {
    slider.classList.remove("is-initializing");
  });
  window.addEventListener("resize", () => applyState(activeIndex));
};

const init = () => {
  initCanvasBackground();
  initHero();
  initPairSection(".morning-a", "morning-a");
  initPairSection(".morning-b", "morning-b");
  initPairSection(".morning-c", "morning-c");
  initPairSection(".afternoon-a", "afternoon-a");
  initPairSection(".afternoon-b", "afternoon-b");
  initPairSection(".afternoon-c", "afternoon-c");
  initPairSection(".night-a", "night-a");
  initPairSection(".night-b", "night-b");
  initMidnight();
  initSectionMap();
  initExpandableCards();
  initShowcaseSlider();
  ScrollTrigger.refresh();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    resetInitialScroll();
    requestAnimationFrame(() => {
      requestAnimationFrame(init);
    });
  });
} else {
  resetInitialScroll();
  requestAnimationFrame(() => {
    requestAnimationFrame(init);
  });
}
