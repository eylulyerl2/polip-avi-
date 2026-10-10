import { describe, expect, it } from "vitest";
import { AI, LEVELS, SCORE, VARIANTS, isPolyp } from "@/game/config";
import { GameEngine } from "@/game/engine";
import { poseOf, progressOf } from "@/game/geometry";
import { mulberry32, parseSeed } from "@/game/rng";
import { buildSchedule, maxScore } from "@/game/schedule";
import { compareBeforeAfter, levelStats } from "@/game/stats";

describe("rng", () => {
  it("produces the same sequence for the same seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect(Array.from({ length: 20 }, a)).toEqual(Array.from({ length: 20 }, b));
  });

  it("parses numeric and text seeds deterministically", () => {
    expect(parseSeed("12345")).toBe(12345);
    expect(parseSeed("konferans")).toBe(parseSeed("konferans"));
    expect(parseSeed("a")).not.toBe(parseSeed("b"));
  });
});

describe("schedule", () => {
  it("is identical for the same seed and differs for another", () => {
    expect(buildSchedule(2025)).toEqual(buildSchedule(2025));
    expect(buildSchedule(2025)).not.toEqual(buildSchedule(2026));
  });

  it("builds four levels with items sorted by spawn time that fit inside the level", () => {
    const s = buildSchedule(7);
    expect(s.levels).toHaveLength(4);
    s.levels.forEach((lvl, i) => {
      expect(lvl.durationMs).toBe(LEVELS[i].durationMs);
      for (let j = 1; j < lvl.items.length; j++) {
        expect(lvl.items[j].spawnMs).toBeGreaterThanOrEqual(lvl.items[j - 1].spawnMs);
      }
      for (const it of lvl.items) {
        expect(it.spawnMs + it.lifetimeMs).toBeLessThanOrEqual(lvl.durationMs);
      }
    });
  });

  it("warm-up has no flat polyps; real-life levels do", () => {
    const s = buildSchedule(99);
    expect(s.levels[0].items.some((i) => i.kind === "flat")).toBe(false);
    expect(s.levels[1].items.some((i) => i.kind === "flat")).toBe(true);
  });

  it("warm-up is top-only; other levels start top-only and add side entries later", () => {
    const s = buildSchedule(21);
    expect(s.levels[0].items.every((i) => i.edge === "top")).toBe(true);
    for (const idx of [1, 2, 3]) {
      const lvl = s.levels[idx];
      const early = lvl.items.filter((i) => i.spawnMs < LEVELS[idx].topOnlyUntil * lvl.durationMs);
      expect(early.length).toBeGreaterThan(0);
      expect(early.every((i) => i.edge === "top")).toBe(true);
    }
    const edges = new Set(s.levels.flatMap((l) => l.items.map((i) => i.edge)));
    expect(edges.has("left") && edges.has("right")).toBe(true);
  });

  it("every item uses a valid visual variant", () => {
    for (const lvl of buildSchedule(8).levels) {
      for (const it of lvl.items) {
        expect(it.variant).toBeGreaterThanOrEqual(0);
        expect(it.variant).toBeLessThan(VARIANTS[it.kind]);
      }
    }
  });

  it("AI box rates roughly match the configured constants", () => {
    let polyp = 0, polypBoxed = 0, flat = 0, flatBoxed = 0, decoy = 0, decoyBoxed = 0;
    for (let seed = 1; seed <= 150; seed++) {
      for (const it of buildSchedule(seed).levels[2].items) {
        if (it.kind === "polyp") { polyp++; if (it.aiBox) polypBoxed++; }
        else if (it.kind === "flat") { flat++; if (it.aiBox) flatBoxed++; }
        else { decoy++; if (it.aiBox) decoyBoxed++; }
      }
    }
    expect(polypBoxed / polyp).toBeCloseTo(AI.detectPolyp, 1);
    expect(flatBoxed / flat).toBeCloseTo(AI.detectFlat, 1);
    expect(decoyBoxed / decoy).toBeCloseTo(AI.falsePositiveDecoy, 1);
  });

  it("maxScore counts every polyp at its tap value", () => {
    const s = buildSchedule(5);
    const expected = s.levels.map((l) =>
      l.items.reduce((sum, i) => sum + (isPolyp(i.kind) ? SCORE[i.kind].tap : 0), 0),
    );
    expect(maxScore(s).perLevel).toEqual(expected);
  });
});

/** Runs a level, tapping the objects selected by `shouldTap`. */
function playLevel(engine: GameEngine, index: number, shouldTap: (kind: string) => boolean): void {
  const lvl = engine.schedule.levels[index];
  engine.startLevel(index, 0);
  let now = 0;
  const tapped = new Set<number>();
  while (engine.phase === "playing") {
    now += 50;
    engine.update(now);
    for (const it of lvl.items) {
      if (tapped.has(it.id) || engine.isResolved(it.id) || !shouldTap(it.kind)) continue;
      const p = progressOf(it, engine.levelMs);
      if (p < 0.6 || p >= 1) continue;
      const pose = poseOf(it, p, engine.viewport);
      engine.tap(pose.x, pose.y);
      tapped.add(it.id);
    }
  }
}

describe("engine scoring", () => {
  it("catching everything scores the maximum and detects 100%", () => {
    const schedule = buildSchedule(11);
    const engine = new GameEngine(schedule);
    playLevel(engine, 1, (k) => k === "polyp" || k === "flat");
    const stats = levelStats(engine.results[0]);
    expect(engine.results[0].score).toBe(maxScore(schedule).perLevel[1]);
    expect(stats.detectionRate).toBe(1);
    expect(stats.falsePositives).toBe(0);
  });

  it("ignoring everything costs 15 per polyp and nothing for decoys", () => {
    const schedule = buildSchedule(11);
    const engine = new GameEngine(schedule);
    playLevel(engine, 1, () => false);
    const polyps = schedule.levels[1].items.filter((i) => isPolyp(i.kind)).length;
    expect(engine.results[0].score).toBe(polyps * SCORE.polyp.miss);
    expect(levelStats(engine.results[0]).detectionRate).toBe(0);
  });

  it("tapping decoys costs 5 each and tapping empty tunnel is free", () => {
    const schedule = buildSchedule(11);
    const engine = new GameEngine(schedule);
    playLevel(engine, 1, (k) => k === "bubble" || k === "fold");
    const decoys = schedule.levels[1].items.filter((i) => !isPolyp(i.kind)).length;
    const polyps = schedule.levels[1].items.length - decoys;
    expect(engine.results[0].score).toBe(decoys * SCORE.bubble.tap + polyps * SCORE.polyp.miss);

    const fresh = new GameEngine(schedule);
    fresh.startLevel(0, 0);
    fresh.update(16);
    expect(fresh.tap(1, 1)).toBe(false);
    expect(fresh.currentLevelScore).toBe(0);
  });

  it("a missed-polyp penalty is larger than a false-tap penalty", () => {
    expect(Math.abs(SCORE.polyp.miss)).toBeGreaterThan(Math.abs(SCORE.bubble.tap));
  });

  it("same seed and same taps give the same result (frame rate independent)", () => {
    const run = (step: number) => {
      const engine = new GameEngine(buildSchedule(31));
      const lvl = engine.schedule.levels[1];
      engine.startLevel(1, 0);
      let now = 0;
      while (engine.phase === "playing") {
        now += step;
        engine.update(now);
        for (const it of lvl.items) {
          if (engine.isResolved(it.id) || !isPolyp(it.kind)) continue;
          const t = it.spawnMs + it.lifetimeMs * 0.8;
          if (engine.levelMs >= t) {
            const pose = poseOf(it, progressOf(it, engine.levelMs), engine.viewport);
            engine.tap(pose.x, pose.y);
          }
        }
      }
      return engine.results[0].score;
    };
    // 60 fps vs 30 fps: tap moment differs by < 50 ms but every polyp is still reachable.
    expect(run(16)).toBe(run(33));
  });
});

describe("stats", () => {
  it("compares level 2 and level 4 detection rates", () => {
    const schedule = buildSchedule(3);
    const engine = new GameEngine(schedule);
    playLevel(engine, 1, (k) => k === "polyp" || k === "flat");
    // Level index 3 is played after index 2 in the real game; engine accepts any order here.
    playLevel(engine, 3, (k) => k === "polyp");
    const stats = engine.results.map(levelStats);
    const cmp = compareBeforeAfter(stats);
    expect(cmp).not.toBeNull();
    expect(cmp!.before).toBe(1);
    expect(cmp!.dropped).toBe(true);
    expect(cmp!.deltaPoints).toBeLessThan(0);
  });
});
