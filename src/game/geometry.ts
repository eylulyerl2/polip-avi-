import { VIEW } from "./config";
import type { SpawnItem, Viewport } from "./types";

/** Depth easing shared by tunnel rings and objects so they move together. */
export function depth(p: number): number {
  return VIEW.kMax * Math.pow(Math.max(p, 0), VIEW.depthExponent);
}

export interface Pose {
  x: number;
  y: number;
  r: number;
}

export function progressOf(item: SpawnItem, levelMs: number): number {
  return (levelMs - item.spawnMs) / item.lifetimeMs;
}

/** Screen position and radius of an item at progress p (0 = centre, 1 = edge). */
export function poseOf(item: SpawnItem, p: number, vp: Viewport): Pose {
  const k = depth(p);
  const minDim = Math.min(vp.w, vp.h);
  const eased = k / VIEW.kMax;
  return {
    x: vp.w / 2 + Math.cos(item.angle) * (vp.w / 2) * k,
    y: vp.h / 2 + Math.sin(item.angle) * (vp.h / 2) * k,
    r: item.size * minDim * (VIEW.radiusBase + VIEW.radiusGain * eased),
  };
}
