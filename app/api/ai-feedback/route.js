import { NextResponse } from "next/server";
import { buildPracticeReview, getFallbackTemplate } from "@/lib/ai-review";

async function fetchGeminiFeedback(payload) {
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
                  "Review this learner submission for programming practice.",
                  "Return concise JSON with keys: summary, fixes, hints.",
                  "Keep fixes practical and beginner-friendly.",
                  `Track: ${payload.track}`,
                  `Language: ${payload.language || "unknown"}`,
                  `Topic: ${payload.topicTitle || "Practice"}`,
                  `Files: ${JSON.stringify(payload.files)}`
                ].join("\n")
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
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
  const payload = await request.json();
  const staticReview = buildPracticeReview(payload);
  const aiReview = await fetchGeminiFeedback(payload);

  return NextResponse.json({
    provider: aiReview ? "Gemini Flash-Lite + local validator" : "Local validator",
    staticReview,
    aiReview,
    template: getFallbackTemplate(payload.track, payload.language)
  });
}
