import { Scene } from '../core/SceneManager';
import { Renderer } from '../core/Renderer';
import { input } from '../core/Input';
import { CONFIG } from '../core/config';
import { GameState } from '../gameState';
import { SaveSystem } from '../systems/SaveSystem';
import { FieldScene } from './FieldScene';
import { SceneManager } from '../core/SceneManager';
import { audio } from '../systems/Audio';

const STARS: [number, number][] = [];
for (let i = 0; i < 40; i++) STARS.push([Math.random() * 256, Math.random() * 224]);

export class TitleScene implements Scene {
  private scenes: SceneManager;
  private sel = 0;
  private t = 0;

  constructor(scenes: SceneManager) {
    this.scenes = scenes;
  }

  enter() {
    const el = document.getElementById('prompt-input') as HTMLInputElement;
    if (el) {
      el.style.display = 'none';
      el.blur();
    }
  }

  update(dt: number) {
    this.t += dt;
    const hasSave = SaveSystem.has();
    if (hasSave) {
      if (input.wasPressed('ArrowUp') || input.wasPressed('ArrowDown')) {
        this.sel = this.sel ? 0 : 1;
        audio.sfx('select');
      }
      if (input.wasPressed('c') || input.wasPressed('C')) {
        this.sel = 1;
        audio.sfx('select');
      }
    }
    if (input.anyPressed('Enter', ' ', 'z', 'Z')) {
      audio.sfx('confirm');
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

    // stars
    for (const [sx, sy] of STARS) {
      const twinkle = Math.sin(this.t * 2 + sx * 0.1 + sy * 0.13) > 0.3;
      if (twinkle) r.rect(sx, sy, 1, 1, '#cfe8ff');
    }

    // ground silhouette
    r.rect(0, 160, CONFIG.baseW, 64, '#0a0a14');
    r.rect(0, 158, CONFIG.baseW, 2, '#1a1a2a');
    // castle silhouette
    r.rect(80, 120, 12, 38, '#0e0e1a');
    r.rect(92, 128, 20, 30, '#0e0e1a');
    r.rect(112, 120, 12, 38, '#0e0e1a');
    r.rect(76, 116, 8, 6, '#0e0e1a');
    r.rect(116, 116, 8, 6, '#0e0e1a');
    // small silhouettes (heroes)
    r.rect(160, 146, 8, 12, '#1a1a2a');
    r.rect(170, 144, 8, 14, '#1a1a2a');
    r.rect(180, 147, 8, 11, '#1a1a2a');

    // title
    r.heading('PROMPTING', CONFIG.baseW / 2 - 66, 30, '#ffd86b', 14);
    r.heading('FANTASY', CONFIG.baseW / 2 - 56, 50, '#ffd86b', 14);
    r.text('— command with words —', CONFIG.baseW / 2 - 60, 72, '#cfe8ff', 8);

    const hasSave = SaveSystem.has();
    const items = hasSave ? ['New Game', 'Continue'] : ['New Game'];
    items.forEach((label, i) => {
      const y = 100 + i * 16;
      const selected = i === this.sel && hasSave;
      const color = selected ? '#ffe9a8' : '#9aa0b8';
      r.text((selected ? '▶ ' : '  ') + label, CONFIG.baseW / 2 - 44, y, color, 9);
    });

    if (Math.floor(this.t * 2) % 2 === 0) {
      r.text('Press Enter', CONFIG.baseW / 2 - 32, 140, '#f4e7c0', 8);
    }
    r.text('Type prompts in battle to cast spells', CONFIG.baseW / 2 - 92, 186, '#4a5070', 7);
    r.text('M: mute', CONFIG.baseW - 36, 214, '#4a5070', 7);
  }
}
