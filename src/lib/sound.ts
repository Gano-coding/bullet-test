// 音效管理系统 - Web Audio API + HTMLAudio BGM
// 民国黑金电影感：短促铜铃声 + 胶片节拍

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled = true;
  private masterVolume = 0.55;
  private bgMusic: HTMLAudioElement | null = null;
  private bgMusicEnabled = false;
  private bgMusicUrl: string | null = null;
  private bgFadeTimer: number | null = null;
  private unlocked = false;

  init() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {
        console.warn("Web Audio API not supported");
        this.enabled = false;
        return;
      }
    }
    void this.resume();
  }

  async resume() {
    if (!this.audioContext) return;
    if (this.audioContext.state === "suspended") {
      try {
        await this.audioContext.resume();
        this.unlocked = true;
      } catch {
        /* ignore */
      }
    } else {
      this.unlocked = true;
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.bgMusic) {
      this.bgMusic.volume = this.masterVolume * 0.28;
    }
  }

  isBackgroundMusicEnabled() {
    return this.bgMusicEnabled;
  }

  isBackgroundMusicPlaying() {
    return !!(this.bgMusic && !this.bgMusic.paused);
  }

  private clearFade() {
    if (this.bgFadeTimer != null) {
      window.clearInterval(this.bgFadeTimer);
      this.bgFadeTimer = null;
    }
  }

  private fadeTo(target: number, durationMs = 700) {
    if (!this.bgMusic) return;
    this.clearFade();
    const audio = this.bgMusic;
    const start = audio.volume;
    const steps = Math.max(1, Math.floor(durationMs / 40));
    let i = 0;
    this.bgFadeTimer = window.setInterval(() => {
      i += 1;
      const t = i / steps;
      audio.volume = start + (target - start) * t;
      if (i >= steps) {
        this.clearFade();
        audio.volume = target;
        if (target <= 0.001) {
          audio.pause();
          audio.currentTime = 0;
        }
      }
    }, 40);
  }

  /** 返回是否真正开始播放（可用于自动播放被拦截时重试） */
  async playBackgroundMusic(url: string, loop = true): Promise<boolean> {
    this.bgMusicUrl = url;
    if (!this.bgMusicEnabled) return false;

    await this.resume();

    if (this.bgMusic) {
      this.bgMusic.pause();
      this.bgMusic = null;
    }

    const audio = new Audio(url);
    audio.loop = loop;
    audio.preload = "auto";
    audio.volume = 0;
    this.bgMusic = audio;

    try {
      await audio.play();
      this.fadeTo(this.masterVolume * 0.28, 900);
      return true;
    } catch (err) {
      console.warn("背景音乐播放失败:", err);
      return false;
    }
  }

  stopBackgroundMusic(fade = true) {
    if (!this.bgMusic) return;
    if (fade) {
      this.fadeTo(0, 500);
      const ref = this.bgMusic;
      window.setTimeout(() => {
        if (this.bgMusic === ref) {
          ref.pause();
          this.bgMusic = null;
        }
      }, 560);
    } else {
      this.clearFade();
      this.bgMusic.pause();
      this.bgMusic.currentTime = 0;
      this.bgMusic = null;
    }
  }

  setBackgroundMusicEnabled(enabled: boolean) {
    this.bgMusicEnabled = enabled;
    if (!enabled) {
      this.stopBackgroundMusic(true);
    }
  }

  private ensureCtx(): AudioContext | null {
    if (!this.enabled) return null;
    this.init();
    if (!this.audioContext) return null;
    if (this.audioContext.state === "suspended") {
      void this.audioContext.resume();
    }
    return this.audioContext;
  }

  private tone(
    freq: number,
    duration: number,
    opts: {
      type?: OscillatorType;
      gain?: number;
      slideTo?: number;
      delay?: number;
    } = {}
  ) {
    const ctx = this.ensureCtx();
    if (!ctx) return;

    const type = opts.type ?? "sine";
    const gainLevel = opts.gain ?? 0.12;
    const delay = opts.delay ?? 0;
    const start = ctx.currentTime + delay;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (opts.slideTo != null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, opts.slideTo), start + duration);
    }

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(this.masterVolume * gainLevel, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  /** 轻微铜铃点击 */
  playClick() {
    this.tone(1860, 0.09, { gain: 0.11 });
    this.tone(2480, 0.07, { gain: 0.05, delay: 0.02 });
  }

  /** 答题选中：双音确认 */
  playSelect() {
    this.tone(1320, 0.1, { gain: 0.1 });
    this.tone(1760, 0.14, { gain: 0.09, delay: 0.05 });
    this.tone(2200, 0.12, { gain: 0.05, delay: 0.1 });
  }

  /** 胶片倒计时：3→2→1 音调下降 */
  playCountdown(number: number) {
    const map: Record<number, number> = { 3: 880, 2: 740, 1: 620 };
    const freq = map[number] ?? 700;
    this.tone(freq, 0.18, { type: "triangle", gain: 0.16 });
    this.tone(freq * 1.5, 0.1, { gain: 0.05, delay: 0.03 });
  }

  /** 开场视频开始 */
  playVideoStart() {
    this.tone(980, 0.12, { type: "triangle", gain: 0.08, slideTo: 1400 });
    this.tone(1960, 0.1, { gain: 0.06, delay: 0.06 });
  }

  /** 角色揭晓：风铃上行 */
  playReveal() {
    const notes = [988, 1175, 1480, 1760, 2093];
    notes.forEach((freq, i) => {
      this.tone(freq, 0.22, { gain: 0.08, delay: i * 0.07 });
    });
  }

  /** 分享 / 快门 */
  playShare() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    // 短噪声快门
    const duration = 0.06;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    src.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.value = 1800;
    gain.gain.setValueAtTime(this.masterVolume * 0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    this.tone(2400, 0.05, { gain: 0.04, delay: 0.02 });
  }

  /** 进度微音 */
  playProgress() {
    this.tone(2600, 0.05, { gain: 0.03 });
  }

  playError() {
    this.tone(420, 0.16, { type: "triangle", gain: 0.12, slideTo: 280 });
  }

  playSuccess() {
    [784, 988, 1319].forEach((freq, i) => {
      this.tone(freq, 0.28, { gain: 0.07, delay: i * 0.04 });
    });
  }

  /** 入场 / 页面过渡 */
  playEnter() {
    this.tone(660, 0.2, { type: "triangle", gain: 0.1, slideTo: 990 });
    this.tone(1320, 0.18, { gain: 0.06, delay: 0.08 });
  }

  /** 结果页翻转 / 一体两面 */
  playFlip() {
    this.tone(520, 0.18, { type: "sine", gain: 0.09, slideTo: 980 });
    this.tone(1400, 0.14, { gain: 0.05, delay: 0.1 });
  }

  /** 加载完成 / 骰子亮相 */
  playDice() {
    this.tone(880, 0.1, { gain: 0.08 });
    this.tone(1320, 0.12, { gain: 0.07, delay: 0.08 });
    this.tone(1760, 0.16, { gain: 0.06, delay: 0.16 });
  }

  /** 求签：签筒摇晃 + 出签铃 */
  playLotShake() {
    [520, 480, 540, 500, 560].forEach((freq, i) => {
      this.tone(freq, 0.08, { type: "triangle", gain: 0.07, delay: i * 0.09 });
    });
  }

  /** 签文揭晓 */
  playLotReveal() {
    this.tone(784, 0.2, { type: "triangle", gain: 0.1 });
    this.tone(1175, 0.22, { gain: 0.08, delay: 0.1 });
    this.tone(1568, 0.28, { gain: 0.07, delay: 0.2 });
  }
}

export const soundManager = new SoundManager();
