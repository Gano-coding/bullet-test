import { useState, useEffect } from "react";
import { soundManager } from "@/lib/sound";

export default function LoadingPage() {
  const [countdown, setCountdown] = useState<number | null>(3);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      soundManager.playCountdown(countdown);
      const timer = setTimeout(() => setCountdown(countdown - 1), 800);
      return () => clearTimeout(timer);
    }

    soundManager.playDice();
    const timer = setTimeout(() => setCountdown(null), 500);
    return () => clearTimeout(timer);
  }, [countdown]);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center relative z-10 px-6 spotlight-glow"
      style={{ backgroundColor: "#0D0A06" }}
    >
      {countdown !== null && countdown > 0 && (
        <div className="flex flex-col items-center gap-6 fade-in" key={countdown}>
          <div className="countdown-num">{countdown}</div>
          <p className="quiz-progress-num">胶片倒计时</p>
        </div>
      )}

      {countdown === null && (
        <div className="flex flex-col items-center fade-in">
          <h2 className="loading-title mb-10 md:mb-12">正在分析你的鹅城人格...</h2>

          <div className="dice-container">
            <div className="dice">
              <div className="dice-face front">
                <div className="dot dot-center" />
              </div>
              <div className="dice-face back">
                <div className="dot dot-tl" />
                <div className="dot dot-br" />
              </div>
              <div className="dice-face right">
                <div className="dot dot-tl" />
                <div className="dot dot-center" />
                <div className="dot dot-br" />
              </div>
              <div className="dice-face left">
                <div className="dot dot-tl" />
                <div className="dot dot-tr" />
                <div className="dot dot-bl" />
                <div className="dot dot-br" />
              </div>
              <div className="dice-face top">
                <div className="dot dot-tl" />
                <div className="dot dot-tr" />
                <div className="dot dot-center" />
                <div className="dot dot-bl" />
                <div className="dot dot-br" />
              </div>
              <div className="dice-face bottom">
                <div className="dot dot-tl" />
                <div className="dot dot-tr" />
                <div className="dot dot-ml" />
                <div className="dot dot-mr" />
                <div className="dot dot-bl" />
                <div className="dot dot-br" />
              </div>
            </div>
          </div>

          <p className="quiz-progress-num mt-8">命运落子 · 鹅城识人</p>

          <div className="mt-8 w-[180px] md:w-[280px] waveform-bar loading-wave">
            <div className="h-full waveform-fill loading-wave-fill" />
          </div>
        </div>
      )}
    </div>
  );
}
