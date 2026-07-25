import { promises as fs } from 'node:fs';
import path from 'node:path';
import * as git from 'isomorphic-git';
import http from 'node:http';
import https from 'node:https';

const DIR = '/home/aitech/Opencode/rpg-prompting-fantasy';

const IGNORE = new Set(['node_modules', 'dist', '.git', '.env', '.env.local']);
const SKIP_EXT = new Set(['.log']);

async function walk(dir, base = '') {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (IGNORE.has(e.name)) continue;
    const rel = base ? path.join(base, e.name) : e.name;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walk(abs, rel)));
    } else {
      if (SKIP_EXT.has(path.extname(e.name))) continue;
      out.push(rel);
    }
  }
  return out;
}

const files = await walk(DIR);
console.log('Staging', files.length, 'files');

await git.init({ fs, dir: DIR, defaultBranch: 'main' });

for (const f of files) {
  try {
    await git.add({ fs, dir: DIR, filepath: f });
  } catch (e) {
    console.error('skip', f, e.message);
  }
}

const oid = await git.commit({
  fs,
  dir: DIR,
  message: 'Initial commit: Prompting Fantasy MVP (ATB + LLM prompt combat)',
  author: { name: 'Prompting Fantasy', email: 'dev@prompting.fantasy' }
});
console.log('Committed', oid);

const log = await git.log({ fs, dir: DIR, depth: 1 });
console.log('Commit:', log[0].commit.message);
