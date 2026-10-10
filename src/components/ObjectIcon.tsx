"use client";

import { useEffect, useRef } from "react";
import type { ObjectKind } from "@/game/config";
import { Renderer } from "@/game/render";

interface Props {
  kind: ObjectKind;
  variant: number;
  size?: number;
}

/** A small picture of one object on a patch of wall, drawn with the game's own renderer. */
export function ObjectIcon({ kind, variant, size = 60 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.7);
    g.addColorStop(0, "#f4adb4");
    g.addColorStop(1, "#d9788c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    new Renderer(ctx, 1).drawSample(kind, variant, size / 2, size / 2, size * 0.3);
  }, [kind, variant, size]);

  return (
    <canvas
      ref={ref}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-2xl"
      aria-hidden
    />
  );
}
