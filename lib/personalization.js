export const THEME_PRESETS = [
  {
    id: "aurora-notes",
    label: "AI",
    style: "particles",
    blurb: "Flowing particles and soft model-lab surfaces for AI and research topics.",
  },
  {
    id: "voyager-postcards",
    label: "Video",
    style: "studio",
    blurb: "A clean video-platform feel with compact cards and bright action cues.",
  },
  {
    id: "pixel-arcade",
    label: "Gaming",
    style: "gaming",
    blurb: "Game-library colors, moving energy marks, and sharper interactive panels.",
  },
  {
    id: "ocean-logbook",
    label: "Music",
    style: "flow",
    blurb: "Rhythmic green accents and circular motion for music and audio learning.",
  },
  {
    id: "forest-camp",
    label: "Nature",
    style: "organic",
    blurb: "Soft organic surfaces with tree and waterfall-inspired background motion.",
  },
  {
    id: "sports-pulse",
    label: "Sports",
    style: "motion",
    blurb: "High-energy motion, warm highlights, and compact training-card styling.",
  },
  {
    id: "studio-ink",
    label: "Minimal",
    style: "minimal",
    blurb: "Quiet monochrome panels for reading-heavy sessions and focus work.",
  },
  {
    id: "retro-terminal",
    label: "Coding",
    style: "code",
    blurb: "Code-stream ambience, terminal edges, and high-contrast action states.",
  },
  {
    id: "sunset-journal",
    label: "Travel",
    style: "journey",
    blurb: "Warm route-map motion and calm references for travel or language study.",
  },
  {
    id: "festival-pop",
    label: "Creative",
    style: "blocks",
    blurb: "Colorful block motion for design, making, and playful creative topics.",
  },
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
  "Entrepreneurship",
];

const THEME_BY_INTEREST = {
  AI: "aurora-notes",
  Travel: "ocean-logbook",
  Gaming: "pixel-arcade",
  Design: "studio-ink",
  Coding: "retro-terminal",
  Startups: "aurora-notes",
  Science: "aurora-notes",
  History: "studio-ink",
  Finance: "studio-ink",
  Marketing: "voyager-postcards",
  Movies: "voyager-postcards",
  Music: "ocean-logbook",
  Sports: "sports-pulse",
  Fitness: "sports-pulse",
  Photography: "sunset-journal",
  Cooking: "forest-camp",
  Nature: "forest-camp",
  "Language Learning": "sunset-journal",
  Productivity: "ocean-logbook",
  Entrepreneurship: "aurora-notes",
};

const THEME_KEYWORD_SIGNALS = {
  "aurora-notes": [
    "ai",
    "agents",
    "automation",
    "future",
    "saas",
    "workspace",
    "machine learning",
  ],
  "voyager-postcards": [
    "glitch",
    "hacker",
    "cyberpunk",
    "experimental",
    "distortion",
    "underground",
  ],
  "pixel-arcade": [
    "gaming",
    "minecraft",
    "pixel",
    "arcade",
    "retro",
    "quest",
    "rpg",
    "platformer",
  ],
  "ocean-logbook": [
    "water",
    "ocean",
    "calm",
    "productivity",
    "learning",
    "language",
    "focus",
    "meditation",
  ],
  "forest-camp": [
    "nature",
    "forest",
    "wood",
    "camp",
    "outdoor",
    "cabin",
    "eco",
    "hiking",
  ],
  "neon-grid": [
    "startup",
    "founder",
    "growth",
    "crypto",
    "cyber",
    "platform",
    "tech",
    "futuristic",
  ],
  "studio-ink": [
    "design system",
    "portfolio",
    "minimal",
    "brand",
    "finance",
    "editorial",
    "product design",
  ],
  "retro-terminal": [
    "coding",
    "terminal",
    "developer",
    "programming",
    "javascript",
    "react",
    "api",
    "backend",
  ],
  "sports-pulse": [
    "sports",
    "fitness",
    "fire",
    "energy",
    "training",
    "battle",
    "action",
  ],
  "festival-pop": [
    "blocks",
    "voxel",
    "kids",
    "creative",
    "building",
    "sandbox",
    "playful",
  ],
};

const SUGGESTIONS_BY_INTEREST = {
  AI: [
    "Build a deep guide to large language models",
    "Explain prompt engineering with examples",
    "Create a study pack for AI agents and workflows",
  ],
  Travel: [
    "Create a full travel planning guide for Japan",
    "Explain how to build a budget backpacking plan",
    "Generate a destination research pack for Italy",
  ],
  Gaming: [
    "Explain game design loops with examples",
    "Create a deep guide to esports team strategy",
    "Build a study pack for level design basics",
  ],
  Design: [
    "Explain typography systems for beginners",
    "Build a study card for UX case study thinking",
    "Generate a deep guide to color theory",
  ],
  Coding: [
    "Build a deep guide to JavaScript promises",
    "Explain APIs and async flows step by step",
    "Create a study pack for React state management",
  ],
  Science: [
    "Explain quantum computing for beginners",
    "Build a deep guide to climate systems",
    "Generate a study pack for neuroscience basics",
  ],
  Finance: [
    "Create a guide to personal budgeting systems",
    "Explain compound interest with examples",
    "Build a study card for startup finance basics",
  ],
};

export function assignThemePreset(interests = []) {
  for (const interest of interests) {
    if (THEME_BY_INTEREST[interest]) {
      return THEME_BY_INTEREST[interest];
    }
  }

  return "aurora-notes";
}

export function recommendThemePreset({
  interests = [],
  recentQueries = [],
  focus = "",
  headline = "",
  bio = "",
} = {}) {
  const scores = Object.fromEntries(
    THEME_PRESETS.map((preset) => [preset.id, 0]),
  );
  const corpus = [focus, headline, bio, ...recentQueries]
    .join(" ")
    .toLowerCase();

  for (const interest of interests) {
    const presetId = THEME_BY_INTEREST[interest];
    if (presetId) {
      scores[presetId] += 4;
    }
  }

  for (const [presetId, keywords] of Object.entries(THEME_KEYWORD_SIGNALS)) {
    if (!(presetId in scores)) {
      continue;
    }

    for (const keyword of keywords) {
      if (corpus.includes(keyword)) {
        scores[presetId] += 2;
      }
    }
  }

  const topMatch = Object.entries(scores).sort(
    (left, right) => right[1] - left[1],
  )[0];
  return topMatch && topMatch[1] > 0
    ? topMatch[0]
    : assignThemePreset(interests);
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
