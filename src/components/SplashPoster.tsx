import { useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { publicUrl } from "@/lib/utils";

interface SplashPosterProps {
  /** 入场完成（淡出结束后） */
  onEnter: () => void;
}

/**
 * 开屏海报覆盖层：全屏海报 → 入场按钮 / 3 秒自动入场 → 淡出后进入欢迎页
 */
const SplashPoster: FC<SplashPosterProps> = ({ onEnter }) => {
  const [phase, setPhase] = useState<"idle" | "glow" | "fade" | "gone">("idle");
  const exitingRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const finish = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    setPhase("gone");
    onEnter();
  };

  const startExit = () => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    setPhase("glow");
    const t1 = window.setTimeout(() => setPhase("fade"), 200);
    const t2 = window.setTimeout(() => finish(), 200 + 800);
    timersRef.current.push(t1, t2);
  };

  useEffect(() => {
    const auto = window.setTimeout(() => startExit(), 3000);
    timersRef.current.push(auto);
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      className={`splash-poster ${phase === "fade" ? "is-fading" : ""} ${phase === "glow" ? "is-glowing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="鹅城开屏海报"
    >
      <div className="splash-poster-media">
        {/* 开屏海报：images/poster_cyber.jpg */}
        <img
          className="splash-poster-img"
          src={publicUrl("images/poster_cyber.jpg")}
          alt="鹅城开屏海报"
          draggable={false}
        />
      </div>

      <div className="splash-poster-actions">
        <button
          type="button"
          className={`splash-enter ${phase === "glow" ? "is-flash" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            startExit();
          }}
        >
          入 场
        </button>
        <p className="splash-poster-hint">点击入场，进入鹅城</p>
      </div>
    </div>
  );
};

export default SplashPoster;
