"use client";

import { useCallback, useEffect, useState } from "react";
import { COUNTDOWN_SECONDS, LEVELS } from "@/game/config";
import { GameEngine } from "@/game/engine";
import { buildSchedule, maxScore } from "@/game/schedule";
import { levelStats } from "@/game/stats";
import { Briefing } from "./Briefing";
import { GameCanvas, type HudState } from "./GameCanvas";
import { Hud } from "./Hud";
import { Interstitial } from "./Interstitial";
import { Results } from "./Results";

type Stage =
  | { kind: "briefing" }
  | { kind: "interstitial"; level: number }
  | { kind: "countdown"; level: number; count: number }
  | { kind: "playing"; level: number }
  | { kind: "results" };

interface Props {
  seed: number;
  /** Replays skip the briefing the player has already read. */
  skipBriefing: boolean;
  onReplay: () => void;
}

/** Pause between the last tap of a level and the next screen, so final effects stay visible. */
const LEVEL_END_DELAY_MS = 700;

export function Game({ seed, skipBriefing, onReplay }: Props) {
  const [engine] = useState(() => new GameEngine(buildSchedule(seed)));
  const [stage, setStage] = useState<Stage>(
    skipBriefing ? { kind: "interstitial", level: 0 } : { kind: "briefing" },
  );
  const [hud, setHud] = useState<HudState>({ score: 0, secondsLeft: 0 });

  // Countdown 3 -> 2 -> 1 -> start the level.
  useEffect(() => {
    if (stage.kind !== "countdown") return;
    const id = window.setTimeout(() => {
      if (stage.count > 1) {
        setStage({ kind: "countdown", level: stage.level, count: stage.count - 1 });
      } else {
        engine.startLevel(stage.level, performance.now());
        setStage({ kind: "playing", level: stage.level });
      }
    }, 1000);
    return () => window.clearTimeout(id);
  }, [stage, engine]);

  const handleLevelEnd = useCallback(
    (index: number) => {
      window.setTimeout(() => {
        setStage(
          index >= LEVELS.length - 1
            ? { kind: "results" }
            : { kind: "interstitial", level: index + 1 },
        );
      }, LEVEL_END_DELAY_MS);
    },
    [],
  );

  const handleHud = useCallback((next: HudState) => setHud(next), []);

  if (stage.kind === "results") {
    return (
      <Results
        stats={engine.results.map(levelStats)}
        maxScore={maxScore(engine.schedule).total}
        seed={seed}
        onReplay={onReplay}
      />
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <GameCanvas engine={engine} onHud={handleHud} onLevelEnd={handleLevelEnd} />
      {stage.kind === "playing" && (
        <Hud levelIndex={stage.level} score={hud.score} secondsLeft={hud.secondsLeft} seed={seed} />
      )}
      {stage.kind === "briefing" && (
        <Briefing onStart={() => setStage({ kind: "interstitial", level: 0 })} />
      )}
      {stage.kind === "interstitial" && (
        <Interstitial
          levelIndex={stage.level}
          countdown={null}
          onReady={() => setStage({ kind: "countdown", level: stage.level, count: COUNTDOWN_SECONDS })}
        />
      )}
      {stage.kind === "countdown" && (
        <Interstitial levelIndex={stage.level} countdown={stage.count} onReady={() => {}} />
      )}
    </div>
  );
}
