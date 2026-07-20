import { useState, useRef, useEffect } from "react";
import type { CSSProperties } from "react";
import type { QuizResult, CharacterType } from "@/types";
import {
  CHARACTER_INFO,
  CHARACTER_IMAGES,
  CHARACTER_VIDEOS,
  CHARACTER_RELATIONSHIPS,
  CHARACTER_SHORT_LABELS,
  pickPosterBg,
  getShareUrl,
} from "@/types";
import { soundManager } from "@/lib/sound";
import PosterPreview from "@/components/PosterPreview";
import {
  ENTERTAINMENT_DISCLAIMER,
  exportCeremonyGif,
} from "@/lib/posterCeremony";

interface ResultPageProps {
  result: QuizResult;
  onRestart: () => void;
}

const RAIL_COLORS: Partial<Record<CharacterType, string>> = {
  zhang: "#8B3A3A",
  huang: "#B8973E",
};

const BAR_TONES = ["gold", "copper", "gray"] as const;

/** 朋友圈宣发竖版：1080×1920（9:16） */
const ID_W = 1080;
const ID_H = 1920;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    if (src.startsWith("http")) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** 按目标框裁切居中绘制，不拉伸变形 */
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

/** 圆角矩形路径 */
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

/** 平面骰子（点数 1–6） */
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
  const grad = ctx.createLinearGradient(-half, -half, half, half);
  grad.addColorStop(0, "#F3E6B8");
  grad.addColorStop(0.45, "#E8D48B");
  grad.addColorStop(1, "#B8973E");
  roundRectPath(ctx, -half, -half, size, size, size * 0.18);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "rgba(90, 60, 20, 0.55)";
  ctx.lineWidth = Math.max(2, size * 0.04);
  ctx.stroke();

  // 内边高光
  roundRectPath(ctx, -half + size * 0.08, -half + size * 0.08, size * 0.84, size * 0.84, size * 0.12);
  ctx.strokeStyle = "rgba(255, 248, 220, 0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();

  const pipR = size * 0.09;
  const inset = size * 0.28;
  const positions: Record<number, Array<[number, number]>> = {
    1: [[0, 0]],
    2: [[-inset, -inset], [inset, inset]],
    3: [[-inset, -inset], [0, 0], [inset, inset]],
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
  const dots = positions[Math.min(6, Math.max(1, pips))] ?? positions[1];
  dots.forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(dx, dy, pipR, 0, Math.PI * 2);
    ctx.fillStyle = "#3A1F12";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(dx - pipR * 0.25, dy - pipR * 0.25, pipR * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.fill();
  });

  ctx.restore();
}

/** 竖向签枝 */
function drawFortuneStick(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  tiltDeg = 0
) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((tiltDeg * Math.PI) / 180);

  const hw = w / 2;
  const hh = h / 2;
  const grad = ctx.createLinearGradient(-hw, 0, hw, 0);
  grad.addColorStop(0, "#6B4E22");
  grad.addColorStop(0.35, "#E8D48B");
  grad.addColorStop(0.65, "#C8B06A");
  grad.addColorStop(1, "#5C3F18");

  roundRectPath(ctx, -hw, -hh, w, h, w * 0.35);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "rgba(232, 212, 139, 0.55)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 顶端红绳结
  ctx.beginPath();
  ctx.arc(0, -hh + w * 0.55, w * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = "#C13B1B";
  ctx.fill();

  ctx.fillStyle = "#5C1A12";
  ctx.font = `600 ${Math.max(14, w * 0.55)}px 'Noto Serif SC', serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label.slice(0, 1), 0, 8);
  ctx.restore();
  ctx.textBaseline = "alphabetic";
}

/** 装饰角标 */
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
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

/** 朱红方印 */
function drawSealStamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  lines: string[],
  rotationDeg = -14
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotationDeg * Math.PI) / 180);
  const half = size / 2;
  ctx.strokeStyle = "rgba(193, 59, 27, 0.9)";
  ctx.lineWidth = 3.5;
  ctx.strokeRect(-half, -half, size, size);
  ctx.strokeRect(-half + 6, -half + 6, size - 12, size - 12);
  ctx.fillStyle = "rgba(193, 59, 27, 0.12)";
  ctx.fillRect(-half + 6, -half + 6, size - 12, size - 12);
  ctx.fillStyle = "rgba(193, 59, 27, 0.92)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fontSize = lines.length > 1 ? size * 0.28 : size * 0.36;
  ctx.font = `700 ${fontSize}px 'Noto Serif SC', serif`;
  const step = size * 0.32;
  const start = -((lines.length - 1) * step) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, 0, start + i * step);
  });
  ctx.restore();
  ctx.textBaseline = "alphabetic";
}

function useCountUp(target: number, enabled: boolean, duration = 600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!enabled) {
      setValue(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, enabled, duration]);
  return value;
}

function PercentRow({
  name,
  label,
  percentage,
  tone,
  visible,
  railColor,
}: {
  name: string;
  label: string;
  percentage: number;
  tone: (typeof BAR_TONES)[number];
  visible: boolean;
  railColor: string;
}) {
  const display = useCountUp(percentage, visible);
  return (
    <div
      className={`result-bar-card ${visible ? "slide-in" : "is-hidden"}`}
      style={{ ["--rail-color"]: railColor } as CSSProperties}
    >
      <div className="result-bar-head">
        <span>
          {label} · {name}
        </span>
        <span className="pct-num">{display}%</span>
      </div>
      <div className="pct-track">
        <div
          className={`pct-fill ${tone}`}
          style={{ width: visible ? `${percentage}%` : "0%" }}
        />
      </div>
    </div>
  );
}

export default function ResultPage({ result, onRestart }: ResultPageProps) {
  const topThree = result.topThree;
  const mainCharacter = topThree[0];
  const secondCharacter = topThree[1];
  const thirdCharacter = topThree[2];
  const mainInfo = CHARACTER_INFO[mainCharacter.character];
  const secondInfo = CHARACTER_INFO[secondCharacter.character];
  const thirdInfo = CHARACTER_INFO[thirdCharacter.character];
  const mainImageUrl = CHARACTER_IMAGES[mainCharacter.character];
  const mainVideoUrl = CHARACTER_VIDEOS[mainCharacter.character];
  const relationships = CHARACTER_RELATIONSHIPS[mainCharacter.character];

  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);
  const [showDarkSide, setShowDarkSide] = useState(false);
  const [fracturePhase, setFracturePhase] = useState<"idle" | "slash" | "split" | "swap" | "close">("idle");
  const [fractureFrom, setFractureFrom] = useState<"light" | "dark">("light");
  const [fractureTo, setFractureTo] = useState<"light" | "dark">("dark");
  const [showShutter, setShowShutter] = useState(false);
  const [showMainCard, setShowMainCard] = useState(false);
  const [showSecondCard, setShowSecondCard] = useState(false);
  const [showThirdCard, setShowThirdCard] = useState(false);
  const [expandedPersona, setExpandedPersona] = useState<"second" | "third" | null>(null);
  const [lotInView, setLotInView] = useState(false);
  const [lotPhase, setLotPhase] = useState<"ready" | "shaking" | "ejecting" | "unfurl" | "reveal" | "done">("ready");
  const [showPosterPreview, setShowPosterPreview] = useState(false);
  const [posterSaving, setPosterSaving] = useState(false);
  const [posterGifSaving, setPosterGifSaving] = useState(false);
  const [posterGifProgress, setPosterGifProgress] = useState(0);
  const verdictRef = useRef<HTMLDivElement>(null);
  const lotTimersRef = useRef<number[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  /** 同一结果会话内 GIF / 静图共用同一背景 */
  const posterBgRef = useRef<string | null>(null);
  const isAiResult = mainCharacter.character === "ai";
  if (!posterBgRef.current) {
    posterBgRef.current = pickPosterBg(isAiResult);
  }

  useEffect(() => {
    soundManager.playReveal();
    const timer1 = setTimeout(() => setShowMainCard(true), 200);
    const timer2 = setTimeout(() => setShowSecondCard(true), 400);
    const timer3 = setTimeout(() => setShowThirdCard(true), 600);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  // 求签区域进入视口
  useEffect(() => {
    if (!verdictRef.current || lotInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setLotInView(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(verdictRef.current);
    return () => observer.disconnect();
  }, [lotInView]);

  useEffect(() => {
    return () => {
      lotTimersRef.current.forEach((id) => window.clearTimeout(id));
      lotTimersRef.current = [];
    };
  }, []);

  const startLotDraw = () => {
    if (lotPhase !== "ready") return;
    soundManager.playLotShake();
    setLotPhase("shaking");

    const charCount = mainInfo.verdict.replace(/[。，、；：！？]/g, "").length;
    lotTimersRef.current.forEach((id) => window.clearTimeout(id));
    lotTimersRef.current = [
      window.setTimeout(() => setLotPhase("ejecting"), 900),
      window.setTimeout(() => {
        soundManager.playLotReveal();
        setLotPhase("unfurl");
      }, 1500),
      window.setTimeout(() => setLotPhase("reveal"), 2100),
      window.setTimeout(() => {
        soundManager.playSuccess();
        setLotPhase("done");
      }, 2100 + charCount * 70 + 700),
    ];
  };

  const handleImageClick = () => {
    if (!mainVideoUrl || isPlayingVideo) return;
    soundManager.playVideoStart();
    setIsPlayingVideo(true);
  };

  useEffect(() => {
    if (!isPlayingVideo || !videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => setIsPlayingVideo(false));
  }, [isPlayingVideo]);

  const handleVideoEnded = () => setIsPlayingVideo(false);

  const fractureTimersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      fractureTimersRef.current.forEach((id) => window.clearTimeout(id));
      fractureTimersRef.current = [];
    };
  }, []);

  const handleFractureToggle = () => {
    if (fracturePhase !== "idle") return;
    soundManager.playFlip();

    const from: "light" | "dark" = showDarkSide ? "dark" : "light";
    const to: "light" | "dark" = showDarkSide ? "light" : "dark";
    setFractureFrom(from);
    setFractureTo(to);
    setFracturePhase("slash");

    fractureTimersRef.current.forEach((id) => window.clearTimeout(id));
    fractureTimersRef.current = [
      window.setTimeout(() => setFracturePhase("split"), 300),
      window.setTimeout(() => {
        setFracturePhase("swap");
        setShowDarkSide(to === "dark");
      }, 600),
      window.setTimeout(() => setFracturePhase("close"), 900),
      window.setTimeout(() => setFracturePhase("idle"), 1200),
    ];
  };

  const sideCopy = (side: "light" | "dark") =>
    side === "dark"
      ? { label: "你的另一面", text: mainInfo.twoSidesDark }
      : { label: "光明面", text: mainInfo.twoSidesLight };

  const outgoingCopy = sideCopy(fracturePhase === "idle" ? (showDarkSide ? "dark" : "light") : fractureFrom);
  const incomingCopy = sideCopy(fracturePhase === "idle" ? (showDarkSide ? "dark" : "light") : fractureTo);

  const buildPosterPayload = () => ({
    name: mainInfo.name,
    persona: CHARACTER_SHORT_LABELS[mainCharacter.character] ?? "",
    percentage: mainCharacter.percentage,
    verdict: mainInfo.verdict,
    survivalGuide: mainInfo.survivalGuide,
    metaphysics: mainInfo.metaphysics,
    imageUrl: mainImageUrl,
    bgUrl: posterBgRef.current ?? pickPosterBg(isAiResult),
    variant: (isAiResult ? "ai" : "classic") as "ai" | "classic",
  });

  const generatePoster = async (exportFn: () => Promise<void>) => {
    setPosterSaving(true);
    setShowShutter(true);
    setTimeout(() => setShowShutter(false), 200);
    try {
      await exportFn();
    } catch (err) {
      console.error("海报生成失败:", err);
      alert("海报生成失败，请重试");
    } finally {
      setPosterSaving(false);
    }
  };

  const generateGifPoster = async () => {
    setPosterGifSaving(true);
    setPosterGifProgress(0);
    try {
      await exportCeremonyGif(buildPosterPayload(), (ratio) => setPosterGifProgress(ratio));
    } catch (err) {
      console.error("动态海报生成失败:", err);
      alert("动态海报生成失败，请重试");
    } finally {
      setPosterGifSaving(false);
      setPosterGifProgress(0);
    }
  };


  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("已复制到剪贴板！");
    } catch {
      alert("复制失败，请手动复制");
    }
  };

  const shareToWechat = async () => {
    soundManager.playShare();
    const shareData = {
      title: `我是鹅城【${mainInfo.name}】`,
      text: getWechatText(),
      url: getShareUrl(),
    };

    // 尝试使用 Web Share API
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // 用户取消分享或分享失败，降级为复制链接
        if ((err as Error).name !== "AbortError") {
          console.warn("分享失败:", err);
        }
      }
    }

    // 降级方案：复制链接
    try {
      await navigator.clipboard.writeText(getShareUrl());
      alert("链接已复制，请粘贴到微信分享");
    } catch {
      alert("复制失败，请手动复制链接");
    }
  };

  const getWechatText = () =>
    `求了支鹅城签，抽中【${mainInfo.name}】！判词太准了：「${mainInfo.verdict}」你们也来求一签👇 #鹅城人格鉴定 #鹅城签`;

  const getXiaohongshuText = () => {
    const first = CHARACTER_INFO[topThree[0].character].name;
    const tip = mainInfo.survivalGuide[0] ?? "";
    return `抽了鹅城签直接沉默😭 我是【${first}】\n判词：${mainInfo.verdict}\n生存要诀：${tip}\n签筒一摇，人格立判。传送门在评论区🔗 #鹅城签 #鹅城人格鉴定 #人格测试`;
  };

  const getChallengeText = () =>
    `@第一个想到的人 我猜你测出来肯定有六子，不准请你吃凉粉🍜 测测你是鹅城里的谁`;

  const generatePlayfulSummary = () => {
    const first = CHARACTER_SHORT_LABELS[topThree[0].character];
    const second = CHARACTER_SHORT_LABELS[topThree[1].character];
    const third = CHARACTER_SHORT_LABELS[topThree[2].character];
    return `你的外壳是【${first}】，内核藏着【${second}】的灵活，偶尔露出【${third}】的锋芒`;
  };

  const getRelationshipMeta = (type: string) => {
    switch (type) {
      case "leader":
        return { label: "引路人", icon: "⭐" };
      case "partners":
        return { label: "默契搭档", icon: "🤝" };
      case "rivals":
        return { label: "棋逢对手", icon: "⚔" };
      case "dislikes":
        return { label: "看不顺眼", icon: "✕" };
      case "observe":
        return { label: "观察对象", icon: "🔍" };
      case "cannotUnderstand":
        return { label: "无法理解", icon: "❓" };
      default:
        return null;
    }
  };

  const formatRelationshipValue = (value: string | string[] | undefined): string | null => {
    if (!value) return null;
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.length > 0 ? value.join(" ") : null;
    return null;
  };

  const visibleRelationships = relationships
    ? Object.entries(relationships).filter(([type, value]) => {
        const meta = getRelationshipMeta(type);
        return meta && formatRelationshipValue(value);
      })
    : [];

  const verdictLines = (() => {
    const clean = mainInfo.verdict.replace(/[。，、；：！？]/g, "");
    const lines: string[] = [];
    for (let i = 0; i < clean.length; i += 7) lines.push(clean.slice(i, i + 7));
    return lines;
  })();

  const railOf = (c: CharacterType) => RAIL_COLORS[c] ?? "#6B5F52";

  return (
    <div className="result-page">
      <header className={`result-header ${showMainCard ? "fade-in" : "is-hidden"}`}>
        <h1>你的鹅城三面人格</h1>
        <div className="result-header-line" />
      </header>

      {/* 主角色卡片 */}
      <section
        className={`hero-card ${showMainCard ? "slide-in" : "is-hidden"}`}
        style={{ ["--rail-color"]: railOf(mainCharacter.character) } as CSSProperties}
      >
        {(mainImageUrl || mainVideoUrl) && (
          <button
            type="button"
            className="hero-media"
            onClick={handleImageClick}
            aria-label="播放角色微动效"
          >
            {isPlayingVideo && mainVideoUrl ? (
              <video
                ref={videoRef}
                src={mainVideoUrl}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
                onEnded={handleVideoEnded}
              />
            ) : (
              mainImageUrl && <img src={mainImageUrl} alt={mainInfo.name} className="w-full h-full object-cover" />
            )}
            {!isPlayingVideo && mainVideoUrl && <span className="hero-play-hint">▶</span>}
          </button>
        )}

        <div className="hero-copy">
          <h2 className="character-name">{mainInfo.name}</h2>
          <p className="hero-quote">
            <span className="qmark">“</span>
            {mainInfo.quote}
            <span className="qmark">”</span>
          </p>
          <p className="summary-quote">{generatePlayfulSummary()}</p>
        </div>
      </section>

      {/* 三面百分比 */}
      <div className="result-bars">
        {topThree.map((item, index) => (
          <PercentRow
            key={item.character}
            name={CHARACTER_INFO[item.character].name}
            label={index === 0 ? "A面" : index === 1 ? "B面" : "C面"}
            percentage={item.percentage}
            tone={BAR_TONES[index]}
            visible={index === 0 ? showMainCard : index === 1 ? showSecondCard : showThirdCard}
            railColor={railOf(item.character)}
          />
        ))}
      </div>

      {/* 求签仪式 · 判词 + 签解（结果页主流程） */}
      <div
        ref={verdictRef}
        className={`lot-ceremony ${lotInView ? "is-inview" : ""} phase-${lotPhase} ${showMainCard ? "fade-in" : "is-hidden"}`}
      >
        <p className="lot-kicker">命 运 一 签</p>
        <h3 className="text-center">鹅城判词</h3>
        <p className="lot-subtitle">摇签出命 · 立判鹅城人格</p>

        {(lotPhase === "ready" || lotPhase === "shaking" || lotPhase === "ejecting") && (
          <div className="lot-stage">
            <div className={`lot-tube ${lotPhase === "shaking" ? "is-shaking" : ""} ${lotPhase === "ejecting" ? "is-ejecting" : ""}`}>
              <div className="lot-tube-rim" />
              <div className="lot-tube-body">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="lot-stick-peek" style={{ ["--i" as string]: i } as CSSProperties} />
                ))}
              </div>
              <div className="lot-tube-base" />
              <div className="lot-stick-fly" aria-hidden>
                <span>签</span>
              </div>
            </div>

            {lotPhase === "ready" && (
              <button type="button" className="lot-draw-btn" onClick={startLotDraw}>
                求取鹅城签
              </button>
            )}
            {lotPhase === "shaking" && <p className="lot-status">签筒摇动中…</p>}
            {lotPhase === "ejecting" && <p className="lot-status">一签飞出</p>}
          </div>
        )}

        {(lotPhase === "unfurl" || lotPhase === "reveal" || lotPhase === "done") && (
          <div className={`lot-slip ${lotPhase === "unfurl" ? "is-unfurling" : "is-open"}`}>
            <div className="lot-slip-badge">上上签</div>
            <div className="verdict-xuan">
              {verdictLines.map((line, lineIdx) => (
                <p key={`verdict-line-${lineIdx}`} className="verdict-line">
                  {Array.from(line).map((ch, charIdx) => {
                    const globalIndex =
                      verdictLines.slice(0, lineIdx).reduce((sum, l) => sum + l.length, 0) + charIdx;
                    return (
                      <span
                        key={`verdict-char-${lineIdx}-${charIdx}`}
                        className={`verdict-char ${lotPhase === "reveal" || lotPhase === "done" ? "is-lighting" : ""}`}
                        style={{ animationDelay: `${globalIndex * 70}ms` }}
                      >
                        {ch}
                      </span>
                    );
                  })}
                </p>
              ))}
            </div>
            <div className={`lot-seal ${lotPhase === "done" ? "is-stamped" : ""}`} aria-hidden>
              <span>鹅</span>
              <span>判</span>
            </div>
          </div>
        )}

        {lotPhase === "done" && (
          <div className="lot-advice fade-in">
            <h4>签解 · 生存要诀</h4>
            <ul className="survival-list">
              {mainInfo.survivalGuide.map((guide) => (
                <li key={guide} className="survival-item">
                  {guide}
                </li>
              ))}
            </ul>
            <div className="lot-meta-block">
              <p className="lot-meta-label">玄学建议</p>
              <p className="lot-meta-text">{mainInfo.metaphysics}</p>
            </div>
            <div className="lot-meta-block lot-mbti">
              <p className="lot-meta-label">MBTI</p>
              <p className="lot-meta-text">{mainInfo.mbti}</p>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        className="btn-enter result-toggle"
        onClick={() => {
          soundManager.playClick();
          setShowFullReport(!showFullReport);
        }}
      >
        {showFullReport ? "收起完整报告" : "查看完整报告"}
      </button>

      {showFullReport && (
        <div className="result-report fade-in">
          <div className="echeng-card report-block">
            <h3>心理学标签</h3>
            <div className="tag-row">
              {mainInfo.psychologyTags.map((tag) => (
                <span key={tag} className="tag-chip">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* 一体两面 · 金色断裂 */}
          <div className="echeng-card-elevated report-block fracture-wrap">
            <div className="fracture-head">
              <h3>一体两面</h3>
              {!showDarkSide && fracturePhase === "idle" && (
                <p className="fracture-hint">
                  <span className="fracture-hint-arrow" aria-hidden>
                    ↓
                  </span>
                  点击水晶球，窥见另一面
                </p>
              )}
              {showDarkSide && fracturePhase === "idle" && (
                <p className="fracture-hint is-dark">点击水晶球或「返回」回到光明面</p>
              )}
            </div>

            <button
              type="button"
              className={`fracture-stage phase-${fracturePhase} ${showDarkSide ? "is-dark" : "is-light"}`}
              onClick={handleFractureToggle}
              disabled={fracturePhase !== "idle"}
              aria-label={showDarkSide ? "返回光明面" : "查看隐藏暗面"}
            >
              {showDarkSide && fracturePhase === "idle" && (
                <span className="dark-corner-mark" aria-hidden />
              )}

              <div className="fracture-beam" aria-hidden />
              <div className="fracture-gap-glow" aria-hidden />

              <div className="fracture-outgoing">
                <div className="fracture-slice top">
                  <div className="fracture-slice-body">
                    <p className="flip-label">{outgoingCopy.label}</p>
                    <p>{outgoingCopy.text}</p>
                  </div>
                </div>
                <div className="fracture-slice bottom">
                  <div className="fracture-slice-body">
                    <p className="flip-label">{outgoingCopy.label}</p>
                    <p>{outgoingCopy.text}</p>
                  </div>
                </div>
              </div>

              <div className="fracture-incoming">
                <p className="flip-label">{incomingCopy.label}</p>
                <p>{incomingCopy.text}</p>
              </div>
            </button>

            <div className="fracture-controls">
              <button
                type="button"
                className={`flip-orb ${!showDarkSide && fracturePhase === "idle" ? "is-guiding" : ""}`}
                onClick={handleFractureToggle}
                disabled={fracturePhase !== "idle"}
                aria-label={showDarkSide ? "返回光明面" : "查看隐藏暗面"}
              >
                🔮
              </button>
              {showDarkSide && fracturePhase === "idle" && (
                <button
                  type="button"
                  className="fracture-back-btn"
                  onClick={handleFractureToggle}
                >
                  返回
                </button>
              )}
            </div>
          </div>

          {visibleRelationships.length > 0 && (
            <div className="echeng-card report-block">
              <h3>鹅城江湖关系</h3>
              <div className="relation-list">
                {visibleRelationships.map(([type, value]) => {
                  const meta = getRelationshipMeta(type);
                  const display = formatRelationshipValue(value);
                  if (!meta || !display) return null;
                  return (
                    <div key={type} className="relation-row">
                      <span className="relation-icon">{meta.icon}</span>
                      <span className="relation-label">{meta.label}</span>
                      <span className="relation-value">【{display}】</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="side-personas">
            <div
              className={`result-bar-card side-persona-card ${expandedPersona === "second" ? "is-expanded" : ""}`}
              style={{ ["--rail-color"]: railOf(secondCharacter.character) } as CSSProperties}
            >
              <button
                type="button"
                className="side-persona-header"
                onClick={() => {
                  soundManager.playClick();
                  setExpandedPersona(expandedPersona === "second" ? null : "second");
                }}
              >
                <p>
                  <strong>第二人格：【{secondInfo.name}】</strong>
                  <em> —— {secondInfo.playfulComment}</em>
                </p>
                <span className="side-persona-arrow">{expandedPersona === "second" ? "▲" : "▼"}</span>
              </button>
              {expandedPersona === "second" && (
                <div className="side-persona-detail fade-in">
                  <div className="detail-section">
                    <h4>角色名言</h4>
                    <p className="detail-quote">"{secondInfo.quote}"</p>
                  </div>
                  <div className="detail-section">
                    <h4>心理学标签</h4>
                    <div className="tag-row">
                      {secondInfo.psychologyTags.map((tag) => (
                        <span key={tag} className="tag-chip">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="detail-section">
                    <h4>MBTI</h4>
                    <p>{secondInfo.mbti}</p>
                  </div>
                  <div className="detail-section">
                    <h4>生存指南</h4>
                    <ul className="survival-list">
                      {secondInfo.survivalGuide.map((guide) => (
                        <li key={guide}>{guide}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div
              className={`result-bar-card side-persona-card ${expandedPersona === "third" ? "is-expanded" : ""}`}
              style={{ ["--rail-color"]: railOf(thirdCharacter.character) } as CSSProperties}
            >
              <button
                type="button"
                className="side-persona-header"
                onClick={() => {
                  soundManager.playClick();
                  setExpandedPersona(expandedPersona === "third" ? null : "third");
                }}
              >
                <p>
                  <strong>第三人格：【{thirdInfo.name}】</strong>
                  <em> —— {thirdInfo.playfulComment}</em>
                </p>
                <span className="side-persona-arrow">{expandedPersona === "third" ? "▲" : "▼"}</span>
              </button>
              {expandedPersona === "third" && (
                <div className="side-persona-detail fade-in">
                  <div className="detail-section">
                    <h4>角色名言</h4>
                    <p className="detail-quote">"{thirdInfo.quote}"</p>
                  </div>
                  <div className="detail-section">
                    <h4>心理学标签</h4>
                    <div className="tag-row">
                      {thirdInfo.psychologyTags.map((tag) => (
                        <span key={tag} className="tag-chip">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="detail-section">
                    <h4>MBTI</h4>
                    <p>{thirdInfo.mbti}</p>
                  </div>
                  <div className="detail-section">
                    <h4>生存指南</h4>
                    <ul className="survival-list">
                      {thirdInfo.survivalGuide.map((guide) => (
                        <li key={guide}>{guide}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <section className="ranking-block">
        <h3>鹅城三甲</h3>
        <div className="echeng-card">
          {topThree.map((item, index) => {
            const info = CHARACTER_INFO[item.character];
            const title = index === 0 ? "状元" : index === 1 ? "榜眼" : "探花";
            return (
              <div key={item.character} className="rank-row">
                <span className="rank-rail" style={{ background: railOf(item.character) }} />
                <div>
                  <p className="rank-title">
                    {title} · {info.name}
                  </p>
                  <p className="rank-pct">{item.percentage}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="share-actions">
        <button
          type="button"
          className="btn-solid"
          onClick={() => {
            soundManager.playEnter();
            setShowPosterPreview(true);
          }}
        >
          预览海报 · 群聊动态 / 朋友圈静图
        </button>
        <p className="share-disclaimer">{ENTERTAINMENT_DISCLAIMER}</p>
        <button
          type="button"
          className="btn-outline"
          onClick={shareToWechat}
        >
          分享链接到微信
        </button>
        <button
          type="button"
          className="btn-outline"
          onClick={() => {
            soundManager.playShare();
            copyToClipboard(getWechatText());
          }}
        >
          复制朋友圈文案
        </button>
        <button
          type="button"
          className="btn-outline"
          onClick={() => {
            soundManager.playShare();
            copyToClipboard(getXiaohongshuText());
          }}
        >
          复制小红书文案
        </button>
        <button
          type="button"
          className="btn-outline"
          onClick={() => {
            soundManager.playShare();
            copyToClipboard(getChallengeText());
          }}
        >
          挑战好友
        </button>
        <button
          type="button"
          className="btn-enter"
          onClick={() => {
            soundManager.playClick();
            onRestart();
          }}
        >
          再来一次
        </button>
      </div>

      <div className={`shutter-flash ${showShutter ? "active" : ""}`} />

      <PosterPreview
        open={showPosterPreview}
        onClose={() => {
          if (!posterSaving && !posterGifSaving) setShowPosterPreview(false);
        }}
        onSaveStatic={generatePoster}
        onSaveGif={generateGifPoster}
        name={mainInfo.name}
        persona={CHARACTER_SHORT_LABELS[mainCharacter.character] ?? ""}
        percentage={mainCharacter.percentage}
        imageUrl={mainImageUrl}
        verdict={mainInfo.verdict}
        survivalGuide={mainInfo.survivalGuide}
        metaphysics={mainInfo.metaphysics}
        mbti={mainInfo.mbti}
        bgUrl={posterBgRef.current ?? undefined}
        variant={isAiResult ? "ai" : "classic"}
        savingStatic={posterSaving}
        savingGif={posterGifSaving}
        gifProgress={posterGifProgress}
      />

      <footer className="result-footer">
        <p className="footer-credit">GANO PRODUCTION</p>
        <a href="mailto:Gano-being@outlook.com" className="footer-email">
          Gano-being@outlook.com
        </a>
      </footer>
    </div>
  );
}
