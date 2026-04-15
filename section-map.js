function getSectionMapConfig() {
  return [
    { selector: ".hero", label: "Tokyo Awakens", size: 26 },
    { selector: ".morning-a", label: "Morning I", size: 26 },
    { selector: ".morning-b", label: "Morning II", size: 26 },
    { selector: ".morning-c", label: "Morning III", size: 26 },
    { selector: ".afternoon-a", label: "Afternoon I", size: 26 },
    { selector: ".afternoon-b", label: "Afternoon II", size: 26 },
    { selector: ".afternoon-c", label: "Afternoon III", size: 26 },
    { selector: ".night-a", label: "Night I", size: 26 },
    { selector: ".night-b", label: "Night II", size: 26 },
    { selector: ".section-midnight", label: "Midnight", size: 26 }
  ];
}

function getSectionMapState(activeIndex, total) {
  return Array.from({ length: total }, (_, index) => {
    if (index < activeIndex) return "past";
    if (index === activeIndex) return "current";
    return "upcoming";
  });
}

if (typeof window !== "undefined") {
  window.getSectionMapConfig = getSectionMapConfig;
  window.getSectionMapState = getSectionMapState;
}
