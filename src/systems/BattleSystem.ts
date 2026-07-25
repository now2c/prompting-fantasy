import { Combatant, Spell } from '../core/config';

export interface Hit {
  target: Combatant;
  amount: number;
  heal: boolean;
  dead: boolean;
}

export interface ActionResult {
  log: string;
  hits: Hit[];
  flavor: string;
}

function aliveOf(list: Combatant[]): Combatant[] {
  return list.filter((c) => c.alive);
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

function damageFormula(actor: Combatant, target: Combatant, spell: Spell): number {
  const stat = spell.element === 'slash' ? actor.attack : actor.magic;
  const mult = [0, 1, 1.6, 2.4][spell.power] || 1.6;
  let dmg = stat * 0.55 * mult + spell.power * 6 - target.defense * 0.4;
  dmg *= 0.85 + Math.random() * 0.3;
  if (target.guarding) dmg *= 0.5;
  return Math.max(1, Math.round(dmg));
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

  if (spell.element === 'guard') {
    actor.guarding = true;
    actor.guardTurns = 2;
    log = `${actor.name} guards.`;
    return { log, hits, flavor };
  }

  const targets = resolveTargets(spell, actor, party, enemies);

  if (spell.element === 'heal') {
    const amount = Math.round(actor.magic * 2.6 * spell.power + 6);
    for (const t of targets) {
      t.hp = Math.min(t.maxHp, t.hp + amount);
      hits.push({ target: t, amount, heal: true, dead: false });
    }
    log = `${actor.name} casts heal (${spell.power}).`;
    return { log, hits, flavor };
  }

  // offense
  for (const t of targets) {
    const dmg = damageFormula(actor, t, spell);
    t.hp -= dmg;
    let dead = false;
    if (t.hp <= 0) {
      t.hp = 0;
      t.alive = false;
      dead = true;
    }
    hits.push({ target: t, amount: dmg, heal: false, dead });
  }
  log = `${actor.name} uses ${spell.element} (${spell.power}).`;
  return { log, hits, flavor };
}
