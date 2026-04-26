export type ExpertEmotionInput = {
  humor: number;
  aggression: number;
  sadness: number;
  surprise: number;
  confusion: number;
};

export type EmotionAnalysis = {
  scores: ExpertEmotionInput;
  dominant: string;
  confidence: number;
  explanation: string;
};

export type MuscleName =
  | "browRaise"
  | "browLower"
  | "eyeOpen"
  | "eyeSquint"
  | "smile"
  | "mouthDown"
  | "lipPress"
  | "jawDrop"
  | "asymmetry";

export type MuscleControl = {
  power: number;
  lcr: number;
};

export type FaceState = Record<MuscleName, MuscleControl>;

export type FuzzyTerm = "low" | "medium" | "high";