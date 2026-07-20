import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  GIF_W,
  GIF_H,
  animAt,
  drawCeremonyPoster,
  gifDurationMs,
  preloadPosterAssets,
  verdictCharCount,
  type PosterPayload,
} from "@/lib/posterCeremony";
import { CHARACTER_IMAGES, CHARACTER_INFO, POSTER_BG_AI, pickPosterBg } from "@/types";

export const Route = createFileRoute("/gif-preview")({
  component: GifPreviewPage,
});

const SAMPLE_CLASSIC: PosterPayload = {
  name: CHARACTER_INFO.zhang.name,
  persona: "理想主义者",
  percentage: 86,
  verdict: CHARACTER_INFO.zhang.verdict,
  survivalGuide: CHARACTER_INFO.zhang.survivalGuide,
  metaphysics: CHARACTER_INFO.zhang.metaphysics,
  imageUrl: CHARACTER_IMAGES.zhang,
  bgUrl: pickPosterBg(false),
  variant: "classic",
};

const SAMPLE_AI: PosterPayload = {
  name: CHARACTER_INFO.ai.name,
  persona: "逻辑观察者",
  percentage: 91,
  verdict: CHARACTER_INFO.ai.verdict,
  survivalGuide: CHARACTER_INFO.ai.survivalGuide,
  metaphysics: CHARACTER_INFO.ai.metaphysics,
  imageUrl: CHARACTER_IMAGES.ai,
  bgUrl: POSTER_BG_AI,
  variant: "ai",
};

function phaseLabel(timeMs: number, charCount: number): string {
  const n = Math.max(1, charCount);
  const act1RevealEnd = 2100 + n * 70;
  const act1Done = act1RevealEnd + 700;
  const transitionStart = act1Done + 350;
  const transitionEnd = transitionStart + 500;
  const act2Start = transitionStart;

  if (timeMs < 900) return "Act1 · 摇签筒";
  if (timeMs < 1500) return "Act1 · 一签飞出";
  if (timeMs < 2100) return "Act1 · 签牌展开";
  if (timeMs < act1RevealEnd) return "Act1 · 判词点亮";
  if (timeMs < transitionStart) return "Act1 · 落印";
  if (timeMs < transitionEnd) return "过渡 · 交叉淡入海报";
  const a2 = timeMs - act2Start;
  if (a2 < 900) return "Act2 · 骰子落下";
  if (a2 < 1600) return "Act2 · 签牌展开";
  if (a2 < 1600 + n * 55) return "Act2 · 判词点亮";
  if (a2 < 1600 + n * 55 + 400 + 450) return "Act2 · 落印";
  return "Act2 · 签解 / 页脚";
}

const KEY_FRAMES = [
  { t: 400, name: "摇签筒" },
  { t: 1200, name: "一签飞出" },
  { t: 1800, name: "签牌展开" },
  { t: 2800, name: "判词点亮" },
  { t: 4200, name: "落印" },
  { t: 5200, name: "过渡到海报" },
  { t: 6200, name: "骰子落下" },
  { t: 7500, name: "海报签牌" },
  { t: 9000, name: "海报终态" },
];

function GifPreviewPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"classic" | "ai">("classic");
  const [playing, setPlaying] = useState(true);
  const [timeMs, setTimeMs] = useState(0);
  const [label, setLabel] = useState("准备中…");
  const sample = mode === "ai" ? SAMPLE_AI : SAMPLE_CLASSIC;
  const charCount = verdictCharCount(sample.verdict);
  const duration = gifDurationMs(charCount);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const pausedAtRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cancelled = false;
    startRef.current = 0;
    pausedAtRef.current = 0;

    const render = async (t: number) => {
      const anim = animAt(t, charCount);
      await drawCeremonyPoster(ctx, sample, anim, {
        width: GIF_W,
        height: GIF_H,
        showQr: true,
        disclaimer: true,
      });
      if (!cancelled) {
        setTimeMs(t);
        setLabel(phaseLabel(t, charCount));
      }
    };

    const start = async () => {
      await preloadPosterAssets(sample);
      if (cancelled) return;

      const tick = (now: number) => {
        if (!startRef.current) startRef.current = now - pausedAtRef.current;
        const t = (now - startRef.current) % duration;
        void render(t);
        if (playing && !cancelled) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };

      if (playing) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        void render(pausedAtRef.current);
      }
    };

    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      if (playing && startRef.current) {
        pausedAtRef.current = (performance.now() - startRef.current) % duration;
      }
    };
  }, [playing, charCount, duration, sample, mode]);

  // 关键帧条：一次画出各阶段静态图
  useEffect(() => {
    const root = stripRef.current;
    if (!root) return;
    let cancelled = false;

    const run = async () => {
      await preloadPosterAssets(sample);
      if (cancelled) return;
      const canvases = Array.from(root.querySelectorAll("canvas[data-frame]"));
      for (const el of canvases) {
        if (cancelled) return;
        const canvas = el as HTMLCanvasElement;
        const t = Number(canvas.dataset.frame);
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        const anim = animAt(Math.min(t, duration - 1), charCount);
        await drawCeremonyPoster(ctx, sample, anim, {
          width: GIF_W,
          height: GIF_H,
          showQr: true,
          disclaimer: true,
        });
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [charCount, duration, sample, mode]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(180deg, #1a1410, #0d0a06)",
        color: "#E8D48B",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1.25rem 1rem 2rem",
        fontFamily: "'Noto Serif SC', serif",
      }}
    >
      <p style={{ margin: 0, letterSpacing: "0.35em", fontSize: 12, color: "#8A7B6B" }}>
        GIF 两幕预览
      </p>
      <h1 style={{ margin: "0.4rem 0 0.25rem", fontSize: 22, letterSpacing: "0.2em" }}>
        鹅城签 · 动态效果
      </h1>
      <p style={{ margin: "0 0 0.75rem", fontSize: 13, color: "#C8BBA5" }}>{label}</p>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.85rem" }}>
        <button
          type="button"
          onClick={() => setMode("classic")}
          style={{
            padding: "0.35rem 0.85rem",
            border: mode === "classic" ? "1px solid #D4AF37" : "1px solid #5C4A2E",
            background: mode === "classic" ? "rgba(212,175,55,0.18)" : "transparent",
            color: "#E8D48B",
            letterSpacing: "0.12em",
            cursor: "pointer",
          }}
        >
          普通角色
        </button>
        <button
          type="button"
          onClick={() => setMode("ai")}
          style={{
            padding: "0.35rem 0.85rem",
            border: mode === "ai" ? "1px solid #A78BFA" : "1px solid #5C4A2E",
            background: mode === "ai" ? "rgba(167,139,250,0.2)" : "transparent",
            color: mode === "ai" ? "#E9D5FF" : "#C8BBA5",
            letterSpacing: "0.12em",
            cursor: "pointer",
          }}
        >
          AI 专属
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={GIF_W}
        height={GIF_H}
        style={{
          width: "min(100%, 320px)",
          height: "auto",
          border: "1px solid #D4AF37",
          borderRadius: 8,
          boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
          background: "#0D0A06",
        }}
      />

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          style={{
            padding: "0.55rem 1.2rem",
            border: "1px solid #D4AF37",
            background: playing ? "rgba(193,59,27,0.25)" : "rgba(212,175,55,0.15)",
            color: "#E8D48B",
            letterSpacing: "0.18em",
            cursor: "pointer",
          }}
        >
          {playing ? "暂停" : "播放"}
        </button>
        <button
          type="button"
          onClick={() => {
            pausedAtRef.current = 0;
            startRef.current = 0;
            setPlaying(true);
          }}
          style={{
            padding: "0.55rem 1.2rem",
            border: "1px solid #8A7B6B",
            background: "transparent",
            color: "#C8BBA5",
            letterSpacing: "0.18em",
            cursor: "pointer",
          }}
        >
          重播
        </button>
      </div>

      <p style={{ marginTop: "0.85rem", fontSize: 12, color: "#6B5F52" }}>
        {(timeMs / 1000).toFixed(1)}s / {(duration / 1000).toFixed(1)}s · 540×960
      </p>
      <p style={{ marginTop: "0.35rem", fontSize: 11, color: "#5C4A2E", textAlign: "center", maxWidth: 340 }}>
        Act1 对齐结果页鹅城签 → 交叉淡入 → Act2 对齐海报预览
      </p>

      <h2 style={{ margin: "1.75rem 0 0.75rem", fontSize: 14, letterSpacing: "0.28em", color: "#B8973E" }}>
        关键阶段截帧
      </h2>
      <div
        ref={stripRef}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          justifyContent: "center",
          maxWidth: 980,
        }}
      >
        {KEY_FRAMES.map((f) => (
          <div key={f.t} style={{ width: 110, textAlign: "center" }}>
            <canvas
              data-frame={f.t}
              width={GIF_W}
              height={GIF_H}
              style={{
                width: 110,
                height: "auto",
                border: "1px solid rgba(212,175,55,0.45)",
                borderRadius: 4,
                background: "#0D0A06",
                display: "block",
              }}
            />
            <p style={{ margin: "0.35rem 0 0", fontSize: 11, color: "#8A7B6B" }}>{f.name}</p>
            <p style={{ margin: 0, fontSize: 10, color: "#5C4A2E" }}>{(f.t / 1000).toFixed(1)}s</p>
          </div>
        ))}
      </div>
    </div>
  );
}
