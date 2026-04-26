import type { EmotionAnalysis } from "@/lib/fuzzy-core/types";
import { clamp01 } from "@/lib/fuzzy-core/membership";
import { buildEmotionPrompt } from "./prompt.";

function normalizeAnalysis(data: unknown): EmotionAnalysis {
  const raw = data as Partial<EmotionAnalysis>;

  return {
    scores: {
      humor: clamp01(Number(raw.scores?.humor ?? 0)),
      aggression: clamp01(Number(raw.scores?.aggression ?? 0)),
      sadness: clamp01(Number(raw.scores?.sadness ?? 0)),
      surprise: clamp01(Number(raw.scores?.surprise ?? 0)),
      confusion: clamp01(Number(raw.scores?.confusion ?? 0)),
    },
    dominant: String(raw.dominant ?? "unknown"),
    confidence: clamp01(Number(raw.confidence ?? 0)),
    explanation: String(raw.explanation ?? ""),
  };
}

export async function analyzeWithMistral(message: string): Promise<EmotionAnalysis> {
  const apiKey = process.env.MISTRAL_API_KEY;
  const model = process.env.MISTRAL_MODEL ?? "mistral-small-latest";

  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY не найден в .env.local");
  }

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.15,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content:
            "Ты модуль эмоционального анализа. Всегда возвращай только валидный JSON.",
        },
        {
          role: "user",
          content: buildEmotionPrompt(message),
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ошибка Mistral API: ${response.status} ${text}`);
  }

  const json = await response.json();

  const content = json?.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new Error("Mistral вернул неожиданный формат ответа");
  }

  const parsed = JSON.parse(content);

  return normalizeAnalysis(parsed);
}