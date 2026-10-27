class MinerSoundFX {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private masterGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private echoDelay: DelayNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;

  public enabled = false;
  private ambienceStarted = false;
  private horrorEventTimer = 0;
  private lastDigTime = 0;
  private depthProgress = 0;

  private ensureContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;
      this.masterGain.connect(this.ctx.destination);

      // Cavern echo feedback network for horror drips & metallic impacts
      this.echoDelay = this.ctx.createDelay(1.0);
      this.echoDelay.delayTime.value = 0.27;
      const echoFeedback = this.ctx.createGain();
      echoFeedback.gain.value = 0.38;
      const echoFilter = this.ctx.createBiquadFilter();
      echoFilter.type = 'lowpass';
      echoFilter.frequency.value = 1350;

      this.echoDelay.connect(echoFilter);
      echoFilter.connect(echoFeedback);
      echoFeedback.connect(this.echoDelay);
      echoFilter.connect(this.masterGain);

      this.noiseBuffer = this.createNoiseBuffer(this.ctx, 4.0);
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
      // Blend of pink/brownish gritty noise for realistic rock & cave wind
      lastOut = (lastOut + 0.08 * white) / 1.08;
      data[i] = lastOut * 2.1 + white * 0.32;
    }
    return buffer;
  }

  public enable(): boolean {
    if (this.enabled) return true;
    this.enabled = true;
    const ctx = this.ensureContext();
    if (ctx) {
      this.startHorrorAmbience();
      this.playDigCrunch(0.7);
    }
    return this.enabled;
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    const ctx = this.ensureContext();
    if (!ctx) return false;

    if (this.enabled) {
      this.startHorrorAmbience();
      if (this.ambienceGain) {
        this.ambienceGain.gain.cancelScheduledValues(ctx.currentTime);
        this.ambienceGain.gain.setTargetAtTime(1.0, ctx.currentTime, 0.35);
      }
      this.playDigCrunch(0.8);
    } else {
      if (this.ambienceGain) {
        this.ambienceGain.gain.cancelScheduledValues(ctx.currentTime);
        this.ambienceGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15);
      }
      window.clearTimeout(this.horrorEventTimer);
    }
    return this.enabled;
  }

  public setDepthProgress(progress: number): void {
    this.depthProgress = Math.max(0, Math.min(1, progress));
    if (!this.ctx || !this.enabled || !this.droneOsc1 || !this.droneOsc2 || !this.droneFilter) {
      return;
    }
    const now = this.ctx.currentTime;
    // Pitch subtly sinks into deeper abyssal dread as you descend
    const baseFreq = 41.2 - this.depthProgress * 7.5;
    this.droneOsc1.frequency.setTargetAtTime(baseFreq, now, 0.25);
    this.droneOsc2.frequency.setTargetAtTime(baseFreq * 1.014, now, 0.25);
    this.droneFilter.frequency.setTargetAtTime(95 + this.depthProgress * 75, now, 0.25);
  }

  private startHorrorAmbience(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;

    if (!this.ambienceStarted) {
      this.ambienceStarted = true;
      this.ambienceGain = ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(0.001, ctx.currentTime);
      this.ambienceGain.gain.setTargetAtTime(1.0, ctx.currentTime, 0.6);
      this.ambienceGain.connect(this.masterGain);

      // 1. Deep Abyssal Sub-Drone (detuned dark oscillators + slow breathing filter)
      this.droneFilter = ctx.createBiquadFilter();
      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.value = 105;
      this.droneFilter.Q.value = 2.8;

      const droneGain = ctx.createGain();
      droneGain.gain.value = 0.16;

      this.droneOsc1 = ctx.createOscillator();
      this.droneOsc1.type = 'sawtooth';
      this.droneOsc1.frequency.value = 41.2; // E1

      this.droneOsc2 = ctx.createOscillator();
      this.droneOsc2.type = 'triangle';
      this.droneOsc2.frequency.value = 41.8; // Slow eerie beating

      // Eerie tritone / dark fifth shadow tone
      const tritoneOsc = ctx.createOscillator();
      tritoneOsc.type = 'sine';
      tritoneOsc.frequency.value = 58.27; // Bb1 (tritone above E1!)
      const tritoneGain = ctx.createGain();
      tritoneGain.gain.value = 0.045;

      // Slow breathing LFO on drone filter
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.11;
      const lfoDepth = ctx.createGain();
      lfoDepth.gain.value = 38;
      lfo.connect(lfoDepth);
      lfoDepth.connect(this.droneFilter.frequency);

      this.droneOsc1.connect(this.droneFilter);
      this.droneOsc2.connect(this.droneFilter);
      tritoneOsc.connect(tritoneGain);
      tritoneGain.connect(this.ambienceGain);
      this.droneFilter.connect(droneGain);
      droneGain.connect(this.ambienceGain);

      this.droneOsc1.start();
      this.droneOsc2.start();
      tritoneOsc.start();
      lfo.start();

      // 2. Howling Subterranean Cave Wind (looped noise + sweeping resonant bandpass)
      const windSource = ctx.createBufferSource();
      windSource.buffer = this.noiseBuffer;
      windSource.loop = true;

      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.value = 260;
      windFilter.Q.value = 6.5;

      const windLfo = ctx.createOscillator();
      windLfo.type = 'sine';
      windLfo.frequency.value = 0.07;
      const windLfoGain = ctx.createGain();
      windLfoGain.gain.value = 115;
      windLfo.connect(windLfoGain);
      windLfoGain.connect(windFilter.frequency);

      const windGain = ctx.createGain();
      windGain.gain.value = 0.095;

      windSource.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(this.ambienceGain);

      windSource.start();
      windLfo.start();
    }

    this.scheduleNextHorrorEvent();
  }

  private scheduleNextHorrorEvent(): void {
    window.clearTimeout(this.horrorEventTimer);
    if (!this.enabled) return;
    const delayMs = 2600 + Math.random() * 3400;
    this.horrorEventTimer = window.setTimeout(() => {
      if (!this.enabled) return;
      const roll = Math.random();
      if (roll < 0.48) {
        this.playCaveWaterDrip();
      } else if (roll < 0.78) {
        this.playEerieCaveWhisper();
      } else {
        this.playTimberGroan();
      }
      this.scheduleNextHorrorEvent();
    }, delayMs);
  }

  private playCaveWaterDrip(): void {
    const ctx = this.ctx;
    if (!ctx || !this.ambienceGain || !this.echoDelay) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const startF = 920 + Math.random() * 520;
    osc.frequency.setValueAtTime(startF, now);
    osc.frequency.exponentialRampToValueAtTime(startF * 0.58, now + 0.045);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ambienceGain);
    gain.connect(this.echoDelay);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  private playEerieCaveWhisper(): void {
    const ctx = this.ctx;
    if (!ctx || !this.ambienceGain || !this.noiseBuffer || !this.echoDelay) return;
    const now = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 11;
    const fStart = 420 + Math.random() * 380;
    bp.frequency.setValueAtTime(fStart, now);
    bp.frequency.exponentialRampToValueAtTime(fStart * 0.48, now + 1.35);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0005, now);
    gain.gain.linearRampToValueAtTime(0.055, now + 0.45);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 1.45);

    src.connect(bp);
    bp.connect(gain);
    gain.connect(this.ambienceGain);
    gain.connect(this.echoDelay);
    src.start(now, Math.random() * 2.0, 1.5);
  }

  private playTimberGroan(): void {
    const ctx = this.ctx;
    if (!ctx || !this.ambienceGain || !this.echoDelay) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(98 + Math.random() * 26, now);
    osc.frequency.linearRampToValueAtTime(72, now + 0.9);

    const lp = ctx.createBiquadFilter();
    lp.type = 'bandpass';
    lp.frequency.value = 165;
    lp.Q.value = 8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0005, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.95);

    osc.connect(lp);
    lp.connect(gain);
    gain.connect(this.ambienceGain);
    gain.connect(this.echoDelay);
    osc.start(now);
    osc.stop(now + 1.0);
  }

  /**
   * Heavy physical iron pickaxe crunching into solid cave rock
   */
  public playDigCrunch(intensity = 1.0): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;

    const nowMs = performance.now();
    if (nowMs - this.lastDigTime < 82) return; // Prevent rapid-scroll clipping
    this.lastDigTime = nowMs;

    const now = ctx.currentTime;
    const vol = Math.min(1.2, Math.max(0.35, intensity));

    // 1. Sub-bass rock impact thump
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(135 + Math.random() * 25, now);
    thud.frequency.exponentialRampToValueAtTime(34, now + 0.095);

    thudGain.gain.setValueAtTime(0.24 * vol, now);
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
    rockGain.gain.setValueAtTime(0.22 * vol, now);
    rockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    rockNoise.connect(rockFilter);
    rockFilter.connect(rockGain);
    rockGain.connect(this.masterGain);
    rockNoise.start(now, Math.random() * 2.5, 0.12);

    // 3. Cold iron pickaxe metallic bite (subtle dark ring)
    const metal = ctx.createOscillator();
    const metalGain = ctx.createGain();
    metal.type = 'triangle';
    const metalFreq = 1480 + Math.random() * 380;
    metal.frequency.setValueAtTime(metalFreq, now);
    metal.frequency.exponentialRampToValueAtTime(metalFreq * 0.72, now + 0.05);

    metalGain.gain.setValueAtTime(0.045 * vol, now);
    metalGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.055);

    metal.connect(metalGain);
    metalGain.connect(this.masterGain);
    if (this.echoDelay) metalGain.connect(this.echoDelay);
    metal.start(now);
    metal.stop(now + 0.06);
  }

  /**
   * Visceral heavy melee slash impact on cave monsters
   */
  public playSlashHit(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = ctx.currentTime;

    // 1. Heavy flesh/bone punch
    const punch = ctx.createOscillator();
    const punchGain = ctx.createGain();
    punch.type = 'triangle';
    punch.frequency.setValueAtTime(175, now);
    punch.frequency.exponentialRampToValueAtTime(38, now + 0.12);

    punchGain.gain.setValueAtTime(0.28, now);
    punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    punch.connect(punchGain);
    punchGain.connect(this.masterGain);
    punch.start(now);
    punch.stop(now + 0.135);

    // 2. Razor slash & monster shatter hiss
    const slashSrc = ctx.createBufferSource();
    slashSrc.buffer = this.noiseBuffer;

    const slashFilter = ctx.createBiquadFilter();
    slashFilter.type = 'bandpass';
    slashFilter.Q.value = 2.4;
    slashFilter.frequency.setValueAtTime(1850, now);
    slashFilter.frequency.exponentialRampToValueAtTime(240, now + 0.13);

    const slashGain = ctx.createGain();
    slashGain.gain.setValueAtTime(0.24, now);
    slashGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    slashSrc.connect(slashFilter);
    slashFilter.connect(slashGain);
    slashGain.connect(this.masterGain);
    if (this.echoDelay) slashGain.connect(this.echoDelay);
    slashSrc.start(now, Math.random() * 2.0, 0.15);
  }

  /**
   * Deep seismic cavern collapse + dark horror iron toll on sector unlock
   */
  public playRockSmash(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = ctx.currentTime;

    // 1. Seismic sub-drop
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(105, now);
    sub.frequency.exponentialRampToValueAtTime(24, now + 0.42);

    subGain.gain.setValueAtTime(0.34, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 0.46);

    // 2. Crumbling cavern rubble roar
    const rumble = ctx.createBufferSource();
    rumble.buffer = this.noiseBuffer;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(420, now);
    lp.frequency.exponentialRampToValueAtTime(110, now + 0.45);

    const rGain = ctx.createGain();
    rGain.gain.setValueAtTime(0.28, now);
    rGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

    rumble.connect(lp);
    lp.connect(rGain);
    rGain.connect(this.masterGain);
    rumble.start(now, Math.random() * 1.5, 0.5);

    // 3. Dark ominous subterranean iron toll (tritone resonance, NOT cheerful chime!)
    for (const freq of [164.81, 233.08]) {
      const bell = ctx.createOscillator();
      const bGain = ctx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(freq, now + 0.02);

      bGain.gain.setValueAtTime(0.08, now + 0.02);
      bGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.85);

      bell.connect(bGain);
      bGain.connect(this.masterGain);
      if (this.echoDelay) bGain.connect(this.echoDelay);
      bell.start(now + 0.02);
      bell.stop(now + 0.88);
    }
  }

  /**
   * Echoing underground old-west revolver / cavern shotgun blast + bat hit crunch
   */
  public playGunshot(hitBat = true): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = ctx.currentTime;

    // 1. Sharp gunpowder crack transient
    const crack = ctx.createBufferSource();
    crack.buffer = this.noiseBuffer;
    const crackFilter = ctx.createBiquadFilter();
    crackFilter.type = 'bandpass';
    crackFilter.frequency.setValueAtTime(1950, now);
    crackFilter.frequency.exponentialRampToValueAtTime(420, now + 0.16);
    crackFilter.Q.value = 1.1;

    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(0.42, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    crack.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(this.masterGain);
    if (this.echoDelay) crackGain.connect(this.echoDelay);
    crack.start(now, Math.random() * 2.0, 0.2);

    // 2. Heavy revolver barrel boom
    const boom = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boom.type = 'sawtooth';
    boom.frequency.setValueAtTime(220, now);
    boom.frequency.exponentialRampToValueAtTime(36, now + 0.14);

    const boomLp = ctx.createBiquadFilter();
    boomLp.type = 'lowpass';
    boomLp.frequency.setValueAtTime(620, now);
    boomLp.frequency.exponentialRampToValueAtTime(95, now + 0.14);

    boomGain.gain.setValueAtTime(0.32, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    boom.connect(boomLp);
    boomLp.connect(boomGain);
    boomGain.connect(this.masterGain);
    boom.start(now);
    boom.stop(now + 0.16);

    // 3. Brass shell casing clink + bat impact screech/splat on hit
    const shell = ctx.createOscillator();
    const shellGain = ctx.createGain();
    shell.type = 'sine';
    shell.frequency.setValueAtTime(2950 + Math.random() * 450, now + 0.11);
    shellGain.gain.setValueAtTime(0.035, now + 0.11);
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

      sGain.gain.setValueAtTime(0.09, now + 0.02);
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
