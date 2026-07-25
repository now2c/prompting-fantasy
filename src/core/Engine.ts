import { Renderer } from './Renderer';
import { SceneManager } from './SceneManager';

export class Engine {
  renderer: Renderer;
  scenes: SceneManager;
  private last = 0;
  private running = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.scenes = new SceneManager(this.renderer);
  }

  start(scene: import('./SceneManager').Scene) {
    this.scenes.set(scene);
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    if (!this.running) return;
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.1) dt = 0.1;
    this.scenes.update(dt);
    this.scenes.draw();
    requestAnimationFrame(this.frame);
  };
}
