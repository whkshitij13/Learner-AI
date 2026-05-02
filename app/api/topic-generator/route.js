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
  const slug = slugify(query);
  const makeQuiz = (level, questions) => ({
    level,
    quiz: questions,
    mockPrompts: technical
      ? [
          {
            id: `${slug}-${level}-mock`,
            title: `${level} applied task for ${query}`,
            prompt:
              level === "beginner"
                ? `Write one simple example that shows the basic idea of ${query}.`
                : level === "intermediate"
                  ? `Explain how you would apply ${query} in a practical scenario and justify your choices.`
                  : `Design a more advanced solution, tradeoff discussion, or analysis that shows deeper mastery of ${query}.`
          }
        ]
      : []
  });
  const subtopicCards = technical
    ? [
        { id: `${slug}-foundations`, title: "Foundations", summary: `Understand what ${query} is and why it exists.`, goal: "Build the mental model first." },
        { id: `${slug}-syntax`, title: "Syntax and structure", summary: `Learn the core syntax, structure, or shape of ${query}.`, goal: "Recognize the essential building blocks." },
        { id: `${slug}-conditions-loops`, title: "Logic and flow", summary: `Study the decision flow, conditions, loops, and control behavior around ${query}.`, goal: "Follow execution step by step." },
        { id: `${slug}-patterns`, title: "Core patterns", summary: `See the common implementation patterns used with ${query}.`, goal: "Move from theory to reusable patterns." },
        { id: `${slug}-debugging`, title: "Debugging", summary: `Understand the common mistakes and how to debug them.`, goal: "Learn how to recover when things break." },
        { id: `${slug}-practice`, title: "Practice and projects", summary: `Apply ${query} in small exercises and more realistic tasks.`, goal: "Turn understanding into ability." }
      ]
    : [
        { id: `${slug}-overview`, title: "Overview", summary: `Start with the big picture of ${query}.`, goal: "Get context before details." },
        { id: `${slug}-background`, title: "Background", summary: `Learn the history, context, or origin of ${query}.`, goal: "Understand where it comes from." },
        { id: `${slug}-core-ideas`, title: "Core ideas", summary: `Break the topic into its most important concepts.`, goal: "Separate the major ideas clearly." },
        { id: `${slug}-examples`, title: "Examples", summary: `See memorable examples and realistic situations involving ${query}.`, goal: "Connect the topic to real life." },
        { id: `${slug}-deeper-study`, title: "Deeper study", summary: `Go beyond the basics with comparisons, nuance, and related ideas.`, goal: "Build a richer understanding." }
      ];

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
          `When revising, explain the topic out loud in your own words and then rebuild one example from memory.`,
          `It also helps to separate the beginner-level concepts from the advanced tradeoffs, because that makes the topic less overwhelming and easier to revisit later.`,
          `A learner usually improves faster when each subtopic feels like a milestone, not just a paragraph to read once and forget.`,
          `When you understand how the pieces connect, you stop treating ${query} like isolated syntax and start seeing it as a real system.`,
          `That is why a good study path should move from first principles into examples, practice, debugging, and finally more confident implementation choices.`
        ]
      : [
          `${query} is best studied by starting with the big picture and then moving into patterns, examples, and use cases.`,
          `A good study card should make the topic feel readable, not overwhelming, so the learner can keep momentum.`,
          `Short examples, visual media, and reflective questions usually work better than forcing every topic into a quiz.`,
          `It helps to separate definition, process, real-world context, and common misconceptions so the learner can absorb the topic step by step.`,
          `Each deep-dive section should answer what it is, why it matters, when it applies, and what good usage looks like.`,
          `The best study experience leaves the learner with both understanding and language they can confidently reuse later.`,
          `If the learner wants to keep reading, the content should keep unfolding into background, examples, variants, and deeper connections instead of stopping too early.`,
          `A strong study page therefore needs enough substance to support curiosity, not just enough text to look complete at first glance.`,
          `Breaking ${query} into smaller subtopics also makes it easier to click into the exact section the learner wants next.`,
          `That structure is what turns a search result into an actual guided learning flow.`
        ],
    longRead: technical
      ? [
          `To learn ${query} well, begin with the problem it solves and the reason developers use it in real projects.`,
          `Once the purpose is clear, the next step is understanding the shape of the syntax, structure, or architecture involved.`,
          `After that, the learner should move into control flow and behavior, because understanding what happens during execution matters more than memorizing isolated code.`,
          `Examples are most useful when they move from small and safe to realistic and imperfect, because that is where implementation judgment starts to grow.`,
          `Debugging should not be treated as a separate advanced skill. It should be part of learning from the beginning.`,
          `A good learning path also explains what beginner solutions look like, what intermediate improvements add, and what advanced tradeoffs become important later.`,
          `That progression helps the learner understand not only how to write ${query}, but how to think with it.`,
          `It is also useful to revisit the same concept from different angles: explanation, example, scenario, and practice.`,
          `Over time, the topic becomes easier because the learner stops seeing disconnected facts and starts seeing a coherent system.`,
          `The goal is not only recall. The goal is confident application in a new situation.`,
          `That is why a deep study page should provide multiple entry points, deeper reading, and practice paths that match the learner's level.`,
          `If you can explain ${query}, apply it, debug it, and compare alternatives, you are moving toward real mastery.`
        ]
      : [
          `A strong introduction to ${query} starts by answering what it is in simple language and why people care about it.`,
          `From there, the learner should move into the main pieces or dimensions that define the topic.`,
          `Background context often matters because many topics only make sense when you understand where they came from or how they developed.`,
          `Examples are what make the topic memorable, especially when they connect directly to real situations or familiar comparisons.`,
          `It also helps to surface misconceptions early so the learner does not build understanding on a weak foundation.`,
          `Once the basics are clear, deeper reading can explore variations, contrasting viewpoints, or more advanced interpretations.`,
          `This is where the topic stops feeling like a short answer and starts feeling like a subject worth studying.`,
          `A good study flow keeps the learner moving by dividing the subject into smaller sections that are easier to click and revisit.`,
          `That is especially important when the user is curious and wants to keep reading rather than stop after a few paragraphs.`,
          `The goal is to leave the learner with clarity, vocabulary, examples, and a sense of what to explore next.`,
          `If the page supports that progression well, it becomes a reusable learning guide instead of a one-time answer.`,
          `That is the kind of depth a real learning platform should provide for ${query}.`
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
    subtopicCards,
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
    quiz: [],
    assessments: technical
      ? {
          beginner: makeQuiz("beginner", [
            {
              q: `Which learning approach is best when starting ${query}?`,
              options: [
                "Understand the concept, then test it with one small example",
                "Memorize isolated terms only",
                "Skip examples and go directly to advanced cases",
                "Avoid reviewing mistakes"
              ],
              answer: 0
            },
            {
              q: `What should a learner focus on first for ${query}?`,
              options: ["The problem the topic solves", "Only naming conventions", "Only interview tricks", "Only production scaling"],
              answer: 0
            }
          ]),
          intermediate: makeQuiz("intermediate", [
            {
              q: `What usually improves understanding of ${query} at the intermediate stage?`,
              options: [
                "Connecting syntax to runtime behavior and realistic examples",
                "Ignoring debugging completely",
                "Avoiding tradeoffs and edge cases",
                "Studying only definitions"
              ],
              answer: 0
            }
          ]),
          advanced: makeQuiz("advanced", [
            {
              q: `What makes advanced understanding of ${query} different from beginner understanding?`,
              options: [
                "The ability to discuss tradeoffs, edge cases, and maintainability",
                "Only remembering more keywords",
                "Avoiding architecture conversations",
                "Using the shortest possible answer"
              ],
              answer: 0
            }
          ])
        }
      : {
          beginner: { level: "beginner", quiz: [], mockPrompts: [] },
          intermediate: { level: "intermediate", quiz: [], mockPrompts: [] },
          advanced: { level: "advanced", quiz: [], mockPrompts: [] }
        },
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
    mockPrompts: [],
    media: [
      {
        type: "Video",
        title: `${query} quick preview`,
        description: `A short playable preview card to keep the topic visually engaging inside the study view.`,
        href: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        previewVideo: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        image: `https://placehold.co/960x600/1f2140/f5f7ff?text=${encodeURIComponent(`${query} preview`)}`
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
    slug
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
                  "If the topic is non-technical, keep the output content-first and usually disable terminalEnabled, quizEnabled, and mockEnabled. Do not force practice or mock tabs for things like football, history, travel, movies, music, or general reading topics.",
                  "For non-technical topics, example should be a reference summary, comparison, quote-style explainer, or sample note, not code.",
                  "Keep every text readable and specific.",
                  "Provide 3 or 4 media suggestions using direct search URLs when necessary.",
                  "For videos, prefer sources that can actually preview on hover. Include previewVideo only when you are confident it is a direct playable video URL such as mp4/webm, otherwise omit it instead of guessing.",
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
  const fallbackTopic = buildFallbackTopic(query.trim());

  return NextResponse.json({
    topic: aiTopic || fallbackTopic,
    provider: aiTopic ? process.env.GEMINI_MODEL || "gemini-2.5-flash-lite" : "local fallback"
  });
}
