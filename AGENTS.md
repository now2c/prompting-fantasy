# AGENTS.md — Prompting Fantasy

Pixel-art RPG (Final Fantasy IV style) where combat is driven by **typing prompts**. Vite + TypeScript + Canvas2D, no game engine. The player types natural-language instructions that are interpreted (via Vercel AI Gateway, with an offline keyword fallback) into spells.

## Commands
- `npm run dev` — runs `node server.js` (:3001) **and** `vite` (:5173) together. Vite proxies `/api` → `http://localhost:3001`. Both must be up; the browser talks to the Vite port.
- `npm run build` — `vite build` only (outputs `dist/`). It does **not** typecheck.
- `npm run typecheck` — `tsc --noEmit`. There is **no test suite**; this plus `build` are the only automated checks. Run typecheck before pushing.
- `npm start` — `node server.js`: serves `dist/` and handles `POST /api/cast`. Used in production/Railway.

## Secrets / Vercel AI Gateway (important)
- `server.js` loads `.env` itself (no dotenv dep). Provide `AI_GATEWAY_TOKEN` and `AI_GATEWAY_MODEL` in `.env` locally, and as Railway env vars in production. `.env` is gitignored — never commit the token.
- The browser **never** calls the gateway. The client only calls same-origin `POST /api/cast`; `server.js` holds the token and forwards to `https://ai-gateway.vercel.sh/v1/chat/completions`.
- Model `meta/muse-spark-1.1` does **not** support tool-calling or `response_format`. `server.js` prompts for a JSON object and parses `content`. Do **not** "upgrade" it to function calling — it will 400. If `/api/cast` errors, `src/systems/PromptInterpreter.ts` falls back to the offline keyword parser (`src/data/promptKeywords.ts`), so the game still works without a token.

## Architecture
- Entry `src/main.ts` → `Engine` → `SceneManager`. Scenes: `TitleScene`, `FieldScene`, `BattleScene` (`src/scenes/`).
- Shared mutable state in `src/gameState.ts` (party, current map, player tile, `consumedBattles` Set).
- Sprites/tiles are generated procedurally in `src/core/Assets.ts` (humanoid/slime/bat/boss + tile functions). There are **no image asset files** — don't look for them.
- `src/core/Input.ts` is a global keyboard handler. It only swallows key events when the battle prompt `<input id="prompt-input">` is **visible** (`isPromptActive`); otherwise movement keys must always register. Don't add a blanket "ignore INPUT" bail or movement breaks after battle.

## Battle-screen gotchas (easy to break)
- `BattleScene.draw` must call `r.setCamera(0, 0)` first. It inherits FieldScene's scroll offset, so without it enemies render off-screen.
- The "▶ Name, type a PROMPT:" label is drawn on the canvas **above** the DOM input box. Keep it above the input, or the opaque input covers it (it looked like the label appeared only after typing).
- Two-line action log is a `logs` buffer (last 2) rendered mid-screen, not a single `log` string.

## Field/map gotchas (hard-won)
- NPCs are solid (`collide` checks NPC tiles). **Map spawn points must not overlap an NPC tile** — route spawn once equaled the Sign NPC and trapped the player. Also a spawn must not sit on the `O` exit tile (caused an infinite town↔route flip).
- `FieldScene` gates NPC interaction with `wasActive` so the Enter that closes the last dialogue line doesn't immediately reopen it. Keep that guard.
- On map transition, `gotoOtherMap` sets `newScene.transitionLock` so you don't bounce straight back.

## Deploy (Railway)
Railway auto-detects Node, runs `npm run build` then `npm start` (see `railway.json`). Set `AI_GATEWAY_TOKEN` and `AI_GATEWAY_MODEL` in the Railway dashboard. No Dockerfile needed.

## Environment note (this sandbox)
Node is not on the default `PATH` here; prepend `~/.local/node20/bin` (Node 18+, since `server.js` uses global `fetch`).
