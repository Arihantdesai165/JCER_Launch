/**
 * Lightweight WebAudio synthesis engine for the JCER ERP launch ceremony.
 * No external audio files — everything is generated, so nothing can 404
 * during a live ceremony.
 */

type Ctx = AudioContext;

export class LaunchAudio {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private nodes: { stop: () => void }[] = [];

  async start() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") await this.ctx.resume();
      return;
    }
    const AC: typeof AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.85;
    this.master.connect(this.ctx.destination);
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  private get t() {
    return this.ctx?.currentTime ?? 0;
  }

  private noiseBuffer(seconds: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  /** Soft evolving ambience for the ready screen. */
  ambient() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.075, this.t + 3);
    g.connect(this.master);

    [55, 82.5, 110, 164.8].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i % 2 ? "sine" : "triangle";
      o.frequency.value = f;
      const og = ctx.createGain();
      og.gain.value = 0.5 / (i + 1);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.03;
      const lg = ctx.createGain();
      lg.gain.value = 0.2 / (i + 1);
      lfo.connect(lg).connect(og.gain);
      o.connect(og).connect(g);
      o.start();
      lfo.start();
      this.nodes.push({
        stop: () => {
          try {
            o.stop();
            lfo.stop();
          } catch {
            /* noop */
          }
        },
      });
    });
    this.nodes.push({ stop: () => g.disconnect() });
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType = "sine",
    vol = 0.3,
    slideTo?: number,
  ) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, this.t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, this.t + dur);
    g.gain.setValueAtTime(0.0001, this.t);
    g.gain.exponentialRampToValueAtTime(vol, this.t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, this.t + dur);
    o.connect(g).connect(this.master);
    o.start();
    o.stop(this.t + dur + 0.05);
  }

  private noise(dur: number, vol = 0.4, freq = 900, q = 0.7, type: BiquadFilterType = "lowpass") {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(dur);
    const filt = ctx.createBiquadFilter();
    filt.type = type;
    filt.frequency.value = freq;
    filt.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, this.t);
    g.gain.exponentialRampToValueAtTime(0.0001, this.t + dur);
    src.connect(filt).connect(g).connect(this.master);
    src.start();
    src.stop(this.t + dur);
  }

  activation() {
    this.tone(120, 0.9, "sawtooth", 0.28, 900);
    this.tone(440, 0.5, "triangle", 0.18, 1760);
    this.noise(1.2, 0.25, 1800);
  }

  confirm(i: number) {
    this.tone(660 + i * 45, 0.12, "square", 0.09);
  }

  allReady() {
    [523, 659, 784].forEach((f, i) =>
      window.setTimeout(() => this.tone(f, 0.5, "triangle", 0.16), i * 110),
    );
  }

  countdownPulse(n: number) {
    const intensity = Math.min(1, (11 - n) / 8);
    this.tone(70 - n, 0.55, "sine", 0.22 + intensity * 0.25, 45);
    this.noise(0.25, 0.07 + intensity * 0.1, 400 + intensity * 900);
    if (n <= 3) this.tone(180 + (4 - n) * 90, 0.35, "sawtooth", 0.12);
  }

  ignition() {
    this.noise(3.5, 0.75, 420, 0.6);
    this.tone(46, 3.2, "sawtooth", 0.4, 28);
    this.tone(92, 2.2, "square", 0.14, 40);
  }

  rocket() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(6);
    src.loop = true;
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.setValueAtTime(1600, this.t);
    filt.frequency.exponentialRampToValueAtTime(220, this.t + 5.2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, this.t);
    g.gain.exponentialRampToValueAtTime(0.5, this.t + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, this.t + 5.2);
    src.connect(filt).connect(g).connect(this.master);
    src.start();
    src.stop(this.t + 5.3);
  }

  transform() {
    [392, 523, 659, 784, 1046].forEach((f, i) =>
      window.setTimeout(() => this.tone(f, 1.4, "sine", 0.13), i * 140),
    );
    this.noise(2.5, 0.16, 5200, 1, "highpass");
  }

  reveal() {
    [261.6, 329.6, 392, 523.3].forEach((f) => this.tone(f, 3.2, "triangle", 0.13));
    this.tone(65.4, 3.5, "sine", 0.3);
    this.noise(2, 0.2, 4000, 1, "highpass");
  }

  celebrate() {
    for (let i = 0; i < 10; i++) {
      window.setTimeout(() => {
        this.noise(0.7, 0.2, 2400 + Math.random() * 2500, 1, "highpass");
        this.tone(500 + Math.random() * 900, 0.5, "triangle", 0.07);
      }, i * 420);
    }
    [523.3, 659.3, 784, 1046.5].forEach((f, i) =>
      window.setTimeout(() => this.tone(f, 2.4, "sine", 0.11), i * 300),
    );
  }

  finale() {
    [130.8, 196, 261.6, 329.6, 392].forEach((f, i) =>
      window.setTimeout(() => this.tone(f, 4, "triangle", 0.12), i * 180),
    );
  }

  dispose() {
    this.nodes.forEach((n) => n.stop());
    this.nodes = [];
    try {
      this.ctx?.close();
    } catch {
      /* noop */
    }
    this.ctx = null;
  }
}
