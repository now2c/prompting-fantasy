import { Renderer } from '../core/Renderer';
import { Combatant } from '../core/config';

export function drawBar(
  r: Renderer,
  x: number,
  y: number,
  w: number,
  h: number,
  ratio: number,
  color: string,
  bg = '#2a2230'
) {
  r.rect(x, y, w, h, bg);
  const v = Math.max(0, Math.min(1, ratio));
  r.rect(x, y, Math.round(w * v), h, color);
  r.strokeRect(x, y, w, h, '#000', 1);
}

export function nameAndBars(r: Renderer, c: Combatant, x: number, y: number) {
  r.text(c.name, x, y, '#f4e7c0', 8);
  drawBar(r, x, y + 10, 56, 4, c.hp / c.maxHp, '#3ad23b');
  drawBar(r, x, y + 16, 56, 3, c.mp / c.maxMp, '#3b8fd2');
  r.text(`${Math.max(0, c.hp)}/${c.maxHp}`, x + 60, y + 9, '#9fe0a0', 7);
  if (c.guarding) r.text('GUARD', x + 60, y + 15, '#e0c040', 7);
}
