import { LEVELS } from "@/game/config";
import { tr } from "@/content/tr";

interface Props {
  levelIndex: number;
  score: number;
  secondsLeft: number;
  seed: number;
}

export function Hud({ levelIndex, score, secondsLeft, seed }: Props) {
  const level = LEVELS[levelIndex];
  const total = Math.ceil(level.durationMs / 1000);
  const fraction = Math.max(0, Math.min(1, secondsLeft / total));

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="flex items-start justify-between gap-3 text-white drop-shadow-[0_1px_3px_rgba(50,8,30,0.8)]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide opacity-90">
            {levelIndex + 1} / {LEVELS.length}
          </div>
          <div className="text-base font-bold leading-tight">{tr.levels[levelIndex].title}</div>
          {level.aiEnabled && (
            <div className="mt-1 inline-block rounded-full bg-[#2de2c2] px-2 py-0.5 text-[11px] font-bold text-[#06352c] drop-shadow-none">
              {tr.hud.aiBadge}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-wide opacity-90">{tr.hud.score}</div>
          <div className="text-3xl font-extrabold tabular-nums leading-none">{score}</div>
        </div>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/25">
        <div
          className="h-full rounded-full bg-white/90 transition-[width] duration-300 ease-linear"
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
      <div className="mt-1 text-right text-xs font-semibold tabular-nums text-white/90 drop-shadow-[0_1px_2px_rgba(50,8,30,0.8)]">
        {secondsLeft} sn
      </div>
      <div className="fixed bottom-1 left-2 text-[10px] text-white/50">
        {tr.hud.seedLabel}: {seed}
      </div>
    </div>
  );
}
