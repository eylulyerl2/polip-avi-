import {
  AI,
  LEVELS,
  SCORE,
  SPAWN,
  VARIANTS,
  VIEW,
  isPolyp,
  type Edge,
  type LevelConfig,
  type ObjectKind,
} from "./config";
import { deriveSeed, mulberry32, pickWeighted, range, type Rng } from "./rng";
import type { GameSchedule, LevelSchedule, SpawnItem } from "./types";

function aiDecision(rng: Rng, kind: ObjectKind): boolean {
  // Always consume exactly one draw so the AI stream never depends on the item mix.
  const roll = rng();
  if (kind === "polyp") return roll < AI.detectPolyp;
  if (kind === "flat") return roll < AI.detectFlat;
  return roll < AI.falsePositiveDecoy;
}

function buildLevel(seed: number, config: LevelConfig, index: number): LevelSchedule {
  const rng = mulberry32(deriveSeed(seed, index * 2));
  const aiRng = mulberry32(deriveSeed(seed, index * 2 + 1));
  const items: SpawnItem[] = [];
  const lastSpawn = SPAWN.fitLifetimeInLevel
    ? config.durationMs - config.lifetimeMs
    : config.durationMs;

  let t: number = SPAWN.firstSpawnMs;
  while (t <= lastSpawn) {
    const kind = pickWeighted(rng, config.weights);
    const variant = Math.floor(rng() * VARIANTS[kind]);
    const size = range(rng, config.size[kind][0], config.size[kind][1]);
    const edge: Edge =
      t < config.topOnlyUntil * config.durationMs
        ? "top"
        : pickWeighted(rng, config.edges);
    const lifetimeMs = Math.round(
      edge === "top" || edge === "bottom"
        ? config.lifetimeMs
        : config.lifetimeMs * VIEW.horizontalTimeFactor,
    );

    // Keep near-simultaneous objects from the same edge apart.
    let lane = range(rng, VIEW.laneRange[0], VIEW.laneRange[1]);
    for (let attempt = 0; attempt < SPAWN.laneRetries; attempt++) {
      const crowded = items.some(
        (o) =>
          o.edge === edge &&
          t - o.spawnMs < o.lifetimeMs * 0.5 &&
          Math.abs(o.lane - lane) < SPAWN.minLaneGap,
      );
      if (!crowded) break;
      lane = range(rng, VIEW.laneRange[0], VIEW.laneRange[1]);
    }

    items.push({
      id: index * 1000 + items.length,
      kind,
      variant,
      spawnMs: Math.round(t),
      lifetimeMs,
      edge,
      lane,
      drift: rng() * 2 - 1,
      sway: rng(),
      swayPhase: rng() * Math.PI * 2,
      angle: rng() * Math.PI * 2,
      size,
      aiBox: aiDecision(aiRng, kind),
    });
    t += range(rng, config.intervalMs[0], config.intervalMs[1]);
  }

  return {
    index,
    durationMs: config.durationMs,
    lifetimeMs: config.lifetimeMs,
    aiEnabled: config.aiEnabled,
    items,
  };
}

/** Builds the full, deterministic schedule of all levels from a seed. */
export function buildSchedule(seed: number): GameSchedule {
  const normalized = seed >>> 0;
  return { seed: normalized, levels: LEVELS.map((cfg, i) => buildLevel(normalized, cfg, i)) };
}

/** Highest score achievable for a schedule: catch every polyp, tap no decoy. */
export function maxScore(schedule: GameSchedule): { total: number; perLevel: number[] } {
  const perLevel = schedule.levels.map((lvl) =>
    lvl.items.reduce((sum, it) => (isPolyp(it.kind) ? sum + SCORE[it.kind].tap : sum), 0),
  );
  return { total: perLevel.reduce((a, b) => a + b, 0), perLevel };
}
