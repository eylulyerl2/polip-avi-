"use client";

import { useState } from "react";
import { fill, tr } from "@/content/tr";
import { compareBeforeAfter, formatPercent, type LevelStats } from "@/game/stats";
import { renderShareCard, shareText, type ShareCardData } from "./shareCard";

interface Props {
  stats: LevelStats[];
  maxScore: number;
  seed: number;
  onReplay: () => void;
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white/85 p-5 shadow-sm">
      {title && <h2 className="mb-2 text-lg font-extrabold text-[#5a1633]">{title}</h2>}
      {children}
    </section>
  );
}

export function Results({ stats, maxScore, seed, onReplay }: Props) {
  const [notice, setNotice] = useState<string | null>(null);

  const totalScore = stats.reduce((s, l) => s + l.score, 0);
  const sum = (pick: (l: LevelStats) => number) => stats.reduce((s, l) => s + pick(l), 0);
  const polypsTotal = sum((l) => l.polypsTotal);
  const polypsCaught = sum((l) => l.polypsCaught);
  const overallRate = polypsTotal === 0 ? 0 : polypsCaught / polypsTotal;
  const missedRegular = sum((l) => l.missedRegular);
  const missedFlat = sum((l) => l.missedFlat);
  const falsePositives = sum((l) => l.falsePositives);
  const comparison = compareBeforeAfter(stats);
  const aiLevel = stats.find((l) => l.index === 2);

  const cardData: ShareCardData = {
    totalScore,
    detectionRate: overallRate,
    levelScores: stats.map((l) => l.score),
    levelRates: stats.map((l) => l.detectionRate),
    seed,
  };

  const handleShare = async () => {
    try {
      const blob = await renderShareCard(cardData);
      const file = new File([blob], "polip-avi.png", { type: "image/png" });
      const text = shareText(cardData);
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "polip-avi.png";
      a.click();
      URL.revokeObjectURL(url);
      setNotice(tr.results.share.saved);
    } catch (err) {
      // The user closing the share sheet is not an error worth showing.
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setNotice(String(err));
      }
    }
  };

  return (
    <div className="absolute inset-0 z-30 overflow-y-auto bg-gradient-to-b from-[#f9c9cc] to-[#e58a9c]">
      <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6 pb-10">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-[#5a1633]">{tr.results.title}</h1>
          <div className="mt-2 text-sm font-semibold text-[#7a2a48]">{tr.results.total}</div>
          <div className="text-7xl font-extrabold tabular-nums text-[#5a1633]">{totalScore}</div>
          <div className="text-xs text-[#7a2a48]/80">{fill(tr.results.best, { max: maxScore })}</div>
        </div>

        <Card title={tr.results.perLevel}>
          <ul className="space-y-3">
            {stats.map((l) => (
              <li key={l.index}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-bold text-[#5a1633]">
                    {l.index + 1}. {tr.levels[l.index].title}
                  </span>
                  <span className="font-extrabold tabular-nums text-[#5a1633]">{l.score}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#f3c3c8]">
                    <div className="h-full rounded-full bg-[#d9566f]" style={{ width: `${l.detectionRate * 100}%` }} />
                  </div>
                  <span className="w-28 text-right text-xs tabular-nums text-[#7a2a48]">
                    {formatPercent(l.detectionRate)} · {fill(tr.results.detection.caught, { caught: l.polypsCaught, total: l.polypsTotal })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title={tr.results.detection.title}>
          <p className="text-sm leading-relaxed text-[#5a1633]">{tr.results.detection.explanation}</p>
        </Card>

        {/* Without any level-2 catch there is no baseline to compare against. */}
        {comparison && comparison.before > 0 && (
          <Card title={tr.results.comparison.title}>
            <p className="text-sm font-semibold text-[#5a1633]">
              {fill(tr.results.comparison.line, {
                before: formatPercent(comparison.before),
                after: formatPercent(comparison.after),
              })}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#5a1633]">
              {comparison.dropped ? tr.results.comparison.deskilling : tr.results.comparison.neutral}
            </p>
          </Card>
        )}

        {aiLevel && (
          <Card title={tr.results.ai.title}>
            <ul className="space-y-1 text-sm text-[#5a1633]">
              {aiLevel.boxedPolyps > 0 && (
                <li>{fill(tr.results.ai.boxedCaught, { caught: aiLevel.boxedPolypsCaught, total: aiLevel.boxedPolyps })}</li>
              )}
              {aiLevel.unboxedPolyps > 0 && (
                <li>{fill(tr.results.ai.unboxedCaught, { caught: aiLevel.unboxedPolypsCaught, total: aiLevel.unboxedPolyps })}</li>
              )}
              {aiLevel.boxedDecoys > 0 && <li>{fill(tr.results.ai.falseBoxes, { n: aiLevel.boxedDecoys })}</li>}
            </ul>
            {aiLevel.unboxedPolyps > 0 && (
              <p className="mt-2 text-sm font-semibold text-[#7a2a48]">{tr.results.ai.unboxedWarning}</p>
            )}
            <p className="mt-2 text-sm leading-relaxed text-[#5a1633]">{tr.results.ai.fact}</p>
          </Card>
        )}

        <Card title={tr.results.missed.title}>
          {missedRegular + missedFlat === 0 ? (
            <p className="text-sm font-semibold text-[#5a1633]">{tr.results.missed.none}</p>
          ) : (
            <ul className="space-y-2 text-sm text-[#5a1633]">
              {missedRegular > 0 && (
                <li>
                  <b>{fill(tr.results.missed.regular, { n: missedRegular })}</b>
                  <br />
                  {tr.results.missed.regularLesson}
                </li>
              )}
              {missedFlat > 0 && (
                <li>
                  <b>{fill(tr.results.missed.flat, { n: missedFlat })}</b>
                  <br />
                  {tr.results.missed.flatLesson}
                </li>
              )}
            </ul>
          )}
          {falsePositives > 0 && (
            <p className="mt-2 text-sm text-[#5a1633]">{fill(tr.results.missed.falsePositives, { n: falsePositives })}</p>
          )}
          <p className="mt-3 text-sm leading-relaxed text-[#7a2a48]">{tr.results.missed.costLesson}</p>
        </Card>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleShare}
            className="rounded-2xl bg-[#5a1633] py-4 text-lg font-bold text-white shadow-lg active:scale-[0.98]"
          >
            {tr.results.share.button}
          </button>
          {notice && <p className="text-center text-xs text-[#5a1633]">{notice}</p>}
          <button
            onClick={onReplay}
            className="rounded-2xl bg-[#d9566f] py-4 text-lg font-bold text-white shadow-lg active:scale-[0.98]"
          >
            {tr.results.replay}
          </button>
        </div>

        <p className="text-center text-xs leading-relaxed text-[#5a1633]/80">{tr.disclaimer}</p>
        <p className="text-center text-[10px] text-[#5a1633]/50">
          {tr.hud.seedLabel}: {seed}
        </p>
      </div>
    </div>
  );
}
