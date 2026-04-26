import type { EmotionAnalysis, FaceState } from "./types";
import { clamp01 } from "./membership";
import { weightedDefuzzify, average } from "./defuzzification";

export function generateFaceState(analysis: EmotionAnalysis): FaceState {
  const e = analysis.scores;

  const humor = clamp01(e.humor);
  const aggression = clamp01(e.aggression);
  const sadness = clamp01(e.sadness);
  const surprise = clamp01(e.surprise);
  const confusion = clamp01(e.confusion);

  const browRaise = weightedDefuzzify([
    { value: surprise, term: "high", weight: 0.9 },
    { value: sadness, term: "medium", weight: 0.35 },
    { value: confusion, term: "medium", weight: 0.45 },
  ]);

  const browLower = weightedDefuzzify([
    { value: aggression, term: "high", weight: 0.95 },
    { value: confusion, term: "medium", weight: 0.45 },
  ]);

  const eyeOpen = weightedDefuzzify([
    { value: surprise, term: "high", weight: 0.95 },
    { value: confusion, term: "medium", weight: 0.35 },
  ]);

  const eyeSquint = weightedDefuzzify([
    { value: humor, term: "medium", weight: 0.5 },
    { value: aggression, term: "medium", weight: 0.45 },
    { value: confusion, term: "medium", weight: 0.25 },
  ]);

  const smile = weightedDefuzzify([
    { value: humor, term: "high", weight: 1.0 },
    { value: surprise, term: "medium", weight: 0.2 },
    { value: sadness, term: "low", weight: 0.35 },
  ]);

  const mouthDown = weightedDefuzzify([
    { value: sadness, term: "high", weight: 0.95 },
    { value: confusion, term: "medium", weight: 0.25 },
  ]);

  const lipPress = weightedDefuzzify([
    { value: aggression, term: "high", weight: 0.9 },
    { value: sadness, term: "medium", weight: 0.25 },
  ]);

  const jawDrop = weightedDefuzzify([
    { value: surprise, term: "high", weight: 0.8 },
    { value: confusion, term: "high", weight: 0.35 },
  ]);

  const asymmetryPower = average([
    humor * 0.85,
    aggression * humor * 0.6,
    confusion * 0.25,
  ]);

  const asymmetryLcr =
    humor > 0.45 || aggression * humor > 0.25
      ? 0.82
      : 0.5;

  return {
    browRaise: { power: browRaise, lcr: 0.5 },
    browLower: { power: browLower, lcr: 0.5 },
    eyeOpen: { power: eyeOpen, lcr: 0.5 },
    eyeSquint: { power: eyeSquint, lcr: 0.5 },
    smile: { power: smile, lcr: asymmetryLcr },
    mouthDown: { power: mouthDown, lcr: 0.5 },
    lipPress: { power: lipPress, lcr: 0.5 },
    jawDrop: { power: jawDrop, lcr: 0.5 },
    asymmetry: { power: asymmetryPower, lcr: asymmetryLcr },
  };
}