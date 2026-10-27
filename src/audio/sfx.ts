class MinerSoundFX {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private masterGain: GainNode | null = null;
  private echoDelay: DelayNode | null = null;
  private bgmAudio: HTMLAudioElement | null = null;

  public enabled = true;
  private lastDigTime = 0;

  private ensureBgmElement(): HTMLAudioElement {
    if (!this.bgmAudio) {
      const audio = new Audio('/audio/lofi-bgm.mp4');
      audio.loop = true;
      audio.autoplay = true;
      audio.preload = 'auto';
      audio.volume = 0.55;
      audio.setAttribute('playsinline', 'true');
      this.bgmAudio = audio;
    }
    return this.bgmAudio;
  }

  private ensureContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.72;
      this.masterGain.connect(this.ctx.destination);

      // Subtle cavern echo network for pickaxe & revolver impacts
      this.echoDelay = this.ctx.createDelay(1.0);
      this.echoDelay.delayTime.value = 0.24;
      const echoFeedback = this.ctx.createGain();
      echoFeedback.gain.value = 0.3;
      const echoFilter = this.ctx.createBiquadFilter();
      echoFilter.type = 'lowpass';
      echoFilter.frequency.value = 1350;

      this.echoDelay.connect(echoFilter);
      echoFilter.connect(echoFeedback);
      echoFeedback.connect(this.echoDelay);
      echoFilter.connect(this.masterGain);

      this.noiseBuffer = this.createNoiseBuffer(this.ctx, 3.0);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private createNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.08 * white) / 1.08;
      data[i] = lastOut * 2.1 + white * 0.32;
    }
    return buffer;
  }

  public isBgmPlaying(): boolean {
    return Boolean(this.bgmAudio && !this.bgmAudio.paused);
  }

  /**
   * Since sound is ON by default, starts or resumes BGM & WebAudio immediately on load
   * or on the very first scroll/tap/click/key interaction if browser deferred autoplay.
   */
  public async resumeIfEnabled(): Promise<boolean> {
    if (!this.enabled) return false;
    this.ensureContext();
    const bgm = this.ensureBgmElement();
    if (!bgm.paused) return true;
    try {
      await bgm.play();
      return true;
    } catch {
      return false;
    }
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    const bgm = this.ensureBgmElement();

    if (this.enabled) {
      this.ensureContext();
      bgm.play().catch(() => {});
    } else {
      bgm.pause();
    }
    return this.enabled;
  }

  public setDepthProgress(_progress: number): void {
    // Keep Lofi Guitar BGM warm and steady at all depths
  }

  /**
   * Physical iron pickaxe crunching into solid cave rock
   */
  public playDigCrunch(intensity = 1.0): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;

    const nowMs = performance.now();
    if (nowMs - this.lastDigTime < 90) return;
    this.lastDigTime = nowMs;

    const now = ctx.currentTime;
    const vol = Math.min(1.0, Math.max(0.3, intensity)) * 0.72;

    // 1. Sub-bass rock impact thump
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(135 + Math.random() * 25, now);
    thud.frequency.exponentialRampToValueAtTime(34, now + 0.095);

    thudGain.gain.setValueAtTime(0.22 * vol, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    thud.connect(thudGain);
    thudGain.connect(this.masterGain);
    thud.start(now);
    thud.stop(now + 0.105);

    // 2. Crushing stone / gravel burst
    const rockNoise = ctx.createBufferSource();
    rockNoise.buffer = this.noiseBuffer;
    const rockFilter = ctx.createBiquadFilter();
    rockFilter.type = 'bandpass';
    rockFilter.frequency.setValueAtTime(640 + Math.random() * 260, now);
    rockFilter.Q.value = 1.3;

    const rockGain = ctx.createGain();
    rockGain.gain.setValueAtTime(0.2 * vol, now);
    rockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    rockNoise.connect(rockFilter);
    rockFilter.connect(rockGain);
    rockGain.connect(this.masterGain);
    rockNoise.start(now, Math.random() * 2.0, 0.12);

    // 3. Subtle iron pickaxe metallic bite
    const metal = ctx.createOscillator();
    const metalGain = ctx.createGain();
    metal.type = 'triangle';
    const metalFreq = 1480 + Math.random() * 380;
    metal.frequency.setValueAtTime(metalFreq, now);
    metal.frequency.exponentialRampToValueAtTime(metalFreq * 0.72, now + 0.05);

    metalGain.gain.setValueAtTime(0.04 * vol, now);
    metalGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.055);

    metal.connect(metalGain);
    metalGain.connect(this.masterGain);
    if (this.echoDelay) metalGain.connect(this.echoDelay);
    metal.start(now);
    metal.stop(now + 0.06);
  }

  /**
   * Melee slash impact on cave monsters
   */
  public playSlashHit(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = ctx.currentTime;

    const punch = ctx.createOscillator();
    const punchGain = ctx.createGain();
    punch.type = 'triangle';
    punch.frequency.setValueAtTime(175, now);
    punch.frequency.exponentialRampToValueAtTime(38, now + 0.12);

    punchGain.gain.setValueAtTime(0.22, now);
    punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    punch.connect(punchGain);
    punchGain.connect(this.masterGain);
    punch.start(now);
    punch.stop(now + 0.135);

    const slashSrc = ctx.createBufferSource();
    slashSrc.buffer = this.noiseBuffer;

    const slashFilter = ctx.createBiquadFilter();
    slashFilter.type = 'bandpass';
    slashFilter.Q.value = 2.4;
    slashFilter.frequency.setValueAtTime(1850, now);
    slashFilter.frequency.exponentialRampToValueAtTime(240, now + 0.13);

    const slashGain = ctx.createGain();
    slashGain.gain.setValueAtTime(0.18, now);
    slashGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    slashSrc.connect(slashFilter);
    slashFilter.connect(slashGain);
    slashGain.connect(this.masterGain);
    if (this.echoDelay) slashGain.connect(this.echoDelay);
    slashSrc.start(now, Math.random() * 1.5, 0.15);
  }

  /**
   * Cavern rubble break on sector unlock
   */
  public playRockSmash(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = ctx.currentTime;

    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(105, now);
    sub.frequency.exponentialRampToValueAtTime(26, now + 0.36);

    subGain.gain.setValueAtTime(0.26, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 0.4);

    const rumble = ctx.createBufferSource();
    rumble.buffer = this.noiseBuffer;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(420, now);
    lp.frequency.exponentialRampToValueAtTime(110, now + 0.38);

    const rGain = ctx.createGain();
    rGain.gain.setValueAtTime(0.2, now);
    rGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    rumble.connect(lp);
    lp.connect(rGain);
    rGain.connect(this.masterGain);
    rumble.start(now, Math.random() * 1.2, 0.42);
  }

  /**
   * Echoing revolver blast + bat hit crunch
   */
  public playGunshot(hitBat = true): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = ctx.currentTime;

    const crack = ctx.createBufferSource();
    crack.buffer = this.noiseBuffer;
    const crackFilter = ctx.createBiquadFilter();
    crackFilter.type = 'bandpass';
    crackFilter.frequency.setValueAtTime(1950, now);
    crackFilter.frequency.exponentialRampToValueAtTime(420, now + 0.16);
    crackFilter.Q.value = 1.1;

    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(0.34, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    crack.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(this.masterGain);
    if (this.echoDelay) crackGain.connect(this.echoDelay);
    crack.start(now, Math.random() * 1.5, 0.2);

    const boom = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boom.type = 'sawtooth';
    boom.frequency.setValueAtTime(220, now);
    boom.frequency.exponentialRampToValueAtTime(36, now + 0.14);

    const boomLp = ctx.createBiquadFilter();
    boomLp.type = 'lowpass';
    boomLp.frequency.setValueAtTime(620, now);
    boomLp.frequency.exponentialRampToValueAtTime(95, now + 0.14);

    boomGain.gain.setValueAtTime(0.25, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    boom.connect(boomLp);
    boomLp.connect(boomGain);
    boomGain.connect(this.masterGain);
    boom.start(now);
    boom.stop(now + 0.16);

    const shell = ctx.createOscillator();
    const shellGain = ctx.createGain();
    shell.type = 'sine';
    shell.frequency.setValueAtTime(2950 + Math.random() * 450, now + 0.11);
    shellGain.gain.setValueAtTime(0.03, now + 0.11);
    shellGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.17);
    shell.connect(shellGain);
    shellGain.connect(this.masterGain);
    shell.start(now + 0.11);
    shell.stop(now + 0.18);

    if (hitBat) {
      const screech = ctx.createOscillator();
      const sGain = ctx.createGain();
      screech.type = 'sawtooth';
      screech.frequency.setValueAtTime(1320, now + 0.02);
      screech.frequency.exponentialRampToValueAtTime(290, now + 0.13);

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 900;
      bp.Q.value = 3.5;

      sGain.gain.setValueAtTime(0.075, now + 0.02);
      sGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.14);

      screech.connect(bp);
      bp.connect(sGain);
      sGain.connect(this.masterGain);
      if (this.echoDelay) sGain.connect(this.echoDelay);
      screech.start(now + 0.02);
      screech.stop(now + 0.15);
    }
  }
}

export const minerSfx = new MinerSoundFX();
