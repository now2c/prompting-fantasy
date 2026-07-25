import { Scene, SceneManager } from '../core/SceneManager';
import { Renderer } from '../core/Renderer';
import { input } from '../core/Input';
import { CONFIG, MapDef } from '../core/config';
import { TILES, SPRITES, humanoid } from '../core/Assets';
import { MAPS, tileAt, isSolid } from '../data/maps';
import { DialogueBox } from '../ui/DialogueOverlay';
import { GameState } from '../gameState';
import { SaveSystem } from '../systems/SaveSystem';
import { BattleScene } from './BattleScene';
import { makeEncounter } from '../data/enemies';

const SPEED = 52;

export class FieldScene implements Scene {
  private scenes: SceneManager;
  private map: MapDef;
  private px = 0;
  private py = 0;
  private facing = { x: 0, y: 1 };
  private dialogue = new DialogueBox();
  private npcSprites = new Map<string, HTMLCanvasElement>();
  private transitionLock = 0;

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
  }

  private collide(x: number, y: number): boolean {
    const pts = [
      [x + 2, y + 2],
      [x + 10, y + 2],
      [x + 2, y + 10],
      [x + 10, y + 10]
    ];
    for (const [cx, cy] of pts) {
      const tx = Math.floor(cx / CONFIG.tile);
      const ty = Math.floor(cy / CONFIG.tile);
      if (isSolid(this.map, tx, ty)) return true;
    }
    return false;
  }

  update(dt: number) {
    this.dialogue.update(dt);
    if (this.dialogue.active) return;
    if (this.transitionLock > 0) this.transitionLock -= dt;

    const d = input.dir();
    if (d.x !== 0 || d.y !== 0) {
      if (d.x !== 0) this.facing = { x: Math.sign(d.x), y: 0 };
      else this.facing = { x: 0, y: Math.sign(d.y) };
      const nx = this.px + d.x * SPEED * dt;
      const ny = this.py + d.y * SPEED * dt;
      if (!this.collide(nx, this.py)) this.px = nx;
      if (!this.collide(this.px, ny)) this.py = ny;
    }

    const cx = Math.floor((this.px + 6) / CONFIG.tile);
    const cy = Math.floor((this.py + 6) / CONFIG.tile);
    const t = tileAt(this.map, cx, cy);

    if (t === 'O' && this.transitionLock <= 0) {
      this.gotoOtherMap();
      return;
    }
    if (t === 'B' && this.transitionLock <= 0) {
      const key = `${this.map.id}@${cx}@${cy}`;
      if (!GameState.consumedBattles.has(key)) {
        this.startBattle(cx, cy, key);
        return;
      }
    }

    if (input.anyPressed('Enter', ' ', 'z', 'Z') && this.transitionLock <= 0) {
      const fx = cx + this.facing.x;
      const fy = cy + this.facing.y;
      const npc = this.map.npcs.find((n) => n.x === fx && n.y === fy);
      if (npc) this.dialogue.start(npc.name, npc.lines);
    }
  }

  private gotoOtherMap() {
    const next = this.map.id === 'town' ? 'route' : 'town';
    GameState.mapId = next;
    GameState.playerTile = { ...MAPS[next].spawn };
    this.transitionLock = 0.4;
    this.scenes.set(new FieldScene(this.scenes));
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

    for (const n of this.map.npcs) {
      const s = this.npcSprites.get(n.name)!;
      r.drawSprite(s, n.x * CONFIG.tile, n.y * CONFIG.tile);
    }

    r.drawSprite(SPRITES['vance'], this.px, this.py);

    // top hint
    r.rect(0, 0, CONFIG.baseW, 12, 'rgba(0,0,0,0.5)');
    r.text('Arrows/WASD move  Enter talk  step on blue tile to travel', 4, 3, '#cfe8ff', 8);

    this.dialogue.draw(r);
  }
}
