import { Element, Spell, Target } from '../core/config';

const HEAL_W = ['heal', 'cure', 'restore', 'mend', '治療', '補', '回血', '治', '癒', '奶'];
const GUARD_W = ['guard', 'defend', 'protect', 'shield', '防', '守', '護', '禦', '防禦'];
const FIRE_W = ['fire', 'flame', 'burn', '火', '火焰', '炎', '燒'];
const ICE_W = ['ice', 'freeze', 'frost', '冰', '凍', '寒'];
const LIGHT_W = ['lightning', 'thunder', 'bolt', 'storm', '雷', '閃電', '雷電'];
const EARTH_W = ['earth', 'rock', 'stone', 'quake', '土', '岩', '地', '震'];
const HOLY_W = ['holy', 'light', 'sacred', 'purify', '神', '聖', '光', '淨'];
const SLASH_W = ['slash', 'cut', 'strike', 'slice', '斬', '砍', '劈', '擊', '攻', '打', '斬擊'];
const FOCUS_W = ['focus', 'concentrate', 'power up', 'boost', '集中', '蓄力', '提升', '強化'];
const WEAKEN_W = ['weaken', 'debuff', 'soften', '削弱', '弱化', '減弱', '降防'];
const FLEE_W = ['flee', 'escape', 'run away', 'run', '逃', '逃跑', '逃走', '撤退', '離開'];

const ALL_EN = ['all', 'every', 'each', '所有', '全部', '全體', '全隊', '全', '們', '群', 'everyone'];
const SELF_W = ['self', 'myself', '我', '自己'];
const ALLY_W = ['ally', 'friend', 'companion', '隊友', '同伴', '友', '大家'];
const WEAK_W = ['weak', 'small', 'little', 'lightly', '微弱', '小', '輕', '弱', '稍微'];
const STRONG_W = ['strong', 'massive', 'huge', 'powerful', 'big', '爆', '強', '大', '猛烈', '全力', '重'];

const ELEMENT_KIND: Record<Element, 'offense' | 'heal' | 'guard' | 'buff' | 'debuff' | 'flee'> = {
  fire: 'offense',
  ice: 'offense',
  lightning: 'offense',
  earth: 'offense',
  holy: 'offense',
  heal: 'heal',
  slash: 'offense',
  guard: 'guard',
  focus: 'buff',
  weaken: 'debuff',
  flee: 'flee'
};

export const ELEMENTS: Element[] = [
  'fire', 'ice', 'lightning', 'earth', 'holy',
  'heal', 'slash', 'guard', 'focus', 'weaken', 'flee'
];

function has(p: string, words: string[]): boolean {
  return words.some((w) => {
    if (/[a-z]/i.test(w)) {
      const re = new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
      return re.test(p);
    }
    return p.includes(w);
  });
}

export function interpretOffline(prompt: string): Spell {
  const p = prompt.toLowerCase();

  // flee (check first — "run away" could match other patterns)
  if (has(p, FLEE_W)) return { element: 'flee', target: 'self', power: 1 };

  let element: Element = 'slash';
  if (has(p, HEAL_W)) element = 'heal';
  else if (has(p, GUARD_W)) element = 'guard';
  else if (has(p, FOCUS_W)) element = 'focus';
  else if (has(p, WEAKEN_W)) element = 'weaken';
  else if (has(p, FIRE_W)) element = 'fire';
  else if (has(p, ICE_W)) element = 'ice';
  else if (has(p, LIGHT_W)) element = 'lightning';
  else if (has(p, EARTH_W)) element = 'earth';
  else if (has(p, HOLY_W)) element = 'holy';
  else if (has(p, SLASH_W)) element = 'slash';

  const kind = ELEMENT_KIND[element];
  let target: Target;
  if (kind === 'heal' || kind === 'guard' || kind === 'buff') {
    if (has(p, ALL_EN) && (has(p, ALLY_W) || has(p, SELF_W) || has(p, ALL_EN)))
      target = 'all-allies';
    else if (has(p, ALLY_W)) target = 'single-ally';
    else target = 'self';
    if (has(p, ['enemy', '敵', '敵人'])) target = 'single-ally';
  } else if (kind === 'debuff') {
    if (has(p, ALL_EN)) target = 'all-enemies';
    else target = 'single-enemy';
  } else {
    if (has(p, ALL_EN)) target = 'all-enemies';
    else target = 'single-enemy';
  }

  let power = 2;
  if (has(p, WEAK_W)) power = 1;
  if (has(p, STRONG_W)) power = 3;

  return { element, target, power };
}

export function isValidSpell(s: any): s is Spell {
  return (
    s &&
    ELEMENTS.includes(s.element) &&
    ['all-enemies', 'single-enemy', 'all-allies', 'single-ally', 'self'].includes(s.target) &&
    [1, 2, 3].includes(s.power)
  );
}

export const EXAMPLE_PROMPTS = [
  'burn all enemies with fire',
  'strike the foe with lightning',
  'heal the most wounded ally',
  'guard yourself',
  'smite them with holy light',
  '用冰凍結所有敵人',
  'flee!',
  'focus my power',
  'weaken the enemy'
];
