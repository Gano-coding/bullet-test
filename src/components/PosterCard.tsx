import { type FC, type Ref } from "react";
import { ENTERTAINMENT_DISCLAIMER } from "@/lib/posterCeremony";

/** 宣发用主要角色（不含隐藏触发角色） */
export const PROMO_CHARACTER_IDS = [
  "zhang",
  "huang",
  "tang",
  "laosan",
  "laoer",
  "huajie",
  "furen",
  "huwan",
  "wujuren",
  "sunshouyi",
] as const;

export type PromoCharacterId = (typeof PROMO_CHARACTER_IDS)[number];

/** 海报用短玄学：MBTI 主型 + 幸运物，去掉长风水句 */
export function shortPosterMeta(metaphysics: string, mbti?: string): string {
  const lucky = metaphysics.match(/幸运物[^·]+/)?.[0]?.trim();
  const mbtiMain = mbti?.split("/")[0]?.trim();
  const parts = [mbtiMain, lucky].filter(Boolean);
  if (parts.length) return parts.join(" · ");
  return metaphysics
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" · ");
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

export type PosterCardProps = {
  name: string;
  persona: string;
  percentage: number;
  imageUrl?: string;
  verdict: string;
  survivalGuide: string[];
  metaphysics: string;
  mbti?: string;
  qrUrl?: string;
  /** 最终态（无动画），用于导出/批量 */
  final?: boolean;
  className?: string;
  cardRef?: Ref<HTMLDivElement>;
};

export function verdictLinesOf(verdict: string): string[] {
  const clean = verdict.replace(/[。，、；：！？]/g, "");
  const lines: string[] = [];
  for (let i = 0; i < clean.length; i += 7) lines.push(clean.slice(i, i + 7));
  return lines;
}

/** 与预览页一致的鹅城签卡片（最终态） */
export const PosterCard: FC<PosterCardProps> = ({
  name,
  persona,
  percentage,
  imageUrl,
  verdict,
  survivalGuide,
  metaphysics,
  mbti,
  qrUrl = "",
  final = true,
  className = "",
  cardRef,
}) => {
  const dicePip = Math.min(6, Math.max(1, Math.round(percentage / 17)));
  const verdictLines = verdictLinesOf(verdict);
  const metaLine = shortPosterMeta(metaphysics, mbti);
  const tips = survivalGuide.slice(0, 2);

  return (
    <div
      ref={cardRef}
      className={`poster-stage-frame ${final ? "is-final is-exporting" : ""} ${className}`.trim()}
    >
      <i className="poster-corner tl" />
      <i className="poster-corner tr" />
      <i className="poster-corner bl" />
      <i className="poster-corner br" />

      <div className={`poster-dice-row ${final ? "is-in" : ""}`}>
        <DiceFace pips={dicePip} className="dice-left" />
        <div className="poster-stage-title">
          <p>命 运 落 子  ·  鹅 城 求 签</p>
          <h3>鹅 城 签</h3>
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

      <div className={`poster-slip ${final ? "is-open" : ""}`}>
        <div className="poster-slip-ribbon">上 上 签</div>
        <p className="poster-slip-label">鹅 城 判 词</p>
        <div className="poster-verdict">
          {verdictLines.map((line, lineIdx) => (
            <p key={`pl-${lineIdx}`} className="poster-verdict-line">
              {Array.from(line).map((ch, charIdx) => {
                const globalIndex =
                  verdictLines.slice(0, lineIdx).reduce((sum, l) => sum + l.length, 0) + charIdx;
                return (
                  <span
                    key={`pc-${lineIdx}-${charIdx}`}
                    className={`poster-verdict-char ${final ? "is-lighting" : ""}`}
                    style={final ? undefined : { animationDelay: `${globalIndex * 55}ms` }}
                  >
                    {ch}
                  </span>
                );
              })}
            </p>
          ))}
        </div>
        <div className={`poster-seal ${final ? "is-stamped" : ""}`} aria-hidden>
          <span>鹅</span>
          <span>判</span>
        </div>
        <DiceFace pips={dicePip} className="slip-dice" />
      </div>

      <div className={`poster-advice ${final ? "is-in" : ""}`}>
        <p className="poster-advice-title">签 解  ·  生 存 要 诀</p>
        <ul>
          {tips.map((guide, idx) => (
            <li key={guide}>
              <DiceFace pips={idx + 1} className="tip-dice" />
              <span>{guide}</span>
            </li>
          ))}
        </ul>
        <p className="poster-meta-text">{metaLine}</p>
      </div>

      <div className={`poster-footer ${final ? "is-in" : ""}`}>
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
  );
};

export { DiceFace };
