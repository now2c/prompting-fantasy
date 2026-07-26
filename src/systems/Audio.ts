type Ctx = AudioContext;

function ac(): Ctx {
  const w = window as any;
  return new (w.AudioContext || w.webkitAudioContext)();
}

export class AudioSystem {
  muted = false;
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private bgmTimer: number | null = null;
  private bgmStep = 0;

  constructor() {
    try {
      this.muted = localStorage.getItem('pf_mute') === '1';
    } catch {}
  }

  unlock() {
    if (!this.ctx) {
      this.ctx = ac();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.45;
      this.master.connect(this.ctx.destination);
      this.startBgm();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      localStorage.setItem('pf_mute', this.muted ? '1' : '0');
    } catch {}
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.45, this.ctx.currentTime, 0.02);
    }
  }

  private tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.3, delay = 0) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private sweep(f0: number, f1: number, dur: number, vol = 0.3) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol = 0.3) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1200;
    src.connect(lp);
    lp.connect(g);
    g.connect(this.master);
    src.start(t);
  }

  sfx(name: string) {
    if (!this.ctx) return;
    switch (name) {
      case 'select':
        this.tone(660, 0.06, 'square', 0.18);
        break;
      case 'confirm':
        this.tone(660, 0.06, 'square', 0.22);
        this.tone(990, 0.08, 'square', 0.22, 0.06);
        break;
      case 'step':
        this.tone(180, 0.03, 'square', 0.08);
        break;
      case 'hit':
        this.noise(0.14, 0.35);
        this.tone(120, 0.12, 'square', 0.25);
        break;
      case 'cast':
        this.sweep(220, 880, 0.28, 0.28);
        break;
      case 'heal':
        this.sweep(520, 880, 0.3, 0.25);
        this.tone(1040, 0.2, 'sine', 0.15, 0.1);
        break;
      case 'battle':
        this.tone(440, 0.1, 'square', 0.25);
        this.tone(554, 0.1, 'square', 0.25, 0.1);
        this.tone(659, 0.16, 'square', 0.25, 0.2);
        break;
      case 'transition':
        this.noise(0.25, 0.25);
        break;
      case 'win':
        [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.18, 'square', 0.28, i * 0.12));
        break;
      case 'lose':
        [392, 311, 233, 175].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.3, i * 0.14));
        break;
    }
  }

  private startBgm() {
    if (this.bgmTimer !== null || !this.ctx) return;
    // gentle pentatonic loop
    const pattern = [0, 7, 12, 7, 3, 10, 12, 7, 5, 12, 15, 12, 3, 10, 7, 5];
    const bass = [0, 0, 7, 7, 5, 5, 3, 3, 0, 0, 7, 7, 5, 5, 10, 10];
    const root = 196; // G3
    const stepMs = 200;
    this.bgmTimer = window.setInterval(() => {
      if (!this.ctx || !this.master) return;
      const i = this.bgmStep % pattern.length;
      const f = root * Math.pow(2, pattern[i] / 12);
      this.tone(f, 0.18, 'triangle', 0.08);
      if (i % 2 === 0) this.tone(root * Math.pow(2, bass[i] / 12) / 2, 0.22, 'square', 0.07);
      this.bgmStep++;
    }, stepMs);
  }
}

export const audio = new AudioSystem();
