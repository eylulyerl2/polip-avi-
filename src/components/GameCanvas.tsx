"use client";

import { useEffect, useRef } from "react";
import type { GameEngine } from "@/game/engine";
import { Renderer } from "@/game/render";

export interface HudState {
  score: number;
  /** Whole seconds left in the current level. */
  secondsLeft: number;
}

interface Props {
  engine: GameEngine;
  onHud: (hud: HudState) => void;
  onLevelEnd: (index: number) => void;
}

function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Some browsers throw without a user gesture; haptics are optional.
    }
  }
}

export function GameCanvas({ engine, onHud, onLevelEnd }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const callbacks = useRef({ onHud, onLevelEnd });

  useEffect(() => {
    callbacks.current = { onHud, onLevelEnd };
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!container || !canvas || !ctx) return;

    const renderer = new Renderer(ctx);
    let raf = 0;
    let lastScore = Number.NaN;
    let lastSecs = Number.NaN;

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      engine.setViewport({ w, h });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    const frame = (now: number) => {
      engine.update(now);

      for (const ev of engine.drainEvents()) {
        if (ev.type === "levelEnd") {
          callbacks.current.onLevelEnd(ev.index);
          continue;
        }
        renderer.addEvent(ev, now);
        vibrate(ev.type === "tap" && ev.good ? 15 : [25, 30, 25]);
      }

      renderer.draw(engine, now);

      const score = engine.totalScore;
      const secs = Math.ceil(engine.remainingMs / 1000);
      if (score !== lastScore || secs !== lastSecs) {
        lastScore = score;
        lastSecs = secs;
        callbacks.current.onHud({ score, secondsLeft: secs });
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [engine]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    engine.tap(e.clientX - rect.left, e.clientY - rect.top);
  };

  return (
    <div ref={containerRef} className="absolute inset-0 touch-none select-none">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        className="block h-full w-full touch-none"
        aria-label="Oyun alanı"
      />
    </div>
  );
}
