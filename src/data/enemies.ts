import { Combatant, Element } from '../core/config';
import { slime, bat, boss, SPRITES } from '../core/Assets';

export interface EnemyDef {
  id: string;
  name: string;
  sprite: string;
  tint: string;
  maxHp: number;
  attack: number;
  magic: number;
  defense: number;
  atbRate: number;
  weaknesses: Element[];
  resistances: Element[];
}

const ENEMY_DEFS: Record<string, EnemyDef> = {
  goblin: {
    id: 'goblin',
    name: 'Goblin',
    sprite: 'goblin',
    tint: '#5a8a3a',
    maxHp: 60,
    attack: 14,
    magic: 2,
    defense: 4,
    atbRate: 34,
    weaknesses: ['fire'],
    resistances: ['earth']
  },
  wraith: {
    id: 'wraith',
    name: 'Wraith',
    sprite: 'wraith',
    tint: '#7a5ac8',
    maxHp: 70,
    attack: 10,
    magic: 16,
    defense: 3,
    atbRate: 40,
    weaknesses: ['holy'],
    resistances: ['ice']
  },
  sorcerer: {
    id: 'sorcerer',
    name: 'Dark Sorcerer',
    sprite: 'sorcerer',
    tint: '#b03ad2',
    maxHp: 160,
    attack: 16,
    magic: 26,
    defense: 8,
    atbRate: 30,
    weaknesses: ['lightning'],
    resistances: ['fire', 'ice']
  }
};

SPRITES['goblin'] = slime('#5a8a3a', 0);
SPRITES['goblin_w'] = slime('#5a8a3a', 1);
SPRITES['wraith'] = bat('#7a5ac8', 0);
SPRITES['wraith_w'] = bat('#7a5ac8', 1);
SPRITES['sorcerer'] = boss('#b03ad2', 0);
SPRITES['sorcerer_w'] = boss('#b03ad2', 1);

export function makeEnemy(id: string): Combatant {
  const d = ENEMY_DEFS[id];
  return {
    id: d.id,
    name: d.name,
    side: 'enemy',
    maxHp: d.maxHp,
    hp: d.maxHp,
    maxMp: 0,
    mp: 0,
    atb: 0,
    atbRate: d.atbRate,
    attack: d.attack,
    magic: d.magic,
    defense: d.defense,
    guarding: false,
    guardTurns: 0,
    atkUpTurns: 0,
    defDownTurns: 0,
    weaknesses: d.weaknesses,
    resistances: d.resistances,
    spriteKey: d.sprite,
    tint: d.tint,
    alive: true
  };
}

export function makeEncounter(ids: string[]): Combatant[] {
  return ids.map(makeEnemy);
}
