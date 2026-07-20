import { useState, useEffect, useRef } from "react";
import type { CharacterType } from "@/types";
import { CHARACTER_VIDEOS, CHARACTER_INFO, CHARACTER_IMAGES } from "@/types";
import { soundManager } from "@/lib/sound";

interface CharacterRevealPageProps {
  character: CharacterType;
  onComplete: () => void;
}

export default function CharacterRevealPage({ character, onComplete }: CharacterRevealPageProps) {
  const [showVideo, setShowVideo] = useState(false);
  const [showName, setShowName] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const completedRef = useRef(false);
  const mainVideoUrl = CHARACTER_VIDEOS[character];
  const mainImageUrl = CHARACTER_IMAGES[character];
  const characterInfo = CHARACTER_INFO[character];

  const finish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  };

  useEffect(() => {
    completedRef.current = false;
    soundManager.init();
    soundManager.playReveal();

    if (!mainVideoUrl) {
      const tShow = setTimeout(() => setShowName(true), 400);
      const tDone = setTimeout(finish, 1800);
      return () => {
        clearTimeout(tShow);
        clearTimeout(tDone);
      };
    }

    const t1 = setTimeout(() => setShowVideo(true), 300);
    const t2 = setTimeout(() => {
      videoRef.current?.play().catch(() => {
        // 自动播放失败时仍继续流程
      });
    }, 500);
    const t3 = setTimeout(() => setShowName(true), 1200);
    // 兜底：视频若不触发 ended，最多 4.5s 后进入结果页
    const tFailsafe = setTimeout(finish, 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tFailsafe);
    };
  }, [mainVideoUrl, character]);

  const handleVideoEnded = () => {
    setTimeout(finish, 600);
  };

  if (!mainVideoUrl) {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: "#0D0A06" }}
      >
        <div className={`relative z-10 flex flex-col items-center ${showName ? "fade-in" : "opacity-0"}`}>
          {mainImageUrl ? (
            <div
              className="overflow-hidden"
              style={{ width: 220, height: 293, border: "1px solid #3A2F25" }}
            >
              <img src={mainImageUrl} alt={characterInfo.name} className="w-full h-full object-cover" />
            </div>
          ) : null}
          <h2 className="character-name mt-8">{characterInfo.name}</h2>
          <p className="mt-4 text-sm italic" style={{ color: "#8A7B6B" }}>
            "{characterInfo.quote}"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: "#0D0A06" }}
    >
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(184, 151, 62, 0.14) 0%, transparent 70%)",
          filter: "blur(80px)",
          opacity: showVideo ? 1 : 0,
          transition: "opacity 1s cubic-bezier(0.22, 0.61, 0.36, 1)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        <div className={`video-frame ${showVideo ? "fade-in" : "opacity-0"}`}>
          <span className="c-tl" />
          <span className="c-tr" />
          <span className="c-bl" />
          <span className="c-br" />
          <div
            className="relative overflow-hidden"
            style={{
              width: "clamp(220px, 70vw, 320px)",
              aspectRatio: "3 / 4",
              border: "1px solid #3A2F25",
              boxShadow: "0 0 36px rgba(184, 151, 62, 0.22)",
            }}
          >
            <video
              ref={videoRef}
              src={mainVideoUrl}
              className="w-full h-full object-cover"
              muted
              playsInline
              onEnded={handleVideoEnded}
              onError={() => setTimeout(finish, 400)}
            />
          </div>
        </div>

        <div className={`mt-8 text-center ${showName ? "fade-in" : "opacity-0"}`}>
          <h2 className="character-name">{characterInfo.name}</h2>
          <p className="mt-4 text-sm italic" style={{ color: "#8A7B6B" }}>
            "{characterInfo.quote}"
          </p>
        </div>

        <p className={`mt-6 quiz-progress-num ${showName ? "fade-in" : "opacity-0"}`}>
          鹅城人格揭晓
        </p>
      </div>
    </div>
  );
}
