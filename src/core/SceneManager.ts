import { Renderer } from './Renderer';
import { input } from './Input';

export interface Scene {
  enter?(): void;
  update(dt: number): void;
  draw(r: Renderer): void;
  exit?(): void;
}

export class SceneManager {
  current: Scene | null = null;
  private next: Scene | null = null;

  constructor(public renderer: Renderer) {}

  set(scene: Scene) {
    this.next = scene;
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
    this.swap();
    if (this.current) this.current.update(dt);
    input.update();
  }

  draw() {
    if (this.current) this.current.draw(this.renderer);
  }
}
