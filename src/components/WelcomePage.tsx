import { useState, useEffect, useRef } from "react";
import type { FC } from "react";
import { soundManager } from "@/lib/sound";
import { BGM_URL } from "@/types";
import SplashPoster from "@/components/SplashPoster";

interface WelcomePageProps {
  onStart: () => void;
}

const WelcomePage: FC<WelcomePageProps> = ({ onStart }) => {
  const [showSplash, setShowSplash] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dissolvePlay, setDissolvePlay] = useState(false);
  const [bgMusicEnabled, setBgMusicEnabled] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startBgMusic = async () => {
    if (!BGM_URL) {
      console.log("[WelcomePage] 背景音乐 URL 为空，跳过");
      return;
    }
    if (soundManager.isBackgroundMusicPlaying()) {
      return;
    }
    soundManager.init();
    await soundManager.resume();
    soundManager.setBackgroundMusicEnabled(true);
    // 循环播放，贯穿整个测试流程
    const ok = await soundManager.playBackgroundMusic(BGM_URL, true);
    console.log("[WelcomePage] 背景音乐播放结果:", ok);
  };

  const startOpeningVideo = async () => {
    const video = videoRef.current;
    if (!video || isPlaying) return false;
    video.muted = true; // 视频始终静音
    try {
      await video.play();
      setDissolvePlay(true);
      setIsPlaying(true);
      soundManager.playVideoStart();
      console.log("[WelcomePage] 视频播放成功");
      return true;
    } catch (err) {
      console.warn("[WelcomePage] 视频播放失败:", err);
      setDissolvePlay(false);
      return false;
    }
  };

  const handleFirstInteraction = async () => {
    if (userInteracted) return;

    console.log("[WelcomePage] 用户首次交互");
    setUserInteracted(true);

    // 初始化并恢复 AudioContext
    soundManager.init();
    await soundManager.resume();

    // 直接播放背景音乐（不依赖视频）
    if (bgMusicEnabled) {
      await startBgMusic();
    }

    // 视频静音播放（不再有声音）
    await startOpeningVideo();
  };

  const handlePlayClick = async () => {
    await handleFirstInteraction();
    soundManager.playClick();
  };

  const handleBgMusicToggle = () => {
    soundManager.init();
    void soundManager.resume();
    const next = !bgMusicEnabled;
    setBgMusicEnabled(next);
    soundManager.setBackgroundMusicEnabled(next);
    if (next) {
      void startBgMusic();
    } else {
      soundManager.stopBackgroundMusic(true);
    }
  };

  return (
    <div
      className="welcome-page"
      onClick={handleFirstInteraction}
      onTouchStart={handleFirstInteraction}
    >
      {showSplash && (
        <SplashPoster
          onEnter={() => {
            setShowSplash(false);
            void handleFirstInteraction();
          }}
        />
      )}

      <div className="welcome-shell">
        <section className="welcome-media">
          <div className="welcome-frame welcome-anim-frame">
            <i className="welcome-corner tl" />
            <i className="welcome-corner tr" />
            <i className="welcome-corner bl" />
            <i className="welcome-corner br" />
            <div className="welcome-video welcome-anim-video">
              <video
                ref={videoRef}
                muted
                playsInline
                autoPlay
                preload="auto"
                src="https://conversation.cdn.meoo.host/conversations/336348431167721472/video/2026-07-17/1784268918671-opening__2_.mp4?auth_key=703655cf64b1e204c1c1dd37b0142e5c926645d44a2df6eacd6fbebecb3c86fb"
                onPlaying={() => {
                  setDissolvePlay(true);
                  setIsPlaying(true);
                }}
                onEnded={() => {
                  setIsPlaying(false);
                }}
              />
              {!isPlaying && (
                <button
                  type="button"
                  className={`welcome-play ${dissolvePlay ? "is-dissolving" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handlePlayClick();
                  }}
                  aria-label="播放开场视频"
                >
                  <span className="welcome-play-ring">
                    <span className="welcome-play-tri" />
                  </span>
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="welcome-aside">
          <div className="welcome-content welcome-anim-text">
            <h1 className="welcome-heading">鹅城人格测试</h1>

            <p className="welcome-lead">
              <span className="welcome-lead-rule" aria-hidden />
              <span className="welcome-lead-text">你身上有谁的影子</span>
            </p>

            <div className="welcome-rule" aria-hidden />

            <label className="welcome-music">
              <span>背景音乐</span>
              <button
                type="button"
                className={`welcome-switch ${bgMusicEnabled ? "is-on" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleBgMusicToggle();
                }}
                aria-label="切换背景音乐"
              >
                <span className="welcome-switch-knob" />
              </button>
            </label>

            <button
              type="button"
              className="welcome-enter welcome-anim-btn"
              onClick={async (e) => {
                e.stopPropagation();
                soundManager.init();
                await soundManager.resume();
                soundManager.playEnter();

                // 如果用户还没交互过（没触发触屏播放），在这里启动音乐
                if (!userInteracted && bgMusicEnabled) {
                  setUserInteracted(true);
                  await startBgMusic();
                }

                // 不停止背景音乐，让它继续播放到答题页和结果页
                onStart();
              }}
            >
              入 场
            </button>

            <p className="welcome-hint">十二道问题之后，你会认出自己</p>
            
            {!userInteracted && (
              <p className="welcome-hint" style={{ color: "#D4AF37", marginTop: "0.5rem" }}>
                点击屏幕任意位置开启音效
              </p>
            )}
          </div>

          <div className="welcome-footer welcome-anim-dot" aria-hidden>
            <span className="welcome-pulse" />
          </div>
        </section>
      </div>
    </div>
  );
};

export default WelcomePage;
