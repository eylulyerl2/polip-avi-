import type { ObjectKind } from "./config";

export interface SpawnItem {
  id: number;
  kind: ObjectKind;
  /** Level-local time (ms) at which the object appears in the tunnel centre. */
  spawnMs: number;
  lifetimeMs: number;
  /** Direction on the tunnel wall, radians. */
  angle: number;
  /** Radius at the screen edge as a fraction of min(viewport w, h). */
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
