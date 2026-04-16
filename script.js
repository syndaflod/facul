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
const disableScrollEffectsForTest = true;

const initSmoothScroll = () => {
  if (prefersReducedMotion || !window.Lenis) return null;

  const lenis = new Lenis({
    duration: 2.75,
    easing: (value) => 1 - Math.pow(1 - value, 5),
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: 0.08,
    touchMultiplier: 0.42
  });

  window.lenis = lenis;
  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  return lenis;
};

const initTextScrollBlur = () => {
  if (prefersReducedMotion || disableScrollEffectsForTest) return;

  const root = document.documentElement;
  const setBlur = gsap.quickSetter(root, "--text-scroll-blur");
  let currentBlur = 0;
  let lastScroll = window.scrollY;
  let lastTime = performance.now();

  gsap.ticker.add(() => {
    const now = performance.now();
    let velocity = 0;

    if (window.lenis && typeof window.lenis.velocity === "number") {
      velocity = Math.abs(window.lenis.velocity);
    } else {
      const scroll = window.scrollY;
      velocity = Math.abs(scroll - lastScroll) / Math.max(now - lastTime, 16) * 16;
      lastScroll = scroll;
      lastTime = now;
    }

    const targetBlur = clamp(velocity * 0.075, 0, 4.5);
    const ease = targetBlur > currentBlur ? 0.32 : 0.12;
    currentBlur = lerp(currentBlur, targetBlur, ease);

    if (currentBlur < 0.015) currentBlur = 0;
    setBlur(`${currentBlur.toFixed(3)}px`);
  });
};

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

  if (disableScrollEffectsForTest) return;

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

const initThreeBackground = () => {
  if (disableScrollEffectsForTest) {
    initCanvasBackground();
    return;
  }

  const canvas = document.querySelector(".page-bg-canvas");
  const THREE = window.THREE;

  if (!canvas || !THREE) {
    initCanvasBackground();
    return;
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x040713, 0.045);

  const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 80);
  camera.position.set(0, 0.15, 8.5);

  const state = {
    progress: 0,
    pointerX: 0,
    pointerY: 0
  };

  const corridor = new THREE.Group();
  scene.add(corridor);

  const createGradientTexture = () => {
    const gradientCanvas = document.createElement("canvas");
    gradientCanvas.width = 32;
    gradientCanvas.height = 512;

    const context = gradientCanvas.getContext("2d");
    const gradient = context.createLinearGradient(0, 0, 0, gradientCanvas.height);
    gradient.addColorStop(0, "#f3d5a9");
    gradient.addColorStop(0.42, "#6d5cc4");
    gradient.addColorStop(1, "#040713");
    context.fillStyle = gradient;
    context.fillRect(0, 0, gradientCanvas.width, gradientCanvas.height);

    const texture = new THREE.CanvasTexture(gradientCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  const world = new THREE.Mesh(
    new THREE.SphereGeometry(36, 40, 40),
    new THREE.MeshBasicMaterial({
      map: createGradientTexture(),
      side: THREE.BackSide
    })
  );
  scene.add(world);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambientLight);

  const keyLight = new THREE.PointLight(0xffcc92, 11, 30, 2);
  keyLight.position.set(3, 2, 6);
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0x6fa7ff, 7, 30, 2);
  fillLight.position.set(-4, -2, 2);
  scene.add(fillLight);

  const glowMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#ffd8b5"),
    emissive: new THREE.Color("#ffb36d"),
    emissiveIntensity: 0.9,
    roughness: 0.16,
    metalness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.18,
    transparent: true,
    opacity: 0.94
  });

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#d9e4ff"),
    emissive: new THREE.Color("#4e6cff"),
    emissiveIntensity: 0.22,
    roughness: 0.08,
    metalness: 0.04,
    transmission: 0.18,
    transparent: true,
    opacity: 0.62
  });

  const matteMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#f7f0e8"),
    roughness: 0.42,
    metalness: 0.08
  });

  const createNode = (type, x, y, z, scale, colorOffset = 0) => {
    let geometry;

    if (type === "core") geometry = new THREE.IcosahedronGeometry(1.3, 5);
    if (type === "ring") geometry = new THREE.TorusKnotGeometry(0.72, 0.2, 120, 16);
    if (type === "orb") geometry = new THREE.SphereGeometry(0.9, 32, 32);
    if (type === "tower") geometry = new THREE.OctahedronGeometry(1.05, 0);
    if (type === "gate") geometry = new THREE.TorusGeometry(1.05, 0.16, 24, 96);

    const material =
      type === "core" || type === "orb"
        ? glowMaterial.clone()
        : type === "ring" || type === "gate"
          ? glassMaterial.clone()
          : matteMaterial.clone();

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(scale);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    mesh.userData = {
      baseX: x,
      baseY: y,
      baseZ: z,
      spinX: (Math.random() * 0.4 + 0.08) * (Math.random() > 0.5 ? 1 : -1),
      spinY: (Math.random() * 0.55 + 0.12) * (Math.random() > 0.5 ? 1 : -1),
      bob: Math.random() * Math.PI * 2,
      drift: 0.12 + Math.random() * 0.2
    };

    if (material.color) {
      material.color.offsetHSL(colorOffset, 0, 0);
    }

    corridor.add(mesh);
    return mesh;
  };

  const nodes = [
    createNode("core", 0, 0, 0, 1.35, 0),
    createNode("ring", -2.7, 1.2, -5.5, 0.95, -0.01),
    createNode("orb", 2.9, -1.4, -10.5, 0.9, 0.02),
    createNode("tower", -3.6, -0.3, -15.5, 1.2, -0.03),
    createNode("gate", 2.8, 1.45, -21, 1.28, 0.03),
    createNode("orb", -1.2, -1.7, -26.5, 1.1, -0.02),
    createNode("ring", 3.3, 0.5, -32, 1.35, 0.01),
    createNode("core", -2.5, 1.3, -38, 1.05, 0),
    createNode("gate", 0.6, -1.1, -44, 1.45, -0.02)
  ];

  const starCount = prefersReducedMotion ? 180 : 320;
  const starPositions = new Float32Array(starCount * 3);

  for (let index = 0; index < starCount; index += 1) {
    const stride = index * 3;
    starPositions[stride] = (Math.random() - 0.5) * 22;
    starPositions[stride + 1] = (Math.random() - 0.5) * 13;
    starPositions[stride + 2] = -Math.random() * 54 + 6;
  }

  const starsGeometry = new THREE.BufferGeometry();
  starsGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));

  const starsMaterial = new THREE.PointsMaterial({
    color: new THREE.Color("#ffe7c8"),
    size: 0.09,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);

  const resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.fov = width < 720 ? 56 : 48;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
  };

  const applyAtmosphere = (progress) => {
    const atmosphere = resolveAtmosphere(progress);
    const top = new THREE.Color(`rgb(${atmosphere.top[0]}, ${atmosphere.top[1]}, ${atmosphere.top[2]})`);
    const bottom = new THREE.Color(`rgb(${atmosphere.bottom[0]}, ${atmosphere.bottom[1]}, ${atmosphere.bottom[2]})`);
    const glow = new THREE.Color(`rgb(${atmosphere.glow[0]}, ${atmosphere.glow[1]}, ${atmosphere.glow[2]})`);

    scene.fog.color.copy(bottom);
    keyLight.color.copy(glow);
    fillLight.color.copy(bottom.clone().lerp(top, 0.58));
    glowMaterial.color.copy(top.clone().lerp(glow, 0.24));
    glowMaterial.emissive.copy(glow);
    glassMaterial.color.copy(top.clone().lerp(bottom, 0.16));
    glassMaterial.emissive.copy(bottom.clone().lerp(glow, 0.52));
    matteMaterial.color.copy(top.clone().lerp(bottom, 0.3));
    starsMaterial.color.copy(top.clone().lerp(glow, 0.4));
    starsMaterial.opacity = 0.22 + (1 - progress) * 0.5;
    renderer.setClearColor(bottom, 1);
  };

  const getCameraPath = (progress) => ({
    x: Math.sin(progress * Math.PI * 2.2) * 1.25,
    y: lerp(0.65, -1.35, progress) + Math.sin(progress * Math.PI * 5) * 0.18,
    z: lerp(8.5, -43, progress)
  });

  const getLookTarget = (progress) => ({
    x: Math.sin(progress * Math.PI * 1.7) * 0.7,
    y: Math.cos(progress * Math.PI * 3.4) * 0.25,
    z: lerp(-2, -48, progress)
  });

  const pointerStrength = prefersReducedMotion ? 0.08 : 0.22;

  const renderFrame = (time = performance.now() * 0.001) => {
    if (document.hidden) return;

    const progress = state.progress;
    const cameraPath = getCameraPath(progress);
    const lookTarget = getLookTarget(progress);

    camera.position.x = cameraPath.x + state.pointerX * pointerStrength;
    camera.position.y = cameraPath.y - state.pointerY * pointerStrength * 0.7;
    camera.position.z = cameraPath.z;
    camera.lookAt(
      lookTarget.x + state.pointerX * 0.2,
      lookTarget.y - state.pointerY * 0.14,
      lookTarget.z
    );

    corridor.rotation.z = Math.sin(progress * Math.PI * 2) * 0.05;
    corridor.position.x = Math.sin(progress * Math.PI * 4) * 0.15;

    nodes.forEach((node, index) => {
      const drift = Math.sin(time * node.userData.drift + node.userData.bob);
      node.rotation.x += 0.0025 * node.userData.spinX;
      node.rotation.y += 0.0025 * node.userData.spinY;
      node.position.x = node.userData.baseX + Math.sin(time * 0.45 + index) * 0.12;
      node.position.y = node.userData.baseY + drift * 0.32;
      node.position.z = node.userData.baseZ;
    });

    stars.rotation.y = time * 0.02 + progress * 0.18;
    stars.position.z = progress * 6;

    keyLight.position.z = camera.position.z + 4;
    keyLight.position.x = camera.position.x + 2.6;
    fillLight.position.z = camera.position.z - 2;

    renderer.render(scene, camera);
  };

  window.addEventListener("pointermove", (event) => {
    state.pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
    state.pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  window.addEventListener("resize", resize);
  resize();
  applyAtmosphere(0);
  gsap.ticker.add(renderFrame);

  gsap.to(state, {
    progress: 1,
    ease: "none",
    scrollTrigger: {
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: true
    },
    onUpdate: () => applyAtmosphere(state.progress)
  });
};

const initHero = () => {
  if (disableScrollEffectsForTest) return;

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
  if (disableScrollEffectsForTest) return;

  const section = document.querySelector(sectionClass);
  if (!section) return;
  section.classList.add("is-scroll-motion");

  const copyNodes = [
    `.js-${prefix}-index`,
    `.js-${prefix}-title`,
    `.js-${prefix}-text`
  ].flatMap((selector) => gsap.utils.toArray(selector));

  const cardNodes = [
    `.js-${prefix}-card-1`,
    `.js-${prefix}-card-2`,
    `.js-${prefix}-slider`
  ].flatMap((selector) => gsap.utils.toArray(selector));

  gsap.set([...copyNodes, ...cardNodes], {
    opacity: 1,
    force3D: true
  });

  copyNodes.forEach((node, index) => {
    gsap.fromTo(node, {
      y: 72 + index * 10
    }, {
      y: -54 - index * 8,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.25
      }
    });
  });

  cardNodes.forEach((node, index) => {
    gsap.fromTo(node, {
      y: 120 + index * 42,
      rotate: index === 0 ? -0.8 : 0.8,
      scale: 0.985
    }, {
      y: -96 - index * 34,
      rotate: index === 0 ? 0.7 : -0.7,
      scale: 1.012,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.35
      }
    });
  });

  gsap.fromTo(section.querySelector(".sticky-frame"), {
    y: 34
  }, {
    y: -28,
    ease: "none",
    scrollTrigger: {
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      scrub: 1.6
    }
  });
};

const initMidnight = () => {
  if (disableScrollEffectsForTest) return;

  const section = document.querySelector(".section-midnight");
  if (!section) return;
  section.classList.add("is-scroll-motion");

  const copyNodes = gsap.utils.toArray(".js-midnight-index, .js-midnight-title, .js-midnight-text");
  const card = document.querySelector(".js-midnight-card");

  gsap.set([...copyNodes, card].filter(Boolean), {
    opacity: 1,
    force3D: true
  });

  copyNodes.forEach((node, index) => {
    gsap.fromTo(node, {
      y: 76 + index * 12
    }, {
      y: -58 - index * 10,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.3
      }
    });
  });

  if (card) {
    gsap.fromTo(card, {
      y: 132,
      scale: 0.985,
      rotate: -0.6
    }, {
      y: -110,
      scale: 1.01,
      rotate: 0.6,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.45
      }
    });
  }

  gsap.fromTo(section.querySelector(".sticky-frame"), {
    y: 42
  }, {
    y: -34,
    ease: "none",
    scrollTrigger: {
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      scrub: 1.7
    }
  });
};

const initSectionMap = () => {
  const map = document.querySelector(".section-map");
  const itemsContainer = document.querySelector(".section-map__items");
  const config = window.getSectionMapConfig?.() || [];
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!map || !itemsContainer || config.length === 0) return;

  const sections = config
    .map((item) => ({ ...item, element: document.querySelector(item.selector) }))
    .filter((item) => item.element);

  if (sections.length === 0) return;

  let navigationTimer = null;

  const releaseMapJump = () => {
    document.body.classList.remove("is-map-jumping");
    if (navigationTimer) {
      window.clearTimeout(navigationTimer);
      navigationTimer = null;
    }
  };

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
      if (section.element.matches(".hero")) return 0;

      const sectionTop = window.scrollY + section.element.getBoundingClientRect().top;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      return Math.min(Math.max(sectionTop, 0), maxScroll);
    };

    button.addEventListener("click", () => {
      const target = Math.max(getScrollTarget(), 0);

      releaseMapJump();
      document.body.classList.add("is-map-jumping");

      if (window.lenis && !prefersReducedMotion) {
        window.lenis.scrollTo(target, {
          duration: 1.05,
          easing: (value) => 1 - Math.pow(1 - value, 3),
          onComplete: releaseMapJump
        });
      } else {
        window.scrollTo({ top: target, behavior: "auto" });
      }

      if ("onscrollend" in window) {
        window.addEventListener("scrollend", releaseMapJump, { once: true });
        return;
      }

      navigationTimer = window.setTimeout(releaseMapJump, prefersReducedMotion ? 80 : 950);
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
    activeTimeline: null,
    activeBounds: null
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

  const getOpeningBounds = (card) => {
    const rect = card.getBoundingClientRect();
    const isLifted = card.matches(":hover") || card.matches(":focus-visible");

    if (!isLifted) {
      return rect;
    }

    const hoverScale = 1.01;
    const hoverLift = 10;
    const width = rect.width / hoverScale;
    const height = rect.height / hoverScale;

    return {
      left: rect.left + (rect.width - width) / 2,
      top: rect.top + hoverLift + (rect.height - height) / 2,
      width,
      height
    };
  };

  const createPreviewClone = (card) => {
    const clone = card.cloneNode(true);

    clone.classList.add("card-overlay__card", "card-overlay__card--preview");
    clone.classList.remove("is-source-hidden");
    clone.removeAttribute("style");
    clone.removeAttribute("tabindex");
    clone.removeAttribute("data-expandable");
    clone.removeAttribute("role");
    clone.removeAttribute("aria-haspopup");
    clone.setAttribute("aria-hidden", "true");

    return clone;
  };

  const syncCardSurface = (sourceCard, clone) => {
    const computed = getComputedStyle(sourceCard);

    clone.style.background = computed.background;
    clone.style.border = computed.border;
    clone.style.boxShadow = computed.boxShadow;
    clone.style.backdropFilter = computed.backdropFilter;
    clone.style.webkitBackdropFilter = computed.webkitBackdropFilter;
    clone.style.color = computed.color;
  };

  const applyDetailState = (clone, card) => {
    const text = card.dataset.detailText || card.querySelector("p")?.textContent || "";
    let body = clone.querySelector("p");
    let hint = clone.querySelector(".card-overlay__hint");

    clone.classList.remove("card-overlay__card--preview");
    clone.classList.add("card-overlay__card--detail");
    clone.setAttribute("aria-hidden", "true");

    if (body) {
      body.textContent = text;
    } else {
      const description = document.createElement("p");
      description.textContent = text;
      clone.appendChild(description);
      body = description;
    }

    if (!hint) {
      hint = document.createElement("div");
      hint.className = "card-overlay__hint";
      hint.textContent = "Toque fora ou pressione Esc para fechar";
      clone.appendChild(hint);
    }

    return { body, hint };
  };

  const getDetailEnterNodes = (clone) => Array.from(clone.children).filter((child) => (
    child.classList.contains("card-media")
    || child.classList.contains("card-overlay__hint")
    || child.tagName === "SPAN"
    || child.tagName === "H2"
    || child.tagName === "P"
  ));

  const positionCloseButton = (bounds) => {
    if (!bounds) return;

    const inset = window.innerWidth <= 640 ? 10 : 16;
    const size = window.innerWidth <= 640 ? 44 : 48;

    closeButton.style.top = `${bounds.top + inset}px`;
    closeButton.style.left = `${bounds.left + bounds.width - size - inset}px`;
    closeButton.style.right = "auto";
  };

  const getBoundsDelta = (fromBounds, toBounds) => ({
    x: fromBounds.left - toBounds.left,
    y: fromBounds.top - toBounds.top,
    scaleX: fromBounds.width / toBounds.width,
    scaleY: fromBounds.height / toBounds.height
  });

  const closeOverlay = () => {
    if (!state.activeCard || !state.activeClone) return;

    const sourceCard = state.activeCard;
    const clone = state.activeClone;
    const sourceRadius = getComputedStyle(sourceCard).borderRadius;
    const finalBounds = sourceCard.getBoundingClientRect();
    const targetBounds = state.activeBounds || getTargetBounds();
    const finalDelta = getBoundsDelta(finalBounds, targetBounds);

    state.activeTimeline?.kill();

    if (clone.classList.contains("card-overlay__card--detail")) {
      clone.className = `${sourceCard.className} card-overlay__card card-overlay__card--preview`;
      clone.innerHTML = sourceCard.innerHTML;
      syncCardSurface(sourceCard, clone);
      clone.style.left = `${targetBounds.left}px`;
      clone.style.top = `${targetBounds.top}px`;
      clone.style.width = `${targetBounds.width}px`;
      clone.style.height = `${targetBounds.height}px`;
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
        closeButton.style.top = "";
        closeButton.style.left = "";
        closeButton.style.right = "";
        state.activeCard = null;
        state.activeClone = null;
        state.activeTimeline = null;
        state.activeBounds = null;
      }
    });

    state.activeTimeline = tl;

    tl.to(closeButton, { opacity: 0, scale: 0.92, duration: 0.18 }, 0)
      .to(backdrop, { opacity: 0, duration: 0.34 }, 0)
      .to(clone, {
        x: finalDelta.x,
        y: finalDelta.y,
        scaleX: finalDelta.scaleX,
        scaleY: finalDelta.scaleY,
        borderRadius: sourceRadius,
        duration: 0.58
      }, 0);
  };

  const openOverlay = (card) => {
    if (state.activeCard || state.activeTimeline) return;

    const initialBounds = getOpeningBounds(card);
    const initialRadius = getComputedStyle(card).borderRadius;
    const targetRadius = `${window.innerWidth <= 640 ? 26 : 32}px`;
    const targetBounds = getTargetBounds();
    const openingDelta = getBoundsDelta(initialBounds, targetBounds);
    const clone = createPreviewClone(card);

    clone.style.left = `${targetBounds.left}px`;
    clone.style.top = `${targetBounds.top}px`;
    clone.style.width = `${targetBounds.width}px`;
    clone.style.height = `${targetBounds.height}px`;
    clone.style.borderRadius = initialRadius;
    syncCardSurface(card, clone);

    content.replaceChildren(clone);
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    panel.style.pointerEvents = "auto";
    applyScrollLock();
    card.classList.add("is-source-hidden");
    positionCloseButton(targetBounds);

    gsap.set(backdrop, { opacity: 0 });
    gsap.set(closeButton, { opacity: 0, scale: 0.92 });
    gsap.set(clone, {
      opacity: 1,
      x: openingDelta.x,
      y: openingDelta.y,
      scaleX: openingDelta.scaleX,
      scaleY: openingDelta.scaleY,
      borderRadius: initialRadius
    });

    state.activeCard = card;
    state.activeClone = clone;
    state.activeBounds = targetBounds;

    const tl = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => {
        syncCardSurface(card, clone);
        applyDetailState(clone, card);
        const detailNodes = getDetailEnterNodes(clone);
        gsap.set(detailNodes, { opacity: 0, y: -18 });
        closeButton.focus({ preventScroll: true });
        gsap.timeline({
          defaults: { ease: "power2.out" },
          onComplete: () => {
            state.activeTimeline = null;
          }
        })
          .to(closeButton, { opacity: 1, scale: 1, duration: 0.24 }, 0)
          .to(detailNodes, { opacity: 1, y: 0, duration: 0.34, stagger: 0.055 }, 0.02);
      }
    });

    state.activeTimeline = tl;

    tl.to(backdrop, { opacity: 1, duration: 0.38 }, 0)
      .to(clone, {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: targetRadius,
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
    state.activeBounds = bounds;
    positionCloseButton(bounds);
    gsap.set(state.activeClone, {
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1
    });
  });
};

const initShowcaseSlider = () => {
  const slider = document.querySelector("[data-showcase-slider]");
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll("[data-showcase-slide]"));
  if (slides.length === 0) return;

  let activeIndex = 0;
  const lastIndex = slides.length - 1;

  const getMetric = (name, fallback) => {
    const value = getComputedStyle(slider).getPropertyValue(name).trim();
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const getCardWidth = () => slides[activeIndex]?.getBoundingClientRect().width || slides[0]?.getBoundingClientRect().width || 520;

  const applyState = (index) => {
    activeIndex = Math.min(Math.max(index, 0), lastIndex);
    const viewport = slider.querySelector(".showcase-slider__viewport");
    const cardWidth = getCardWidth();
    const cardGap = getMetric("--showcase-card-gap", 10);
    const hiddenOffset = getMetric("--showcase-hidden-offset", 320);
    const prevIndex = activeIndex > 0 ? activeIndex - 1 : -1;
    const nextIndex = activeIndex < lastIndex ? activeIndex + 1 : -1;
    const viewportWidth = viewport?.clientWidth || slider.clientWidth || window.innerWidth;
    const availablePeek = Math.max((viewportWidth - cardWidth) / 2, 0);
    const edgeOffset = availablePeek > cardGap ? cardWidth + cardGap : cardWidth;

    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeIndex;
      const isPrev = slideIndex === prevIndex;
      const isNext = slideIndex === nextIndex;
      const isVisible = isActive || isPrev || isNext;

      slide.classList.remove("is-active", "is-prev", "is-next", "is-hidden");
      slide.classList.add(isActive ? "is-active" : isPrev ? "is-prev" : isNext ? "is-next" : "is-hidden");

      slide.setAttribute("aria-selected", isActive ? "true" : "false");
      slide.tabIndex = isVisible ? 0 : -1;

      if (isActive) {
        slide.style.setProperty("--slide-offset", "0px");
        slide.style.setProperty("--slide-scale", "1");
        slide.style.opacity = "1";
        slide.style.filter = "none";
        return;
      }

      if (isPrev) {
        slide.style.setProperty("--slide-offset", `${-edgeOffset}px`);
        slide.style.setProperty("--slide-scale", "1");
        slide.style.opacity = "1";
        slide.style.filter = "none";
        return;
      }

      if (isNext) {
        slide.style.setProperty("--slide-offset", `${edgeOffset}px`);
        slide.style.setProperty("--slide-scale", "1");
        slide.style.opacity = "1";
        slide.style.filter = "none";
        return;
      }

      const hiddenDirection = slideIndex < activeIndex ? -1 : 1;
      slide.style.setProperty("--slide-offset", `${hiddenDirection * (edgeOffset + hiddenOffset)}px`);
      slide.style.setProperty("--slide-scale", "1");
      slide.style.opacity = "0";
      slide.style.filter = "saturate(0.85)";
    });
  };

  const render = (nextIndex) => {
    if (nextIndex === activeIndex) return;
    applyState(nextIndex);
  };

  slides.forEach((slide, index) => {
    slide.addEventListener("click", () => {
      render(index);
    });

    slide.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        render(Math.min(activeIndex + 1, lastIndex));
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        render(Math.max(activeIndex - 1, 0));
      }
    });
  });

  applyState(0);
};

const init = () => {
  initSmoothScroll();
  initTextScrollBlur();
  initThreeBackground();
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
