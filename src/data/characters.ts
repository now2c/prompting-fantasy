import { Combatant } from '../core/config';
import { humanoid, SPRITES } from '../core/Assets';

export interface CharDef {
  id: string;
  name: string;
  tint: string;
  maxHp: number;
  maxMp: number;
  attack: number;
  magic: number;
  defense: number;
  atbRate: number;
  role: string;
  blurb: string;
}

export const CHARACTERS: CharDef[] = [
  {
    id: 'vance',
    name: 'Vance',
    tint: '#c8443a',
    maxHp: 120,
    maxMp: 20,
    attack: 22,
    magic: 6,
    defense: 10,
    atbRate: 42,
    role: 'Knight',
    blurb: 'A stalwart swordsman. Strong with slash and guard.'
  },
  {
    id: 'lyra',
    name: 'Lyra',
    tint: '#3a6ec8',
    maxHp: 80,
    maxMp: 60,
    attack: 8,
    magic: 24,
    defense: 5,
    atbRate: 36,
    role: 'Mage',
    blurb: 'Wields fire, ice, lightning and earth.'
  },
  {
    id: 'soren',
    name: 'Soren',
    tint: '#e0c040',
    maxHp: 95,
    maxMp: 50,
    attack: 10,
    magic: 18,
    defense: 7,
    atbRate: 38,
    role: 'Cleric',
    blurb: 'Heals wounds and smites with holy light.'
  }
];

SPRITES['vance'] = humanoid('#c8443a');
SPRITES['lyra'] = humanoid('#3a6ec8');
SPRITES['soren'] = humanoid('#e0c040');

export function makeParty(): Combatant[] {
  return CHARACTERS.map((c) => ({
    id: c.id,
    name: c.name,
    side: 'party',
    maxHp: c.maxHp,
    hp: c.maxHp,
    maxMp: c.maxMp,
    mp: c.maxMp,
    atb: 0,
    atbRate: c.atbRate,
    attack: c.attack,
    magic: c.magic,
    defense: c.defense,
    guarding: false,
    guardTurns: 0,
    spriteKey: c.id,
    tint: c.tint,
    alive: true
  }));
}
