import { NextResponse } from "next/server";

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

const VALIDATION_TIMEOUT_MS = 4500;
const MEDIA_LIMITS = {
  visual: { Video: 5, Photo: 8, Diagram: 4, Article: 4, Podcast: 3 },
  default: { Video: 3, Photo: 4, Diagram: 3, Article: 4, Podcast: 3 }
};

function isProgrammingTopic(query, topic) {
  const source = [
    query,
    topic?.title,
    topic?.focus,
    topic?.topicKind,
    ...(topic?.subtopics || []),
    ...(topic?.keyTerms || [])
  ]
    .join(" ")
    .toLowerCase();

  return /(programming|coding|code|developer|software|javascript|typescript|python|java|c\+\+|cpp|c#|csharp|php|ruby|go|golang|rust|sql|html|css|react|node|lwc|apex|salesforce|api|algorithm|data structure|terminal|compiler)/.test(
    source
  );
}

function isVisualTopic(query, topic) {
  const source = [
    query,
    topic?.title,
    topic?.focus,
    topic?.topicKind,
    ...(topic?.subtopics || []),
    ...(topic?.keyTerms || [])
  ]
    .join(" ")
    .toLowerCase();

  return /(wildlife|nature|animal|forest|ocean|mountain|bird|marine|landscape|national park|ecology|environment|planet|space|astronomy|biology|geography|travel|architecture|art|history|museum|diagram|map|anatomy|botany)/.test(
    source
  );
}

function isSafeUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    const hostname = url.hostname.toLowerCase();

    return (
      ["http:", "https:"].includes(url.protocol) &&
      !hostname.includes("example.com") &&
      !hostname.includes("placeholder") &&
      !hostname.includes("localhost")
    );
  } catch {
    return false;
  }
}

function normalizeMediaType(value) {
  const type = String(value || "").trim().toLowerCase();

  if (type.includes("video")) return "Video";
  if (type.includes("photo") || type.includes("image")) return "Photo";
  if (type.includes("podcast") || type.includes("audio")) return "Podcast";
  if (type.includes("diagram") || type.includes("map") || type.includes("chart") || type.includes("infographic")) return "Diagram";
  if (type.includes("article") || type.includes("guide") || type.includes("reading")) return "Article";

  return "Article";
}

function getYouTubeVideoId(value) {
  if (!isSafeUrl(value)) {
    return "";
  }

  const url = new URL(value);
  const hostname = url.hostname.replace(/^www\./, "");
  const pathParts = url.pathname.split("/").filter(Boolean);

  if (hostname === "youtube.com" || hostname === "m.youtube.com") {
    return url.searchParams.get("v") || (pathParts[0] === "shorts" ? pathParts[1] : "") || (pathParts[0] === "embed" ? pathParts[1] : "");
  }

  if (hostname === "youtu.be") {
    return pathParts[0] || "";
  }

  return "";
}

function getVimeoVideoId(value) {
  if (!isSafeUrl(value)) {
    return "";
  }

  const url = new URL(value);
  const hostname = url.hostname.replace(/^www\./, "");

  if (hostname === "vimeo.com" || hostname === "player.vimeo.com") {
    return url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part)) || "";
  }

  return "";
}

function isDirectImageUrl(value) {
  return isSafeUrl(value) && /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i.test(String(value || "").trim());
}

function isDirectAudioUrl(value) {
  return isSafeUrl(value) && /\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(String(value || "").trim());
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VALIDATION_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": "LearnerDevMediaValidator/1.0",
        ...(options.headers || {})
      }
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function urlResponds(url, expectedType = "") {
  if (!isSafeUrl(url)) {
    return false;
  }

  const methods = [
    { method: "HEAD" },
    { method: "GET", headers: { Range: "bytes=0-2048" } }
  ];

  for (const options of methods) {
    try {
      const response = await fetchWithTimeout(url, options);

      if (!response.ok) {
        continue;
      }

      const contentType = response.headers.get("content-type") || "";

      if (!expectedType || contentType.toLowerCase().includes(expectedType)) {
        return true;
      }
    } catch {
      // Try the next method before rejecting the media item.
    }
  }

  return false;
}

async function canEmbedYouTube(value) {
  const videoId = getYouTubeVideoId(value);

  if (!videoId) {
    return false;
  }

  const oembedUrl = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  try {
    const [oembedOk, thumbnailOk] = await Promise.all([urlResponds(oembedUrl, "json"), urlResponds(thumbnailUrl, "image")]);
    return oembedOk && thumbnailOk;
  } catch {
    return false;
  }
}

async function canEmbedVimeo(value) {
  const videoId = getVimeoVideoId(value);

  if (!videoId) {
    return false;
  }

  return urlResponds(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${videoId}`)}`, "json");
}

async function validateMediaItem(item) {
  const type = normalizeMediaType(item?.type);
  const href = isSafeUrl(item?.href) ? String(item.href).trim() : "";
  const image = isSafeUrl(item?.image) ? String(item.image).trim() : "";
  const audio = isSafeUrl(item?.audio) ? String(item.audio).trim() : "";
  const previewVideo = isSafeUrl(item?.previewVideo) && /\.(mp4|webm|ogg)(\?.*)?$/i.test(String(item.previewVideo)) ? String(item.previewVideo).trim() : "";

  if (!href && !image && !audio && !previewVideo) {
    return null;
  }

  if (type === "Video") {
    const playable = previewVideo
      ? await urlResponds(previewVideo, "video")
      : getYouTubeVideoId(href)
        ? await canEmbedYouTube(href)
        : getVimeoVideoId(href)
          ? await canEmbedVimeo(href)
          : false;

    if (!playable) {
      return null;
    }
  }

  if (type === "Photo") {
    const imageUrl = image || (isDirectImageUrl(href) ? href : "");

    if (!imageUrl || !(await urlResponds(imageUrl, "image"))) {
      return null;
    }
  }

  if (type === "Diagram") {
    const imageUrl = image || (isDirectImageUrl(href) ? href : "");
    const diagramWorks = imageUrl ? await urlResponds(imageUrl, "image") : await urlResponds(href);

    if (!diagramWorks) {
      return null;
    }
  }

  if (type === "Podcast") {
    const audioUrl = audio || (isDirectAudioUrl(href) ? href : "");
    const podcastWorks = audioUrl ? await urlResponds(audioUrl, "audio") : await urlResponds(href);

    if (!podcastWorks) {
      return null;
    }
  }

  if (type === "Article" && !(await urlResponds(href))) {
    return null;
  }

  return {
    type,
    title: String(item?.title || `${type} resource`).trim(),
    description: String(item?.description || "").trim(),
    href,
    image: image || (type === "Photo" && isDirectImageUrl(href) ? href : ""),
    previewVideo,
    audio,
    source: String(item?.source || "").trim()
  };
}

async function validateMediaItems(media, query, topic) {
  const limits = isVisualTopic(query, topic) ? MEDIA_LIMITS.visual : MEDIA_LIMITS.default;
  const validItems = (await Promise.all((Array.isArray(media) ? media : []).slice(0, 18).map(validateMediaItem))).filter(Boolean);
  const counts = {};

  return validItems.filter((item) => {
    counts[item.type] = counts[item.type] || 0;

    if (counts[item.type] >= (limits[item.type] || 3)) {
      return false;
    }

    counts[item.type] += 1;
    return true;
  });
}

function emptyAssessment(level) {
  return {
    level,
    quiz: [],
    mockPrompts: []
  };
}

function normalizeAssessment(level, value, technical) {
  if (!technical) {
    return emptyAssessment(level);
  }

  return {
    level,
    quiz: Array.isArray(value?.quiz) ? value.quiz : [],
    mockPrompts: Array.isArray(value?.mockPrompts) ? value.mockPrompts : []
  };
}

function getFallbackQuiz(title, level) {
  return [
    {
      q: `Which approach best shows ${level} understanding of ${title}?`,
      options: [
        "Memorizing a definition without applying it",
        "Explaining the concept and applying it to a small scenario",
        "Skipping examples and only reading syntax",
        "Choosing tools before understanding the problem"
      ],
      answer: 1
    }
  ];
}

function getFallbackMockPrompts(title, level) {
  return [
    {
      id: `${slugify(title || "topic")}-${level}-scenario`,
      title: `${level} scenario challenge`,
      prompt: `Describe a realistic ${title} scenario, outline the solution, and include the code or terminal steps you would use.`
    }
  ];
}

async function applyGeminiGuardrails(topic, query, activeTrack) {
  const trackImpliesCode = ["lwc", "apex"].includes(activeTrack);
  const technical = trackImpliesCode || isProgrammingTopic(query, topic);
  const assessments = {
    beginner: normalizeAssessment("beginner", topic?.assessments?.beginner, technical),
    intermediate: normalizeAssessment("intermediate", topic?.assessments?.intermediate, technical),
    advanced: normalizeAssessment("advanced", topic?.assessments?.advanced, technical)
  };
  const title = topic?.title || query;
  const quiz = technical ? (topic.quiz?.length ? topic.quiz : assessments.beginner.quiz.length ? assessments.beginner.quiz : getFallbackQuiz(title, "beginner")) : [];
  const mockPrompts = technical
    ? topic.mockPrompts?.length
      ? topic.mockPrompts
      : assessments.beginner.mockPrompts.length
        ? assessments.beginner.mockPrompts
        : getFallbackMockPrompts(title, "beginner")
    : [];
  const guardedAssessments = technical
    ? {
        beginner: {
          ...assessments.beginner,
          quiz: assessments.beginner.quiz.length ? assessments.beginner.quiz : quiz,
          mockPrompts: assessments.beginner.mockPrompts.length ? assessments.beginner.mockPrompts : mockPrompts
        },
        intermediate: {
          ...assessments.intermediate,
          quiz: assessments.intermediate.quiz.length ? assessments.intermediate.quiz : getFallbackQuiz(title, "intermediate"),
          mockPrompts: assessments.intermediate.mockPrompts.length ? assessments.intermediate.mockPrompts : getFallbackMockPrompts(title, "intermediate")
        },
        advanced: {
          ...assessments.advanced,
          quiz: assessments.advanced.quiz.length ? assessments.advanced.quiz : getFallbackQuiz(title, "advanced"),
          mockPrompts: assessments.advanced.mockPrompts.length ? assessments.advanced.mockPrompts : getFallbackMockPrompts(title, "advanced")
        }
      }
    : assessments;
  const terminalFiles = technical && Array.isArray(topic?.capabilities?.terminalFiles) ? topic.capabilities.terminalFiles : [];

  const media = await validateMediaItems(topic?.media, query, topic);

  return {
    ...topic,
    topicKind: technical ? topic.topicKind || "technical" : topic.topicKind || "general",
    quiz,
    mockPrompts,
    assessments: guardedAssessments,
    exercise: technical
      ? topic.exercise
      : {
          title: "Reading reflection",
          prompt: "Summarize the topic in your own words after reading.",
          starter: "",
          checklist: ["Identify the main idea.", "Name the most important details.", "Write one follow-up question."]
    },
    media,
    capabilities: {
      quizEnabled: technical,
      terminalEnabled: technical,
      mockEnabled: technical,
      terminalLanguage: technical ? topic?.capabilities?.terminalLanguage || "" : "",
      terminalFiles,
      compiler: technical ? topic?.capabilities?.compiler || "" : ""
    }
  };
}

function getResponseSchema() {
  return {
    type: "object",
    properties: {
      title: { type: "string" },
      topicKind: { type: "string" },
      level: { type: "string" },
      focus: { type: "string" },
      objectives: { type: "array", items: { type: "string" } },
      deepDive: { type: "array", items: { type: "string" } },
      subtopics: { type: "array", items: { type: "string" } },
      branchTopics: { type: "array", items: { type: "string" } },
      subtopicCards: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            summary: { type: "string" },
            goal: { type: "string" }
          },
          required: ["id", "title", "summary", "goal"]
        }
      },
      keyTerms: { type: "array", items: { type: "string" } },
      scenarios: { type: "array", items: { type: "string" } },
      example: { type: "string" },
      longRead: { type: "array", items: { type: "string" } },
      exercise: {
        type: "object",
        properties: {
          title: { type: "string" },
          prompt: { type: "string" },
          starter: { type: "string" },
          checklist: { type: "array", items: { type: "string" } }
        },
        required: ["title", "prompt", "starter", "checklist"]
      },
      quiz: {
        type: "array",
        items: {
          type: "object",
          properties: {
            q: { type: "string" },
            options: { type: "array", items: { type: "string" } },
            answer: { type: "integer" }
          },
          required: ["q", "options", "answer"]
        }
      },
      mockPrompts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            prompt: { type: "string" }
          },
          required: ["id", "title", "prompt"]
        }
      },
      assessments: {
        type: "object",
        properties: {
          beginner: { type: "object" },
          intermediate: { type: "object" },
          advanced: { type: "object" }
        },
        required: ["beginner", "intermediate", "advanced"]
      },
      media: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            href: { type: "string" },
            image: { type: "string" },
            previewVideo: { type: "string" },
            audio: { type: "string" },
            source: { type: "string" }
          },
          required: ["type", "title", "description", "href"]
        }
      },
      capabilities: {
        type: "object",
        properties: {
          quizEnabled: { type: "boolean" },
          terminalEnabled: { type: "boolean" },
          mockEnabled: { type: "boolean" },
          terminalLanguage: { type: "string" },
          terminalFiles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                label: { type: "string" },
                starter: { type: "string" }
              },
              required: ["id", "label", "starter"]
            }
          },
          compiler: { type: "string" }
        },
        required: ["quizEnabled", "terminalEnabled", "mockEnabled", "terminalLanguage", "terminalFiles", "compiler"]
      }
    },
    required: [
      "title",
      "topicKind",
      "level",
      "focus",
      "objectives",
      "deepDive",
      "subtopics",
      "branchTopics",
      "subtopicCards",
      "keyTerms",
      "scenarios",
      "example",
      "longRead",
      "exercise",
      "quiz",
      "mockPrompts",
      "assessments",
      "media",
      "capabilities"
    ]
  };
}

async function fetchGeminiTopic(query, activeTrack) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  "You are generating a structured study card for an AI learning dashboard.",
                  `User topic: ${query}`,
                  `Current dashboard track: ${activeTrack}`,
                  "Do not assume the topic is about LWC, Apex, Salesforce, or programming unless the user topic clearly asks for that.",
                  "First identify what kind of topic this is: technical, general, franchise, game, sport, history, travel, or concept.",
                  "If the topic is a franchise, game series, or broad universe, explain the umbrella topic first and mention its major variants or entries clearly.",
                  "For example, if the user asks for Assassin's Creed, explain that it is a game franchise with multiple main titles, spin-offs, themes, and historical settings.",
                  "Do not narrow a broad franchise topic to one variant unless the user explicitly asks for that variant.",
                  "Return a complete topic object for a learner-facing study page.",
                  "Make the topic feel substantial and scrollable, not brief.",
                  "Set topicKind to the best fit.",
                  "Write 8 to 12 deepDive paragraphs.",
                  "Write 10 to 16 subtopics.",
                  "Write 6 to 12 branchTopics that can be clicked later as follow-up searches. Keep them short and specific.",
                  "Write 8 to 12 keyTerms.",
                  "Write 6 to 8 scenarios or applied use cases.",
                  "Also write a longRead array with 10 to 14 rich reading paragraphs for users who want more depth.",
                  "Create subtopicCards as clickable learning-path cards. Each card needs id, title, summary, and goal. Think like a walkthrough: foundations, loops, conditions, syntax, examples, projects, and so on when relevant.",
                  "If the topic is technical, create assessments for beginner, intermediate, and advanced. Each level should have quiz and mockPrompts.",
                  "Only programming, developer, software, API, database, framework, markup/style, Salesforce, LWC, Apex, or clearly code-oriented topics are technical.",
                  "For programming-language topics, assessments must include MCQs, scenario-based prompts, and coding-oriented mock prompts.",
                  "If terminalEnabled is true, also return terminalLanguage, compiler, and terminalFiles so the practice terminal matches the main programming language automatically.",
                  "Set terminalEnabled true for programming-language topics and provide practical starter code in terminalFiles.",
                  "Support any programming language the topic calls for, not only web, Apex, or Java. Examples: cpp -> g++, java -> javac, python -> python, javascript -> node, typescript -> ts-node, go -> go run, rust -> cargo or rustc, csharp -> dotnet, php -> php, ruby -> ruby.",
                  "For terminalFiles, return the files a learner would expect for that language. For a single-file language exercise, return one file with starter code. For bundled topics like LWC, return html/js/css files.",
                  "If the topic is non-technical, keep the output content-first and usually disable terminalEnabled, quizEnabled, and mockEnabled. Do not force practice or mock tabs for things like football, history, travel, movies, music, or general reading topics.",
                  "For read-only topics, set quizEnabled false, terminalEnabled false, mockEnabled false, quiz empty, mockPrompts empty, and each assessment level with empty quiz and mockPrompts.",
                  "For non-technical topics, example should be a reference summary, comparison, quote-style explainer, or sample note, not code.",
                  "Keep every text readable and specific.",
                  "Provide 6 to 12 media suggestions split across these types when possible: Video, Photo, Diagram, Article, Podcast.",
                  "For visual topics like wildlife, nature, geography, history, travel, art, architecture, biology, astronomy, or anatomy, prioritize more Video, Photo, and Diagram resources.",
                  "Use real public source URLs from reputable domains whenever you know them. Do not invent URLs.",
                  "Never use example.com, placeholder services, demo mp4 files, fake previews, or made-up direct image URLs.",
                  "Only include YouTube or Vimeo videos that are public, embeddable, and likely to open in an iframe player.",
                  "Only include image URLs that are direct, stable, and renderable as an image in a browser.",
                  "Only include podcast/audio items with a real show page or direct audio URL that opens.",
                  "For Diagram cards, use a real diagram, map, chart, Wikimedia Commons image/file page, official educational diagram, or a direct image URL. Do not invent diagrams.",
                  "For Video cards, YouTube watch URLs are preferred when you know a real video. The UI can render YouTube previews from the href, so do not invent previewVideo.",
                  "For Photo cards, prefer Wikimedia Commons, official press/media pages, NASA image assets, Unsplash image/photo pages, or other reputable real image sources. Add a direct image URL only when you are confident it is a real stable image.",
                  "For Podcast cards, use real episode or show page URLs. Include audio only when you know a direct mp3/m4a file URL.",
                  "For Article and Podcast cards, href must open the source article, podcast page, or a reliable search results page when you are not certain of a direct URL.",
                  "For Photo cards, include image only if it is a stable direct image URL. If uncertain, use a reputable image-search URL in href and omit image.",
                  "For Video cards, prefer YouTube/Vimeo/source page URLs in href. Include previewVideo only when you are confident it is a direct playable mp4/webm URL; otherwise omit previewVideo instead of guessing.",
                  "Return a topic object that feels like a real learning product, not a short answer."
                ].join("\n")
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: getResponseSchema()
        }
      })
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    return null;
  }

  try {
    return applyGeminiGuardrails(JSON.parse(text), query, activeTrack);
  } catch {
    return null;
  }
}

export async function POST(request) {
  const { query, activeTrack } = await request.json();

  if (!query?.trim()) {
    return NextResponse.json({ error: "Topic query is required." }, { status: 400 });
  }

  const aiTopic = await fetchGeminiTopic(query.trim(), activeTrack || "workspace");

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured. Real topic generation is unavailable right now." },
      { status: 503 }
    );
  }

  if (!aiTopic) {
    return NextResponse.json(
      { error: "Gemini could not return a valid topic package with real media data. Try a more specific prompt." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    topic: aiTopic,
    provider: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite"
  });
}
