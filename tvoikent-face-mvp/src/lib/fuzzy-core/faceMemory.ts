import type { FaceState, MuscleName } from "./types";

export function smoothFaceState(
  previous: FaceState | null,
  next: FaceState,
  alpha = 0.35
): FaceState {
  if (!previous) return next;

  const result = {} as FaceState;

  for (const key of Object.keys(next) as MuscleName[]) {
    result[key] = {
      power: previous[key].power * (1 - alpha) + next[key].power * alpha,
      lcr: previous[key].lcr * (1 - alpha) + next[key].lcr * alpha,
    };
  }

  return result;
}