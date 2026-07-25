import { MapDef } from '../core/config';

const town: MapDef = {
  id: 'town',
  spawn: { x: 1, y: 6 },
  tiles: [
    '####################',
    '#FFFFFFF,,,,,FFFFFF#',
    '#FF.FF..,,..,.FF.FF#',
    '#F..F...TT...F..F.F#',
    '#FF.FF..TT...FF.FF.#',
    '#FFFFFFFFFFFFFFFF.F#',
    '#....,,FFFFFF,,....#',
    '#.FF.,,FFF.FFF,,FF.#',
    '#.F...,F.D.F...,F..#',
    '#.FF.,,FFF.FFF,,FF.#',
    '#....,,FFFFFF,,....#',
    '#FFFFFFFFFFFFFFFF.F#',
    '#F..T..O.......T..F#',
    '####################'
  ],
  npcs: [
    {
      x: 5,
      y: 3,
      name: 'Elder Mage',
      tint: '#9a6ad2',
      lines: [
        'Welcome to Prompting Fantasy, hero.',
        'In battle we do not pick commands.',
        "We COMMAND with words. Type a PROMPT.",
        "e.g.  'burn all enemies with fire'",
        "or     'heal the most wounded ally'.",
        'Step into the blue door to begin.'
      ]
    },
    {
      x: 14,
      y: 8,
      name: 'Squire',
      tint: '#c8a040',
      lines: [
        'The Dark Sorcerer lurks on the road.',
        'Guard (防禦) when foes look mighty,',
        'and let Soren mend our wounds.'
      ]
    },
    {
      x: 8,
      y: 8,
      name: 'Gate',
      tint: '#3b8fd2',
      lines: ['A blue portal. Step on it to leave town.']
    }
  ]
};

const route: MapDef = {
  id: 'route',
  spawn: { x: 5, y: 12 },
  tiles: [
    '####################',
    '#TTTTT,,....,,TTTTT#',
    '#.....,,....,,.....#',
    '#..TT.,,....,,.TT..#',
    '#.....,,....,,.....#',
    '#,,,,,......B,,,,,##',
    '#.....,,....,,.....#',
    '#..TT.,,....,,.TT..#',
    '#.....,,....,,.....#',
    '#,,,,,......B,,,,,##',
    '#.....,,....,,.....#',
    '#..TT.,,....,,.TT..#',
    '#O...,,....,,...TT.#',
    '####################'
  ],
  npcs: [
    {
      x: 3,
      y: 12,
      name: 'Sign',
      tint: '#e0c040',
      lines: ['Danger ahead. Type your spells with care.']
    }
  ]
};

export const MAPS: Record<string, MapDef> = { town, route };

export function tileAt(map: MapDef, tx: number, ty: number): string {
  if (ty < 0 || ty >= map.tiles.length) return '#';
  const row = map.tiles[ty];
  if (tx < 0 || tx >= row.length) return '#';
  return row[tx];
}

export function isSolid(map: MapDef, tx: number, ty: number): boolean {
  const t = tileAt(map, tx, ty);
  return t === '#' || t === 'T' || t === 'W' || t === 'D';
}
