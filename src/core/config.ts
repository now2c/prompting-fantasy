export const CONFIG = {
  baseW: 256,
  baseH: 224,
  scale: 3,
  tile: 16
};

export type Element =
  | 'fire'
  | 'ice'
  | 'lightning'
  | 'earth'
  | 'holy'
  | 'heal'
  | 'slash'
  | 'guard';

export type Target = 'all-enemies' | 'single-enemy' | 'all-allies' | 'single-ally' | 'self';

export interface Spell {
  element: Element;
  target: Target;
  power: number;
  flavor?: string;
}

export type Side = 'party' | 'enemy';

export interface Combatant {
  id: string;
  name: string;
  side: Side;
  maxHp: number;
  hp: number;
  maxMp: number;
  mp: number;
  atb: number;
  atbRate: number;
  attack: number;
  magic: number;
  defense: number;
  guarding: boolean;
  guardTurns: number;
  spriteKey: string;
  tint: string;
  alive: boolean;
}

export interface NpcDef {
  x: number;
  y: number;
  name: string;
  tint: string;
  lines: string[];
}

export interface MapDef {
  id: string;
  tiles: string[];
  spawn: { x: number; y: number };
  npcs: NpcDef[];
  music?: string;
}
