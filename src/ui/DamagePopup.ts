import { Renderer } from '../core/Renderer';

interface Pop {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
}

export class DamagePopups {
  private pops: Pop[] = [];

  add(x: number, y: number, text: string, color = '#ffffff') {
    this.pops.push({ x, y, text, color, life: 1.0, vy: -14 });
  }

  update(dt: number) {
    for (const p of this.pops) {
      p.y += p.vy * dt;
      p.life -= dt * 0.8;
    }
    this.pops = this.pops.filter((p) => p.life > 0);
  }

  draw(r: Renderer) {
    for (const p of this.pops) {
      const a = Math.max(0, Math.min(1, p.life));
      const col = p.color;
      r.text(p.text, p.x, p.y, col, 9);
    }
  }

  clear() {
    this.pops = [];
  }
}
