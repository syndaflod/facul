function getHeroAnimationConfig() {
  return [
    {
      selector: ".js-hero-eyebrow",
      from: { y: 0, opacity: 1 },
      to: { y: -22, opacity: 0.3 },
      position: 0
    },
    {
      selector: ".js-hero-title",
      from: { y: 0, scale: 1, opacity: 1 },
      to: { y: -54, scale: 0.945, opacity: 0.58 },
      position: 0
    },
    {
      selector: ".js-hero-text",
      from: { y: 0, opacity: 1 },
      to: { y: -26, opacity: 0.45 },
      position: 0
    },
    {
      selector: ".js-hero-card-a",
      from: { y: 44, opacity: 0 },
      to: { y: -18, opacity: 1, scale: 1.01 },
      position: 0.1
    },
    {
      selector: ".js-hero-card-b",
      from: { y: 58, opacity: 0, scale: 0.94 },
      to: { y: -10, opacity: 0.92, scale: 1.02 },
      position: 0.18
    },
    {
      selector: ".js-hero-glow",
      from: { scale: 1, xPercent: 0, yPercent: 0 },
      to: { scale: 1.26, xPercent: -10, yPercent: 8 },
      position: 0
    }
  ];
}

if (typeof window !== "undefined") {
  window.getHeroAnimationConfig = getHeroAnimationConfig;
}
