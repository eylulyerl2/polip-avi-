import { AI, LEVELS, SCORE, SPAWN, isPolyp, type LevelConfig, type ObjectKind } from "./config";
import { deriveSeed, mulberry32, pickWeighted, range, type Rng } from "./rng";
import type { GameSchedule, LevelSchedule, SpawnItem } from "./types";

function angleDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % (Math.PI * 2);
  return d > Math.PI ? Math.PI * 2 - d : d;
}

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
    const size = range(rng, config.size[kind][0], config.size[kind][1]);

    // Keep objects that are alive together apart so they do not overlap.
    let angle = rng() * Math.PI * 2;
    for (let attempt = 0; attempt < SPAWN.angleRetries; attempt++) {
      const crowded = items.some(
        (o) => t - o.spawnMs < o.lifetimeMs && angleDistance(angle, o.angle) < SPAWN.minAngleGap,
      );
      if (!crowded) break;
      angle = rng() * Math.PI * 2;
    }

    items.push({
      id: index * 1000 + items.length,
      kind,
      spawnMs: Math.round(t),
      lifetimeMs: config.lifetimeMs,
      angle,
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
