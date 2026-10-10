/** Every tunable number of the game lives here. */

export type ObjectKind = "polyp" | "flat" | "bubble" | "fold";

export function isPolyp(kind: ObjectKind): boolean {
  return kind === "polyp" || kind === "flat";
}

export interface LevelConfig {
  id: 1 | 2 | 3 | 4;
  durationMs: number;
  /** Time an object needs to travel from the tunnel centre to the screen edge. */
  lifetimeMs: number;
  /** Delay between consecutive spawns [min, max]. */
  intervalMs: [number, number];
  weights: Record<ObjectKind, number>;
  /** Object radius at the screen edge, as a fraction of min(viewport w, h). */
  size: Record<ObjectKind, [number, number]>;
  aiEnabled: boolean;
}

const WARMUP_SIZE: LevelConfig["size"] = {
  polyp: [0.12, 0.15],
  flat: [0.1, 0.12],
  bubble: [0.07, 0.09],
  fold: [0.09, 0.11],
};

const REAL_SIZE: LevelConfig["size"] = {
  polyp: [0.09, 0.12],
  flat: [0.09, 0.12],
  bubble: [0.06, 0.09],
  fold: [0.08, 0.11],
};

/** Levels 2, 3 and 4 share exactly the same difficulty. */
const REAL_LIFE = {
  durationMs: 45_000,
  lifetimeMs: 2_800,
  intervalMs: [850, 1400] as [number, number],
  weights: { polyp: 0.36, flat: 0.28, bubble: 0.18, fold: 0.18 },
  size: REAL_SIZE,
};

export const LEVELS: readonly LevelConfig[] = [
  {
    id: 1,
    durationMs: 30_000,
    lifetimeMs: 4_000,
    intervalMs: [1_500, 2_300],
    weights: { polyp: 0.82, flat: 0, bubble: 0.09, fold: 0.09 },
    size: WARMUP_SIZE,
    aiEnabled: false,
  },
  { id: 2, ...REAL_LIFE, aiEnabled: false },
  { id: 3, ...REAL_LIFE, aiEnabled: true },
  { id: 4, ...REAL_LIFE, aiEnabled: false },
];

/** Simulated AI quality. These are the knobs to turn for the talk. */
export const AI = {
  /** Probability the AI boxes a regular polyp. */
  detectPolyp: 0.9,
  /** Probability the AI boxes a flat polyp. */
  detectFlat: 0.4,
  /** Probability the AI wrongly boxes a decoy (bubble / fold shadow). */
  falsePositiveDecoy: 0.15,
  /** The box appears once an object has travelled this fraction of its path. */
  revealAtProgress: 0.1,
} as const;

/** Points per (kind, outcome). Missing a polyp costs more than a false tap on purpose. */
export const SCORE = {
  polyp: { tap: 10, miss: -15 },
  flat: { tap: 20, miss: -15 },
  bubble: { tap: -5, miss: 0 },
  fold: { tap: -5, miss: 0 },
} as const satisfies Record<ObjectKind, { tap: number; miss: number }>;

/** Spawn rules. */
export const SPAWN = {
  /** Last spawn leaves the tunnel before the level ends. */
  fitLifetimeInLevel: true,
  /** First object shows up this long after the level starts. */
  firstSpawnMs: 600,
  /** Minimum angular gap between objects alive at the same time (radians). */
  minAngleGap: 0.7,
  angleRetries: 10,
} as const;

/** Touch handling. */
export const INPUT = {
  tolerancePx: 12,
  minHitRadiusPx: 14,
} as const;

/** Rendering / pseudo-3D. */
export const VIEW = {
  /** Depth easing: position along the path = KMAX * p^depthExponent. */
  depthExponent: 1.8,
  kMax: 1.12,
  ringCount: 12,
  /** Object radius = size * minDim * (base + gain * eased progress). */
  radiusBase: 0.22,
  radiusGain: 0.9,
} as const;

/** Longest time one frame may advance the game; longer gaps (hidden tab) act like a pause. */
export const MAX_FRAME_DT_MS = 100;

export const COUNTDOWN_SECONDS = 3;
