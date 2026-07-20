import { useEffect, useMemo, useRef, useState } from "react";
import type { FC } from "react";
import QRCode from "qrcode";
import { getShareUrl } from "@/types";
import { soundManager } from "@/lib/sound";
import { ENTERTAINMENT_DISCLAIMER, exportStaticPosterFromDom } from "@/lib/posterCeremony";
import { shortPosterMeta } from "@/components/PosterCard";

export type PosterAnimPhase = "dice" | "slip" | "reveal" | "seal" | "done";

interface PosterPreviewProps {
  open: boolean;
  onClose: () => void;
  /** 朋友圈静图：由预览 DOM 截图导出；父级可包一层 loading / 快门 */
  onSaveStatic: (exportFn: () => Promise<void>) => void | Promise<void>;
  /** 群聊动态 GIF */
  onSaveGif: () => void | Promise<void>;
  name: string;
  persona: string;
  percentage: number;
  imageUrl?: string;
  verdict: string;
  survivalGuide: string[];
  metaphysics: string;
  mbti?: string;
  bgUrl?: string;
  variant?: "classic" | "ai";
  savingStatic?: boolean;
  savingGif?: boolean;
  gifProgress?: number;
}

function DiceFace({ pips, className }: { pips: number; className?: string }) {
  const map: Record<number, string[]> = {
    1: ["c"],
    2: ["tl", "br"],
    3: ["tl", "c", "br"],
    4: ["tl", "tr", "bl", "br"],
    5: ["tl", "tr", "c", "bl", "br"],
    6: ["tl", "tr", "ml", "mr", "bl", "br"],
  };
  const dots = map[Math.min(6, Math.max(1, pips))] ?? map[1];
  return (
    <div className={`poster-dice ${className ?? ""}`} aria-hidden>
      {dots.map((pos) => (
        <span key={pos} className={`poster-dice-dot ${pos}`} />
      ))}
    </div>
  );
}

const PosterPreview: FC<PosterPreviewProps> = ({
  open,
  onClose,
  onSaveStatic,
  onSaveGif,
  name,
  persona,
  percentage,
  imageUrl,
  verdict,
  survivalGuide,
  metaphysics,
  mbti,
  bgUrl,
  variant = "classic",
  savingStatic = false,
  savingGif = false,
  gifProgress = 0,
}) => {
  const [phase, setPhase] = useState<PosterAnimPhase>("dice");
  const [playKey, setPlayKey] = useState(0);
  const [qrUrl, setQrUrl] = useState<string>("");
  const timersRef = useRef<number[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const busy = savingStatic || savingGif;

  const dicePip = Math.min(6, Math.max(1, Math.round(percentage / 17)));
  const verdictLines = useMemo(() => {
    const clean = verdict.replace(/[。，、；：！？]/g, "");
    const lines: string[] = [];
    for (let i = 0; i < clean.length; i += 7) lines.push(clean.slice(i, i + 7));
    return lines;
  }, [verdict]);

  const charCount = useMemo(
    () => verdict.replace(/[。，、；：！？]/g, "").length,
    [verdict]
  );
  const metaLine = useMemo(
    () => shortPosterMeta(metaphysics, mbti),
    [metaphysics, mbti]
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    QRCode.toDataURL(getShareUrl(), {
      width: 240,
      margin: 1,
      color: { dark: "#0D0A06", light: "#E8D48B" },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) setQrUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    setPhase("dice");
    soundManager.playDice();

    const revealAt = 1600;
    const sealAt = revealAt + charCount * 55 + 400;
    const doneAt = sealAt + 700;

    timersRef.current = [
      window.setTimeout(() => {
        soundManager.playLotReveal();
        setPhase("slip");
      }, 900),
      window.setTimeout(() => setPhase("reveal"), revealAt),
      window.setTimeout(() => {
        soundManager.playSuccess();
        setPhase("seal");
      }, sealAt),
      window.setTimeout(() => setPhase("done"), doneAt),
    ];

    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, [open, playKey, charCount]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, busy]);

  if (!open) return null;

  const isAi = variant === "ai";
  const phaseRank = { dice: 0, slip: 1, reveal: 2, seal: 3, done: 4 }[phase];
  const showSlip = phaseRank >= 1;
  const showReveal = phaseRank >= 2;
  const showSeal = phaseRank >= 3;
  const showAdvice = phaseRank >= 3;
  const isDone = phase === "done";

  const replay = () => {
    if (busy) return;
    soundManager.playClick();
    setPlayKey((k) => k + 1);
  };

  const handleSaveStatic = async () => {
    if (!stageRef.current || busy || !isDone) return;
    soundManager.playShare();
    const node = stageRef.current;
    await onSaveStatic(async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await exportStaticPosterFromDom(node, name);
    });
  };

  return (
    <div className="poster-preview-overlay" role="dialog" aria-modal="true" aria-label="鹅城签海报预览">
      <button
        type="button"
        className="poster-preview-backdrop"
        aria-label="关闭预览"
        onClick={() => {
          if (!busy) onClose();
        }}
      />

      <div className="poster-preview-shell">
        <header className="poster-preview-head">
          <div>
            <p className="poster-preview-kicker">{isAi ? "A I  ·  签" : "动 态 海 报"}</p>
            <h2>{isAi ? "逻辑观察 · 预览" : "鹅城签 · 预览"}</h2>
          </div>
          <button
            type="button"
            className="poster-preview-close"
            onClick={() => {
              if (!busy) onClose();
            }}
            aria-label="关闭"
            disabled={busy}
          >
            ✕
          </button>
        </header>

        <div className="poster-preview-scroll">
          <div className={`poster-stage phase-${phase} ${isAi ? "is-ai" : ""}`} key={playKey}>
            <div
              ref={stageRef}
              className={`poster-stage-frame ${isDone ? "is-final" : ""} ${isAi ? "is-ai" : ""}`}
              style={
                bgUrl
                  ? {
                      backgroundImage: `linear-gradient(180deg, rgba(8,4,18,0.72), rgba(13,10,6,0.82)), url(${bgUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            >
              <i className="poster-corner tl" />
              <i className="poster-corner tr" />
              <i className="poster-corner bl" />
              <i className="poster-corner br" />

              <div className={`poster-dice-row ${phaseRank >= 0 ? "is-in" : ""}`}>
                <DiceFace pips={dicePip} className="dice-left" />
                <div className="poster-stage-title">
                  <p>{isAi ? "算 尽 天 机  ·  逻 辑 观 察" : "命 运 落 子  ·  鹅 城 求 签"}</p>
                  <h3>{isAi ? "A I  ·  签" : "鹅 城 签"}</h3>
                </div>
                <DiceFace pips={Math.max(1, 7 - dicePip)} className="dice-right" />
              </div>

              <div className="poster-portrait-wrap">
                <div className="poster-portrait">
                  {imageUrl ? (
                    <img src={imageUrl} alt={name} crossOrigin="anonymous" />
                  ) : (
                    <div className="poster-portrait-fallback">{name.slice(0, 1)}</div>
                  )}
                </div>
              </div>

              <p className="poster-name">{name}</p>
              <p className="poster-persona">
                抽中 · {persona} · {percentage}%
              </p>

              <div className={`poster-slip ${showSlip ? "is-open" : ""}`}>
                <div className="poster-slip-ribbon">{isAi ? "最 优 解" : "上 上 签"}</div>
                <p className="poster-slip-label">{isAi ? "算 力 判 词" : "鹅 城 判 词"}</p>
                <div className="poster-verdict">
                  {verdictLines.map((line, lineIdx) => (
                    <p key={`pl-${lineIdx}`} className="poster-verdict-line">
                      {Array.from(line).map((ch, charIdx) => {
                        const globalIndex =
                          verdictLines.slice(0, lineIdx).reduce((sum, l) => sum + l.length, 0) + charIdx;
                        return (
                          <span
                            key={`pc-${lineIdx}-${charIdx}`}
                            className={`poster-verdict-char ${showReveal ? "is-lighting" : ""}`}
                            style={{ animationDelay: `${globalIndex * 55}ms` }}
                          >
                            {ch}
                          </span>
                        );
                      })}
                    </p>
                  ))}
                </div>
                <div className={`poster-seal ${showSeal ? "is-stamped" : ""}`} aria-hidden>
                  <span>{isAi ? "AI" : "鹅"}</span>
                  <span>{isAi ? "算" : "判"}</span>
                </div>
                <DiceFace pips={dicePip} className="slip-dice" />
              </div>

              <div className={`poster-advice ${showAdvice ? "is-in" : ""}`}>
                <p className="poster-advice-title">{isAi ? "推 演  ·  生 存 要 诀" : "签 解  ·  生 存 要 诀"}</p>
                <ul>
                  {survivalGuide.slice(0, 2).map((guide, idx) => (
                    <li key={guide}>
                      <DiceFace pips={idx + 1} className="tip-dice" />
                      <span>{guide}</span>
                    </li>
                  ))}
                </ul>
                <p className="poster-meta-text">{metaLine}</p>
              </div>

              <div className={`poster-footer ${isDone ? "is-in" : ""}`}>
                {qrUrl ? (
                  <img src={qrUrl} alt="扫码求签" className="poster-qr" />
                ) : (
                  <div className="poster-qr placeholder" />
                )}
                <p>扫码求签 · 测测你是鹅城谁</p>
                <p className="poster-brand">鹅城往事 · 鹅城人格鉴定 · GANO</p>
                <p className="poster-frame-disclaimer">{ENTERTAINMENT_DISCLAIMER}</p>
              </div>
            </div>
          </div>
        </div>

        <footer className="poster-preview-actions">
          <p className="poster-preview-hint">
            {savingGif
              ? `正在生成群聊动态 GIF… ${Math.round(gifProgress * 100)}%`
              : savingStatic
                ? "正在定格预览为朋友圈静图…"
                : isDone
                  ? "静图将完全复刻上方预览；动态 GIF 适合发微信群"
                  : "骰子落子 → 签牌展开 → 判词点亮 → 落印"}
          </p>
          <div className="poster-preview-btns poster-preview-btns-triple">
            <button type="button" className="btn-outline" onClick={replay} disabled={busy}>
              再看一遍
            </button>
            <button
              type="button"
              className="btn-solid"
              onClick={() => {
                soundManager.playShare();
                void onSaveGif();
              }}
              disabled={busy || !isDone}
            >
              {savingGif ? "生成中…" : "分享到群聊（动态）"}
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => void handleSaveStatic()}
              disabled={busy || !isDone}
            >
              {savingStatic ? "正在定格…" : "保存朋友圈海报（静态）"}
            </button>
          </div>
          {!isDone && !busy && (
            <button
              type="button"
              className="poster-skip-btn"
              onClick={() => {
                timersRef.current.forEach((id) => window.clearTimeout(id));
                timersRef.current = [];
                setPhase("done");
              }}
            >
              跳过动画，直接导出
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default PosterPreview;
