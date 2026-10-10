import { INPUT, MAX_FRAME_DT_MS, isPolyp } from "./config";
import { poseOf, progressOf } from "./geometry";
import { missPoints, tapPoints } from "./scoring";
import type {
  GameEvent,
  GameSchedule,
  ItemOutcome,
  LevelResult,
  LevelSchedule,
  Outcome,
  SpawnItem,
  Viewport,
} from "./types";

export type EnginePhase = "idle" | "playing" | "levelEnded";

/**
 * Game loop state, timing and scoring. No React, no canvas.
 * Everything is driven by elapsed time, never by frame count.
 */
export class GameEngine {
  readonly schedule: GameSchedule;
  phase: EnginePhase = "idle";
  levelIndex = -1;
  /** Elapsed time inside the current level. */
  levelMs = 0;
  /** Free-running clock used for the tunnel animation (follows levelMs while playing). */
  clockMs = 0;
  viewport: Viewport = { w: 390, h: 844 };
  readonly results: LevelResult[] = [];

  private lastNow: number | null = null;
  private resolved = new Set<number>();
  private outcomes: ItemOutcome[] = [];
  private levelScore = 0;
  /** Items before this index have all expired; items have different lifetimes, so scan from here. */
  private firstPending = 0;
  private expired = new Set<number>();
  private events: GameEvent[] = [];

  constructor(schedule: GameSchedule) {
    this.schedule = schedule;
  }

  get level(): LevelSchedule | null {
    return this.schedule.levels[this.levelIndex] ?? null;
  }

  get totalScore(): number {
    return this.results.reduce((sum, r) => sum + r.score, 0) + (this.phase === "playing" ? this.levelScore : 0);
  }

  get currentLevelScore(): number {
    return this.levelScore;
  }

  get remainingMs(): number {
    const lvl = this.level;
    return lvl ? Math.max(0, lvl.durationMs - this.levelMs) : 0;
  }

  get isLastLevel(): boolean {
    return this.levelIndex >= this.schedule.levels.length - 1;
  }

  setViewport(vp: Viewport): void {
    this.viewport = vp;
  }

  isResolved(id: number): boolean {
    return this.resolved.has(id);
  }

  /** Starts level `index` (0-based). `now` is a performance.now() timestamp. */
  startLevel(index: number, now: number): void {
    this.levelIndex = index;
    this.levelMs = 0;
    this.levelScore = 0;
    this.firstPending = 0;
    this.expired = new Set();
    this.resolved = new Set();
    this.outcomes = [];
    this.phase = "playing";
    this.lastNow = now;
  }

  /** Drains events emitted since the last call (for effects, haptics, sound). */
  drainEvents(): GameEvent[] {
    if (this.events.length === 0) return this.events;
    const out = this.events;
    this.events = [];
    return out;
  }

  update(now: number): void {
    const dt = this.lastNow === null ? 0 : Math.min(Math.max(now - this.lastNow, 0), MAX_FRAME_DT_MS);
    this.lastNow = now;
    if (this.phase !== "playing") {
      this.clockMs += dt;
      return;
    }
    const lvl = this.level;
    if (!lvl) return;

    this.levelMs = Math.min(this.levelMs + dt, lvl.durationMs);
    this.clockMs = this.levelMs;
    this.expireUntil(lvl, this.levelMs);

    if (this.levelMs >= lvl.durationMs) this.endLevel(lvl);
  }

  /** Handles a tap in CSS pixels. Returns true if it hit an object. */
  tap(x: number, y: number): boolean {
    const lvl = this.level;
    if (this.phase !== "playing" || !lvl) return false;

    let best: SpawnItem | null = null;
    let bestGap = Infinity;
    let bestPose = { x: 0, y: 0 };

    for (const item of lvl.items) {
      if (item.spawnMs > this.levelMs) break; // items are sorted by spawn time
      if (this.resolved.has(item.id)) continue;
      const p = progressOf(item, this.levelMs);
      if (p >= 1) continue;
      const pose = poseOf(item, p, this.viewport);
      const hitR = Math.max(pose.r, INPUT.minHitRadiusPx) + INPUT.tolerancePx;
      const gap = Math.hypot(x - pose.x, y - pose.y) - hitR;
      if (gap <= 0 && gap < bestGap) {
        best = item;
        bestGap = gap;
        bestPose = pose;
      }
    }
    if (!best) return false;

    const points = tapPoints(best.kind);
    const good = isPolyp(best.kind);
    this.resolve(best, good ? "caught" : "falsePositive");
    this.levelScore += points;
    this.events.push({ type: "tap", kind: best.kind, good, points, x: bestPose.x, y: bestPose.y });
    return true;
  }

  private resolve(item: SpawnItem, outcome: Outcome): void {
    this.resolved.add(item.id);
    this.outcomes.push({ id: item.id, kind: item.kind, aiBox: item.aiBox, outcome });
  }

  private expireUntil(lvl: LevelSchedule, levelMs: number): void {
    for (let i = this.firstPending; i < lvl.items.length; i++) {
      const item = lvl.items[i];
      if (item.spawnMs > levelMs) break; // items are sorted by spawn time
      if (this.expired.has(item.id) || item.spawnMs + item.lifetimeMs > levelMs) continue;
      this.expired.add(item.id);
      if (this.resolved.has(item.id)) continue;
      const polyp = isPolyp(item.kind);
      this.resolve(item, polyp ? "missed" : "ignored");
      if (polyp) {
        const points = missPoints(item.kind);
        this.levelScore += points;
        const pose = poseOf(item, 1, this.viewport);
        this.events.push({ type: "miss", kind: item.kind, points, x: pose.x, y: pose.y });
      }
    }
    while (this.firstPending < lvl.items.length && this.expired.has(lvl.items[this.firstPending].id)) {
      this.firstPending++;
    }
  }

  private endLevel(lvl: LevelSchedule): void {
    // Anything still unresolved has left the tunnel by now.
    this.expireUntil(lvl, Number.POSITIVE_INFINITY);
    this.results.push({ index: lvl.index, score: this.levelScore, outcomes: this.outcomes });
    this.phase = "levelEnded";
    this.events.push({ type: "levelEnd", index: lvl.index });
  }
}
