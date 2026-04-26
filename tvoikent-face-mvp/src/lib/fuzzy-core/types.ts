export const emotionKeys = [
  "joy",
  "affection",
  "humor",
  "aggression",
  "sadness",
  "surprise",
  "confusion",
  "embarrassment",
  "disgust",
  "tension",
  "sarcasm",
  "fear",
  "contempt",
  "awe",
  "curiosity",
] as const;

export type EmotionName = (typeof emotionKeys)[number];

export type EmotionScores = Record<EmotionName, number>;

export type ExpertEmotionInput = EmotionScores;

export type ExpertAssessment = {
  expert: string;
  focus: string;
  scores: EmotionScores;
  dominant: EmotionName | "mixed";
  confidence: number;
  explanation: string;
};

export type EmotionAnalysis = {
  scores: EmotionScores;
  dominant: EmotionName | "mixed";
  confidence: number;
  explanation: string;
  experts: ExpertAssessment[];
  disagreement: EmotionScores;
  calibrationNotes: string[];
};

export const emotionLabels: Record<EmotionName, string> = {
  joy: "Радость",
  affection: "Тепло",
  humor: "Юмор",
  aggression: "Агрессия",
  sadness: "Грусть",
  surprise: "Удивление",
  confusion: "Замешательство",
  embarrassment: "Смущение",
  disgust: "Отвращение",
  tension: "Напряжение",
  sarcasm: "Сарказм",
  fear: "Страх",
  contempt: "Презрение",
  awe: "Восторг",
  curiosity: "Любопытство",
};

export function createEmptyEmotionScores(): EmotionScores {
  return {
    joy: 0,
    affection: 0,
    humor: 0,
    aggression: 0,
    sadness: 0,
    surprise: 0,
    confusion: 0,
    embarrassment: 0,
    disgust: 0,
    tension: 0,
    sarcasm: 0,
    fear: 0,
    contempt: 0,
    awe: 0,
    curiosity: 0,
  };
}

export type MuscleName =
  | "browRaise"
  | "browLower"
  | "singleBrowRaise"
  | "eyeOpen"
  | "eyeSquint"
  | "smile"
  | "mouthDown"
  | "lipPress"
  | "upperLipRaise"
  | "jawDrop"
  | "mouthRound"
  | "mouthStretch"
  | "asymmetry";

export type MuscleControl = {
  power: number;
  lcr: number;
};

export type FaceState = Record<MuscleName, MuscleControl>;

export type FuzzyTerm = "low" | "medium" | "high";
