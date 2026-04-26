import type { FuzzyTerm } from "./types";
import {
  clamp01,
  leftShoulder,
  rightShoulder,
  triangular,
} from "./membership";

type Rule = {
  activation: number;
  weight?: number;
  term: FuzzyTerm;
};

function outputMembership(x: number, term: FuzzyTerm): number {
  switch (term) {
    case "low":
      return leftShoulder(x, 0.2, 0.45);

    case "medium":
      return triangular(x, 0.22, 0.5, 0.78);

    case "high":
      return rightShoulder(x, 0.55, 0.82);

    default:
      return 0;
  }
}

export function centroidDefuzzify(rules: Rule[], resolution = 201): number {
  if (rules.length === 0) return 0;

  let numerator = 0;
  let denominator = 0;

  for (let index = 0; index < resolution; index += 1) {
    const x = index / (resolution - 1);
    let aggregatedMembership = 0;

    for (const rule of rules) {
      const strength = clamp01(rule.activation * (rule.weight ?? 1));
      const clippedConsequent = Math.min(strength, outputMembership(x, rule.term));

      aggregatedMembership = Math.max(aggregatedMembership, clippedConsequent);
    }

    numerator += x * aggregatedMembership;
    denominator += aggregatedMembership;
  }

  if (denominator === 0) return 0;

  return clamp01(numerator / denominator);
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return clamp01(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function weightedAverage(values: number[], weights: number[]): number {
  if (values.length === 0 || values.length !== weights.length) return 0;

  let numerator = 0;
  let denominator = 0;

  values.forEach((value, index) => {
    const weight = Math.max(0, weights[index] ?? 0);

    numerator += value * weight;
    denominator += weight;
  });

  if (denominator === 0) return 0;

  return clamp01(numerator / denominator);
}
