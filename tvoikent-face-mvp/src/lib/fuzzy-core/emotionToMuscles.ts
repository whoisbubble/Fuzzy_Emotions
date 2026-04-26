import type { EmotionAnalysis, FaceState, FuzzyTerm } from "./types";
import { clamp01, membership } from "./membership";
import {
  average,
  centroidDefuzzify,
  weightedAverage,
} from "./defuzzification";

type MuscleRule = {
  activation: number;
  term: FuzzyTerm;
  weight?: number;
};

function rule(
  value: number,
  antecedent: FuzzyTerm,
  consequent: FuzzyTerm,
  weight = 1
): MuscleRule {
  return {
    activation: membership(value, antecedent),
    term: consequent,
    weight,
  };
}

function direct(activation: number, consequent: FuzzyTerm, weight = 1): MuscleRule {
  return {
    activation: clamp01(activation),
    term: consequent,
    weight,
  };
}

function getCombinedRuleSupport(rules: MuscleRule[]): number {
  const remaining = rules.reduce((product, rule) => {
    const strength = clamp01(rule.activation * (rule.weight ?? 1));
    return product * (1 - strength);
  }, 1);

  return clamp01(1 - remaining);
}

function inferMusclePower(rules: MuscleRule[], response = 1): number {
  const support = getCombinedRuleSupport(rules);

  if (support <= 0.0001) {
    return 0;
  }

  const centroid = centroidDefuzzify(rules);
  return clamp01(centroid * support * response);
}

export function generateFaceState(analysis: EmotionAnalysis): FaceState {
  const e = analysis.scores;

  const joy = clamp01(e.joy);
  const affection = clamp01(e.affection);
  const humor = clamp01(e.humor);
  const aggression = clamp01(e.aggression);
  const sadness = clamp01(e.sadness);
  const surprise = clamp01(e.surprise);
  const confusion = clamp01(e.confusion);
  const embarrassment = clamp01(e.embarrassment);
  const disgust = clamp01(e.disgust);
  const tension = clamp01(e.tension);
  const sarcasm = clamp01(e.sarcasm);
  const fear = clamp01(e.fear);
  const contempt = clamp01(e.contempt);
  const awe = clamp01(e.awe);
  const curiosity = clamp01(e.curiosity);

  const warmth = weightedAverage([joy, affection, humor, awe], [0.95, 1, 0.45, 0.3]);
  const hostility = weightedAverage(
    [aggression, contempt, disgust, tension],
    [1, 0.8, 0.45, 0.35]
  );
  const distress = weightedAverage(
    [sadness, fear, tension, embarrassment],
    [0.75, 0.9, 0.4, 0.25]
  );
  const cognitiveLoad = weightedAverage(
    [confusion, surprise, fear, curiosity],
    [1, 0.35, 0.2, 0.18]
  );
  const awkwardness = weightedAverage(
    [embarrassment, confusion, tension, curiosity],
    [1, 0.45, 0.35, 0.2]
  );
  const wonder = weightedAverage([surprise, awe, fear], [0.8, 1, 0.3]);
  const revulsion = weightedAverage([disgust, contempt, fear], [1, 0.35, 0.15]);
  const skepticism = weightedAverage(
    [curiosity, sarcasm, contempt, confusion],
    [0.75, 0.45, 0.35, 0.45]
  );
  const sardonicBlend = weightedAverage(
    [sarcasm, contempt, aggression, humor, curiosity],
    [1, 0.7, 0.35, 0.25, 0.18]
  );

  const browRaise = inferMusclePower([
    rule(surprise, "medium", "medium", 0.45),
    rule(surprise, "high", "high", 1),
    rule(awe, "medium", "medium", 0.55),
    rule(awe, "high", "high", 0.95),
    rule(confusion, "medium", "medium", 0.35),
    rule(fear, "high", "high", 0.75),
    rule(curiosity, "medium", "low", 0.26),
  ], 1.14);

  const browLower = inferMusclePower([
    rule(aggression, "medium", "medium", 0.65),
    rule(aggression, "high", "high", 1),
    rule(contempt, "medium", "medium", 0.55),
    rule(disgust, "medium", "medium", 0.28),
    rule(tension, "high", "high", 0.7),
    direct(hostility * tension, "high", 0.35),
    direct(aggression * hostility, "high", 0.5),
  ], 1.24);

  const singleBrowRaise = inferMusclePower([
    rule(embarrassment, "medium", "medium", 0.55),
    rule(embarrassment, "high", "high", 0.9),
    rule(confusion, "medium", "medium", 0.45),
    rule(confusion, "high", "high", 0.75),
    rule(curiosity, "medium", "medium", 0.55),
    rule(curiosity, "high", "high", 0.8),
    rule(sarcasm, "medium", "medium", 0.25),
    rule(sarcasm, "high", "medium", 0.48),
    direct(skepticism, "medium", 0.35),
  ], 1.2);

  const eyeOpen = inferMusclePower([
    rule(surprise, "medium", "medium", 0.45),
    rule(surprise, "high", "high", 1),
    rule(awe, "medium", "medium", 0.5),
    rule(awe, "high", "high", 0.85),
    rule(fear, "medium", "medium", 0.5),
    rule(fear, "high", "high", 0.8),
    rule(curiosity, "medium", "medium", 0.32),
    rule(confusion, "medium", "medium", 0.2),
  ], 1.12);

  const eyeSquint = inferMusclePower([
    rule(humor, "medium", "medium", 0.45),
    rule(joy, "medium", "medium", 0.25),
    rule(joy, "high", "medium", 0.35),
    rule(affection, "medium", "low", 0.22),
    rule(affection, "high", "medium", 0.4),
    rule(aggression, "medium", "medium", 0.4),
    rule(aggression, "high", "high", 0.68),
    rule(contempt, "medium", "high", 0.55),
    rule(sarcasm, "high", "high", 0.8),
    rule(disgust, "medium", "high", 0.48),
    rule(tension, "medium", "medium", 0.28),
    rule(curiosity, "medium", "medium", 0.25),
    rule(embarrassment, "medium", "low", 0.12),
  ], 1.14);

  const genuineSmile = inferMusclePower([
    rule(joy, "medium", "medium", 0.5),
    rule(joy, "high", "high", 0.95),
    rule(affection, "medium", "medium", 0.65),
    rule(affection, "high", "high", 1),
    rule(humor, "high", "high", 0.72),
    rule(awe, "medium", "medium", 0.22),
  ], 1.36);

  const smileSuppression = inferMusclePower([
    rule(aggression, "medium", "medium", 0.55),
    rule(aggression, "high", "high", 1),
    rule(disgust, "medium", "medium", 0.6),
    rule(sadness, "high", "high", 0.6),
    rule(fear, "medium", "medium", 0.4),
    rule(tension, "high", "high", 0.45),
    rule(contempt, "high", "medium", 0.35),
    rule(embarrassment, "medium", "low", 0.2),
  ], 1.08);

  const sarcasticSmirk = inferMusclePower([
    rule(sarcasm, "medium", "low", 0.2),
    rule(sarcasm, "high", "medium", 0.45),
    direct(sardonicBlend, "medium", 0.4),
  ], 1.18);

  const genuineSmileGate = clamp01(
    1 + warmth * 0.08 - hostility * 0.95 - distress * 0.55 - awkwardness * 0.25
  );
  const smile = clamp01(
    genuineSmile * genuineSmileGate * (1 - smileSuppression * 0.85) +
      sarcasticSmirk * clamp01(0.08 + humor * 0.05 + contempt * 0.04 + curiosity * 0.02)
  );

  const mouthDown = inferMusclePower([
    rule(sadness, "medium", "medium", 0.55),
    rule(sadness, "high", "high", 1),
    rule(disgust, "high", "low", 0.18),
    rule(fear, "medium", "medium", 0.35),
    rule(aggression, "high", "medium", 0.25),
    direct(hostility * (1 - smile), "medium", 0.25),
  ], 1.18);

  const lipPress = inferMusclePower([
    rule(aggression, "medium", "medium", 0.45),
    rule(aggression, "high", "high", 0.9),
    rule(tension, "medium", "medium", 0.4),
    rule(tension, "high", "high", 0.6),
    rule(contempt, "medium", "medium", 0.4),
    rule(fear, "medium", "medium", 0.25),
    rule(embarrassment, "medium", "medium", 0.28),
    direct(awkwardness, "medium", 0.25),
  ], 1.16);

  const upperLipRaise = inferMusclePower([
    rule(disgust, "medium", "medium", 0.65),
    rule(disgust, "high", "high", 1),
    rule(contempt, "medium", "medium", 0.4),
    rule(aggression, "medium", "low", 0.18),
    direct(revulsion, "high", 0.35),
    direct(disgust * hostility, "high", 0.25),
  ], 1.22);

  const jawDrop = inferMusclePower([
    rule(surprise, "high", "high", 0.9),
    rule(awe, "medium", "medium", 0.45),
    rule(awe, "high", "high", 0.75),
    rule(fear, "medium", "medium", 0.4),
    rule(fear, "high", "high", 0.55),
    rule(confusion, "high", "medium", 0.45),
    rule(curiosity, "medium", "low", 0.32),
    rule(embarrassment, "medium", "low", 0.25),
  ], 1.16);

  const mouthRound = inferMusclePower([
    rule(surprise, "medium", "medium", 0.45),
    rule(surprise, "high", "high", 1),
    rule(awe, "medium", "medium", 0.6),
    rule(awe, "high", "high", 0.95),
    rule(fear, "medium", "medium", 0.3),
    rule(curiosity, "medium", "low", 0.38),
    direct(wonder, "high", 0.35),
  ], 1.18);

  const mouthStretch = inferMusclePower([
    rule(confusion, "medium", "medium", 0.55),
    rule(confusion, "high", "high", 0.82),
    rule(embarrassment, "medium", "medium", 0.6),
    rule(embarrassment, "high", "high", 0.8),
    rule(disgust, "medium", "low", 0.2),
    rule(tension, "medium", "medium", 0.3),
    rule(fear, "medium", "medium", 0.22),
    rule(curiosity, "medium", "low", 0.18),
    direct(awkwardness, "high", 0.35),
  ], 1.18);

  const oneBrowLcr =
    sarcasm + contempt + curiosity * 0.35 > embarrassment + confusion
      ? 0.78
      : 0.24;

  const upperLipLcr =
    contempt + sarcasm * 0.5 > disgust + fear * 0.2
      ? 0.78
      : disgust > 0.35
        ? 0.34
        : 0.5;

  const asymmetryPower = average([
    sarcasm * 0.85,
    contempt * 0.65,
    humor * 0.25,
    hostility * sarcasm * 0.9,
    curiosity * 0.18,
    singleBrowRaise * 0.35,
    upperLipRaise * 0.25,
  ]);

  const asymmetryLcr =
    sardonicBlend > 0.42 || skepticism > 0.45
      ? 0.78
      : awkwardness > 0.35 || curiosity > 0.48
        ? 0.24
        : 0.5;

  const calibratedSmile = clamp01(
    smile * (1 - aggression * 0.75 - disgust * 0.45 - upperLipRaise * 0.28) +
      warmth * 0.06 +
      humor * 0.04
  );
  const calibratedJawDrop = clamp01(
    jawDrop + mouthRound * 0.18 + curiosity * 0.06 - lipPress * 0.12 - revulsion * 0.12
  );
  const calibratedRound = clamp01(mouthRound + wonder * 0.08 - mouthStretch * 0.1);
  const calibratedStretch = clamp01(
    mouthStretch + awkwardness * 0.08 + revulsion * 0.05 - mouthRound * 0.12
  );

  return {
    browRaise: { power: clamp01(browRaise + fear * 0.08 + awe * 0.05), lcr: 0.5 },
    browLower: {
      power: clamp01(browLower + hostility * 0.18 + aggression * 0.12 + tension * 0.05),
      lcr: 0.5,
    },
    singleBrowRaise: {
      power: clamp01(singleBrowRaise + skepticism * 0.06 + awkwardness * 0.04),
      lcr: oneBrowLcr,
    },
    eyeOpen: { power: clamp01(eyeOpen + fear * 0.08 + awe * 0.05), lcr: 0.5 },
    eyeSquint: {
      power: clamp01(
        eyeSquint +
          contempt * 0.08 +
          revulsion * 0.05 +
          aggression * 0.08 +
          tension * 0.04 -
          cognitiveLoad * 0.04
      ),
      lcr: 0.5,
    },
    smile: { power: calibratedSmile, lcr: asymmetryLcr },
    mouthDown: { power: clamp01(mouthDown + distress * 0.08), lcr: 0.5 },
    lipPress: {
      power: clamp01(lipPress + hostility * 0.08 + aggression * 0.08 + tension * 0.04),
      lcr: 0.5,
    },
    upperLipRaise: {
      power: clamp01(upperLipRaise + disgust * 0.1 + contempt * 0.04),
      lcr: upperLipLcr,
    },
    jawDrop: { power: calibratedJawDrop, lcr: 0.5 },
    mouthRound: { power: calibratedRound, lcr: 0.5 },
    mouthStretch: { power: calibratedStretch, lcr: 0.5 },
    asymmetry: { power: asymmetryPower, lcr: asymmetryLcr },
  };
}
