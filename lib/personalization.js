export const THEME_PRESETS = [
  { id: "aurora-notes", label: "Aurora Notes", style: "futuristic" },
  { id: "voyager-postcards", label: "Voyager Postcards", style: "travel" },
  { id: "pixel-arcade", label: "Pixel Arcade", style: "gaming" },
  { id: "comic-lab", label: "Comic Lab", style: "cartoonish" },
  { id: "ocean-logbook", label: "Ocean Logbook", style: "calm" },
  { id: "sunset-journal", label: "Sunset Journal", style: "warm" },
  { id: "forest-camp", label: "Forest Camp", style: "organic" },
  { id: "neon-grid", label: "Neon Grid", style: "cyber" },
  { id: "paper-scrapbook", label: "Paper Scrapbook", style: "craft" },
  { id: "studio-ink", label: "Studio Ink", style: "minimal" },
  { id: "astro-console", label: "Astro Console", style: "space" },
  { id: "retro-terminal", label: "Retro Terminal", style: "developer" },
  { id: "dream-cards", label: "Dream Cards", style: "soft" },
  { id: "sports-pulse", label: "Sports Pulse", style: "energetic" },
  { id: "museum-light", label: "Museum Light", style: "editorial" },
  { id: "festival-pop", label: "Festival Pop", style: "vibrant" }
];

export const INTEREST_OPTIONS = [
  "AI",
  "Travel",
  "Gaming",
  "Design",
  "Coding",
  "Startups",
  "Science",
  "History",
  "Finance",
  "Marketing",
  "Movies",
  "Music",
  "Sports",
  "Fitness",
  "Photography",
  "Cooking",
  "Nature",
  "Language Learning",
  "Productivity",
  "Entrepreneurship"
];

const THEME_BY_INTEREST = {
  AI: "aurora-notes",
  Travel: "voyager-postcards",
  Gaming: "pixel-arcade",
  Design: "studio-ink",
  Coding: "retro-terminal",
  Startups: "neon-grid",
  Science: "astro-console",
  History: "museum-light",
  Finance: "studio-ink",
  Marketing: "festival-pop",
  Movies: "dream-cards",
  Music: "comic-lab",
  Sports: "sports-pulse",
  Fitness: "sports-pulse",
  Photography: "sunset-journal",
  Cooking: "paper-scrapbook",
  Nature: "forest-camp",
  "Language Learning": "museum-light",
  Productivity: "ocean-logbook",
  Entrepreneurship: "neon-grid"
};

const SUGGESTIONS_BY_INTEREST = {
  AI: [
    "Build a deep guide to large language models",
    "Explain prompt engineering with examples",
    "Create a study pack for AI agents and workflows"
  ],
  Travel: [
    "Create a full travel planning guide for Japan",
    "Explain how to build a budget backpacking plan",
    "Generate a destination research pack for Italy"
  ],
  Gaming: [
    "Explain game design loops with examples",
    "Create a deep guide to esports team strategy",
    "Build a study pack for level design basics"
  ],
  Design: [
    "Explain typography systems for beginners",
    "Build a study card for UX case study thinking",
    "Generate a deep guide to color theory"
  ],
  Coding: [
    "Build a deep guide to JavaScript promises",
    "Explain APIs and async flows step by step",
    "Create a study pack for React state management"
  ],
  Science: [
    "Explain quantum computing for beginners",
    "Build a deep guide to climate systems",
    "Generate a study pack for neuroscience basics"
  ],
  Finance: [
    "Create a guide to personal budgeting systems",
    "Explain compound interest with examples",
    "Build a study card for startup finance basics"
  ]
};

export function assignThemePreset(interests = []) {
  for (const interest of interests) {
    if (THEME_BY_INTEREST[interest]) {
      return THEME_BY_INTEREST[interest];
    }
  }

  return "aurora-notes";
}

export function getSuggestionsForInterests(interests = [], fallback = []) {
  const suggestions = [];

  for (const interest of interests) {
    const items = SUGGESTIONS_BY_INTEREST[interest] || [];
    for (const item of items) {
      if (!suggestions.includes(item)) {
        suggestions.push(item);
      }
    }
  }

  return suggestions.length ? suggestions.slice(0, 6) : fallback;
}
