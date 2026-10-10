import { LEVELS } from "@/game/config";
import { fill, tr } from "@/content/tr";

interface Props {
  levelIndex: number;
  /** null while waiting for the player; 3, 2, 1 during the countdown. */
  countdown: number | null;
  onReady: () => void;
}

export function Interstitial({ levelIndex, countdown, onReady }: Props) {
  const level = LEVELS[levelIndex];
  const text = tr.levels[levelIndex];
  const aiOff = levelIndex === 3;

  if (countdown !== null) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#3a0f26]/55">
        <div key={countdown} className="animate-[pop_0.9s_ease-out] text-[9rem] font-extrabold leading-none text-white drop-shadow-lg">
          {countdown}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#3a0f26]/70 px-6">
      <div className="w-full max-w-sm rounded-3xl bg-[#fff1f1] p-6 text-center shadow-2xl">
        <div className="text-xs font-semibold uppercase tracking-wide text-[#b0405c]">
          {fill(tr.interstitial.levelLabel, { n: levelIndex + 1, total: LEVELS.length })} ·{" "}
          {fill(tr.interstitial.duration, { seconds: Math.round(level.durationMs / 1000) })}
        </div>
        <h2 className="mt-1 text-3xl font-extrabold text-[#5a1633]">{text.title}</h2>
        {aiOff && (
          <div className="mx-auto mt-2 inline-block rounded-full bg-[#5a1633] px-3 py-1 text-xs font-bold text-white">
            {tr.interstitial.aiOffBanner}
          </div>
        )}
        {level.aiEnabled && (
          <div className="mx-auto mt-2 inline-block rounded-full bg-[#2de2c2] px-3 py-1 text-xs font-bold text-[#06352c]">
            {tr.hud.aiBadge}
          </div>
        )}
        <p className="mt-3 font-semibold text-[#7a2a48]">{text.oneLiner}</p>
        <p className="mt-2 text-sm leading-relaxed text-[#7a2a48]/85">{text.intro}</p>
        <button
          onClick={onReady}
          className="mt-6 w-full rounded-2xl bg-[#d9566f] py-4 text-lg font-bold text-white shadow-lg active:scale-[0.98] active:bg-[#c24660]"
        >
          {tr.interstitial.ready}
        </button>
      </div>
    </div>
  );
}
