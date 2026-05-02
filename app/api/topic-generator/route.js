import { NextResponse } from "next/server";

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
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
                  "If terminalEnabled is true, also return terminalLanguage, compiler, and terminalFiles so the practice terminal matches the main programming language automatically.",
                  "Support any programming language the topic calls for, not only web, Apex, or Java. Examples: cpp -> g++, java -> javac, python -> python, javascript -> node, typescript -> ts-node, go -> go run, rust -> cargo or rustc, csharp -> dotnet, php -> php, ruby -> ruby.",
                  "For terminalFiles, return the files a learner would expect for that language. For a single-file language exercise, return one file with starter code. For bundled topics like LWC, return html/js/css files.",
                  "If the topic is non-technical, keep the output content-first and usually disable terminalEnabled, quizEnabled, and mockEnabled. Do not force practice or mock tabs for things like football, history, travel, movies, music, or general reading topics.",
                  "For non-technical topics, example should be a reference summary, comparison, quote-style explainer, or sample note, not code.",
                  "Keep every text readable and specific.",
                  "Provide 4 to 8 media suggestions split across these types when possible: Video, Photo, Article, Podcast.",
                  "Use real public source URLs from reputable domains whenever you know them. Do not invent URLs.",
                  "Never use example.com, placeholder services, demo mp4 files, fake previews, or made-up direct image URLs.",
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
    return JSON.parse(text);
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
