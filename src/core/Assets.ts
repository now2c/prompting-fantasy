function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

const OUTLINE = '#1a1320';
const SKIN = '#e8b890';
const HAIR = '#3a2a1a';
const DARK = '#2a2230';

function shadow(ctx: CanvasRenderingContext2D) {
  px(ctx, 3, 15, 10, 1, 'rgba(0,0,0,0.25)');
}

function eyes(ctx: CanvasRenderingContext2D) {
  px(ctx, 7, 6, 1, 1, OUTLINE);
  px(ctx, 9, 6, 1, 1, OUTLINE);
}

// Base hero used for NPCs (no accessory)
export function humanoid(tint: string): HTMLCanvasElement {
  const c = makeCanvas(16, 16);
  const ctx = c.getContext('2d')!;
  shadow(ctx);
  px(ctx, 5, 3, 6, 5, SKIN);
  px(ctx, 5, 2, 6, 2, HAIR);
  px(ctx, 4, 3, 1, 3, HAIR);
  px(ctx, 11, 3, 1, 3, HAIR);
  eyes(ctx);
  px(ctx, 4, 9, 8, 5, tint);
  px(ctx, 4, 9, 8, 1, OUTLINE);
  px(ctx, 2, 9, 2, 4, tint);
  px(ctx, 12, 9, 2, 4, tint);
  px(ctx, 5, 14, 2, 2, DARK);
  px(ctx, 9, 14, 2, 2, DARK);
  return c;
}

type Kind = 'knight' | 'mage' | 'cleric';

export function makeHero(tint: string, kind: Kind, step: 0 | 1): HTMLCanvasElement {
  const c = makeCanvas(16, 16);
  const ctx = c.getContext('2d')!;
  shadow(ctx);
  // legs (alternate with step)
  const a = step ? 4 : 5;
  const b = step ? 10 : 9;
  px(ctx, a, 14, 2, 2, DARK);
  px(ctx, b, 14, 2, 2, DARK);
  // body
  px(ctx, 4, 9, 8, 5, tint);
  px(ctx, 4, 9, 8, 1, OUTLINE);
  // arms
  px(ctx, 2, 9, 2, 4, tint);
  px(ctx, 12, 9, 2, 4, tint);
  // head
  px(ctx, 5, 3, 6, 5, SKIN);
  px(ctx, 5, 2, 6, 2, HAIR);
  px(ctx, 4, 3, 1, 3, HAIR);
  px(ctx, 11, 3, 1, 3, HAIR);
  eyes(ctx);

  if (kind === 'mage') {
    // pointed hat
    px(ctx, 4, 1, 8, 2, '#2a4ea0');
    px(ctx, 5, 0, 6, 1, '#2a4ea0');
    px(ctx, 7, 0, 2, 2, '#ffd86b');
  } else if (kind === 'cleric') {
    // miter + small cross
    px(ctx, 5, 0, 6, 3, '#e8e0c0');
    px(ctx, 7, 0, 2, 3, '#d23b3b');
  } else {
    // knight helmet band + crest
    px(ctx, 4, 2, 8, 2, '#9aa0b8');
    px(ctx, 7, 1, 2, 2, '#f4e7c0');
    // sword on the right
    px(ctx, 14, 6, 1, 8, '#cfd6e6');
    px(ctx, 13, 13, 3, 1, '#8a6a3a');
  }
  return c;
}

export function slime(color: string, step: 0 | 1): HTMLCanvasElement {
  const c = makeCanvas(16, 16);
  const ctx = c.getContext('2d')!;
  shadow(ctx);
  px(ctx, 3, 9, 10, 6, color);
  px(ctx, 4, 8, 8, 1, color);
  px(ctx, 5, 7, 6, 1, color);
  px(ctx, 6, 10, 1, 1, OUTLINE);
  px(ctx, 9, 10, 1, 1, OUTLINE);
  px(ctx, 6, 13, 4, 1, 'rgba(255,255,255,0.25)');
  if (step) px(ctx, 4, 7, 8, 1, 'rgba(255,255,255,0.18)');
  return c;
}

export function bat(color: string, step: 0 | 1): HTMLCanvasElement {
  const c = makeCanvas(16, 16);
  const ctx = c.getContext('2d')!;
  shadow(ctx);
  px(ctx, 7, 6, 2, 5, color);
  if (step) {
    px(ctx, 4, 4, 2, 2, color);
    px(ctx, 10, 4, 2, 2, color);
  } else {
    px(ctx, 5, 5, 2, 3, color);
    px(ctx, 9, 5, 2, 3, color);
  }
  px(ctx, 3, 4, 2, 2, color);
  px(ctx, 11, 4, 2, 2, color);
  px(ctx, 7, 6, 1, 1, OUTLINE);
  px(ctx, 8, 6, 1, 1, OUTLINE);
  return c;
}

export function boss(color: string, step: 0 | 1): HTMLCanvasElement {
  const c = makeCanvas(16, 16);
  const ctx = c.getContext('2d')!;
  shadow(ctx);
  px(ctx, 1, 15, 14, 1, 'rgba(0,0,0,0.3)');
  px(ctx, 3, 4, 10, 9, color);
  px(ctx, 2, 6, 1, 4, color);
  px(ctx, 13, 6, 1, 4, color);
  px(ctx, 5, 7, 2, 2, OUTLINE);
  px(ctx, 9, 7, 2, 2, OUTLINE);
  px(ctx, 6, 11, 4, 1, 'rgba(0,0,0,0.4)');
  if (step) {
    px(ctx, 4, 2, 2, 2, color);
    px(ctx, 10, 2, 2, 2, color);
  } else {
    px(ctx, 5, 2, 2, 2, color);
    px(ctx, 9, 2, 2, 2, color);
  }
  return c;
}

// --- tiles ---
function grassTile(): HTMLCanvasElement {
  const c = makeCanvas(16, 16);
  const ctx = c.getContext('2d')!;
  px(ctx, 0, 0, 16, 16, '#3a7d3a');
  for (const [x, y] of [[2, 3], [7, 2], [11, 5], [4, 9], [13, 11], [9, 13], [6, 7]]) px(ctx, x, y, 1, 1, '#2f6a2f');
  return c;
}

function pathTile(): HTMLCanvasElement {
  const c = makeCanvas(16, 16);
  const ctx = c.getContext('2d')!;
  px(ctx, 0, 0, 16, 16, '#b89a6a');
  for (const [x, y] of [[3, 4], [10, 6], [6, 11], [13, 13]]) px(ctx, x, y, 2, 1, '#a3855a');
  return c;
}

function floorTile(): HTMLCanvasElement {
  const c = makeCanvas(16, 16);
  const ctx = c.getContext('2d')!;
  px(ctx, 0, 0, 16, 16, '#8a7a5a');
  px(ctx, 0, 0, 16, 1, '#9a8a6a');
  px(ctx, 0, 8, 16, 1, '#7a6a4a');
  px(ctx, 8, 0, 1, 16, '#7a6a4a');
  return c;
}

function treeTile(): HTMLCanvasElement {
  const c = grassTile();
  const ctx = c.getContext('2d')!;
  px(ctx, 7, 9, 2, 5, '#5a3a1a');
  px(ctx, 3, 3, 10, 7, '#236b2f');
  px(ctx, 2, 4, 4, 4, '#2f8a3f');
  px(ctx, 9, 4, 4, 4, '#2f8a3f');
  return c;
}

function waterTile(): HTMLCanvasElement {
  const c = makeCanvas(16, 16);
  const ctx = c.getContext('2d')!;
  px(ctx, 0, 0, 16, 16, '#3a6ea5');
  px(ctx, 2, 4, 6, 1, '#5a8ec5');
  px(ctx, 8, 10, 6, 1, '#5a8ec5');
  return c;
}

function wallTile(): HTMLCanvasElement {
  const c = makeCanvas(16, 16);
  const ctx = c.getContext('2d')!;
  px(ctx, 0, 0, 16, 16, '#6a5a4a');
  px(ctx, 0, 0, 16, 1, '#7a6a5a');
  px(ctx, 0, 7, 16, 1, '#56483a');
  px(ctx, 7, 1, 1, 6, '#56483a');
  px(ctx, 3, 8, 1, 8, '#56483a');
  px(ctx, 11, 8, 1, 8, '#56483a');
  return c;
}

function doorTile(): HTMLCanvasElement {
  const c = floorTile();
  const ctx = c.getContext('2d')!;
  px(ctx, 5, 4, 6, 12, '#3a2a1a');
  px(ctx, 5, 4, 6, 1, '#52402a');
  return c;
}

function battleTile(): HTMLCanvasElement {
  const c = pathTile();
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#d23b3b';
  ctx.font = 'bold 10px monospace';
  ctx.textBaseline = 'top';
  ctx.fillText('!', 5, 3);
  return c;
}

function exitTile(): HTMLCanvasElement {
  const c = pathTile();
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#3b8fd2';
  ctx.fillRect(5, 4, 6, 8);
  ctx.fillStyle = '#cfe8ff';
  ctx.fillRect(6, 5, 4, 6);
  return c;
}

export const TILES: Record<string, HTMLCanvasElement> = {
  '.': grassTile(),
  ',': pathTile(),
  F: floorTile(),
  T: treeTile(),
  W: waterTile(),
  '#': wallTile(),
  D: doorTile(),
  B: battleTile(),
  O: exitTile()
};

export const SPRITES: Record<string, HTMLCanvasElement> = {};
