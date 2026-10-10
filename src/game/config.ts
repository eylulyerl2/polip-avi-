/** Every tunable number of the game lives here. */

export type ObjectKind = "polyp" | "flat" | "bubble" | "fold";

/** Screen edge an object enters from. */
export type Edge = "top" | "bottom" | "left" | "right";

/** How many look-alike drawings each object kind has (purely visual, scoring is per kind). */
export const VARIANTS: Record<ObjectKind, number> = { polyp: 4, flat: 3, bubble: 3, fold: 3 };

export function isPolyp(kind: ObjectKind): boolean {
  return kind === "polyp" || kind === "flat";
}

export interface LevelConfig {
  id: 1 | 2 | 3 | 4;
  durationMs: number;
  /** Time an object needs to cross the screen top to bottom (side entries are faster). */
  lifetimeMs: number;
  /** Delay between consecutive spawns [min, max]. */
  intervalMs: [number, number];
  weights: Record<ObjectKind, number>;
  /** Object radius at the screen edge, as a fraction of min(viewport w, h). */
  size: Record<ObjectKind, [number, number]>;
  aiEnabled: boolean;
  /** Entry edge mix once the level is past `topOnlyUntil`. */
  edges: Record<Edge, number>;
  /** Fraction of the level during which objects only come from the top. */
  topOnlyUntil: number;
}

const WARMUP_SIZE: LevelConfig["size"] = {
  polyp: [0.1, 0.125],
  flat: [0.085, 0.105],
  bubble: [0.06, 0.08],
  fold: [0.075, 0.095],
};

const REAL_SIZE: LevelConfig["size"] = {
  polyp: [0.07, 0.095],
  flat: [0.07, 0.095],
  bubble: [0.05, 0.07],
  fold: [0.065, 0.09],
};

/** Levels 2, 3 and 4 share exactly the same difficulty. */
const REAL_LIFE = {
  durationMs: 30_000,
  lifetimeMs: 3_600,
  intervalMs: [800, 1300] as [number, number],
  weights: { polyp: 0.36, flat: 0.28, bubble: 0.18, fold: 0.18 },
  size: REAL_SIZE,
  edges: { top: 0.4, left: 0.25, right: 0.25, bottom: 0.1 },
  topOnlyUntil: 0.3,
};

export const LEVELS: readonly LevelConfig[] = [
  {
    id: 1,
    durationMs: 15_000,
    lifetimeMs: 4_500,
    intervalMs: [1_100, 1_700],
    weights: { polyp: 0.82, flat: 0, bubble: 0.09, fold: 0.09 },
    size: WARMUP_SIZE,
    aiEnabled: false,
    edges: { top: 1, left: 0, right: 0, bottom: 0 },
    topOnlyUntil: 1,
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
  revealAtProgress: 0.12,
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
  /** Minimum lane distance between near-simultaneous objects entering from the same edge. */
  minLaneGap: 0.25,
  laneRetries: 10,
} as const;

/** Touch handling. */
export const INPUT = {
  tolerancePx: 12,
  minHitRadiusPx: 14,
} as const;

/** Motion and layout of objects crossing the (static) wall. */
export const VIEW = {
  /** Objects start/end this fraction of the screen outside the edge. */
  margin: 0.1,
  /** Side entries take this fraction of the vertical crossing time (1 = same time, so they move slower on screen). */
  horizontalTimeFactor: 1,
  /** Allowed range of the entry lane across the edge (0..1). */
  laneRange: [0.12, 0.88] as [number, number],
  /** How far an object may drift sideways while crossing, as a fraction of the screen. */
  driftAmount: 0.2,
  /** Gentle lateral wobble, as a fraction of the screen. */
  swayAmount: 0.03,
} as const;

/** Longest time one frame may advance the game; longer gaps (hidden tab) act like a pause. */
export const MAX_FRAME_DT_MS = 100;

export const COUNTDOWN_SECONDS = 3;
