import { Scene } from '../core/SceneManager';
import { Renderer } from '../core/Renderer';
import { input } from '../core/Input';
import { CONFIG } from '../core/config';
import { GameState } from '../gameState';
import { SaveSystem } from '../systems/SaveSystem';
import { FieldScene } from './FieldScene';
import { SceneManager } from '../core/SceneManager';

export class TitleScene implements Scene {
  private scenes: SceneManager;
  private sel = 0;
  private t = 0;

  constructor(scenes: SceneManager) {
    this.scenes = scenes;
  }

  enter() {
    const el = document.getElementById('prompt-input') as HTMLInputElement;
    if (el) el.style.display = 'none';
  }

  update(dt: number) {
    this.t += dt;
    const hasSave = SaveSystem.has();
    if (hasSave) {
      if (input.wasPressed('ArrowUp') || input.wasPressed('ArrowDown')) this.sel = this.sel ? 0 : 1;
      if (input.wasPressed('c') || input.wasPressed('C')) this.sel = 1;
    }
    if (input.anyPressed('Enter', ' ', 'z', 'Z')) {
      if (hasSave && this.sel === 1) this.continueGame();
      else this.newGame();
    }
  }

  private newGame() {
    GameState.reset();
    this.scenes.set(new FieldScene(this.scenes));
  }

  private continueGame() {
    const s = SaveSystem.load();
    if (!s) return this.newGame();
    GameState.mapId = s.mapId;
    GameState.playerTile = { x: s.x, y: s.y };
    for (const p of s.party) {
      const c = GameState.party.find((m) => m.id === p.id);
      if (c) {
        c.hp = p.hp;
        c.mp = p.mp;
      }
    }
    this.scenes.set(new FieldScene(this.scenes));
  }

  draw(r: Renderer) {
    r.clear('#05060a');
    r.rect(0, 30, CONFIG.baseW, 60, '#0c0a16');
    r.text('PROMPTING', CONFIG.baseW / 2 - 64, 44, '#ffd86b', 18);
    r.text('FANTASY', CONFIG.baseW / 2 - 56, 66, '#ffd86b', 18);
    r.text('— command with words —', CONFIG.baseW / 2 - 60, 92, '#cfe8ff', 8);

    const hasSave = SaveSystem.has();
    const items = hasSave ? ['New Game', 'Continue'] : ['New Game'];
    items.forEach((label, i) => {
      const y = 130 + i * 16;
      const color = i === this.sel && hasSave ? '#ffe9a8' : '#9aa0b8';
      r.text((i === this.sel && hasSave ? '▶ ' : '  ') + label, CONFIG.baseW / 2 - 44, y, color, 9);
    });

    if (Math.floor(this.t * 2) % 2 === 0) {
      r.text('Press Enter', CONFIG.baseW / 2 - 32, 178, '#f4e7c0', 8);
    }
    r.text('Type prompts in battle to cast spells', CONFIG.baseW / 2 - 92, 200, '#6a7090', 7);
  }
}
