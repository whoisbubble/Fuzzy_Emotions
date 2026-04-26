import type { FuzzyTerm } from "./types";
import { clamp01, membership } from "./membership";

type Rule = {
  value: number;
  weight: number;
  term: FuzzyTerm;
};

export function weightedDefuzzify(rules: Rule[]): number {
  let numerator = 0;
  let denominator = 0;

  for (const rule of rules) {
    const degree = membership(rule.value, rule.term);
    const strength = degree * rule.weight;

    numerator += rule.value * strength;
    denominator += strength;
  }

  if (denominator === 0) return 0;

  return clamp01(numerator / denominator);
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return clamp01(values.reduce((sum, value) => sum + value, 0) / values.length);
}