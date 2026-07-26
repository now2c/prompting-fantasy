import { Renderer } from './Renderer';
import { input } from './Input';
import { audio } from '../systems/Audio';

export interface Scene {
  enter?(): void;
  update(dt: number): void;
  draw(r: Renderer): void;
  exit?(): void;
}

export class SceneManager {
  current: Scene | null = null;
  private next: Scene | null = null;
  private fade = 0;
  private mode: 'none' | 'out' | 'in' = 'none';

  constructor(public renderer: Renderer) {}

  set(scene: Scene) {
    if (this.next === scene) return;
    this.next = scene;
    this.mode = 'out';
  }

  private swap() {
    if (this.next) {
      if (this.current && this.current.exit) this.current.exit();
      this.current = this.next;
      this.next = null;
      if (this.current.enter) this.current.enter();
    }
  }

  update(dt: number) {
    if (this.mode === 'out') {
      this.fade = Math.min(1, this.fade + dt / 0.18);
      if (this.fade >= 1) {
        this.swap();
        this.mode = 'in';
      }
    } else if (this.mode === 'in') {
      this.fade = Math.max(0, this.fade - dt / 0.2);
      if (this.fade <= 0) this.mode = 'none';
    }
    if (this.current) this.current.update(dt);
    input.update();
  }

  draw() {
    if (this.current) this.current.draw(this.renderer);
    if (this.fade > 0) {
      this.renderer.rect(0, 0, 256, 224, `rgba(0,0,0,${this.fade})`);
    }
    const ind = audio.muted ? 'x' : '♪';
    this.renderer.text(ind, 248 - 8, 2, audio.muted ? '#888' : '#9fe0a0', 7);
  }
}
