import { SCORE, VARIANTS, type ObjectKind } from "@/game/config";
import { fill, tr } from "@/content/tr";
import { ObjectIcon } from "./ObjectIcon";

interface Props {
  onStart: () => void;
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0";
}

function KindCard({ kind, target }: { kind: ObjectKind; target: boolean }) {
  const info = tr.objects[kind];
  const score = SCORE[kind];
  return (
    <div className="rounded-2xl bg-white/90 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-extrabold text-[#5a1633]">{info.name}</div>
        <div className="text-right text-xs font-bold text-[#7a2a48]">
          {fill(tr.briefing.pointsTap, { points: signed(score.tap) })}
          {target && (
            <>
              <br />
              {fill(tr.briefing.pointsMissed, { points: signed(score.miss) })}
            </>
          )}
        </div>
      </div>
      <p className="mt-1 text-sm leading-snug text-[#5a1633]/90">{info.explanation}</p>
      <div className="mt-2 flex gap-2 overflow-x-auto">
        {Array.from({ length: VARIANTS[kind] }, (_, v) => (
          <ObjectIcon key={v} kind={kind} variant={v} />
        ))}
      </div>
    </div>
  );
}

export function Briefing({ onStart }: Props) {
  return (
    <div className="absolute inset-0 z-20 overflow-y-auto bg-[#3a0f26]/80">
      <div className="mx-auto flex max-w-md flex-col gap-3 px-4 pb-28 pt-6">
        <h2 className="text-center text-3xl font-extrabold text-white">{tr.briefing.title}</h2>
        <p className="rounded-2xl bg-[#fff1f1] p-4 text-sm leading-relaxed text-[#5a1633]">{tr.briefing.goal}</p>

        <h3 className="mt-1 text-lg font-extrabold text-[#8dffb8]">{tr.briefing.catchTitle}</h3>
        <p className="-mt-2 text-xs text-white/80">{tr.briefing.looksVary}</p>
        <KindCard kind="polyp" target />
        <KindCard kind="flat" target />

        <h3 className="mt-2 text-lg font-extrabold text-[#ff9aa8]">{tr.briefing.avoidTitle}</h3>
        <p className="-mt-2 text-xs text-white/80">{tr.briefing.avoidIntro}</p>
        <KindCard kind="bubble" target={false} />
        <KindCard kind="fold" target={false} />

        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-white/90">
          {tr.briefing.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>
      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-[#3a0f26] to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8">
        <button
          onClick={onStart}
          className="mx-auto block w-full max-w-md rounded-2xl bg-[#d9566f] py-4 text-lg font-bold text-white shadow-lg active:scale-[0.98]"
        >
          {tr.briefing.start}
        </button>
      </div>
    </div>
  );
}
