import { AI, VIEW } from "./config";
import type { GameEngine } from "./engine";
import { depth, poseOf, progressOf } from "./geometry";
import type { GameEvent, SpawnItem } from "./types";

type RGB = readonly [number, number, number];

/** Soft pastel palette: far (dark, deep pink) to near (light coral). */
const FAR: RGB = [118, 36, 66];
const NEAR: RGB = [250, 192, 194];

const GOOD = "#8dffb8";
const BAD = "#ff7a8a";
const AI_COLOR = "#2de2c2";

interface Effect {
  kind: "float" | "ring" | "flash";
  x: number;
  y: number;
  text?: string;
  color: string;
  born: number;
  ttl: number;
}

function mix(a: RGB, b: RGB, t: number): string {
  const c = (i: number) => Math.round(a[i] + (b[i] - a[i]) * t);
  return `rgb(${c(0)},${c(1)},${c(2)})`;
}

export class Renderer {
  private effects: Effect[] = [];
  private ringDepths = new Float32Array(VIEW.ringCount);

  constructor(private ctx: CanvasRenderingContext2D) {}

  /** Turns an engine event into short visual effects. `now` is performance.now(). */
  addEvent(ev: GameEvent, now: number): void {
    if (ev.type === "levelEnd") return;
    const good = ev.type === "tap" && ev.good;
    const color = good ? GOOD : BAD;
    const sign = ev.points > 0 ? "+" : ev.points < 0 ? "−" : "";
    this.effects.push({ kind: "flash", x: 0, y: 0, color, born: now, ttl: 200 });
    this.effects.push({ kind: "ring", x: ev.x, y: ev.y, color, born: now, ttl: 420 });
    this.effects.push({
      kind: "float",
      x: ev.x,
      y: ev.y,
      color,
      text: `${sign}${Math.abs(ev.points)}`,
      born: now,
      ttl: 900,
    });
    if (this.effects.length > 40) this.effects.splice(0, this.effects.length - 40);
  }

  clearEffects(): void {
    this.effects.length = 0;
  }

  draw(engine: GameEngine, now: number): void {
    const { ctx } = this;
    const { w, h } = engine.viewport;
    ctx.clearRect(0, 0, w, h);
    this.drawTunnel(engine);

    const lvl = engine.level;
    if (engine.phase === "playing" && lvl) {
      // Draw far objects first so closer ones overlap them.
      for (const item of lvl.items) {
        if (item.spawnMs > engine.levelMs) break;
        if (engine.isResolved(item.id)) continue;
        const p = progressOf(item, engine.levelMs);
        if (p >= 1) continue;
        const pose = poseOf(item, p, engine.viewport);
        this.drawItem(item, pose.x, pose.y, pose.r);
      }
      if (lvl.aiEnabled) {
        for (const item of lvl.items) {
          if (item.spawnMs > engine.levelMs) break;
          if (!item.aiBox || engine.isResolved(item.id)) continue;
          const p = progressOf(item, engine.levelMs);
          if (p >= 1 || p < AI.revealAtProgress) continue;
          const pose = poseOf(item, p, engine.viewport);
          const alpha = Math.min(1, (p - AI.revealAtProgress) / 0.06);
          this.drawAiBox(pose.x, pose.y, pose.r, alpha, now);
        }
      }
    }
    this.drawEffects(engine, now);
  }

  private drawTunnel(engine: GameEngine): void {
    const { ctx } = this;
    const { w, h } = engine.viewport;
    const cx = w / 2;
    const cy = h / 2;
    const lifetime = engine.level?.lifetimeMs ?? 3000;
    const base = engine.clockMs / lifetime;
    const n = VIEW.ringCount;

    ctx.fillStyle = mix(FAR, NEAR, 1);
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < n; i++) {
      const phase = (((base + i / n) % 1) + 1) % 1;
      this.ringDepths[i] = depth(phase);
    }
    this.ringDepths.sort(); // ascending; draw from the largest (closest) ring inwards

    for (let i = n - 1; i >= 0; i--) {
      const k = this.ringDepths[i];
      if (k < 0.004) continue;
      const t = Math.min(1, k) ** 0.6;
      const rx = k * cx;
      const ry = k * cy;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = mix(FAR, NEAR, t);
      ctx.fill();

      const fade = Math.min(1, k * 4) * Math.max(0, 1 - k / VIEW.kMax);
      ctx.lineWidth = 1.5 + k * 7;
      ctx.strokeStyle = `rgba(86,18,50,${(0.32 * fade).toFixed(3)})`;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 0.975, ry * 0.975, 0, 0, Math.PI * 2);
      ctx.lineWidth = 1 + k * 3;
      ctx.strokeStyle = `rgba(255,236,238,${(0.16 * fade).toFixed(3)})`;
      ctx.stroke();
    }

    // Dark far end of the tunnel.
    const holeR = Math.min(w, h) * 0.2;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, holeR);
    g.addColorStop(0, "rgba(34,6,24,0.92)");
    g.addColorStop(1, "rgba(34,6,24,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - holeR, cy - holeR, holeR * 2, holeR * 2);
  }

  private drawItem(item: SpawnItem, x: number, y: number, r: number): void {
    const { ctx } = this;
    switch (item.kind) {
      case "polyp": {
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.28, r * 1.08, r * 0.82, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(60,10,34,0.3)";
        ctx.fill();
        const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
        g.addColorStop(0, "#ec858f");
        g.addColorStop(1, "#b0405c");
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x - r * 0.32, y - r * 0.4, r * 0.3, r * 0.17, -0.6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fill();
        break;
      }
      case "flat": {
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.84, item.angle * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(224,112,138,0.26)";
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(255,232,238,0.2)";
        ctx.stroke();
        break;
      }
      case "bubble": {
        const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
        g.addColorStop(0, "rgba(255,255,255,0.06)");
        g.addColorStop(1, "rgba(255,255,255,0.38)");
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(255,255,255,0.75)";
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(x - r * 0.36, y - r * 0.4, r * 0.3, r * 0.16, -0.6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fill();
        break;
      }
      case "fold": {
        const ox = Math.cos(item.angle) * r * 0.5;
        const oy = Math.sin(item.angle) * r * 0.5;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.beginPath();
        ctx.rect(x - r * 2, y - r * 2, r * 4, r * 4);
        ctx.arc(x + ox, y + oy, r * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(62,10,38,0.52)";
        ctx.fill("evenodd");
        ctx.restore();
        break;
      }
    }
  }

  private drawAiBox(x: number, y: number, r: number, alpha: number, now: number): void {
    const { ctx } = this;
    const half = Math.max(r * 1.3, 20) + 6 + Math.sin(now / 160) * 1.5;
    const len = half * 0.45;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = AI_COLOR;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const left = x - half;
    const right = x + half;
    const top = y - half;
    const bottom = y + half;
    ctx.beginPath();
    ctx.moveTo(left, top + len);
    ctx.lineTo(left, top);
    ctx.lineTo(left + len, top);
    ctx.moveTo(right - len, top);
    ctx.lineTo(right, top);
    ctx.lineTo(right, top + len);
    ctx.moveTo(right, bottom - len);
    ctx.lineTo(right, bottom);
    ctx.lineTo(right - len, bottom);
    ctx.moveTo(left + len, bottom);
    ctx.lineTo(left, bottom);
    ctx.lineTo(left, bottom - len);
    ctx.stroke();

    ctx.fillStyle = AI_COLOR;
    ctx.beginPath();
    ctx.roundRect(left, top - 20, 30, 18, 5);
    ctx.fill();
    ctx.fillStyle = "#06352c";
    ctx.font = "bold 12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("AI", left + 15, top - 11);
    ctx.restore();
  }

  private drawEffects(engine: GameEngine, now: number): void {
    const { ctx } = this;
    const { w, h } = engine.viewport;
    let write = 0;
    for (let i = 0; i < this.effects.length; i++) {
      const e = this.effects[i];
      const age = (now - e.born) / e.ttl;
      if (age >= 1) continue;
      this.effects[write++] = e;
      const fade = 1 - age;

      if (e.kind === "flash") {
        ctx.globalAlpha = 0.22 * fade;
        ctx.fillStyle = e.color;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
      } else if (e.kind === "ring") {
        ctx.globalAlpha = fade;
        ctx.lineWidth = 4 * fade + 1;
        ctx.strokeStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 14 + age * 46, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (e.text) {
        const x = Math.min(Math.max(e.x, 34), w - 34);
        const y = Math.min(Math.max(e.y, 90), h - 60) - age * 56;
        ctx.globalAlpha = Math.min(1, fade * 1.6);
        ctx.font = "800 26px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 5;
        ctx.strokeStyle = "rgba(50,8,30,0.85)";
        ctx.lineJoin = "round";
        ctx.strokeText(e.text, x, y);
        ctx.fillStyle = e.color;
        ctx.fillText(e.text, x, y);
        ctx.globalAlpha = 1;
      }
    }
    this.effects.length = write;
  }
}
