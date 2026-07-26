import { Scene } from '../core/SceneManager';
import { Renderer } from '../core/Renderer';
import { input } from '../core/Input';
import { CONFIG, Combatant, Spell } from '../core/config';
import { SPRITES } from '../core/Assets';
import { applySpell } from '../systems/BattleSystem';
import { interpret } from '../systems/PromptInterpreter';
import { DamagePopups } from '../ui/DamagePopup';
import { nameAndBars, drawBar } from '../ui/Bars';
import { GameState } from '../gameState';
import { SaveSystem } from '../systems/SaveSystem';
import { FieldScene } from './FieldScene';
import { SceneManager } from '../core/SceneManager';
import { EXAMPLE_PROMPTS } from '../data/promptKeywords';

const PARTY_POS = [
  { x: 150, y: 158 },
  { x: 186, y: 158 },
  { x: 222, y: 158 }
];
const ENEMY_POS = [
  { x: 55, y: 48 },
  { x: 38, y: 92 },
  { x: 80, y: 92 }
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
  private log = '';
  private awaitingInput = false;
  private thinking = false;
  private activeUnit: Combatant | null = null;
  private pops = new DamagePopups();
  private flashT = 0;
  private endT = 0;
  private example = EXAMPLE_PROMPTS[0];

  private inputEl: HTMLInputElement;
  private onKey: (e: KeyboardEvent) => void;

  constructor(scenes: SceneManager, enemies: Combatant[], isBoss: boolean) {
    this.scenes = scenes;
    this.enemies = enemies;
    this.isBoss = isBoss;
    this.party = GameState.party;
    this.all = [...this.party, ...this.enemies];

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
    this.hideInput();
    this.log = this.isBoss
      ? 'The Dark Sorcerer blocks the path!'
      : 'A wild encounter begins!';
  }

  exit() {
    this.inputEl.removeEventListener('keydown', this.onKey);
    this.hideInput();
    this.inputEl.blur();
  }

  private hideInput() {
    this.inputEl.style.display = 'none';
    this.inputEl.value = '';
    this.inputEl.blur();
  }

  private showInput(unit: Combatant) {
    this.example = EXAMPLE_PROMPTS[Math.floor(Math.random() * EXAMPLE_PROMPTS.length)];
    const scale = CONFIG.scale;
    const bx = 12;
    const by = CONFIG.baseH - 34;
    this.inputEl.style.display = 'block';
    this.inputEl.style.left = bx * scale + 'px';
    this.inputEl.style.top = by * scale + 'px';
    this.inputEl.style.width = (CONFIG.baseW - 24) * scale + 'px';
    this.inputEl.style.height = 18 * scale + 'px';
    this.inputEl.style.fontSize = 9 * scale + 'px';
    this.inputEl.value = '';
    setTimeout(() => this.inputEl.focus(), 0);
  }

  private submit() {
    const v = this.inputEl.value.trim();
    if (!v) return;
    this.hideInput();
    this.thinking = true;
    this.log = `${this.activeUnit!.name} ponders the prompt...`;
    const actor = this.activeUnit!;
    interpret(v, this.party, this.enemies).then((spell) => {
      this.resolveActor(spell, actor);
      this.thinking = false;
      this.awaitingInput = false;
      this.activeUnit = null;
    });
  }

  private resolveActor(spell: Spell, actor: Combatant) {
    const res = applySpell(spell, actor, this.party, this.enemies);
    this.log = res.log + (res.flavor ? `  ${res.flavor}` : '');
    for (const h of res.hits) {
      const pos = this.positions.get(h.target.id)!;
      const color = h.heal ? '#7CFC7C' : '#ff7b7b';
      this.pops.add(pos.x + 4, pos.y - 4, (h.heal ? '+' : '-') + h.amount, color);
      if (!h.heal) this.flashT = 0.18;
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
    this.resolveActor(spell, unit);
  }

  private checkEnd() {
    if (this.enemies.every((e) => !e.alive)) {
      this.state = 'win';
      this.endT = 0;
      SaveSystem.save(GameState.mapId, GameState.playerTile.x, GameState.playerTile.y, this.party);
    } else if (this.party.every((p) => !p.alive)) {
      this.state = 'lose';
      this.endT = 0;
    }
  }

  update(dt: number) {
    if (this.flashT > 0) this.flashT -= dt;
    this.pops.update(dt);

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

    // ATB accumulation
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

  draw(r: Renderer) {
    r.setCamera(0, 0);
    r.clear('#0a0a12');
    // backdrop
    r.rect(0, 0, CONFIG.baseW, 120, '#161a2e');
    r.rect(0, 110, CONFIG.baseW, CONFIG.baseH - 110, '#241a16');
    r.rect(0, 112, CONFIG.baseW, 2, '#3a2a1a');

    // sprites + bars
    for (const c of this.all) {
      const pos = this.positions.get(c.id)!;
      const spr = SPRITES[c.spriteKey];
      if (!c.alive) {
        r.rect(pos.x, pos.y, 16, 16, 'rgba(0,0,0,0.45)');
        continue;
      }
      r.drawSprite(spr, pos.x, pos.y);
      nameAndBars(r, c, pos.x - 4, pos.y + 18);
      drawBar(r, pos.x - 4, pos.y + 30, 40, 2, c.atb / 100, '#e0c040', '#2a2230');
    }

    this.pops.draw(r);

    if (this.flashT > 0) r.flash('rgba(255,255,255,1)', this.flashT * 3);

    // log line
    r.rect(0, CONFIG.baseH - 54, CONFIG.baseW, 14, 'rgba(0,0,0,0.55)');
    r.text(this.log.slice(0, 42), 6, CONFIG.baseH - 51, '#f4e7c0', 8);

    if (this.state === 'intro') {
      r.rect(0, CONFIG.baseH / 2 - 14, CONFIG.baseW, 28, 'rgba(0,0,0,0.7)');
      r.text(
        this.isBoss ? 'The Dark Sorcerer appears!' : 'Encounter!',
        CONFIG.baseW / 2 - 50,
        CONFIG.baseH / 2 - 6,
        '#ffd86b',
        10
      );
    }

    if (this.awaitingInput && this.activeUnit) {
      const by = CONFIG.baseH - 36;
      r.rect(8, by, CONFIG.baseW - 16, 32, '#0c0a16');
      r.strokeRect(8, by, CONFIG.baseW - 16, 32, '#f4e7c0', 2);
      r.text(`▶ ${this.activeUnit.name}, type a PROMPT:`, 12, by + 4, '#ffe9a8', 8);
      r.text('e.g. ' + this.example, 12, by + 20, '#8fa0c8', 7);
      if (this.thinking) r.text('…', CONFIG.baseW - 20, by + 4, '#f4e7c0', 8);
    }

    if (this.state === 'win') {
      r.rect(0, 0, CONFIG.baseW, CONFIG.baseH, 'rgba(0,0,0,0.55)');
      r.text('VICTORY!', CONFIG.baseW / 2 - 28, 90, '#ffd86b', 14);
      r.text('Press Enter to continue', CONFIG.baseW / 2 - 52, 116, '#f4e7c0', 8);
    }
    if (this.state === 'lose') {
      r.rect(0, 0, CONFIG.baseW, CONFIG.baseH, 'rgba(0,0,0,0.7)');
      r.text('GAME OVER', CONFIG.baseW / 2 - 34, 90, '#ff6b6b', 14);
      r.text('Press Enter to restart', CONFIG.baseW / 2 - 50, 116, '#f4e7c0', 8);
    }
  }
}
