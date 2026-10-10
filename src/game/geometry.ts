import { VIEW } from "./config";
import type { SpawnItem, Viewport } from "./types";

export interface Pose {
  x: number;
  y: number;
  r: number;
}

export function progressOf(item: SpawnItem, levelMs: number): number {
  return (levelMs - item.spawnMs) / item.lifetimeMs;
}

/** Screen position and radius of an item at progress p (0 = just outside, 1 = just outside the far side). */
export function poseOf(item: SpawnItem, p: number, vp: Viewport): Pose {
  const along = -VIEW.margin + (1 + 2 * VIEW.margin) * p;
  const endLane = Math.min(
    VIEW.laneRange[1],
    Math.max(VIEW.laneRange[0], item.lane + item.drift * VIEW.driftAmount),
  );
  const lateral =
    item.lane +
    (endLane - item.lane) * p +
    item.sway * VIEW.swayAmount * Math.sin(p * Math.PI * 2.4 + item.swayPhase);

  let x: number;
  let y: number;
  switch (item.edge) {
    case "top":
      x = lateral * vp.w;
      y = along * vp.h;
      break;
    case "bottom":
      x = lateral * vp.w;
      y = (1 - along) * vp.h;
      break;
    case "left":
      x = along * vp.w;
      y = lateral * vp.h;
      break;
    default:
      x = (1 - along) * vp.w;
      y = lateral * vp.h;
  }
  return { x, y, r: item.size * Math.min(vp.w, vp.h) };
}
