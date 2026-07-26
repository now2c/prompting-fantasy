import { Combatant, Spell } from '../core/config';
import { interpretOffline, isValidSpell } from '../data/promptKeywords';

function buildState(party: Combatant[], enemies: Combatant[]): string {
  const f = (c: Combatant) => {
    const weak = c.weaknesses.length ? ` weak:${c.weaknesses.join(',')}` : '';
    const resist = c.resistances.length ? ` resist:${c.resistances.join(',')}` : '';
    return `${c.name} (HP ${Math.max(0, c.hp)}/${c.maxHp} MP ${c.mp}/${c.maxMp}${weak}${resist})`;
  };
  const ps = party.filter((c) => c.alive).map((c) => `${c.name} (HP ${Math.max(0, c.hp)}/${c.maxHp} MP ${c.mp}/${c.maxMp})`).join(', ') || 'none';
  const es = enemies.filter((c) => c.alive).map(f).join(', ') || 'none';
  return `Party: ${ps}. Enemies: ${es}.`;
}

function extractSpell(data: any): Spell | null {
  if (!data) return null;
  if (data.toolArgs && isValidSpell(data.toolArgs)) return data.toolArgs as Spell;
  if (data.content) {
    const m = data.content.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        const obj = JSON.parse(m[0]);
        if (isValidSpell(obj)) return obj as Spell;
      } catch {
        /* ignore */
      }
    }
  }
  return null;
}

export async function interpret(
  prompt: string,
  party: Combatant[],
  enemies: Combatant[]
): Promise<Spell> {
  const p = prompt.trim();
  if (!p) return interpretOffline('');
  try {
    const state = buildState(party, enemies);
    const res = await fetch('/api/cast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: `${state}\nInstruction: ${p}` })
    });
    if (res.ok) {
      const data = await res.json();
      const spell = extractSpell(data);
      if (spell) return spell;
    }
  } catch {
    /* fall through to offline */
  }
  return interpretOffline(p);
}
