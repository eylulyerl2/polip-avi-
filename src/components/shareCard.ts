import { GAME_NAME, GAME_SUBTITLE, fill, tr } from "@/content/tr";

export interface ShareCardData {
  totalScore: number;
  /** Overall detection rate, 0..1. */
  detectionRate: number;
  levelScores: number[];
  levelRates: number[];
  seed: number;
}

const W = 1080;
const H = 1350;

/** Draws the shareable result card and returns it as a PNG blob. */
export async function renderShareCard(data: ShareCardData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not available");

  // Tunnel-like background.
  const bg = ctx.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H * 0.42, H * 0.8);
  bg.addColorStop(0, "#5a1633");
  bg.addColorStop(0.45, "#b0405c");
  bg.addColorStop(1, "#f6b3b8");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 6;
  for (let i = 1; i <= 6; i++) {
    ctx.beginPath();
    ctx.ellipse(W / 2, H * 0.42, i * 95, i * 115, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 96px system-ui, sans-serif";
  ctx.fillText(GAME_NAME, W / 2, 190);
  ctx.font = "500 40px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(GAME_SUBTITLE, W / 2, 252);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 300px system-ui, sans-serif";
  ctx.fillText(String(data.totalScore), W / 2, 590);
  ctx.font = "600 44px system-ui, sans-serif";
  ctx.fillText(tr.results.share.cardTotal, W / 2, 652);

  ctx.font = "700 64px system-ui, sans-serif";
  ctx.fillText(`${tr.results.share.cardRate}: %${Math.round(data.detectionRate * 100)}`, W / 2, 770);

  // Per-level rows.
  const rowY = 850;
  data.levelScores.forEach((score, i) => {
    const y = rowY + i * 88;
    ctx.fillStyle = "rgba(58,15,38,0.55)";
    ctx.beginPath();
    ctx.roundRect(110, y - 54, W - 220, 72, 22);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 36px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${i + 1}. ${tr.levels[i].title}`, 140, y - 6);
    ctx.textAlign = "right";
    ctx.fillText(`${score}  ·  %${Math.round(data.levelRates[i] * 100)}`, W - 140, y - 6);
  });

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(58,15,38,0.8)";
  ctx.font = "500 28px system-ui, sans-serif";
  ctx.fillText(`${tr.results.share.cardSeed}: ${data.seed}`, W / 2, H - 100);
  ctx.font = "500 24px system-ui, sans-serif";
  ctx.fillText(tr.disclaimer, W / 2, H - 56, W - 120);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png");
  });
}

export function shareText(data: ShareCardData): string {
  return fill(tr.results.share.text, {
    game: GAME_NAME,
    score: data.totalScore,
    rate: `%${Math.round(data.detectionRate * 100)}`,
    subtitle: GAME_SUBTITLE,
  });
}
