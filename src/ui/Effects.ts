import { Renderer } from '../core/Renderer';
import { Element } from '../core/config';

interface Part {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  grav: number;
}

interface Bolt {
  x: number;
  y: number;
  t: number;
  dur: number;
  color: string;
  kind: 'zig' | 'beam' | 'slash' | 'ring';
  w?: number;
}

export class Effects {
  private parts: Part[] = [];
  private bolts: Bolt[] = [];

  clear() {
    this.parts = [];
    this.bolts = [];
  }

  private part(x: number, y: number, vx: number, vy: number, life: number, color: string, size: number, grav: number) {
    this.parts.push({ x, y, vx, vy, life, max: life, color, size, grav });
  }

  private bolt(x: number, y: number, dur: number, color: string, kind: Bolt['kind'], w = 0) {
    this.bolts.push({ x, y, t: dur, dur, color, kind, w });
  }

  castFlash(x: number, y: number) {
    this.bolt(x + 8, y + 8, 0.25, '#ffffff', 'ring', 14);
  }

  spawnElement(el: Element, x: number, y: number) {
    const cx = x + 8;
    const cy = y + 8;
    switch (el) {
      case 'fire':
        for (let i = 0; i < 12; i++)
          this.part(cx + (Math.random() * 10 - 5), cy + 6, Math.random() * 20 - 10, -30 - Math.random() * 30, 0.5, i % 2 ? '#ff7b2e' : '#ffd24a', 2, -10);
        break;
      case 'ice':
        for (let i = 0; i < 10; i++)
          this.part(cx + (Math.random() * 12 - 6), cy - 6, Math.random() * 16 - 8, 18 + Math.random() * 26, 0.45, i % 2 ? '#bfe8ff' : '#7fc8ff', 2, 10);
        break;
      case 'lightning':
        this.bolt(cx, cy - 18, 0.18, '#fff27a', 'zig');
        break;
      case 'earth':
        for (let i = 0; i < 9; i++)
          this.part(cx + (Math.random() * 16 - 8), cy - 4, Math.random() * 40 - 20, -40 - Math.random() * 20, 0.6, '#8a6a3a', 2, 80);
        break;
      case 'holy':
        this.bolt(cx, cy - 20, 0.3, '#fff0a0', 'beam');
        for (let i = 0; i < 8; i++)
          this.part(cx + (Math.random() * 10 - 5), cy + 6, Math.random() * 16 - 8, -24 - Math.random() * 20, 0.5, '#ffe06b', 2, -8);
        break;
      case 'heal':
        for (let i = 0; i < 12; i++)
          this.part(cx + (Math.random() * 12 - 6), cy + 8, Math.random() * 12 - 6, -26 - Math.random() * 22, 0.6, i % 2 ? '#7CFC7C' : '#bdffce', 2, -10);
        break;
      case 'slash':
        this.bolt(cx, cy, 0.2, '#ffffff', 'slash');
        break;
      case 'guard':
        this.bolt(cx, cy, 0.4, '#9fe0ff', 'ring', 16);
        break;
    }
  }

  update(dt: number) {
    for (const p of this.parts) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.grav * dt;
      p.life -= dt;
    }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const b of this.bolts) b.t -= dt;
    this.bolts = this.bolts.filter((b) => b.t > 0);
  }

  draw(r: Renderer) {
    for (const p of this.parts) {
      const a = Math.max(0, Math.min(1, p.life / p.max));
      r.setAlpha(a);
      r.rect(p.x, p.y, p.size, p.size, p.color);
    }
    r.clearAlpha();
    for (const b of this.bolts) {
      const k = b.t / b.dur; // 1 -> 0
      const a = Math.max(0, Math.min(1, k));
      r.setAlpha(a);
      if (b.kind === 'zig') {
        r.ctx.strokeStyle = b.color;
        r.ctx.lineWidth = 2;
        r.ctx.beginPath();
        r.ctx.moveTo(b.x, b.y);
        r.ctx.lineTo(b.x - 4, b.y + 6);
        r.ctx.lineTo(b.x + 4, b.y + 12);
        r.ctx.lineTo(b.x - 3, b.y + 20);
        r.ctx.stroke();
      } else if (b.kind === 'beam') {
        r.rect(b.x - 3, b.y, 6, 40, b.color);
        r.rect(b.x - 1, b.y, 2, 40, '#ffffff');
      } else if (b.kind === 'slash') {
        r.ctx.strokeStyle = b.color;
        r.ctx.lineWidth = 2;
        r.ctx.beginPath();
        r.ctx.moveTo(b.x - 8, b.y + 8);
        r.ctx.lineTo(b.x + 8, b.y - 8);
        r.ctx.stroke();
      } else if (b.kind === 'ring') {
        const rad = (1 - k) * (b.w || 14) + 2;
        r.ctx.strokeStyle = b.color;
        r.ctx.lineWidth = 2;
        r.ctx.beginPath();
        r.ctx.arc(b.x, b.y, rad, 0, Math.PI * 2);
        r.ctx.stroke();
      }
    }
    r.clearAlpha();
  }
}
