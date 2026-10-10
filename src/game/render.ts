import { AI } from "./config";
import type { GameEngine } from "./engine";
import { poseOf, progressOf } from "./geometry";
import { mulberry32, range } from "./rng";
import type { GameEvent, SpawnItem } from "./types";

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

export class Renderer {
  private effects: Effect[] = [];
  private wall: HTMLCanvasElement | null = null;
  private wallKey = "";

  constructor(
    private ctx: CanvasRenderingContext2D,
    /** Only seeds the wall texture (looks), never game logic. */
    private seed: number,
  ) {}

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

  /** Draws one object on its own (used by the briefing screen's picture legend). */
  drawSample(kind: SpawnItem["kind"], variant: number, x: number, y: number, r: number): void {
    this.drawItem(
      { kind, variant, angle: 0.9, id: 0, spawnMs: 0, lifetimeMs: 1, edge: "top", lane: 0.5, drift: 0, sway: 0, swayPhase: 0, size: 0, aiBox: false },
      x,
      y,
      r,
    );
  }

  clearEffects(): void {
    this.effects.length = 0;
  }

  draw(engine: GameEngine, now: number): void {
    const { ctx } = this;
    const { w, h } = engine.viewport;
    ctx.clearRect(0, 0, w, h);
    this.drawWall(w, h);

    const lvl = engine.level;
    if (engine.phase === "playing" && lvl) {
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

  // ---------------------------------------------------------------- wall

  /** The wall never moves: a still, soft mucosa texture drawn once per size. */
  private drawWall(w: number, h: number): void {
    const dpr = this.ctx.getTransform().a || 1;
    const key = `${w}x${h}@${dpr}`;
    if (!this.wall || this.wallKey !== key) {
      this.wall = this.buildWall(w, h, dpr);
      this.wallKey = key;
    }
    this.ctx.drawImage(this.wall, 0, 0, w, h);
  }

  private buildWall(w: number, h: number, dpr: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    const g = canvas.getContext("2d");
    if (!g) return canvas;
    g.scale(dpr, dpr);
    const rng = mulberry32(this.seed ^ 0x5eed1234);

    const base = g.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.5, Math.hypot(w, h) * 0.62);
    base.addColorStop(0, "#f8bcc0");
    base.addColorStop(0.55, "#eb98a4");
    base.addColorStop(1, "#c55f78");
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);

    // Soft wide folds with a lighter ridge.
    g.lineCap = "round";
    for (let i = 0; i < 9; i++) {
      const y0 = rng() * h;
      const c = () => y0 + range(rng, -110, 110);
      g.beginPath();
      g.moveTo(-30, y0);
      g.bezierCurveTo(w * 0.3, c(), w * 0.7, c(), w + 30, c());
      g.lineWidth = range(rng, 36, 90);
      g.strokeStyle = "rgba(130,32,64,0.07)";
      g.stroke();
      g.lineWidth = 8;
      g.strokeStyle = "rgba(255,238,240,0.12)";
      g.translate(0, -16);
      g.stroke();
      g.translate(0, 16);
    }

    // Thin blood vessels (random walks).
    g.lineWidth = 1.4;
    g.strokeStyle = "rgba(190,52,76,0.24)";
    for (let i = 0; i < 16; i++) {
      let x = rng() * w;
      let y = rng() * h;
      let a = rng() * Math.PI * 2;
      g.beginPath();
      g.moveTo(x, y);
      for (let s = 0; s < 36; s++) {
        a += range(rng, -0.35, 0.35);
        x += Math.cos(a) * 7;
        y += Math.sin(a) * 7;
        g.lineTo(x, y);
      }
      g.stroke();
    }

    // Fine speckle.
    for (let i = 0; i < 140; i++) {
      g.beginPath();
      g.arc(rng() * w, rng() * h, range(rng, 1, 3.4), 0, Math.PI * 2);
      g.fillStyle = rng() < 0.5 ? "rgba(255,240,242,0.1)" : "rgba(120,30,60,0.07)";
      g.fill();
    }

    // Camera lens vignette.
    const vig = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.hypot(w, h) * 0.58);
    vig.addColorStop(0, "rgba(50,8,28,0)");
    vig.addColorStop(1, "rgba(50,8,28,0.5)");
    g.fillStyle = vig;
    g.fillRect(0, 0, w, h);
    return canvas;
  }

  // --------------------------------------------------------------- items

  private drawItem(item: SpawnItem, x: number, y: number, r: number): void {
    switch (item.kind) {
      case "polyp":
        this.drawPolyp(item, x, y, r);
        break;
      case "flat":
        this.drawFlat(item, x, y, r);
        break;
      case "bubble":
        this.drawBubble(item, x, y, r);
        break;
      case "fold":
        this.drawFold(item, x, y, r);
        break;
    }
  }

  /** A raised, shaded dome. */
  private dome(x: number, y: number, rx: number, ry: number, rot: number): void {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, ry * 0.3, rx * 1.08, ry * 0.82, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(60,10,34,0.28)";
    ctx.fill();
    const g = ctx.createRadialGradient(-rx * 0.3, -ry * 0.35, Math.min(rx, ry) * 0.1, 0, 0, Math.max(rx, ry));
    g.addColorStop(0, "#ec858f");
    g.addColorStop(1, "#b0405c");
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-rx * 0.32, -ry * 0.4, rx * 0.3, ry * 0.17, -0.6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.33)";
    ctx.fill();
    ctx.restore();
  }

  private drawPolyp(item: SpawnItem, x: number, y: number, r: number): void {
    const { ctx } = this;
    switch (item.variant) {
      case 1: {
        // Pedunculated: a head on a stalk.
        const dx = Math.cos(item.angle);
        const dy = Math.sin(item.angle);
        ctx.beginPath();
        ctx.moveTo(x - dx * r * 0.2, y - dy * r * 0.2);
        ctx.lineTo(x + dx * r * 1.0, y + dy * r * 1.0);
        ctx.lineWidth = r * 0.5;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#a63a56";
        ctx.stroke();
        this.dome(x - dx * r * 0.18, y - dy * r * 0.18, r * 0.78, r * 0.78, 0);
        break;
      }
      case 2: {
        // Lobulated: three overlapping bumps.
        for (let i = 0; i < 3; i++) {
          const a = item.angle + (i * Math.PI * 2) / 3;
          this.dome(x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.42, r * 0.58, r * 0.58, 0);
        }
        break;
      }
      case 3:
        this.dome(x, y, r, r * 0.68, item.angle);
        break;
      default:
        this.dome(x, y, r, r, 0);
    }
  }

  private drawFlat(item: SpawnItem, x: number, y: number, r: number): void {
    const { ctx } = this;
    const fill = "rgba(224,112,138,0.26)";
    const edge = "rgba(255,232,238,0.2)";
    if (item.variant === 1) {
      // Irregular blob.
      const n = 9;
      const pts: [number, number][] = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const k = 0.72 + 0.28 * Math.sin(i * 2.3 + item.angle * 3);
        pts.push([x + Math.cos(a) * r * k, y + Math.sin(a) * r * k * 0.85]);
      }
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const [px, py] = pts[i];
        const [nx, ny] = pts[(i + 1) % n];
        const mx = (px + nx) / 2;
        const my = (py + ny) / 2;
        if (i === 0) ctx.moveTo(mx, my);
        else ctx.quadraticCurveTo(px, py, mx, my);
      }
      const [fx, fy] = pts[0];
      const [sx, sy] = pts[1];
      ctx.quadraticCurveTo(fx, fy, (fx + sx) / 2, (fy + sy) / 2);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = edge;
      ctx.stroke();
      return;
    }
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.84, item.angle, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = edge;
    ctx.stroke();
    if (item.variant === 2) {
      // Slightly depressed centre.
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.5, r * 0.42, item.angle, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(150,50,80,0.12)";
      ctx.fill();
    }
  }

  private bubble(x: number, y: number, r: number, tint: boolean): void {
    const { ctx } = this;
    const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
    g.addColorStop(0, tint ? "rgba(240,130,150,0.12)" : "rgba(255,255,255,0.06)");
    g.addColorStop(1, tint ? "rgba(236,110,134,0.42)" : "rgba(255,255,255,0.38)");
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = tint ? "rgba(255,225,230,0.7)" : "rgba(255,255,255,0.75)";
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x - r * 0.36, y - r * 0.4, r * 0.3, r * 0.16, -0.6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fill();
  }

  private drawBubble(item: SpawnItem, x: number, y: number, r: number): void {
    if (item.variant === 1) {
      // Cluster of three.
      this.bubble(x - r * 0.28, y + r * 0.1, r * 0.62, false);
      this.bubble(x + r * 0.5, y - r * 0.32, r * 0.42, false);
      this.bubble(x + r * 0.34, y + r * 0.52, r * 0.32, false);
      return;
    }
    this.bubble(x, y, r, item.variant === 2);
  }

  private drawFold(item: SpawnItem, x: number, y: number, r: number): void {
    const { ctx } = this;
    if (item.variant === 1) {
      // Long thin curved shadow.
      ctx.beginPath();
      ctx.arc(x, y, r * 0.85, item.angle - 0.9, item.angle + 0.9);
      ctx.lineWidth = r * 0.4;
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(62,10,38,0.45)";
      ctx.stroke();
      return;
    }
    if (item.variant === 2) {
      // Soft dark patch.
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(62,10,38,0.38)");
      g.addColorStop(1, "rgba(62,10,38,0)");
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      return;
    }
    // Crescent.
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
  }

  // ------------------------------------------------------------ AI + fx

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
