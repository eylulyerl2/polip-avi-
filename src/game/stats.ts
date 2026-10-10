import { isPolyp } from "./config";
import type { LevelResult } from "./types";

export interface LevelStats {
  index: number;
  score: number;
  polypsTotal: number;
  polypsCaught: number;
  /** Caught / total polyps, 0..1 (0 when the level had no polyps). */
  detectionRate: number;
  regularTotal: number;
  regularCaught: number;
  flatTotal: number;
  flatCaught: number;
  missedRegular: number;
  missedFlat: number;
  falsePositives: number;
  /** Polyps the simulated AI boxed / did not box (only meaningful in the AI level). */
  boxedPolyps: number;
  boxedPolypsCaught: number;
  unboxedPolyps: number;
  unboxedPolypsCaught: number;
  boxedDecoys: number;
}

export function levelStats(result: LevelResult): LevelStats {
  const s: LevelStats = {
    index: result.index,
    score: result.score,
    polypsTotal: 0,
    polypsCaught: 0,
    detectionRate: 0,
    regularTotal: 0,
    regularCaught: 0,
    flatTotal: 0,
    flatCaught: 0,
    missedRegular: 0,
    missedFlat: 0,
    falsePositives: 0,
    boxedPolyps: 0,
    boxedPolypsCaught: 0,
    unboxedPolyps: 0,
    unboxedPolypsCaught: 0,
    boxedDecoys: 0,
  };

  for (const o of result.outcomes) {
    const caught = o.outcome === "caught";
    if (isPolyp(o.kind)) {
      s.polypsTotal++;
      if (caught) s.polypsCaught++;
      if (o.kind === "flat") {
        s.flatTotal++;
        if (caught) s.flatCaught++;
        else s.missedFlat++;
      } else {
        s.regularTotal++;
        if (caught) s.regularCaught++;
        else s.missedRegular++;
      }
      if (o.aiBox) {
        s.boxedPolyps++;
        if (caught) s.boxedPolypsCaught++;
      } else {
        s.unboxedPolyps++;
        if (caught) s.unboxedPolypsCaught++;
      }
    } else {
      if (o.outcome === "falsePositive") s.falsePositives++;
      if (o.aiBox) s.boxedDecoys++;
    }
  }

  s.detectionRate = s.polypsTotal === 0 ? 0 : s.polypsCaught / s.polypsTotal;
  return s;
}

export interface Deskilling {
  /** Level 2 (before AI) detection rate, 0..1. */
  before: number;
  /** Level 4 (after AI is switched off) detection rate, 0..1. */
  after: number;
  /** after - before, in percentage points (negative means worse without AI). */
  deltaPoints: number;
  dropped: boolean;
}

/** Compares level 2 (index 1) with level 4 (index 3). */
export function compareBeforeAfter(stats: LevelStats[]): Deskilling | null {
  const before = stats.find((s) => s.index === 1);
  const after = stats.find((s) => s.index === 3);
  if (!before || !after) return null;
  const deltaPoints = Math.round((after.detectionRate - before.detectionRate) * 100);
  return {
    before: before.detectionRate,
    after: after.detectionRate,
    deltaPoints,
    dropped: after.detectionRate < before.detectionRate,
  };
}

export function formatPercent(rate: number): string {
  return `%${Math.round(rate * 100)}`;
}
