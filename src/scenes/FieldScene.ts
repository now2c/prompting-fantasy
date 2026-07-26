import { Scene, SceneManager } from '../core/SceneManager';
import { Renderer } from '../core/Renderer';
import { input } from '../core/Input';
import { CONFIG, MapDef, NpcDef } from '../core/config';
import { TILES, SPRITES, humanoid } from '../core/Assets';
import { MAPS, tileAt, isSolid } from '../data/maps';
import { DialogueBox } from '../ui/DialogueOverlay';
import { GameState } from '../gameState';
import { SaveSystem } from '../systems/SaveSystem';
import { BattleScene } from './BattleScene';
import { makeEncounter } from '../data/enemies';
import { audio } from '../systems/Audio';

const SPEED = 52;

export class FieldScene implements Scene {
  private scenes: SceneManager;
  private map: MapDef;
  private px = 0;
  private py = 0;
  private facing = { x: 0, y: 1 };
  private dialogue = new DialogueBox();
  private npcSprites = new Map<string, HTMLCanvasElement>();
  transitionLock = 0;
  private transitioning = false;
  private walkT = 0;
  private stepThrottle = 0;
  private time = 0;

  constructor(scenes: SceneManager) {
    this.scenes = scenes;
    this.map = MAPS[GameState.mapId] || MAPS.town;
    const sp = GameState.playerTile;
    this.px = sp.x * CONFIG.tile;
    this.py = sp.y * CONFIG.tile;
    for (const n of this.map.npcs) {
      this.npcSprites.set(n.name, humanoid(n.tint));
    }
  }

  enter() {
    this.dialogue.active = false;
    this.transitioning = false;
    const el = document.getElementById('prompt-input') as HTMLInputElement | null;
    if (el) el.blur();
  }

  private collide(x: number, y: number): boolean {
    const tx0 = Math.floor((x + 2) / CONFIG.tile);
    const tx1 = Math.floor((x + 10) / CONFIG.tile);
    const ty0 = Math.floor((y + 2) / CONFIG.tile);
    const ty1 = Math.floor((y + 10) / CONFIG.tile);
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        if (isSolid(this.map, tx, ty)) return true;
      }
    }
    for (const n of this.map.npcs) {
      if (tx0 <= n.x && n.x <= tx1 && ty0 <= n.y && n.y <= ty1) return true;
    }
    return false;
  }

  update(dt: number) {
    this.time += dt;
    const wasActive = this.dialogue.active;
    this.dialogue.update(dt);
    if (this.dialogue.active) return;
    if (wasActive && !this.dialogue.active) audio.sfx('confirm');
    if (this.transitionLock > 0) this.transitionLock -= dt;

    const d = input.dir();
    const moving = d.x !== 0 || d.y !== 0;
    if (moving) {
      if (d.x !== 0) this.facing = { x: Math.sign(d.x), y: 0 };
      else this.facing = { x: 0, y: Math.sign(d.y) };
      const nx = this.px + d.x * SPEED * dt;
      const ny = this.py + d.y * SPEED * dt;
      if (!this.collide(nx, this.py)) this.px = nx;
      if (!this.collide(this.px, ny)) this.py = ny;
      this.walkT += dt;
      this.stepThrottle -= dt;
      if (this.stepThrottle <= 0) {
        audio.sfx('step');
        this.stepThrottle = 0.25;
      }
    } else {
      this.walkT = 0;
    }

    if (this.transitioning) return;

    const cx = Math.floor((this.px + 6) / CONFIG.tile);
    const cy = Math.floor((this.py + 6) / CONFIG.tile);
    const t = tileAt(this.map, cx, cy);

    if (t === 'O' && this.transitionLock <= 0) {
      this.transitioning = true;
      audio.sfx('transition');
      this.gotoOtherMap();
      return;
    }
    if (t === 'B' && this.transitionLock <= 0) {
      const key = `${this.map.id}@${cx}@${cy}`;
      if (!GameState.consumedBattles.has(key)) {
        this.transitioning = true;
        audio.sfx('battle');
        this.startBattle(cx, cy, key);
        return;
      }
    }

    if (input.anyPressed('Enter', ' ', 'z', 'Z') && this.transitionLock <= 0 && !wasActive) {
      const npc = this.findNpcNear(cx, cy);
      if (npc) {
        this.dialogue.start(npc.name, npc.lines);
        audio.sfx('confirm');
      }
    }
  }

  private findNpcNear(cx: number, cy: number): NpcDef | undefined {
    const candidates = [
      { x: cx + this.facing.x, y: cy + this.facing.y },
      { x: cx + 1, y: cy },
      { x: cx - 1, y: cy },
      { x: cx, y: cy + 1 },
      { x: cx, y: cy - 1 }
    ];
    for (const c of candidates) {
      const npc = this.map.npcs.find((n) => n.x === c.x && n.y === c.y);
      if (npc) return npc;
    }
    return undefined;
  }

  private gotoOtherMap() {
    const next = this.map.id === 'town' ? 'route' : 'town';
    GameState.mapId = next;
    GameState.playerTile = { ...MAPS[next].spawn };
    const newScene = new FieldScene(this.scenes);
    newScene.transitionLock = 0.5;
    this.scenes.set(newScene);
  }

  private startBattle(tx: number, ty: number, key: string) {
    GameState.consumedBattles.add(key);
    GameState.playerTile = {
      x: Math.floor((this.px + 6) / CONFIG.tile),
      y: Math.floor((this.py + 6) / CONFIG.tile)
    };
    SaveSystem.save(GameState.mapId, GameState.playerTile.x, GameState.playerTile.y, GameState.party);
    const ids = ty >= 9 ? ['sorcerer', 'goblin'] : ['goblin', 'wraith'];
    const enemies = makeEncounter(ids);
    this.scenes.set(new BattleScene(this.scenes, enemies, ids.includes('sorcerer')));
  }

  draw(r: Renderer) {
    r.clear('#1a2a1a');
    const worldW = this.map.tiles[0].length * CONFIG.tile;
    const worldH = this.map.tiles.length * CONFIG.tile;
    r.centerOn(this.px + 6, this.py + 6, worldW, worldH);

    for (let ty = 0; ty < this.map.tiles.length; ty++) {
      for (let tx = 0; tx < this.map.tiles[ty].length; tx++) {
        const ch = this.map.tiles[ty][tx];
        const tile = TILES[ch] || TILES['.'];
        r.drawSprite(tile, tx * CONFIG.tile, ty * CONFIG.tile);
      }
    }

    // NPC sprites + "!" indicator
    const pcx = (this.px + 6) / CONFIG.tile;
    const pcy = (this.py + 6) / CONFIG.tile;
    for (const n of this.map.npcs) {
      const s = this.npcSprites.get(n.name)!;
      const bob = Math.sin(this.time * 1.2 + n.x * 0.5 + n.y * 0.7) * 0.5;
      r.drawSprite(s, n.x * CONFIG.tile, n.y * CONFIG.tile + bob);
      const dist = Math.abs(n.x - Math.floor(pcx)) + Math.abs(n.y - Math.floor(pcy));
      if (dist <= 2) {
        const bright = dist <= 1 ? '#ffd86b' : '#9aa0b8';
        const ibob = Math.abs(Math.sin(this.time * 3)) * 2;
        r.text('!', n.x * CONFIG.tile + 6, n.y * CONFIG.tile - 10 - ibob + bob, bright, 9);
      }
    }

    // Player sprite (walk frame)
    const isWalking = this.walkT > 0;
    const frame = isWalking && Math.floor(this.walkT / 0.18) % 2 === 1;
    const spr = SPRITES[frame ? 'vance_w' : 'vance'];
    const pbob = isWalking ? Math.abs(Math.sin(this.walkT * 8)) * 1.5 : Math.sin(this.time * 1.5) * 0.5;
    r.drawSprite(spr, this.px, this.py + pbob);

    // top hint
    r.rect(0, 0, CONFIG.baseW, 12, 'rgba(0,0,0,0.5)');
    r.text('Arrows/WASD move  Enter talk  step on blue tile to travel', 4, 3, '#cfe8ff', 8);

    this.dialogue.draw(r);
  }
}
