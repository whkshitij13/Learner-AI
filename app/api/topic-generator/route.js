import { NextResponse } from "next/server";

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function buildFallbackTopic(query) {
  const lower = query.toLowerCase();
  const technical = /(javascript|js|css|html|apex|lwc|react|node|api|sql|python|java|code|coding|developer|programming)/.test(
    lower
  );

  return {
    title: query.trim(),
    topicKind: technical ? "technical" : "general",
    level: technical ? "AI study pack" : "Guided overview",
    focus: technical
      ? `Understand ${query} through a readable explanation, examples, practice checkpoints, and implementation thinking.`
      : `Get a structured overview of ${query} with key ideas, practical steps, and a clear study flow.`,
    objectives: technical
      ? [
          `Explain what ${query} is and where it is used.`,
          `Recognize the core building blocks involved in ${query}.`,
          `Practice applying ${query} in a small technical scenario.`
        ]
      : [
          `Understand the core idea behind ${query}.`,
          `Break ${query} into manageable learning sections.`,
          `Connect ${query} to practical real-world situations.`
        ],
    deepDive: technical
      ? [
          `${query} becomes easier when you study both the concept and the implementation pattern together.`,
          `A strong learning sequence is concept first, then file structure or syntax, then one realistic task.`,
          `Focus on what problem the topic solves before memorizing exact syntax.`,
          `As you go deeper, connect the topic to performance, maintainability, and developer decision making.`,
          `A useful study pattern is to compare a basic implementation with a cleaner production-friendly version.`,
          `When revising, explain the topic out loud in your own words and then rebuild one example from memory.`
        ]
      : [
          `${query} is best studied by starting with the big picture and then moving into patterns, examples, and use cases.`,
          `A good study card should make the topic feel readable, not overwhelming, so the learner can keep momentum.`,
          `Short examples, visual media, and reflective questions usually work better than forcing every topic into a quiz.`,
          `It helps to separate definition, process, real-world context, and common misconceptions so the learner can absorb the topic step by step.`,
          `Each deep-dive section should answer what it is, why it matters, when it applies, and what good usage looks like.`,
          `The best study experience leaves the learner with both understanding and language they can confidently reuse later.`
        ],
    subtopics: technical
      ? [
          "Core definition",
          "Key syntax or structure",
          "How the runtime behaves",
          "Implementation flow",
          "Common mistakes",
          "Debugging approach",
          "Performance and maintainability",
          "Practice task"
        ]
      : [
          "Overview",
          "Important components",
          "Background context",
          "Real-world examples",
          "Useful tips",
          "Common mistakes",
          "Reflection questions",
          "Practical next steps"
        ],
    branchTopics: technical
      ? [
          `${query} basics`,
          `${query} workflow`,
          `${query} debugging`,
          `${query} best practices`
        ]
      : [
          `${query} overview`,
          `${query} timeline`,
          `${query} important variants`,
          `${query} memorable elements`
        ],
    keyTerms: technical
      ? ["syntax", "runtime", "patterns", "debugging", "practice"]
      : ["overview", "example", "planning", "workflow", "application"],
    example: technical
      ? `// Example starter for ${query}\nfunction studyExample() {\n  console.log("Break the concept into one small working piece.");\n}`
      : `Example study note:\nStart with a clear definition of ${query}, add one practical example, and then list a few situations where it matters.`,
    exercise: technical
      ? {
          title: `Practice ${query}`,
          prompt: `Build one small example that demonstrates the main idea of ${query}.`,
          starter: `// Start a tiny example for ${query}`,
          checklist: ["Define the goal", "Write one small example", "Explain why it works"]
        }
      : {
          title: `Study ${query}`,
          prompt: `Write a short explanation of ${query} and connect it to one practical situation.`,
          starter: "",
          checklist: ["Write the main idea", "Add one real-world example", "Summarize what matters most"]
        },
    quiz: technical
      ? [
          {
            q: `Which study approach is best when learning ${query}?`,
            options: [
              "Understand the concept, then test it with one small example",
              "Memorize isolated terms only",
              "Skip examples and go directly to advanced cases",
              "Avoid reviewing errors"
            ],
            answer: 0
          },
          {
            q: `What should a learner focus on first for ${query}?`,
            options: [
              "The problem the topic solves",
              "Only naming conventions",
              "Only interview tricks",
              "Only production scaling"
            ],
            answer: 0
          }
        ]
      : [],
    scenarios: technical
      ? [
          `A learner is asked to explain ${query} in a project review and must connect the concept to a real implementation.`,
          `A team needs to use ${query} in a maintainable way, so the learner should understand both the simple version and the scalable version.`,
          `During debugging, ${query} becomes easier when the learner can describe the runtime flow instead of only memorizing syntax.`,
          `In an interview or mock task, ${query} is stronger when paired with one practical scenario and one tradeoff discussion.`
        ]
      : [
          `A beginner needs to understand ${query} well enough to explain it to someone else using simple language.`,
          `A real-world decision depends on understanding ${query}, so examples and context matter more than memorization.`,
          `A learner is comparing different approaches around ${query} and wants a more practical decision-making framework.`,
          `A reflective study session uses ${query} to build confidence, vocabulary, and applied understanding.`
        ],
    mockPrompts: technical
      ? [
          {
            id: `${slugify(query)}-mock-1`,
            title: `Applied task for ${query}`,
            prompt: `Write one practical implementation or structured answer that shows how you would use ${query} in a realistic scenario.`
          }
        ]
      : [],
    media: [
      {
        type: "Video",
        title: `${query} video search`,
        description: `A quick video search to explore ${query} from multiple creators.`,
        href: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        image: `https://placehold.co/960x600/1f2140/f5f7ff?text=${encodeURIComponent(query)}`
      },
      {
        type: "Image",
        title: `${query} image ideas`,
        description: `Browse visual references related to ${query}.`,
        href: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`,
        image: `https://placehold.co/960x600/2b315d/f8fafc?text=${encodeURIComponent(`${query} visuals`)}`
      }
    ],
    capabilities: {
      quizEnabled: technical,
      terminalEnabled: technical,
      mockEnabled: technical
    },
    source: "fallback",
    slug: slugify(query)
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
      keyTerms: { type: "array", items: { type: "string" } },
      example: { type: "string" },
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
            previewVideo: { type: "string" }
          },
          required: ["type", "title", "description", "href"]
        }
      },
      capabilities: {
        type: "object",
        properties: {
          quizEnabled: { type: "boolean" },
          terminalEnabled: { type: "boolean" },
          mockEnabled: { type: "boolean" }
        },
        required: ["quizEnabled", "terminalEnabled", "mockEnabled"]
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
      "keyTerms",
      "example",
      "exercise",
      "quiz",
      "mockPrompts",
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
                  "Write 5 to 7 deepDive paragraphs.",
                  "Write 8 to 12 subtopics.",
                  "Write 5 to 10 branchTopics that can be clicked later as follow-up searches. Keep them short and specific.",
                  "Write 6 to 10 keyTerms.",
                  "Write 4 to 6 scenarios or applied use cases.",
                  "If the topic is technical, enable quizEnabled, terminalEnabled, and mockEnabled when helpful.",
                  "If the topic is non-technical, keep the output content-first and usually disable terminalEnabled, quizEnabled, and mockEnabled.",
                  "For non-technical topics, example should be a reference summary, comparison, quote-style explainer, or sample note, not code.",
                  "Keep every text readable and specific.",
                  "Provide 2 or 3 media suggestions using direct search URLs when necessary.",
                  "Include image URLs when possible. Include previewVideo only when you are confident it is a direct playable video URL."
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
  const fallbackTopic = buildFallbackTopic(query.trim());

  return NextResponse.json({
    topic: aiTopic || fallbackTopic,
    provider: aiTopic ? process.env.GEMINI_MODEL || "gemini-2.5-flash-lite" : "local fallback"
  });
}
