import {
  createEmptyEmotionScores,
  emotionKeys,
  emotionLabels,
  type EmotionAnalysis,
  type EmotionName,
  type EmotionScores,
  type ExpertAssessment,
} from "@/lib/fuzzy-core/types";
import { average, weightedAverage } from "@/lib/fuzzy-core/defuzzification";
import { clamp01 } from "@/lib/fuzzy-core/membership";
import { buildEmotionPrompt } from "@/lib/ai/prompt";
import { calibrateEmotionScores } from "@/lib/ai/textCalibration";

type RawMistralResponse = {
  experts?: unknown;
  consensusExplanation?: unknown;
  explanation?: unknown;
  scores?: unknown;
  dominant?: unknown;
  confidence?: unknown;
};

function normalizeScores(data: unknown): EmotionScores {
  const raw = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const scores = createEmptyEmotionScores();

  emotionKeys.forEach((key) => {
    scores[key] = clamp01(Number(raw[key] ?? 0));
  });

  return scores;
}

const emotionCluster: Record<EmotionName, string> = {
  joy: "warmth",
  affection: "warmth",
  humor: "warmth",
  aggression: "hostility",
  sadness: "distress",
  surprise: "wonder",
  confusion: "uncertainty",
  embarrassment: "uncertainty",
  disgust: "hostility",
  tension: "support",
  sarcasm: "sarcasm",
  fear: "distress",
  contempt: "hostility",
  awe: "wonder",
  curiosity: "uncertainty",
};

function isSupportivePair(left: EmotionName, right: EmotionName): boolean {
  if (left === right) return true;

  const pairKey = [left, right].sort().join(":");

  return new Set([
    "affection:joy",
    "humor:joy",
    "aggression:tension",
    "disgust:tension",
    "fear:tension",
    "awe:surprise",
    "confusion:curiosity",
    "confusion:embarrassment",
    "curiosity:embarrassment",
    "contempt:sarcasm",
    "aggression:contempt",
  ]).has(pairKey);
}

function resolveNearTie(
  scores: EmotionScores,
  first: readonly [EmotionName, number],
  second: readonly [EmotionName, number]
): EmotionName | "mixed" {
  const [firstEmotion, firstValue] = first;
  const [secondEmotion, secondValue] = second;

  if (isSupportivePair(firstEmotion, secondEmotion)) {
    if (
      (firstEmotion === "affection" || secondEmotion === "affection") &&
      scores.affection >= Math.max(scores.joy - 0.08, 0.34)
    ) {
      return "affection";
    }

    if (
      (firstEmotion === "aggression" || secondEmotion === "aggression") &&
      scores.aggression >= Math.max(scores.tension - 0.1, scores.contempt - 0.08)
    ) {
      return "aggression";
    }

    if (
      (firstEmotion === "awe" || secondEmotion === "awe") &&
      scores.awe >= Math.max(scores.surprise - 0.08, 0.34)
    ) {
      return "awe";
    }

    if (
      (firstEmotion === "sarcasm" || secondEmotion === "sarcasm") &&
      scores.sarcasm >= Math.max(secondValue - 0.05, firstValue - 0.05, 0.32)
    ) {
      return "sarcasm";
    }

    if (
      (firstEmotion === "fear" || secondEmotion === "fear") &&
      scores.fear >= Math.max(scores.tension - 0.08, 0.32)
    ) {
      return "fear";
    }

    return firstValue >= secondValue ? firstEmotion : secondEmotion;
  }

  if (
    emotionCluster[firstEmotion] === emotionCluster[secondEmotion] &&
    emotionCluster[firstEmotion] !== "support"
  ) {
    return firstValue >= secondValue ? firstEmotion : secondEmotion;
  }

  if (firstEmotion === "tension" && secondValue >= firstValue - 0.08) {
    return secondEmotion;
  }

  if (secondEmotion === "tension" && firstValue >= secondValue - 0.08) {
    return firstEmotion;
  }

  return "mixed";
}

function getDominantEmotion(scores: EmotionScores): EmotionName | "mixed" {
  const ranked = emotionKeys
    .map((key) => [key, scores[key]] as const)
    .sort((left, right) => right[1] - left[1]);

  const [first, second] = ranked;

  if (!first) return "mixed";
  if (!second || first[1] - second[1] > 0.06) return first[0];

  return resolveNearTie(scores, first, second);
}

function normalizeDominant(data: unknown, scores: EmotionScores): EmotionName | "mixed" {
  if (typeof data === "string" && (emotionKeys as readonly string[]).includes(data)) {
    return data as EmotionName;
  }

  if (data === "mixed") return "mixed";

  return getDominantEmotion(scores);
}

function normalizeExpert(data: unknown, index: number): ExpertAssessment {
  const raw = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const scores = normalizeScores(raw.scores);

  return {
    expert:
      typeof raw.expert === "string" && raw.expert.trim()
        ? raw.expert
        : `expert_${index + 1}`,
    focus: typeof raw.focus === "string" ? raw.focus : "Общий эмоциональный ракурс.",
    scores,
    dominant: normalizeDominant(raw.dominant, scores),
    confidence: clamp01(Number(raw.confidence ?? 0.58)),
    explanation:
      typeof raw.explanation === "string"
        ? raw.explanation
        : "Эксперт не добавил пояснение.",
  };
}

function fallbackExpertsFromSingleAnalysis(raw: RawMistralResponse): ExpertAssessment[] {
  const scores = normalizeScores(raw.scores);

  return [
    {
      expert: "single_pass_fallback",
      focus: "Аварийный сценарий, если модель не вернула массив экспертов.",
      scores,
      dominant: normalizeDominant(raw.dominant, scores),
      confidence: clamp01(Number(raw.confidence ?? 0.45)),
      explanation:
        typeof raw.explanation === "string"
          ? raw.explanation
          : "Использована резервная одиночная оценка.",
    },
  ];
}

function aggregateScores(experts: ExpertAssessment[]): EmotionScores {
  const aggregate = createEmptyEmotionScores();

  emotionKeys.forEach((key) => {
    const samples = experts
      .map((expert) => ({
        value: expert.scores[key],
        weight: 0.35 + expert.confidence * 0.65,
      }))
      .sort((left, right) => left.value - right.value);

    const trimmed =
      samples.length >= 6 ? samples.slice(1, samples.length - 1) : samples;

    aggregate[key] = weightedAverage(
      trimmed.map((sample) => sample.value),
      trimmed.map((sample) => sample.weight)
    );
  });

  return aggregate;
}

function calculateDisagreement(
  experts: ExpertAssessment[],
  aggregateScoresMap: EmotionScores
): EmotionScores {
  const disagreement = createEmptyEmotionScores();

  emotionKeys.forEach((key) => {
    const variance = average(
      experts.map((expert) => (expert.scores[key] - aggregateScoresMap[key]) ** 2)
    );

    disagreement[key] = clamp01(Math.sqrt(variance));
  });

  return disagreement;
}

function buildConsensusExplanation(
  scores: EmotionScores,
  experts: ExpertAssessment[],
  disagreement: EmotionScores,
  dominant: EmotionName | "mixed",
  modelExplanation: string,
  calibrationNotes: string[]
): string {
  const strongest = emotionKeys
    .map((key) => [key, scores[key]] as const)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3);

  const summary = strongest
    .map(([key, value]) => `${emotionLabels[key].toLowerCase()} ${value.toFixed(2)}`)
    .join(", ");

  const agreement = strongest
    .map(([key]) => disagreement[key])
    .reduce((sum, value) => sum + value, 0) / Math.max(strongest.length, 1);

  const dominantText =
    dominant === "mixed"
      ? "смешанное состояние"
      : `доминирует ${emotionLabels[dominant].toLowerCase()}`;
  const calibrationSuffix =
    calibrationNotes.length > 0
      ? " После локальной калибровки текстовых маркеров итог выровнен под финальные числа."
      : "";
  const modelSuffix =
    modelExplanation.trim() && calibrationNotes.length === 0
      ? ` Модельный комментарий: ${modelExplanation.trim()}`
      : "";

  return `Консенсус ${experts.length} экспертов: ${dominantText}; главные сигналы — ${summary}. Среднее расхождение по ведущим эмоциям ${agreement.toFixed(2)}.${calibrationSuffix}${modelSuffix}`;
}

function getAdjustedRunnerUp(scores: EmotionScores, dominant: EmotionName | "mixed"): number {
  if (dominant === "mixed") {
    return emotionKeys
      .map((key) => scores[key])
      .sort((left, right) => right - left)[0] ?? 0;
  }

  return (
    emotionKeys
      .filter((key) => key !== dominant)
      .map((key) => (isSupportivePair(dominant, key) ? scores[key] * 0.55 : scores[key]))
      .sort((left, right) => right - left)[0] ?? 0
  );
}

function normalizeAnalysis(data: unknown, message: string): EmotionAnalysis {
  const raw =
    data && typeof data === "object" ? (data as RawMistralResponse) : ({} as RawMistralResponse);

  const rawExperts = Array.isArray(raw.experts)
    ? raw.experts.map((entry, index) => normalizeExpert(entry, index))
    : fallbackExpertsFromSingleAnalysis(raw);

  const experts = rawExperts.slice(0, 10);
  const baseScores = aggregateScores(experts);
  const { scores, notes: calibrationNotes } = calibrateEmotionScores(message, baseScores);
  const disagreement = calculateDisagreement(experts, baseScores);
  const dominant = getDominantEmotion(scores);
  const meanConfidence = average(experts.map((expert) => expert.confidence));
  const dominantValue = dominant === "mixed" ? 0 : scores[dominant];
  const runnerUp = getAdjustedRunnerUp(scores, dominant);
  const separation = clamp01(dominantValue - runnerUp);
  const disagreementPenalty = average(
    emotionKeys
      .map((key) => [key, scores[key]] as const)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([key]) => disagreement[key])
  );

  return {
    scores,
    dominant,
    confidence: clamp01(meanConfidence * 0.68 + separation * 0.5 - disagreementPenalty * 0.35),
    explanation: buildConsensusExplanation(
      scores,
      experts,
      disagreement,
      dominant,
      typeof raw.consensusExplanation === "string"
        ? raw.consensusExplanation
        : typeof raw.explanation === "string"
          ? raw.explanation
          : "",
      calibrationNotes
    ),
    experts,
    disagreement,
    calibrationNotes,
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
      temperature: 0.1,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content:
            "Ты модуль эмоционального анализа для выразительного, темпераментного персонажа. Не сглаживай конфликт, провокацию и агрессию до нейтральности. Всегда возвращай только валидный JSON без markdown.",
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

  return normalizeAnalysis(JSON.parse(content), message);
}
