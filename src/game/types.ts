import type { Edge, ObjectKind } from "./config";

export interface SpawnItem {
  id: number;
  kind: ObjectKind;
  /** Which of the look-alike drawings of this kind is used (visual only). */
  variant: number;
  /** Level-local time (ms) at which the object starts entering the screen. */
  spawnMs: number;
  /** Time to cross the screen. */
  lifetimeMs: number;
  edge: Edge;
  /** Entry position across the edge, 0..1. */
  lane: number;
  /** Lane offset reached at the far side, -1..1 (scaled by VIEW.driftAmount). */
  drift: number;
  /** Lateral wobble strength 0..1 and its phase in radians. */
  sway: number;
  swayPhase: number;
  /** Orientation used when drawing (shadow direction, rotation), radians. */
  angle: number;
  /** Radius as a fraction of min(viewport w, h). */
  size: number;
  /** Whether the simulated AI draws a box on this object (only shown in AI levels). */
  aiBox: boolean;
}

export interface LevelSchedule {
  index: number;
  durationMs: number;
  lifetimeMs: number;
  aiEnabled: boolean;
  items: SpawnItem[];
}

export interface GameSchedule {
  seed: number;
  levels: LevelSchedule[];
}

export type Outcome = "caught" | "missed" | "falsePositive" | "ignored";

export interface ItemOutcome {
  id: number;
  kind: ObjectKind;
  aiBox: boolean;
  outcome: Outcome;
}

export interface LevelResult {
  index: number;
  score: number;
  outcomes: ItemOutcome[];
}

export type GameEvent =
  | { type: "tap"; kind: ObjectKind; good: boolean; points: number; x: number; y: number }
  | { type: "miss"; kind: ObjectKind; points: number; x: number; y: number }
  | { type: "levelEnd"; index: number };

export interface Viewport {
  w: number;
  h: number;
}
