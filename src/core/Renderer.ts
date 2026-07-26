import { CONFIG } from './config';

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  camX = 0;
  camY = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.width = CONFIG.baseW;
    canvas.height = CONFIG.baseH;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    this.ctx = ctx;
    this.setDisplayScale(CONFIG.scale);
  }

  setDisplayScale(s: number) {
    this.canvas.style.width = CONFIG.baseW * s + 'px';
    this.canvas.style.height = CONFIG.baseH * s + 'px';
  }

  clear(color = '#000') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, CONFIG.baseW, CONFIG.baseH);
  }

  setCamera(x: number, y: number) {
    this.camX = Math.round(x);
    this.camY = Math.round(y);
  }

  centerOn(worldX: number, worldY: number, worldW: number, worldH: number) {
    let cx = worldX - CONFIG.baseW / 2;
    let cy = worldY - CONFIG.baseH / 2;
    cx = Math.max(0, Math.min(cx, Math.max(0, worldW - CONFIG.baseW)));
    cy = Math.max(0, Math.min(cy, Math.max(0, worldH - CONFIG.baseH)));
    this.setCamera(cx, cy);
  }

  drawSprite(img: CanvasImageSource, x: number, y: number) {
    this.ctx.drawImage(img, Math.round(x - this.camX), Math.round(y - this.camY));
  }

  drawSpriteFlipped(img: HTMLCanvasElement, x: number, y: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(Math.round(x - this.camX) + img.width, Math.round(y - this.camY));
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }

  fillWorldRect(x: number, y: number, w: number, h: number, color: string) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x - this.camX), Math.round(y - this.camY), w, h);
  }

  // Screen-space helpers (ignore camera)
  rect(x: number, y: number, w: number, h: number, color: string) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }

  strokeRect(x: number, y: number, w: number, h: number, color: string, t = 1) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = t;
    this.ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }

  setAlpha(a: number) {
    this.ctx.globalAlpha = Math.max(0, Math.min(1, a));
  }

  clearAlpha() {
    this.ctx.globalAlpha = 1;
  }

  text(str: string, x: number, y: number, color = '#f4e7c0', size = 8, outline = false) {
    if (outline) {
      this.ctx.font = `${size}px monospace`;
      this.ctx.textBaseline = 'top';
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.ctx.fillText(str, x + 1, y + 1);
    }
    this.ctx.font = `${size}px monospace`;
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = color;
    this.ctx.fillText(str, x, y);
  }

  heading(str: string, x: number, y: number, color = '#ffd86b', size = 16) {
    this.ctx.font = `${size}px "Press Start 2P", monospace`;
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillText(str, x + 2, y + 2);
    this.ctx.fillStyle = color;
    this.ctx.fillText(str, x, y);
  }

  measure(str: string, size = 8): number {
    this.ctx.font = `${size}px monospace`;
    return this.ctx.measureText(str).width;
  }

  flash(color = 'rgba(255,255,255,0.7)', a = 0.5) {
    this.ctx.fillStyle = color.replace(/[\d.]+\)$/, a + ')');
    this.ctx.fillRect(0, 0, CONFIG.baseW, CONFIG.baseH);
  }
}
