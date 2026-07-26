import { Scene } from '../core/SceneManager';
import { Renderer } from '../core/Renderer';
import { input } from '../core/Input';
import { CONFIG, Combatant, Spell } from '../core/config';
import { SPRITES } from '../core/Assets';
import { applySpell } from '../systems/BattleSystem';
import { interpret } from '../systems/PromptInterpreter';
import { DamagePopups } from '../ui/DamagePopup';
import { nameAndBars, drawBar } from '../ui/Bars';
import { Effects } from '../ui/Effects';
import { GameState } from '../gameState';
import { SaveSystem } from '../systems/SaveSystem';
import { FieldScene } from './FieldScene';
import { SceneManager } from '../core/SceneManager';
import { EXAMPLE_PROMPTS } from '../data/promptKeywords';
import { audio } from '../systems/Audio';

const PARTY_POS = [
  { x: 150, y: 150 },
  { x: 186, y: 150 },
  { x: 222, y: 150 }
];
const ENEMY_POS = [
  { x: 60, y: 30 },
  { x: 36, y: 62 },
  { x: 84, y: 62 }
];

type State = 'intro' | 'battle' | 'win' | 'lose';

export class BattleScene implements Scene {
  private scenes: SceneManager;
  private enemies: Combatant[];
  private isBoss: boolean;
  private party: Combatant[];
  private all: Combatant[];
  private positions = new Map<string, { x: number; y: number }>();
  private state: State = 'intro';
  private introT = 1.1;
  private logs: string[] = [];
  private awaitingInput = false;
  private thinking = false;
  private activeUnit: Combatant | null = null;
  private pops = new DamagePopups();
  private effects = new Effects();
  private flashT = 0;
  private endT = 0;
  private example = EXAMPLE_PROMPTS[0];
  private hitFlash = new Map<string, number>();
  private death = new Map<string, number>();
  private lunge = new Map<string, number>();
  private shakeT = 0;
  private bgTheme = '';
  private walkT = 0;
  private time = 0;
  private onResize: (() => void) | null = null;

  private inputEl: HTMLInputElement;
  private onKey: (e: KeyboardEvent) => void;

  constructor(scenes: SceneManager, enemies: Combatant[], isBoss: boolean) {
    this.scenes = scenes;
    this.enemies = enemies;
    this.isBoss = isBoss;
    this.party = GameState.party;
    this.all = [...this.party, ...this.enemies];
    this.bgTheme = GameState.mapId;

    this.party.forEach((c, i) => this.positions.set(c.id, PARTY_POS[i]));
    this.enemies.forEach((c, i) => this.positions.set(c.id, ENEMY_POS[i]));

    this.inputEl = document.getElementById('prompt-input') as HTMLInputElement;
    this.onKey = (e) => {
      if (this.awaitingInput && !this.thinking) {
        if (e.isComposing) return;
        if (e.key === 'Enter') {
          e.preventDefault();
          this.submit();
        }
      }
    };
  }

  enter() {
    this.inputEl.addEventListener('keydown', this.onKey);
    this.onResize = () => this.repositionInput();
    window.addEventListener('resize', this.onResize);
    this.hideInput();
    this.flashT = 0.3;
    audio.sfx('battle');
    this.pushLog(
      this.isBoss
        ? 'The Dark Sorcerer blocks the path!'
        : 'A wild encounter begins!'
    );
  }

  exit() {
    this.inputEl.removeEventListener('keydown', this.onKey);
    if (this.onResize) window.removeEventListener('resize', this.onResize);
    this.hideInput();
    this.inputEl.blur();
  }

  private hideInput() {
    this.inputEl.style.display = 'none';
    this.inputEl.value = '';
    this.inputEl.blur();
  }

  private placeInput() {
    const scale = CONFIG.scale;
    const bx = 12;
    const by = 203;
    this.inputEl.style.left = bx * scale + 'px';
    this.inputEl.style.top = by * scale + 'px';
    this.inputEl.style.width = (CONFIG.baseW - 24) * scale + 'px';
    this.inputEl.style.height = 18 * scale + 'px';
    this.inputEl.style.fontSize = 9 * scale + 'px';
  }

  private repositionInput() {
    if (this.inputEl.style.display !== 'none') this.placeInput();
  }

  private showInput(unit: Combatant) {
    this.example = EXAMPLE_PROMPTS[Math.floor(Math.random() * EXAMPLE_PROMPTS.length)];
    this.inputEl.style.display = 'block';
    this.placeInput();
    this.inputEl.value = '';
    this.inputEl.placeholder = 'e.g. ' + this.example;
    setTimeout(() => this.inputEl.focus(), 0);
  }

  private submit() {
    const v = this.inputEl.value.trim();
    if (!v) return;
    this.hideInput();
    this.thinking = true;
    this.pushLog(`${this.activeUnit!.name} ponders the prompt...`);
    const actor = this.activeUnit!;
    interpret(v, this.party, this.enemies).then((spell) => {
      this.resolveActor(spell, actor);
      this.thinking = false;
      this.awaitingInput = false;
      this.activeUnit = null;
    });
  }

  private pushLog(s: string) {
    this.logs.push(s);
    if (this.logs.length > 2) this.logs.shift();
  }

  private resolveActor(spell: Spell, actor: Combatant) {
    const casterPos = this.positions.get(actor.id)!;
    this.effects.castFlash(casterPos.x, casterPos.y);

    const res = applySpell(spell, actor, this.party, this.enemies);
    this.pushLog(res.log + (res.flavor ? `  ${res.flavor}` : ''));

    const isHeal = spell.element === 'heal';
    const isGuard = spell.element === 'guard';
    audio.sfx(isHeal ? 'heal' : isGuard ? 'confirm' : 'cast');

    for (const h of res.hits) {
      const pos = this.positions.get(h.target.id)!;
      this.effects.spawnElement(spell.element, pos.x, pos.y);
      const color = h.heal ? '#7CFC7C' : '#ff7b7b';
      this.pops.add(pos.x + 4, pos.y - 4, (h.heal ? '+' : '-') + h.amount, color);
      this.hitFlash.set(h.target.id, 0.15);
      if (!h.heal && !isGuard) audio.sfx('hit');
      if (h.dead) this.death.set(h.target.id, 1.0);
    }
    if (!isHeal && !isGuard && res.hits.length > 0) {
      this.shakeT = Math.max(this.shakeT, 0.2 + spell.power * 0.06);
    }
    if (actor.guardTurns > 0) {
      actor.guardTurns--;
      if (actor.guardTurns <= 0) actor.guarding = false;
    }
    actor.atb = 0;
    this.checkEnd();
  }

  private enemyAct(unit: Combatant) {
    let spell: Spell;
    if (unit.hp < unit.maxHp * 0.3 && Math.random() < 0.35) {
      spell = { element: 'guard', target: 'self', power: 1 };
    } else {
      const elems: Spell['element'][] = ['fire', 'ice', 'lightning', 'slash'];
      const element = elems[Math.floor(Math.random() * elems.length)];
      const power = 1 + Math.floor(Math.random() * 2);
      const target = Math.random() < 0.2 ? 'all-enemies' : 'single-enemy';
      spell = { element, target, power };
    }
    this.lunge.set(unit.id, 0.2);
    this.resolveActor(spell, unit);
  }

  private checkEnd() {
    if (this.enemies.every((e) => !e.alive)) {
      this.state = 'win';
      this.endT = 0;
      audio.sfx('win');
      SaveSystem.save(GameState.mapId, GameState.playerTile.x, GameState.playerTile.y, this.party);
    } else if (this.party.every((p) => !p.alive)) {
      this.state = 'lose';
      this.endT = 0;
      audio.sfx('lose');
    }
  }

  update(dt: number) {
    this.time += dt;
    if (this.flashT > 0) this.flashT -= dt;
    if (this.shakeT > 0) this.shakeT -= dt;
    this.pops.update(dt);
    this.effects.update(dt);
    this.walkT += dt;

    for (const [id, t] of this.hitFlash) {
      const nt = t - dt;
      if (nt <= 0) this.hitFlash.delete(id);
      else this.hitFlash.set(id, nt);
    }
    for (const [id, t] of this.lunge) {
      const nt = t - dt;
      if (nt <= 0) this.lunge.delete(id);
      else this.lunge.set(id, nt);
    }
    for (const [id, t] of this.death) {
      const nt = t - dt;
      if (nt <= 0) this.death.delete(id);
      else this.death.set(id, nt);
    }

    if (this.state === 'intro') {
      this.introT -= dt;
      if (this.introT <= 0) this.state = 'battle';
      return;
    }
    if (this.state === 'win' || this.state === 'lose') {
      this.endT += dt;
      if (this.endT > 0.6 && input.anyPressed('Enter', ' ', 'z', 'Z')) {
        if (this.state === 'win') {
          this.scenes.set(new FieldScene(this.scenes));
        } else {
          GameState.reset();
          import('./TitleScene').then((m) => this.scenes.set(new m.TitleScene(this.scenes)));
        }
      }
      return;
    }

    if (this.awaitingInput || this.thinking) return;

    for (const c of this.all) {
      if (!c.alive) continue;
      c.atb += c.atbRate * dt;
    }
    const ready = this.all
      .filter((c) => c.alive && c.atb >= 100)
      .sort((a, b) => b.atb - a.atb)[0];
    if (!ready) return;

    if (ready.side === 'enemy') {
      this.enemyAct(ready);
    } else {
      this.awaitingInput = true;
      this.activeUnit = ready;
      ready.atb = 100;
      this.showInput(ready);
    }
  }

  private drawBg(r: Renderer) {
    const town = this.bgTheme === 'town';
    // sky
    r.rect(0, 0, CONFIG.baseW, 80, town ? '#2a2040' : '#161a2e');
    r.rect(0, 80, CONFIG.baseW, 30, town ? '#3a2a3a' : '#1a2a20');
    // horizon
    r.rect(0, 108, CONFIG.baseW, 2, town ? '#5a3a2a' : '#3a5a3a');
    // ground
    r.rect(0, 110, CONFIG.baseW, CONFIG.baseH - 110, town ? '#241a16' : '#1a2416');
    // silhouettes
    const dark = town ? '#1a1220' : '#0a160a';
    if (town) {
      // houses
      r.rect(20, 70, 30, 38, dark);
      r.rect(18, 64, 34, 8, dark);
      r.rect(80, 75, 24, 33, dark);
      r.rect(78, 69, 28, 8, dark);
      r.rect(180, 72, 28, 36, dark);
      r.rect(178, 66, 32, 8, dark);
    } else {
      // trees
      for (const tx of [15, 45, 90, 160, 210, 240]) {
        r.rect(tx + 6, 85, 4, 23, '#1a2a1a');
        r.rect(tx, 70, 16, 18, dark);
        r.rect(tx + 3, 60, 10, 14, dark);
      }
    }
    // stars (small bright dots)
    for (const [sx, sy] of [[30, 12], [80, 8], [140, 18], [200, 6], [50, 22], [170, 14]]) {
      r.rect(sx, sy, 1, 1, town ? '#ffd86b' : '#cfe8ff');
    }
  }

  draw(r: Renderer) {
    r.setCamera(0, 0);
    // screen shake via camera offset (sprites shake, UI stable)
    if (this.shakeT > 0) {
      const sx = Math.sin(this.time * 80) * this.shakeT * 5;
      const sy = Math.cos(this.time * 100) * this.shakeT * 4;
      r.setCamera(sx, sy);
    }
    r.clear('#0a0a12');
    this.drawBg(r);

    // sprites
    for (const c of this.all) {
      const pos = this.positions.get(c.id)!;
      const wobble = Math.floor(this.walkT / 0.3) % 2 === 1;
      const sprKey = wobble && SPRITES[c.spriteKey + '_w'] ? c.spriteKey + '_w' : c.spriteKey;
      const spr = SPRITES[sprKey] || SPRITES[c.spriteKey];
      const alive = c.alive;
      const deathAlpha = this.death.get(c.id);

      if (!alive && deathAlpha !== undefined && deathAlpha > 0) {
        // death fade
        r.setAlpha(deathAlpha);
        r.drawSprite(spr, pos.x, pos.y);
        r.clearAlpha();
        r.setAlpha(1 - deathAlpha);
        r.rect(pos.x - r.camX, pos.y - r.camY, 16, 16, 'rgba(0,0,0,0.7)');
        r.clearAlpha();
        continue;
      }
      if (!alive) {
        r.rect(pos.x - r.camX, pos.y - r.camY, 16, 16, 'rgba(0,0,0,0.45)');
        continue;
      }

      // alive: bob + lunge
      const bob = Math.sin(this.time * 1.8 + (c.side === 'enemy' ? 1 : 0)) * 1;
      let lungeDx = 0;
      const lt = this.lunge.get(c.id);
      if (lt !== undefined) lungeDx = Math.sin((lt / 0.2) * Math.PI) * 10;

      r.drawSprite(spr, pos.x + lungeDx, pos.y + bob);

      // hit flash overlay
      const hf = this.hitFlash.get(c.id);
      if (hf !== undefined && hf > 0) {
        r.setAlpha(hf * 4);
        r.rect(pos.x + lungeDx - r.camX, pos.y + bob - r.camY, 16, 16, '#ffffff');
        r.clearAlpha();
      }

      nameAndBars(r, c, pos.x - 4 + lungeDx, pos.y + 18 + bob);
      drawBar(r, pos.x - 4 + lungeDx, pos.y + 38 + bob, 40, 2, c.atb / 100, '#e0c040', '#2a2230');
    }

    // reset camera for screen-space UI
    r.setCamera(0, 0);
    this.pops.draw(r);
    this.effects.draw(r);
    if (this.flashT > 0) r.flash('rgba(255,255,255,1)', Math.min(1, this.flashT * 3));

    // two-line action log
    r.rect(4, 112, CONFIG.baseW - 8, 38, 'rgba(0,0,0,0.55)');
    r.strokeRect(4, 112, CONFIG.baseW - 8, 38, '#3a3a52', 1);
    const lines = this.logs.slice(-2);
    for (let i = 0; i < lines.length; i++) {
      r.text(lines[i].slice(0, 40), 10, 120 + i * 14, '#f4e7c0', 8);
    }

    // active unit highlight arrow
    if (this.awaitingInput && this.activeUnit) {
      const pos = this.positions.get(this.activeUnit.id)!;
      const arrowBob = Math.abs(Math.sin(this.time * 4)) * 3;
      r.text('▼', pos.x + 4, pos.y - 10 - arrowBob, '#ffd86b', 9);
    }

    if (this.state === 'intro') {
      r.rect(0, CONFIG.baseH / 2 - 14, CONFIG.baseW, 28, 'rgba(0,0,0,0.7)');
      r.heading(
        this.isBoss ? 'BOSS!' : 'ENCOUNTER!',
        CONFIG.baseW / 2 - (this.isBoss ? 36 : 52),
        CONFIG.baseH / 2 - 6,
        '#ffd86b',
        10
      );
    }

    if (this.awaitingInput && this.activeUnit) {
      const by = 190;
      r.rect(8, by, CONFIG.baseW - 16, 34, '#0c0a16');
      r.strokeRect(8, by, CONFIG.baseW - 16, 34, '#f4e7c0', 2);
      r.text(`▶ ${this.activeUnit.name}, type a PROMPT:`, 12, by + 4, '#ffe9a8', 8);
      if (this.thinking) r.text('…', CONFIG.baseW - 20, by + 4, '#f4e7c0', 8);
    }

    if (this.state === 'win') {
      r.rect(60, 60, CONFIG.baseW - 120, 100, '#0c0a16');
      r.strokeRect(60, 60, CONFIG.baseW - 120, 100, '#ffd86b', 2);
      r.heading('VICTORY!', 82, 76, '#ffd86b', 12);
      r.text('The party presses on.', 82, 100, '#f4e7c0', 8);
      r.text('Press Enter', 100, 138, '#9aa0b8', 8);
    }
    if (this.state === 'lose') {
      r.rect(60, 60, CONFIG.baseW - 120, 100, '#0c0a16');
      r.strokeRect(60, 60, CONFIG.baseW - 120, 100, '#ff6b6b', 2);
      r.heading('GAME OVER', 74, 76, '#ff6b6b', 12);
      r.text('The darkness prevails...', 82, 100, '#f4e7c0', 8);
      r.text('Press Enter', 100, 138, '#9aa0b8', 8);
    }
  }
}
