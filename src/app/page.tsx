import Link from "next/link";
import { GAME_NAME, GAME_SUBTITLE, tr } from "@/content/tr";

export default function StartPage() {
  return (
    <main className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#f9c9cc] via-[#e58a9c] to-[#7a2a48] px-6 text-center">
      {/* Decorative still rings (no motion on purpose) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute h-[70vmin] w-[55vmin] rounded-[50%] border-4 border-white/25"
            style={{ transform: `scale(${0.45 + i * 0.28})` }}
          />
        ))}
      </div>

      <div className="relative z-10 flex max-w-sm flex-col items-center">
        <h1 className="text-6xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_6px_rgba(58,15,38,0.6)]">
          {GAME_NAME}
        </h1>
        <p className="mt-2 text-lg font-semibold text-white/95 drop-shadow-[0_1px_3px_rgba(58,15,38,0.6)]">
          {GAME_SUBTITLE}
        </p>
        <p className="mt-6 text-base leading-relaxed text-white drop-shadow-[0_1px_3px_rgba(58,15,38,0.7)]">
          {tr.start.description}
        </p>
        <p className="mt-3 text-sm text-white/90 drop-shadow-[0_1px_3px_rgba(58,15,38,0.7)]">
          {tr.start.howTo}
        </p>
        <Link
          href="/play"
          className="mt-8 w-full rounded-2xl bg-white py-4 text-xl font-extrabold text-[#b0405c] shadow-xl active:scale-[0.98]"
        >
          {tr.start.play}
        </Link>
        <p className="mt-6 text-xs leading-relaxed text-white/85 drop-shadow-[0_1px_2px_rgba(58,15,38,0.7)]">
          {tr.disclaimer}
        </p>
      </div>
    </main>
  );
}
