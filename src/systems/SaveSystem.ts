import { Combatant } from '../core/config';

export interface SaveData {
  mapId: string;
  x: number;
  y: number;
  party: { id: string; hp: number; mp: number }[];
}

const KEY = 'pf_save_v1';

export const SaveSystem = {
  save(mapId: string, x: number, y: number, party: Combatant[]) {
    const data: SaveData = {
      mapId,
      x,
      y,
      party: party.map((c) => ({ id: c.id, hp: c.hp, mp: c.mp }))
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {}
  },
  load(): SaveData | null {
    try {
      const s = localStorage.getItem(KEY);
      return s ? (JSON.parse(s) as SaveData) : null;
    } catch {
      return null;
    }
  },
  has(): boolean {
    return !!this.load();
  },
  clear() {
    try {
      localStorage.removeItem(KEY);
    } catch {}
  }
};
