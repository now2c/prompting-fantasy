import { Renderer } from '../core/Renderer';
import { CONFIG } from '../core/config';
import { input } from '../core/Input';

export class DialogueBox {
  private name = '';
  private lines: string[] = [];
  private index = 0;
  active = false;
  private blink = 0;

  start(name: string, lines: string[]) {
    this.name = name;
    this.lines = lines.slice();
    this.index = 0;
    this.active = true;
  }

  update(dt: number) {
    this.blink += dt;
    if (this.active && input.anyPressed('Enter', ' ', 'z', 'Z')) {
      this.index++;
      if (this.index >= this.lines.length) {
        this.active = false;
      }
    }
  }

  draw(r: Renderer) {
    if (!this.active) return;
    const w = CONFIG.baseW - 16;
    const h = 48;
    const x = 8;
    const y = CONFIG.baseH - h - 8;
    r.rect(x, y, w, h, '#0c0a16');
    r.strokeRect(x, y, w, h, '#f4e7c0', 2);
    if (this.name) r.text(this.name, x + 6, y + 5, '#ffe9a8', 8);
    const line = this.lines[this.index] || '';
    r.text(line, x + 6, y + 18, '#f4e7c0', 8);
    if (Math.floor(this.blink * 2) % 2 === 0) {
      r.text('▼', x + w - 12, y + h - 12, '#f4e7c0', 8);
    }
  }
}
