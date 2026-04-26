import type { FuzzyTerm } from "./types";

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function triangular(x: number, a: number, b: number, c: number): number {
  x = clamp01(x);

  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  if (x < b) return (x - a) / (b - a);
  return (c - x) / (c - b);
}

export function leftShoulder(x: number, a: number, b: number): number {
  x = clamp01(x);

  if (x <= a) return 1;
  if (x >= b) return 0;
  return (b - x) / (b - a);
}

export function rightShoulder(x: number, a: number, b: number): number {
  x = clamp01(x);

  if (x <= a) return 0;
  if (x >= b) return 1;
  return (x - a) / (b - a);
}

export function membership(value: number, term: FuzzyTerm): number {
  switch (term) {
    case "low":
      return leftShoulder(value, 0.2, 0.45);

    case "medium":
      return triangular(value, 0.25, 0.5, 0.75);

    case "high":
      return rightShoulder(value, 0.55, 0.8);

    default:
      return 0;
  }
}