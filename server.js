import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const text = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const k = m[1];
      const v = m[2].replace(/^["']|["']$/g, '');
      if (process.env[k] === undefined) process.env[k] = v;
    }
  } catch {
    /* no .env file (e.g. Railway provides real env vars) */
  }
}
loadEnv();

const PORT = process.env.PORT || 3001;
const DIST = path.join(__dirname, 'dist');
const GATEWAY = 'https://ai-gateway.vercel.sh/v1/chat/completions';

const SYSTEM = `You are the battle interpreter for "Prompting Fantasy", a Final-Fantasy-style RPG.
The player types a natural-language instruction to make a hero act in combat.
Respond with ONLY a single JSON object (no markdown fencing, no commentary) of exactly this shape:
{"element":"fire|ice|lightning|earth|holy|heal|slash|guard","target":"all-enemies|single-enemy|all-allies|single-ally|self","power":1,"flavor":"short phrase"}
Rules:
- element fire/ice/lightning/earth/holy are offensive (target enemies); holy is strong vs undead.
- heal restores HP and must target an ally or self.
- slash is a physical melee strike (target enemies).
- guard raises defense and targets self or allies.
- target: all-enemies/single-enemy for offense; all-allies/single-ally/self for heal or guard.
- power: 1 (weak) to 3 (strong). Infer from wording ("lightly"=1, "massive"/"everything"=3).`;

async function callGateway(prompt) {
  const token = process.env.AI_GATEWAY_TOKEN;
  if (!token) return { error: 'no_token' };
  const model = process.env.AI_GATEWAY_MODEL || 'meta/muse-spark-1.1';

  try {
    const res = await fetch(GATEWAY, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      })
    });
    if (!res.ok) {
      const detail = await res.text();
      return { error: 'gateway_error', status: res.status, detail };
    }
    const data = await res.json();
    const msg = data.choices && data.choices[0] && data.choices[0].message;
    if (msg && msg.content) return { content: msg.content };
    return { error: 'empty' };
  } catch (e) {
    return { error: 'fetch_failed', detail: String(e) };
  }
}

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/cast') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', async () => {
      let prompt = '';
      try {
        prompt = (JSON.parse(body).prompt || '').toString();
      } catch {}
      const result = await callGateway(prompt);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    });
    return;
  }

  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(DIST, path.normalize(urlPath));
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream'
    });
    res.end(data);
  });
});

server.listen(PORT, () => console.log(`Prompting Fantasy server on http://localhost:${PORT}`));
