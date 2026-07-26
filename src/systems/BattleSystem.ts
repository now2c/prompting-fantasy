import { Combatant, Element, Spell } from '../core/config';

export interface Hit {
  target: Combatant;
  amount: number;
  heal: boolean;
  dead: boolean;
  modifier?: 'weak' | 'resist';
}

export interface ActionResult {
  log: string;
  hits: Hit[];
  flavor: string;
  mpFail?: boolean;
}

function aliveOf(list: Combatant[]): Combatant[] {
  return list.filter((c) => c.alive);
}

export function mpCost(spell: Spell): number {
  if (spell.element === 'flee' || spell.element === 'guard' || spell.element === 'slash') return 0;
  if (spell.element === 'focus' || spell.element === 'weaken') return 2;
  if (spell.element === 'heal') return spell.power * 2;
  // offensive magic
  return spell.power * 3;
}

function resolveTargets(spell: Spell, actor: Combatant, party: Combatant[], enemies: Combatant[]): Combatant[] {
  const foes = actor.side === 'party' ? enemies : party;
  const friends = actor.side === 'party' ? party : enemies;
  switch (spell.target) {
    case 'all-enemies':
      return aliveOf(foes);
    case 'single-enemy':
      return aliveOf(foes).length ? [aliveOf(foes)[0]] : [];
    case 'all-allies':
      return aliveOf(friends);
    case 'single-ally': {
      const a = aliveOf(friends);
      if (!a.length) return [];
      const wounded = a.reduce((m, c) => (c.hp / c.maxHp < m.hp / m.maxHp ? c : m));
      return [wounded];
    }
    case 'self':
      return [actor];
  }
}

function weaknessMultiplier(element: Element, target: Combatant): { mult: number; mod?: 'weak' | 'resist' } {
  if (target.weaknesses.includes(element)) return { mult: 1.5, mod: 'weak' };
  if (target.resistances.includes(element)) return { mult: 0.5, mod: 'resist' };
  return { mult: 1 };
}

function damageFormula(actor: Combatant, target: Combatant, spell: Spell): { dmg: number; mod?: 'weak' | 'resist' } {
  const stat = spell.element === 'slash' ? actor.attack : actor.magic;
  const mult = [0, 1, 1.6, 2.4][spell.power] || 1.6;
  let dmg = stat * 0.55 * mult + spell.power * 6 - target.defense * 0.4;
  dmg *= 0.85 + Math.random() * 0.3;
  if (actor.atkUpTurns > 0) dmg *= 1.5;
  if (target.defDownTurns > 0) dmg *= 1.3;
  if (target.guarding) dmg *= 0.5;
  const wm = weaknessMultiplier(spell.element, target);
  dmg *= wm.mult;
  return { dmg: Math.max(1, Math.round(dmg)), mod: wm.mod };
}

export function applySpell(
  spell: Spell,
  actor: Combatant,
  party: Combatant[],
  enemies: Combatant[]
): ActionResult {
  const hits: Hit[] = [];
  let log = '';
  const flavor = spell.flavor || `${spell.element}`;

  // MP check
  const cost = mpCost(spell);
  if (actor.mp < cost) {
    return { log: `${actor.name} doesn't have enough MP!`, hits, flavor: 'no MP', mpFail: true };
  }

  // flee is handled in BattleScene — not here
  if (spell.element === 'flee') {
    return { log: '', hits, flavor: 'flee' };
  }

  // guard
  if (spell.element === 'guard') {
    actor.mp -= cost;
    actor.guarding = true;
    actor.guardTurns = 2;
    log = `${actor.name} guards.`;
    return { log, hits, flavor };
  }

  // focus
  if (spell.element === 'focus') {
    actor.mp -= cost;
    actor.atkUpTurns = 2;
    log = `${actor.name} focuses power!`;
    return { log, hits, flavor };
  }

  // weaken
  if (spell.element === 'weaken') {
    actor.mp -= cost;
    const targets = resolveTargets(spell, actor, party, enemies);
    for (const t of targets) {
      t.defDownTurns = 2;
      hits.push({ target: t, amount: 0, heal: false, dead: false });
    }
    log = `${actor.name} weakens ${targets.map((t) => t.name).join(', ')}.`;
    return { log, hits, flavor };
  }

  const targets = resolveTargets(spell, actor, party, enemies);

  // heal
  if (spell.element === 'heal') {
    actor.mp -= cost;
    const amount = Math.round(actor.magic * 2.6 * spell.power + 6);
    for (const t of targets) {
      t.hp = Math.min(t.maxHp, t.hp + amount);
      hits.push({ target: t, amount, heal: true, dead: false });
    }
    log = `${actor.name} casts heal (${spell.power}).`;
    return { log, hits, flavor };
  }

  // offense
  actor.mp -= cost;
  for (const t of targets) {
    const { dmg, mod } = damageFormula(actor, t, spell);
    t.hp -= dmg;
    let dead = false;
    if (t.hp <= 0) {
      t.hp = 0;
      t.alive = false;
      dead = true;
    }
    hits.push({ target: t, amount: dmg, heal: false, dead, modifier: mod });
  }
  log = `${actor.name} uses ${spell.element} (${spell.power}).`;
  return { log, hits, flavor };
}
