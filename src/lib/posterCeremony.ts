import { GIFEncoder, quantize, applyPalette } from "gifenc";
import QRCode from "qrcode";

/** 宣发免责声明（结果页 / 预览 / 海报共用） */
export const ENTERTAINMENT_DISCLAIMER =
  "本测试为粉丝向娱乐作品，结果仅供娱乐参考，不构成心理测评、医疗或运势建议；与电影及权利方无关。";

export const POSTER_W = 1080;
export const POSTER_H = 1920;

/** 群聊动态 GIF：缩小尺寸，更适合群聊分享 */
export const GIF_W = 540;
export const GIF_H = 960;
const GIF_FPS = 10;
const GIF_DELAY_MS = Math.round(1000 / GIF_FPS);
const GIF_FREEZE_FRAMES = 8;

/** 与结果页 / 预览页对齐的时间轴（毫秒） */
const ACT1_SHAKE_MS = 900;
const ACT1_EJECT_MS = 1500;
const ACT1_UNFURL_MS = 2100;
const ACT1_CHAR_MS = 70;
const ACT1_DONE_EXTRA_MS = 700;
const ACT1_HOLD_MS = 350;
const ACT_TRANSITION_MS = 500;

const ACT2_SLIP_MS = 900;
const ACT2_REVEAL_MS = 1600;
const ACT2_CHAR_MS = 55;
const ACT2_SEAL_EXTRA_MS = 400;
const ACT2_DONE_EXTRA_MS = 700;

export type PosterPayload = {
  name: string;
  persona: string;
  percentage: number;
  verdict: string;
  survivalGuide: string[];
  metaphysics: string;
  imageUrl?: string;
  bgUrl?: string;
  /** classic=普通鹅城签；ai=AI 专属紫青科技风 */
  variant?: "classic" | "ai";
};

type PosterTheme = {
  isAi: boolean;
  gold: string;
  goldDim: string;
  goldBright: string;
  seal: string;
  overlay: string;
  glow: string;
  muted: string;
  headerKicker: string;
  headerTitle: string;
  slipLabel: string;
  sealLines: string[];
  act1Kicker: string;
  act1Title: string;
  adviceTitle: string;
  footerHint: string;
};

function posterTheme(variant?: "classic" | "ai"): PosterTheme {
  if (variant === "ai") {
    return {
      isAi: true,
      gold: "#A78BFA",
      goldDim: "#7C3AED",
      goldBright: "#E9D5FF",
      seal: "#C4B5FD",
      overlay: "rgba(8, 4, 18, 0.68)",
      glow: "rgba(167, 139, 250, 0.22)",
      muted: "#9CA3AF",
      headerKicker: "算 尽 天 机  ·  逻 辑 观 察",
      headerTitle: "A I  ·  签",
      slipLabel: "算 力 判 词",
      sealLines: ["AI", "算"],
      act1Kicker: "算 尽 天 机",
      act1Title: "逻辑观察",
      adviceTitle: "推 演  ·  生 存 要 诀",
      footerHint: "扫码求签 · 测测你是鹅城谁",
    };
  }
  return {
    isAi: false,
    gold: "#D4AF37",
    goldDim: "#B8973E",
    goldBright: "#E8D48B",
    seal: "#C13B1B",
    overlay: "rgba(13, 10, 6, 0.86)",
    glow: "rgba(212, 175, 55, 0.16)",
    muted: "#8A7B6B",
    headerKicker: "命 运 落 子  ·  鹅 城 求 签",
    headerTitle: "鹅 城 签",
    slipLabel: "鹅 城 判 词",
    sealLines: ["鹅", "判"],
    act1Kicker: "命 运 一 签",
    act1Title: "鹅城判词",
    adviceTitle: "签 解  ·  生 存 要 诀",
    footerHint: "扫码求签 · 测测你是鹅城谁",
  };
}

export type CeremonyAnim = {
  /** 绝对时间（用于摇晃周期等） */
  timeMs: number;
  /** Act1 签筒是否可见（摇晃+飞签阶段） */
  showTube: boolean;
  /** 0–1 摇签筒摇晃强度（仅 shaking 阶段为 1） */
  shake: number;
  /** 0–1 签支飞出 */
  eject: number;
  /** 0–1 结果页签牌展开 */
  resultSlip: number;
  /** 0–1 结果页判词点亮 */
  resultVerdict: number;
  /** 0–1 结果页落印 */
  resultSeal: number;
  /** 0–1 结果页鹅城签仪式整体透明度 */
  ceremonyAlpha: number;
  /** 0–1 海报预览整体透明度 */
  posterAlpha: number;
  /** 0–1 骰子落下（海报） */
  dice: number;
  /** 0–1 签牌展开（海报） */
  slip: number;
  /** 0–1 判词点亮进度（海报） */
  verdict: number;
  /** 0–1 落印（海报） */
  seal: number;
  /** 0–1 签解/页脚（海报） */
  rest: number;
};

/** 静态终态（朋友圈 PNG / GIF 预热） */
export const FULL_CEREMONY_ANIM: CeremonyAnim = {
  timeMs: 0,
  showTube: false,
  shake: 0,
  eject: 0,
  resultSlip: 0,
  resultVerdict: 0,
  resultSeal: 0,
  ceremonyAlpha: 0,
  posterAlpha: 1,
  dice: 1,
  slip: 1,
  verdict: 1,
  seal: 1,
  rest: 1,
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function easeOutCubic(t: number) {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

function easeInOutCubic(t: number) {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function verdictCharCount(verdict: string): number {
  return Math.max(1, verdict.replace(/[。，、；：！？]/g, "").length);
}

/** 按判词字数计算两幕 GIF 总时长 */
export function gifDurationMs(charCount: number): number {
  const n = Math.max(1, charCount);
  const act1Done = ACT1_UNFURL_MS + n * ACT1_CHAR_MS + ACT1_DONE_EXTRA_MS;
  const act2Start = act1Done + ACT1_HOLD_MS;
  const act2Seal = act2Start + ACT2_REVEAL_MS + n * ACT2_CHAR_MS + ACT2_SEAL_EXTRA_MS;
  return act2Seal + ACT2_DONE_EXTRA_MS;
}

/**
 * 两幕时间轴：
 * Act1 — 结果页鹅城签（摇筒 → 飞签 → 展签 → 点亮 → 落印）
 * Act2 — 海报预览（骰子 → 签牌 → 点亮 → 落印 → 签解）
 */
export function animAt(timeMs: number, charCount = 12): CeremonyAnim {
  const n = Math.max(1, charCount);
  const act1RevealEnd = ACT1_UNFURL_MS + n * ACT1_CHAR_MS;
  const act1Done = act1RevealEnd + ACT1_DONE_EXTRA_MS;
  const transitionStart = act1Done + ACT1_HOLD_MS;
  const transitionEnd = transitionStart + ACT_TRANSITION_MS;
  const act2Start = transitionStart;
  const act2SlipAt = act2Start + ACT2_SLIP_MS;
  const act2RevealAt = act2Start + ACT2_REVEAL_MS;
  const act2SealAt = act2RevealAt + n * ACT2_CHAR_MS + ACT2_SEAL_EXTRA_MS;
  const act2DoneAt = act2SealAt + ACT2_DONE_EXTRA_MS;

  const t = Math.max(0, timeMs);

  // —— Act1 ——
  const showTube = t < ACT1_EJECT_MS;
  const shake = t < ACT1_SHAKE_MS ? 1 : 0;
  const eject = easeOutCubic((t - ACT1_SHAKE_MS) / 550);
  const resultSlip = easeOutCubic((t - ACT1_EJECT_MS) / 550);
  const resultVerdict =
    t < ACT1_UNFURL_MS ? 0 : clamp01((t - ACT1_UNFURL_MS) / Math.max(1, n * ACT1_CHAR_MS));
  const resultSeal = easeOutCubic((t - act1RevealEnd) / 450);

  let ceremonyAlpha = 1;
  let posterAlpha = 0;
  if (t >= transitionEnd) {
    ceremonyAlpha = 0;
    posterAlpha = 1;
  } else if (t >= transitionStart) {
    const p = easeInOutCubic((t - transitionStart) / ACT_TRANSITION_MS);
    ceremonyAlpha = 1 - p;
    posterAlpha = p;
  }

  // —— Act2（相对 act2Start，对齐 PosterPreview）——
  const a2 = Math.max(0, t - act2Start);
  const dice = easeOutCubic(a2 / 750);
  const slip = t < act2SlipAt ? 0 : easeOutCubic((t - act2SlipAt) / 550);
  const verdict =
    t < act2RevealAt ? 0 : clamp01((t - act2RevealAt) / Math.max(1, n * ACT2_CHAR_MS));
  const seal = t < act2SealAt ? 0 : easeOutCubic((t - act2SealAt) / 450);
  const rest = t < act2SealAt ? 0 : easeOutCubic((t - act2SealAt) / ACT2_DONE_EXTRA_MS);

  return {
    timeMs: t,
    showTube,
    shake,
    eject: showTube ? eject : 0,
    resultSlip: t >= ACT1_EJECT_MS ? resultSlip : 0,
    resultVerdict,
    resultSeal: t >= act1RevealEnd ? resultSeal : 0,
    ceremonyAlpha,
    posterAlpha,
    dice: posterAlpha > 0.01 ? dice : 0,
    slip: posterAlpha > 0.01 ? slip : 0,
    verdict: posterAlpha > 0.01 ? verdict : 0,
    seal: posterAlpha > 0.01 ? seal : 0,
    rest: posterAlpha > 0.01 ? Math.max(rest, t >= act2DoneAt ? 1 : 0) : 0,
  };
}

const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

export function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  const cached = imageCache.get(src);
  if (cached) return cached;

  const task = (async () => {
    // 优先 fetch→blob，避免部分 CDN 对 Image+CORS 不稳定
    try {
      const res = await fetch(src, { mode: "cors", credentials: "omit" });
      if (res.ok) {
        const blob = await res.blob();
        const objUrl = URL.createObjectURL(blob);
        const img = await new Promise<HTMLImageElement | null>((resolve) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.onerror = () => resolve(null);
          el.src = objUrl;
        });
        if (img && img.naturalWidth > 0) return img;
      }
    } catch {
      /* fall through */
    }

    return new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      if (src.startsWith("http")) img.crossOrigin = "anonymous";
      img.onload = () => resolve(img.naturalWidth > 0 ? img : null);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  })();

  imageCache.set(src, task);
  return task;
}

/** 预热海报资源，避免逐帧重复请求 */
export async function preloadPosterAssets(payload: PosterPayload): Promise<void> {
  await Promise.all([
    payload.imageUrl ? loadImage(payload.imageUrl) : Promise.resolve(null),
    payload.bgUrl ? loadImage(payload.bgUrl) : Promise.resolve(null),
  ]);
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const ir = img.naturalWidth / img.naturalHeight;
  const tr = dw / dh;
  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  if (ir > tr) {
    sw = img.naturalHeight * tr;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / tr;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const chars = text.replace(/\s+/g, "");
  const lines: string[] = [];
  let current = "";
  for (const ch of chars) {
    const next = current + ch;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = ch;
      if (lines.length >= maxLines) break;
    } else {
      current = next;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length === maxLines && chars.length > lines.join("").length) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = last.slice(0, Math.max(1, last.length - 1)) + "…";
  }
  return lines;
}

/** 对齐预览页 .poster-dice：扁平金骰 + CSS 点位 */
function drawDiceFace(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  pips: number,
  rotationDeg = 0
) {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.rotate((rotationDeg * Math.PI) / 180);
  const half = size / 2;
  const r = size * 0.2;

  const grad = ctx.createLinearGradient(-half, -half, half, half);
  grad.addColorStop(0, "#F3E6B8");
  grad.addColorStop(1, "#B8973E");
  roundRectPath(ctx, -half, -half, size, size, r);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "rgba(90, 60, 20, 0.45)";
  ctx.lineWidth = Math.max(1, size * 0.035);
  ctx.stroke();
  // inset 高光
  roundRectPath(ctx, -half + 1, -half + 1, size - 2, size - 2, r * 0.85);
  ctx.strokeStyle = "rgba(255, 248, 220, 0.28)";
  ctx.lineWidth = 1;
  ctx.stroke();

  const pipR = size * 0.1;
  const inset = size * 0.28;
  const map: Record<number, Array<[number, number]>> = {
    1: [[0, 0]],
    2: [
      [-inset, -inset],
      [inset, inset],
    ],
    3: [
      [-inset, -inset],
      [0, 0],
      [inset, inset],
    ],
    4: [
      [-inset, -inset],
      [inset, -inset],
      [-inset, inset],
      [inset, inset],
    ],
    5: [
      [-inset, -inset],
      [inset, -inset],
      [0, 0],
      [-inset, inset],
      [inset, inset],
    ],
    6: [
      [-inset, -inset],
      [inset, -inset],
      [-inset, 0],
      [inset, 0],
      [-inset, inset],
      [inset, inset],
    ],
  };
  (map[Math.min(6, Math.max(1, pips))] ?? map[1]).forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(dx, dy, pipR, 0, Math.PI * 2);
    ctx.fillStyle = "#3A1F12";
    ctx.fill();
  });
  ctx.restore();
}

/** 结果页同款竹签装饰（替代原先粗签牌） */
function drawLotStickDecor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tiltDeg = 0,
  label = ""
) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((tiltDeg * Math.PI) / 180);
  const hw = w / 2;
  const hh = h / 2;
  const grad = ctx.createLinearGradient(0, -hh, 0, hh);
  grad.addColorStop(0, "#F3E6B8");
  grad.addColorStop(0.55, "#C8B06A");
  grad.addColorStop(1, "#8A7040");
  roundRectPath(ctx, -hw, -hh, w, h, w * 0.35);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "rgba(232, 212, 139, 0.55)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
  ctx.fillRect(-hw, -hh, Math.max(1, w * 0.12), h);
  if (label) {
    ctx.fillStyle = "#5C1A12";
    ctx.font = `600 ${Math.max(10, w * 0.7)}px 'Noto Serif SC', serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label.slice(0, 1), 0, -hh * 0.35);
  }
  ctx.restore();
  ctx.textBaseline = "alphabetic";
}

function drawCornerMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number,
  len: number
) {
  ctx.beginPath();
  ctx.moveTo(x, y + dy * len);
  ctx.lineTo(x, y);
  ctx.lineTo(x + dx * len, y);
  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawSealStamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  lines: string[],
  rotationDeg: number,
  alpha: number
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate((rotationDeg * Math.PI) / 180);
  const half = size / 2;
  ctx.strokeStyle = "rgba(193, 59, 27, 0.9)";
  ctx.lineWidth = Math.max(2, size * 0.045);
  ctx.strokeRect(-half, -half, size, size);
  ctx.strokeRect(-half + 5, -half + 5, size - 10, size - 10);
  ctx.fillStyle = "rgba(193, 59, 27, 0.12)";
  ctx.fillRect(-half + 5, -half + 5, size - 10, size - 10);
  ctx.fillStyle = "rgba(193, 59, 27, 0.92)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fontSize = lines.length > 1 ? size * 0.28 : size * 0.36;
  ctx.font = `700 ${fontSize}px 'Noto Serif SC', serif`;
  const step = size * 0.32;
  const start = -((lines.length - 1) * step) / 2;
  lines.forEach((line, i) => ctx.fillText(line, 0, start + i * step));
  ctx.restore();
  ctx.textBaseline = "alphabetic";
}

function verdictLinesOf(verdict: string): string[] {
  const clean = verdict.replace(/[。，、；：！？]/g, "");
  const lines: string[] = [];
  for (let i = 0; i < clean.length; i += 7) lines.push(clean.slice(i, i + 7));
  return lines;
}

/** 结果页签筒：筒口 + 筒身 + 5 根签头 + 底座 */
function drawLotTube(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  s: number,
  timeMs: number,
  shaking: boolean
) {
  const cycleDuration = 840;
  const cycleTime = timeMs % cycleDuration;
  const cycleProgress = cycleTime / cycleDuration;

  let shakeAngle = 0;
  let shakeOffset = 0;
  if (shaking) {
    if (cycleProgress < 0.25) {
      const t = cycleProgress / 0.25;
      shakeAngle = -7 * t;
      shakeOffset = -3 * t;
    } else if (cycleProgress < 0.75) {
      const t = (cycleProgress - 0.25) / 0.5;
      shakeAngle = -7 + 14 * t;
      shakeOffset = -3 + 6 * t;
    } else {
      const t = (cycleProgress - 0.75) / 0.25;
      shakeAngle = 7 * (1 - t);
      shakeOffset = 3 * (1 - t);
    }
  }

  ctx.save();
  ctx.translate(centerX + shakeOffset * s, centerY);
  ctx.rotate((shakeAngle * Math.PI) / 180);
  // 与结果页 .lot-tube filter: drop-shadow 一致
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = 20 * s;
  ctx.shadowOffsetY = 8 * s;

  const tubeH = 168 * s;
  const rimW = 108 * s;
  const rimH = 18 * s;
  const bodyW = 92 * s;
  const bodyH = 120 * s;
  const baseW = 100 * s;
  const baseH = 22 * s;

  const rimY = -tubeH / 2;
  // 画完阴影层后清掉，避免污染内部细节
  const rimGrad = ctx.createLinearGradient(0, rimY, 0, rimY + rimH);
  rimGrad.addColorStop(0, "#E8D48B");
  rimGrad.addColorStop(1, "#8A6A2A");
  ctx.beginPath();
  ctx.ellipse(0, rimY + rimH / 2, rimW / 2, rimH / 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = rimGrad;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  // inset 高光
  ctx.shadowColor = "rgba(255, 240, 200, 0.35)";
  ctx.shadowBlur = 4 * s;
  ctx.shadowOffsetY = 2 * s;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const bodyY = rimY + rimH - 8 * s;
  const bodyGrad = ctx.createLinearGradient(0, bodyY, 0, bodyY + bodyH);
  bodyGrad.addColorStop(0, "#6B4E22");
  bodyGrad.addColorStop(0.4, "#A67C2E");
  bodyGrad.addColorStop(1, "#5C3F18");

  ctx.beginPath();
  ctx.moveTo(-bodyW / 2, bodyY);
  ctx.lineTo(bodyW / 2, bodyY);
  ctx.lineTo(bodyW / 2, bodyY + bodyH - 10 * s);
  ctx.arcTo(bodyW / 2, bodyY + bodyH, 0, bodyY + bodyH, 10 * s);
  ctx.lineTo(0, bodyY + bodyH);
  ctx.arcTo(-bodyW / 2, bodyY + bodyH, -bodyW / 2, bodyY + bodyH - 10 * s, 10 * s);
  ctx.closePath();
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 1 * s;
  ctx.stroke();

  const shadowGrad = ctx.createLinearGradient(-bodyW / 2, 0, bodyW / 2, 0);
  shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.25)");
  shadowGrad.addColorStop(0.3, "transparent");
  shadowGrad.addColorStop(0.7, "transparent");
  shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0.25)");
  ctx.fillStyle = shadowGrad;
  ctx.fill();

  const stickBottom = bodyY + bodyH - 18 * s;
  const stickW = 8 * s;
  const stickH = 72 * s;
  const tubeLeftEdge = -bodyW / 2;

  for (let i = 0; i < 5; i++) {
    const stickX = tubeLeftEdge + (14 + i * 13) * s;
    let rattleAngle = 0;
    if (shaking) {
      const rattleProgress = (timeMs % cycleDuration) / cycleDuration;
      rattleAngle = Math.sin(rattleProgress * Math.PI * 2) * (i - 2) * 3;
    }

    ctx.save();
    ctx.translate(stickX + stickW / 2, stickBottom);
    ctx.rotate((rattleAngle * Math.PI) / 180);
    const stickGrad = ctx.createLinearGradient(0, 0, 0, -stickH);
    stickGrad.addColorStop(0, "#F3E6B8");
    stickGrad.addColorStop(0.55, "#C8B06A");
    stickGrad.addColorStop(1, "#8A7040");
    ctx.fillStyle = stickGrad;
    ctx.beginPath();
    ctx.roundRect(-stickW / 2, -stickH, stickW, stickH, [2 * s, 2 * s, 0, 0]);
    ctx.fill();
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(-stickW / 2, -stickH, 1 * s, stickH);
    ctx.restore();
  }

  const baseY = bodyY + bodyH - 4 * s;
  ctx.beginPath();
  ctx.ellipse(0, baseY + baseH / 2, baseW / 2, baseH / 2, 0, 0, Math.PI * 2);
  const baseGrad = ctx.createLinearGradient(0, baseY, 0, baseY + baseH);
  baseGrad.addColorStop(0, "#8A6A2A");
  baseGrad.addColorStop(1, "#3A2A12");
  ctx.fillStyle = baseGrad;
  ctx.fill();
  ctx.strokeStyle = "#B8973E";
  ctx.lineWidth = 1 * s;
  ctx.stroke();

  ctx.restore();
}

/** 结果页飞出签支（lot-stick-eject） */
function drawFlyingStick(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  s: number,
  eject: number
) {
  if (eject <= 0.01) return;
  // keyframes: 0% ty=36 rot=-10 scale=0.85 → 100% ty=-88 rot=4 scale=1
  const ty = 36 + (-88 - 36) * eject;
  const rot = -10 + 14 * eject;
  const scale = 0.85 + 0.15 * eject;
  const opacity = eject < 0.35 ? clamp01(eject / 0.35) : 1;

  const stickW = 28 * s;
  const stickH = 140 * s;
  // 相对签筒中心：签筒底约在 +84s，飞签 bottom:52 → 起点靠近筒口
  const baseY = 20 * s;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(centerX, centerY + baseY + ty * s);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.scale(scale, scale);

  const grad = ctx.createLinearGradient(0, -stickH / 2, 0, stickH / 2);
  grad.addColorStop(0, "#F7EDC8");
  grad.addColorStop(0.7, "#D4AF37");
  grad.addColorStop(1, "#8A7040");
  roundRectPath(ctx, -stickW / 2, -stickH / 2, stickW, stickH, 3 * s);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "rgba(232, 212, 139, 0.7)";
  ctx.lineWidth = 1 * s;
  ctx.stroke();

  ctx.shadowColor = "rgba(212, 175, 55, 0.45)";
  ctx.shadowBlur = 16 * s;
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.fillStyle = "#5C1A12";
  ctx.font = `600 ${Math.max(14, 18 * s)}px 'Noto Serif SC', serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("签", 0, -stickH * 0.22);
  ctx.restore();
  ctx.textBaseline = "alphabetic";
}

/** 结果页鹅城签签牌（全屏仪式用） */
function drawResultCeremonySlip(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  s: number,
  payload: PosterPayload,
  anim: CeremonyAnim,
  theme: PosterTheme = posterTheme(payload.variant)
) {
  const slipProgress = clamp01(anim.resultSlip);
  if (slipProgress <= 0.01) return;

  const slipW = Math.min(W * 0.78, 420 * s * 2);
  const slipH = Math.min(H * 0.42, 420 * s);
  const slipX = (W - slipW) / 2;
  const slipY = H * 0.32;

  ctx.save();
  ctx.translate(W / 2, slipY);
  ctx.scale(1, Math.max(0.15, slipProgress));
  ctx.translate(-W / 2, -slipY);
  ctx.globalAlpha = slipProgress;

  // 标题区（与签牌拉开，避免重叠）
  ctx.textAlign = "center";
  ctx.fillStyle = theme.muted;
  ctx.font = `${Math.max(11, 13 * s)}px 'Noto Serif SC', serif`;
  ctx.fillText(theme.act1Kicker, W / 2, slipY - 78 * s);
  ctx.fillStyle = theme.goldBright;
  ctx.font = `700 ${Math.max(18, 26 * s)}px 'Noto Serif SC', serif`;
  ctx.fillText(theme.act1Title, W / 2, slipY - 42 * s);

  roundRectPath(ctx, slipX, slipY, slipW, slipH, 4 * s);
  const slipGrad = ctx.createLinearGradient(slipX, slipY, slipX, slipY + slipH);
  slipGrad.addColorStop(0, theme.isAi ? "rgba(167, 139, 250, 0.14)" : "rgba(232, 212, 139, 0.12)");
  slipGrad.addColorStop(1, theme.isAi ? "rgba(124, 58, 237, 0.06)" : "rgba(200, 180, 150, 0.06)");
  ctx.fillStyle = slipGrad;
  ctx.fill();
  ctx.strokeStyle = theme.gold;
  ctx.lineWidth = 1.5 * s;
  ctx.stroke();

  // 竖纹
  ctx.save();
  roundRectPath(ctx, slipX, slipY, slipW, slipH, 4 * s);
  ctx.clip();
  for (let i = 0; i < 14; i++) {
    const lx = slipX + 20 * s + i * ((slipW - 40 * s) / 13);
    ctx.beginPath();
    ctx.moveTo(lx, slipY + 14 * s);
    ctx.lineTo(lx, slipY + slipH - 14 * s);
    ctx.strokeStyle = "rgba(200, 180, 150, 0.06)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();

  // 上上签角标
  const badgeW = 64 * s;
  const badgeH = 22 * s;
  ctx.strokeStyle = "rgba(193, 59, 27, 0.7)";
  ctx.lineWidth = 1 * s;
  ctx.strokeRect(slipX + 14 * s, slipY + 14 * s, badgeW, badgeH);
  ctx.fillStyle = "rgba(13, 10, 6, 0.55)";
  ctx.fillRect(slipX + 14 * s, slipY + 14 * s, badgeW, badgeH);
  ctx.fillStyle = "#C13B1B";
  ctx.font = `600 ${Math.max(11, 13 * s)}px 'Noto Serif SC', serif`;
  ctx.textAlign = "center";
  ctx.fillText("上上签", slipX + 14 * s + badgeW / 2, slipY + 14 * s + badgeH * 0.72);

  const lines = verdictLinesOf(payload.verdict);
  const flat = lines.join("");
  const litCount = Math.floor(flat.length * clamp01(anim.resultVerdict));
  const lineGap = Math.min(48 * s, (slipH * 0.55) / Math.max(lines.length, 1));
  const fontSize = Math.min(32 * s, lineGap * 0.7);
  ctx.font = `${fontSize}px KaiTi, 'STKaiti', '华文楷体', 'Noto Serif SC', serif`;
  const textBlockH = lines.length * lineGap;
  const startY = slipY + slipH * 0.28 + Math.max(0, (slipH * 0.5 - textBlockH) / 2);
  let charCursor = 0;
  lines.forEach((line, i) => {
    const chars = Array.from(line);
    const spacing = 6 * s;
    let totalW = 0;
    chars.forEach((ch) => {
      totalW += ctx.measureText(ch).width + spacing;
    });
    totalW -= spacing;
    let cx = (W - totalW) / 2;
    const ly = startY + i * lineGap;
    chars.forEach((ch) => {
      const lit = charCursor < litCount;
      ctx.fillStyle = lit ? theme.goldBright : "rgba(107, 95, 82, 0.35)";
      ctx.fillText(ch, cx + ctx.measureText(ch).width / 2, ly);
      cx += ctx.measureText(ch).width + spacing;
      charCursor += 1;
    });
  });

  const sealProgress = clamp01(anim.resultSeal);
  if (sealProgress > 0.01) {
    const sealSize = Math.min(64 * s, slipH * 0.2);
    const sealScale = 1.6 - 0.6 * sealProgress;
    drawSealStamp(
      ctx,
      slipX + slipW - sealSize * 1.1,
      slipY + slipH - sealSize * 1.05,
      sealSize * sealScale,
      theme.sealLines,
      -12,
      0.95 * sealProgress
    );
  }

  ctx.restore();
}

/**
 * 绘制仪式帧（静态 PNG 用 FULL_CEREMONY_ANIM；GIF 用两幕插值）
 * 1080×1920 朋友圈宣发：纵向按比例铺满，避免大面积留白
 */
export async function drawCeremonyPoster(
  ctx: CanvasRenderingContext2D,
  payload: PosterPayload,
  anim: CeremonyAnim,
  opts: { width: number; height: number; showQr: boolean; disclaimer: boolean }
) {
  const W = opts.width;
  const H = opts.height;
  const s = W / POSTER_W;
  const theme = posterTheme(payload.variant);

  const drawBackdrop = async () => {
    ctx.fillStyle = theme.isAi ? "#0A0614" : "#0D0A06";
    ctx.fillRect(0, 0, W, H);

    if (payload.bgUrl) {
      const bgImg = await loadImage(payload.bgUrl);
      if (bgImg) {
        drawImageCover(ctx, bgImg, 0, 0, W, H);
        ctx.fillStyle = theme.overlay;
        ctx.fillRect(0, 0, W, H);
      }
    }

    const glow = ctx.createRadialGradient(W * 0.5, H * 0.22, 20 * s, W * 0.5, H * 0.28, 520 * s);
    glow.addColorStop(0, theme.glow);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // AI：底部二进制氛围点缀
    if (theme.isAi) {
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = theme.goldBright;
      ctx.font = `${Math.max(9, 11 * s)}px monospace`;
      const bits = "01001101011010010101";
      for (let i = 0; i < 8; i++) {
        ctx.fillText(bits.slice(i % 4), 24 * s + i * 62 * s, H - 48 * s - (i % 3) * 14 * s);
      }
      ctx.restore();
    }
  };

  await drawBackdrop();

  // —— Act1：全屏鹅城签（结果页同款签筒，按手机比例放大）——
  if (anim.ceremonyAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = anim.ceremonyAlpha;
    // 结果页签筒 120px ≈ 手机宽 32%；GIF 540 宽上约 200px
    const tubeS = Math.max(1.55, (W * 0.38) / 120);

    if (anim.showTube) {
      const centerX = W / 2;
      const centerY = H * 0.52;
      // 标题上移，避免与签筒/飞签重叠
      const titleOffset = 178 * tubeS;
      ctx.textAlign = "center";
      ctx.fillStyle = theme.muted;
      ctx.font = `${Math.max(12, 14 * tubeS * 0.55)}px 'Noto Serif SC', serif`;
      ctx.fillText(theme.act1Kicker, centerX, centerY - titleOffset);
      ctx.fillStyle = theme.goldBright;
      ctx.font = `700 ${Math.max(22, 28 * tubeS * 0.55)}px 'Noto Serif SC', serif`;
      ctx.fillText(theme.act1Title, centerX, centerY - titleOffset + 44 * tubeS * 0.55);
      ctx.fillStyle = theme.isAi ? "#6B7280" : "#6B5F52";
      ctx.font = `${Math.max(12, 13 * tubeS * 0.55)}px 'Noto Serif SC', serif`;
      ctx.fillText(
        anim.shake > 0.5
          ? theme.isAi
            ? "算力推演中…"
            : "签筒摇动中…"
          : anim.eject > 0.01
            ? theme.isAi
              ? "结果溢出"
              : "一签飞出"
            : theme.isAi
              ? "推演所有可能 · 窥见你的下一步"
              : "摇签出命 · 立判鹅城人格",
        centerX,
        centerY - titleOffset + 84 * tubeS * 0.55
      );

      drawLotTube(ctx, centerX, centerY, tubeS, anim.timeMs, anim.shake > 0.5);
      drawFlyingStick(ctx, centerX, centerY, tubeS, anim.eject);
    } else if (anim.resultSlip > 0.01) {
      drawResultCeremonySlip(ctx, W, H, s, payload, anim, theme);
    }

    ctx.restore();
  }

  // —— Act2：海报预览布局 ——
  if (anim.posterAlpha <= 0.01) {
    ctx.globalAlpha = 1;
    ctx.textAlign = "center";
    return;
  }

  ctx.save();
  ctx.globalAlpha = anim.posterAlpha;
  // 过渡时重铺背景，实现与仪式的交叉淡入
  if (anim.ceremonyAlpha > 0.01) {
    ctx.fillStyle = theme.isAi ? "#0A0614" : "#0D0A06";
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W * 0.5, H * 0.22, 20 * s, W * 0.5, H * 0.28, 520 * s);
    glow.addColorStop(0, theme.glow);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  }

  // —— 简化边框（单层即可）——
  const pad = 32 * s;
  const disclaimerBand = opts.disclaimer ? 30 * s : 0;
  const frameBottom = H - pad - disclaimerBand;
  const frameTop = pad;
  const frameH = frameBottom - frameTop;

  ctx.strokeStyle = theme.gold;
  ctx.lineWidth = 2 * s;
  ctx.strokeRect(pad, pad, W - pad * 2, frameH);

  // 预览页四角角标
  const cornerLen = 18 * s;
  const cornerInset = pad + 10 * s;
  drawCornerMark(ctx, cornerInset, pad + 10 * s, 1, 1, cornerLen);
  drawCornerMark(ctx, W - cornerInset, pad + 10 * s, -1, 1, cornerLen);
  drawCornerMark(ctx, cornerInset, frameBottom - 10 * s, 1, -1, cornerLen);
  drawCornerMark(ctx, W - cornerInset, frameBottom - 10 * s, -1, -1, cornerLen);

  const innerTop = pad + 28 * s;
  const innerBottom = frameBottom - 20 * s;
  const innerH = innerBottom - innerTop;

  // 分区比例：顶栏 8% · 人像名 24% · 签牌 34% · 签解 21% · 二维码 13%
  // 加宽人像区，给「姓名 / 抽中」留出行距，避免与签牌重叠
  const headerH = innerH * 0.08;
  const heroH = innerH * 0.24;
  const slipH = innerH * 0.34;
  const adviceH = innerH * 0.21;
  const footerH = opts.showQr ? innerH * 0.13 : innerH * 0.04;
  const used = headerH + heroH + slipH + adviceH + footerH;
  const gapTotal = Math.max(0, innerH - used);
  const gap = gapTotal / 4;

  let cursor = innerTop;
  const headerTop = cursor;
  cursor += headerH + gap;
  const heroTop = cursor;
  cursor += heroH + gap;
  const slipTop = cursor;
  cursor += slipH + gap;
  const adviceTop = cursor;
  cursor += adviceH + gap;
  const footerTop = cursor;

  const dicePip = Math.min(6, Math.max(1, Math.round(payload.percentage / 17)));
  const diceDrop = (1 - anim.dice) * 40 * s;
  const diceAlpha = clamp01(anim.dice);

  // —— 顶栏 ——
  ctx.save();
  ctx.globalAlpha = diceAlpha * anim.posterAlpha;
  const diceSize = Math.min(54 * s, headerH * 0.55);
  drawDiceFace(ctx, pad + 28 * s, headerTop + (headerH - diceSize) / 2 + diceDrop, diceSize, dicePip, -12);
  drawDiceFace(
    ctx,
    W - pad - 28 * s - diceSize * 0.9,
    headerTop + (headerH - diceSize * 0.9) / 2 + diceDrop * 0.85,
    diceSize * 0.9,
    Math.max(1, 7 - dicePip),
    16
  );
  ctx.textAlign = "center";
  ctx.fillStyle = theme.muted;
  ctx.font = `${Math.max(12, 15 * s)}px 'Noto Serif SC', serif`;
  ctx.fillText(theme.headerKicker, W / 2, headerTop + headerH * 0.26);
  ctx.fillStyle = theme.goldBright;
  ctx.font = `700 ${Math.max(28, 44 * s)}px 'Noto Serif SC', serif`;
  ctx.fillText(theme.headerTitle, W / 2, headerTop + headerH * 0.78);
  ctx.restore();

  // —— 人像 + 姓名 ——
  const portraitR = Math.min(100 * s, heroH * 0.34);
  const portraitCX = W / 2;
  const portraitCY = heroTop + portraitR + 4 * s;

  // 两侧改用结果页同款细竹签（去掉原先粗签牌）
  ctx.globalAlpha = (0.55 + 0.45 * anim.dice) * anim.posterAlpha;
  const stickH = Math.min(slipH * 0.85, 220 * s);
  const stickW = 10 * s;
  drawLotStickDecor(ctx, pad + 28 * s, heroTop + 16 * s, stickW, stickH, -4, "上");
  drawLotStickDecor(ctx, W - pad - 38 * s, heroTop + 28 * s, stickW, stickH, 5, "签");
  ctx.globalAlpha = anim.posterAlpha;

  // 先加载头像，再 clip 绘制，避免 await 期间丢失裁剪状态
  const charImg = payload.imageUrl ? await loadImage(payload.imageUrl) : null;

  ctx.beginPath();
  ctx.arc(portraitCX, portraitCY, portraitR + 3 * s, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(212, 175, 55, 0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(portraitCX, portraitCY, portraitR + 1 * s, 0, Math.PI * 2);
  ctx.strokeStyle = theme.gold;
  ctx.lineWidth = 2.5 * s;
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.arc(portraitCX, portraitCY, portraitR, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#1A1410";
  ctx.fillRect(portraitCX - portraitR, portraitCY - portraitR, portraitR * 2, portraitR * 2);
  if (charImg) {
    drawImageCover(
      ctx,
      charImg,
      portraitCX - portraitR,
      portraitCY - portraitR,
      portraitR * 2,
      portraitR * 2
    );
  } else {
    // 兜底：显示姓名首字，避免空白圆
    ctx.fillStyle = theme.goldBright;
    ctx.font = `700 ${Math.max(28, portraitR * 0.7)}px 'Noto Serif SC', serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(payload.name.slice(0, 1), portraitCX, portraitCY);
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();

  // 姓名与「抽中」行距拉开，并与下方签牌留白
  const nameY = portraitCY + portraitR + 26 * s;
  ctx.textAlign = "center";
  ctx.fillStyle = theme.goldBright;
  ctx.font = `700 ${Math.max(24, 34 * s)}px 'Noto Serif SC', serif`;
  ctx.fillText(payload.name, W / 2, nameY);
  ctx.fillStyle = theme.muted;
  ctx.font = `${Math.max(13, 16 * s)}px 'Noto Serif SC', serif`;
  const personaY = Math.min(nameY + 48 * s, slipTop - 18 * s);
  ctx.fillText(`抽中 · ${payload.persona}  ·  ${payload.percentage}%`, W / 2, personaY);

  // —— 签牌（判词）——
  const slipX = 88 * s;
  const slipW = W - 176 * s;
  const slipScale = Math.max(0.08, anim.slip);
  const slipAlpha = clamp01(anim.slip);

  ctx.save();
  ctx.translate(W / 2, slipTop);
  ctx.scale(1, slipScale);
  ctx.translate(-W / 2, -slipTop);
  ctx.globalAlpha = slipAlpha * anim.posterAlpha;

  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  roundRectPath(ctx, slipX + 6 * s, slipTop + 8 * s, slipW, slipH, 16 * s);
  ctx.fill();
  roundRectPath(ctx, slipX, slipTop, slipW, slipH, 16 * s);
  const slipGrad = ctx.createLinearGradient(slipX, slipTop, slipX, slipTop + slipH);
  slipGrad.addColorStop(0, "rgba(42, 32, 20, 0.97)");
  slipGrad.addColorStop(1, "rgba(22, 16, 10, 0.98)");
  ctx.fillStyle = slipGrad;
  ctx.fill();

  ctx.save();
  roundRectPath(ctx, slipX, slipTop, slipW, slipH, 16 * s);
  ctx.clip();
  for (let i = 0; i < 16; i++) {
    const lx = slipX + 24 * s + i * ((slipW - 48 * s) / 15);
    ctx.beginPath();
    ctx.moveTo(lx, slipTop + 12 * s);
    ctx.lineTo(lx, slipTop + slipH - 12 * s);
    ctx.strokeStyle = i % 3 === 0 ? "rgba(212, 175, 55, 0.07)" : "rgba(200, 180, 150, 0.035)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle = theme.gold;
  ctx.lineWidth = 1.8 * s;
  roundRectPath(ctx, slipX, slipTop, slipW, slipH, 16 * s);
  ctx.stroke();

  const ribbonW = 160 * s;
  const ribbonH = 32 * s;
  ctx.fillStyle = theme.isAi ? theme.goldDim : "#C13B1B";
  roundRectPath(ctx, (W - ribbonW) / 2, slipTop - 2 * s, ribbonW, ribbonH, 4 * s);
  ctx.fill();
  ctx.fillStyle = theme.isAi ? theme.goldBright : "#F3E6B8";
  ctx.font = `600 ${Math.max(13, 17 * s)}px 'Noto Serif SC', serif`;
  ctx.fillText(theme.isAi ? "最 优 解" : "上 上 签", W / 2, slipTop + 20 * s);

  ctx.fillStyle = theme.goldDim;
  ctx.font = `600 ${Math.max(14, 18 * s)}px 'Noto Serif SC', serif`;
  ctx.fillText(theme.slipLabel, W / 2, slipTop + slipH * 0.16);

  const lines = verdictLinesOf(payload.verdict);
  const flat = lines.join("");
  const litCount = Math.floor(flat.length * clamp01(anim.verdict));
  const lineGap = Math.min(56 * s, (slipH * 0.55) / Math.max(lines.length, 1));
  const fontSize = Math.min(36 * s, lineGap * 0.62);
  ctx.font = `${fontSize}px KaiTi, 'STKaiti', '华文楷体', 'Noto Serif SC', serif`;
  const textBlockH = lines.length * lineGap;
  const startY = slipTop + slipH * 0.28 + Math.max(0, (slipH * 0.52 - textBlockH) / 2);
  let charCursor = 0;
  lines.forEach((line, i) => {
    const chars = Array.from(line);
    const spacing = 7 * s;
    let totalW = 0;
    chars.forEach((ch) => {
      totalW += ctx.measureText(ch).width + spacing;
    });
    totalW -= spacing;
    let cx = (W - totalW) / 2;
    const ly = startY + i * lineGap;
    chars.forEach((ch) => {
      const lit = charCursor < litCount;
      ctx.fillStyle = lit ? theme.goldBright : "rgba(107, 95, 82, 0.35)";
      ctx.fillText(ch, cx + ctx.measureText(ch).width / 2, ly);
      cx += ctx.measureText(ch).width + spacing;
      charCursor += 1;
    });
  });

  const sealProgress = clamp01(anim.seal);
  const sealSize = Math.min(76 * s, slipH * 0.18);
  const sealScale = 1.55 - 0.55 * sealProgress;
  drawSealStamp(
    ctx,
    slipX + slipW - sealSize * 0.9,
    slipTop + slipH - sealSize * 0.9,
    sealSize * sealScale,
    theme.sealLines,
    -12,
    sealProgress
  );
  drawDiceFace(
    ctx,
    slipX + 22 * s,
    slipTop + slipH - 56 * s,
    Math.min(34 * s, slipH * 0.1),
    dicePip,
    -8
  );
  ctx.restore();

  // —— 签解 ——
  const adviceAlpha = clamp01(anim.rest);
  const tipCount = opts.showQr ? 3 : 2;
  if (adviceAlpha > 0.02 && adviceH > 50 * s) {
    ctx.save();
    ctx.globalAlpha = adviceAlpha * anim.posterAlpha;
    const adviceX = 96 * s;
    const adviceW = W - 192 * s;
    roundRectPath(ctx, adviceX, adviceTop, adviceW, adviceH, 12 * s);
    ctx.fillStyle = "rgba(200, 180, 150, 0.07)";
    ctx.fill();
    ctx.strokeStyle = "rgba(184, 151, 62, 0.55)";
    ctx.lineWidth = 1.2 * s;
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = theme.gold;
    ctx.font = `600 ${Math.max(14, 20 * s)}px 'Noto Serif SC', serif`;
    ctx.fillText(theme.adviceTitle, adviceX + 22 * s, adviceTop + adviceH * 0.14);

    const tipStart = adviceTop + adviceH * 0.24;
    const tipAreaH = adviceH * 0.48;
    const tipRowH = tipAreaH / tipCount;
    ctx.font = `${Math.max(13, 18 * s)}px 'Noto Serif SC', serif`;
    payload.survivalGuide.slice(0, tipCount).forEach((guide, idx) => {
      const ay = tipStart + idx * tipRowH + tipRowH * 0.45;
      drawDiceFace(ctx, adviceX + 20 * s, ay - 12 * s, Math.min(20 * s, tipRowH * 0.45), idx + 1, 0);
      const wrapped = wrapText(ctx, guide, adviceW - 70 * s, tipRowH > 40 * s ? 2 : 1);
      ctx.fillStyle = "#C8BBA5";
      wrapped.forEach((ln, li) => {
        ctx.fillText(ln, adviceX + 50 * s, ay + li * 22 * s - (wrapped.length > 1 ? 10 * s : 0));
      });
    });

    const metaY = adviceTop + adviceH * 0.78;
    ctx.fillStyle = "#B8973E";
    ctx.font = `600 ${Math.max(12, 16 * s)}px 'Noto Serif SC', serif`;
    ctx.fillText("玄学建议", adviceX + 22 * s, metaY);
    ctx.fillStyle = "#A89880";
    ctx.font = `${Math.max(12, 15 * s)}px 'Noto Serif SC', serif`;
    wrapText(ctx, payload.metaphysics, adviceW - 44 * s, 2).forEach((ln, i) => {
      ctx.fillText(ln, adviceX + 22 * s, metaY + 24 * s + i * 20 * s);
    });
    ctx.restore();
  }

  // —— 二维码区 ——
  const qrSize = opts.showQr ? Math.min(112 * s, footerH * 0.55) : 0;
  if (opts.showQr && qrSize > 0) {
    ctx.save();
    ctx.globalAlpha = Math.max(adviceAlpha, anim.seal) * anim.posterAlpha;
    ctx.strokeStyle = "rgba(58, 47, 37, 0.95)";
    ctx.beginPath();
    ctx.moveTo(160 * s, footerTop);
    ctx.lineTo(W - 160 * s, footerTop);
    ctx.stroke();

    const sideDice = Math.min(40 * s, footerH * 0.35);
    drawDiceFace(ctx, pad + 36 * s, footerTop + (footerH - sideDice) / 2, sideDice, 5, -16);
    drawLotStickDecor(
      ctx,
      W - pad - 48 * s,
      footerTop + 10 * s,
      9 * s,
      Math.min(footerH - 16 * s, 100 * s),
      6,
      "测"
    );

    const shareUrl = "https://oa7gu7fu8id9.meoo.info";
    const qrX = (W - qrSize) / 2;
    const qrY = footerTop + footerH * 0.08;
    try {
      const qrDataUrl = await QRCode.toDataURL(shareUrl, {
        width: Math.round(qrSize * 2),
        margin: 1,
        color: { dark: "#0D0A06", light: theme.isAi ? "#E9D5FF" : "#E8D48B" },
        errorCorrectionLevel: "M",
      });
      const qrImg = await loadImage(qrDataUrl);
      if (qrImg) {
        roundRectPath(ctx, qrX - 6 * s, qrY - 6 * s, qrSize + 12 * s, qrSize + 12 * s, 6 * s);
        ctx.fillStyle = theme.isAi ? "#E9D5FF" : "#E8D48B";
        ctx.fill();
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      }
    } catch {
      /* ignore */
    }
    ctx.textAlign = "center";
    ctx.fillStyle = theme.gold;
    ctx.font = `${Math.max(12, 17 * s)}px 'Noto Serif SC', serif`;
    ctx.fillText(theme.footerHint, W / 2, qrY + qrSize + footerH * 0.22);
    ctx.fillStyle = theme.isAi ? "#6B7280" : "#5C4A2E";
    ctx.font = `${Math.max(10, 12 * s)}px 'Noto Serif SC', serif`;
    ctx.fillText(
      theme.isAi ? "鹅城往事 · AI人格鉴定  ·  GANO PRODUCTION" : "鹅城往事 · 鹅城人格鉴定  ·  GANO PRODUCTION",
      W / 2,
      qrY + qrSize + footerH * 0.38
    );
    ctx.restore();
  }

  if (opts.disclaimer) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#4A3F35";
    ctx.font = `${Math.max(9, 11 * s)}px 'Noto Serif SC', serif`;
    const dLines = wrapText(ctx, ENTERTAINMENT_DISCLAIMER, W - pad * 2 - 16 * s, 2);
    let dy = H - pad * 0.45 - (dLines.length - 1) * 14 * s;
    dLines.forEach((ln) => {
      ctx.fillText(ln, W / 2, dy);
      dy += 14 * s;
    });
  }

  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.textAlign = "center";
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** 朋友圈静图 PNG：直接截取预览 DOM，保证与预览一致 */
export async function capturePosterPngDataUrl(node: HTMLElement): Promise<string> {
  const { toPng } = await import("html-to-image");

  const imgs = Array.from(node.querySelectorAll("img"));
  // 损坏图会导致 html-to-image 抛 Event，导出前先隐藏
  const broken: HTMLImageElement[] = [];
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          const finish = () => {
            if (!img.naturalWidth) {
              broken.push(img);
              img.style.visibility = "hidden";
            }
            resolve();
          };
          if (img.complete) finish();
          else {
            img.onload = () => finish();
            img.onerror = () => finish();
          }
        })
    )
  );
  try {
    await document.fonts?.ready;
  } catch {
    /* ignore */
  }

  const width = node.offsetWidth || 360;
  const pixelRatio = Math.min(3, POSTER_W / width);

  node.classList.add("is-exporting");
  try {
    return await toPng(node, {
      cacheBust: true,
      pixelRatio,
      backgroundColor: "#120e09",
      skipFonts: true,
      style: {
        // 避免 html-to-image 访问跨域样式表导致 SecurityError
        transform: "none",
      },
      filter: (el) => {
        if (el instanceof HTMLImageElement && !el.naturalWidth) return false;
        // 跳过 link 和 style 标签，避免 cssRules 访问错误
        if (el instanceof HTMLLinkElement || el instanceof HTMLStyleElement) {
          return false;
        }
        return true;
      },
    });
  } catch (err) {
    console.error("海报截图失败:", err);
    // 降级方案：重试一次，使用更保守的配置
    try {
      return await toPng(node, {
        cacheBust: true,
        pixelRatio,
        backgroundColor: "#120e09",
        skipFonts: true,
        filter: (el) => {
          if (el instanceof HTMLImageElement && !el.naturalWidth) return false;
          if (el instanceof HTMLLinkElement || el instanceof HTMLStyleElement) {
            return false;
          }
          return true;
        },
      });
    } catch (retryErr) {
      console.error("海报截图重试也失败:", retryErr);
      throw retryErr;
    }
  } finally {
    for (const img of broken) img.style.visibility = "";
    node.classList.remove("is-exporting");
  }
}

export async function exportStaticPosterFromDom(
  node: HTMLElement,
  name: string
): Promise<void> {
  const dataUrl = await capturePosterPngDataUrl(node);
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  downloadBlob(blob, `鹅城签-${name}.png`);
}

/** @deprecated 保留给兼容；朋友圈静图请用 exportStaticPosterFromDom */
export async function exportStaticPosterPng(
  canvas: HTMLCanvasElement,
  payload: PosterPayload
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unsupported");
  canvas.width = POSTER_W;
  canvas.height = POSTER_H;
  await drawCeremonyPoster(ctx, payload, FULL_CEREMONY_ANIM, {
    width: POSTER_W,
    height: POSTER_H,
    showQr: true,
    disclaimer: true,
  });
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("png failed");
  downloadBlob(blob, `鹅城签-${payload.name}.png`);
}

/** 群聊动态 GIF（播放一次后定格） */
export async function exportCeremonyGif(
  payload: PosterPayload,
  onProgress?: (ratio: number) => void
): Promise<void> {
  const canvas = document.createElement("canvas");
  canvas.width = GIF_W;
  canvas.height = GIF_H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas unsupported");

  const charCount = verdictCharCount(payload.verdict);
  const durationMs = gifDurationMs(charCount);
  const frameCount = Math.max(2, Math.round((durationMs / 1000) * GIF_FPS));

  try {
    // 预热字体与头像/背景，确保逐帧可绘制
    await preloadPosterAssets(payload);
    await drawCeremonyPoster(ctx, payload, FULL_CEREMONY_ANIM, {
      width: GIF_W,
      height: GIF_H,
      showQr: true,
      disclaimer: true,
    });

    const gif = GIFEncoder();
    const totalFrames = frameCount + GIF_FREEZE_FRAMES;
    for (let i = 0; i < totalFrames; i++) {
      const isFreezeFrame = i >= frameCount;

      if (!isFreezeFrame) {
        const timeMs = (i / (frameCount - 1)) * durationMs;
        const anim = animAt(timeMs, charCount);
        await drawCeremonyPoster(ctx, payload, anim, {
          width: GIF_W,
          height: GIF_H,
          showQr: true,
          disclaimer: true,
        });
      }
      // 定格帧保持最后一帧画面，无需重绘

      const imageData = ctx.getImageData(0, 0, GIF_W, GIF_H);
      const palette = quantize(imageData.data, 64);
      const index = applyPalette(imageData.data, palette);
      gif.writeFrame(index, GIF_W, GIF_H, {
        palette,
        delay: GIF_DELAY_MS,
        repeat: i === 0 ? 1 : undefined, // repeat=1 表示播放一次后停止
      });
      onProgress?.((i + 1) / totalFrames);
      await new Promise((r) => setTimeout(r, 0));
    }
    gif.finish();
    const bytes = gif.bytes();
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const prefix = payload.variant === "ai" ? "AI签动态" : "鹅城签动态";
    downloadBlob(new Blob([copy], { type: "image/gif" }), `${prefix}-${payload.name}.gif`);
  } catch (err) {
    console.error("GIF 生成失败:", err);
    throw err;
  }
}
