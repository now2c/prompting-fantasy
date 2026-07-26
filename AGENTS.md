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
- Sprites/tiles are generated procedurally in `src/core/Assets.ts` (no image asset files). `makeHero(tint, kind, step)` produces knight/mage/cleric variants; `humanoid(tint)` for NPCs; `slime/bat/boss(color, step)` for enemies. The `step` param (0|1) toggles legs/wings for walk/wobble animation.
- **Sprite frame convention**: `SPRITES[id]` = idle frame, `SPRITES[id + '_w']` = walk/wobble frame (e.g., `vance_w`, `goblin_w`). Registered in `characters.ts` and `enemies.ts`.
- `src/core/Input.ts` is a global keyboard handler. It only swallows key events when the battle prompt `<input id="prompt-input">` is **visible** (`isPromptActive`); otherwise movement keys must always register. Don't add a blanket "ignore INPUT" bail or movement breaks after battle.
- `src/systems/Audio.ts` — WebAudio SFX + BGM, all procedurally generated (no audio files). Lazy `AudioContext` init on first user gesture (`audio.unlock()` called in `main.ts`). M key toggles mute (persisted in `localStorage` key `pf_mute`). BGM auto-starts after unlock.
- `src/ui/Effects.ts` — particle/bolt VFX system. `spawnElement(element, x, y)` for spell effects, `castFlash(x, y)` for caster flash. Used in `BattleScene`.

## Responsive scaling
- `CONFIG.scale` is **mutated at runtime** by `main.ts` on window resize: `scale = max(1, floor(min(vw/256, vh/224)))`. Don't hardcode `3`. The DOM prompt input is positioned via `CONFIG.scale * baseCoord`, so it stays aligned.
- `index.html` body is flex-centered; the canvas has `image-rendering: pixelated`. "Press Start 2P" font loaded via `<link>` for pixel headings.

## SceneManager fade transitions
- `SceneManager.set(scene)` does **not** swap immediately. It triggers fade-out (~0.18s) → swap (old `exit()`, new `enter()`) → fade-in (~0.2s). During fade-out the old scene still updates.
- `FieldScene.transitioning` flag (set in `gotoOtherMap`/`startBattle`) prevents re-triggering `O`/`B` tiles during the fade-out window, in addition to `transitionLock`.

## Renderer / fonts
- `r.heading(str, x, y, color, size)` uses `"Press Start 2P"` webfont for titles/panels. `r.text()` uses `monospace` — **keep body text on monospace** because dialogue/prompts contain Chinese (CJK), which Press Start 2P doesn't cover. Don't "fix" all text to pixel font.
- `r.setAlpha(a)` / `r.clearAlpha()` wrap sprite draws for death fades and particle transparency.
- `r.text()` has an optional `outline` param (6th arg) for a 1px dark shadow on important text.

## Battle-screen gotchas (easy to break)
- `BattleScene.draw` must call `r.setCamera(0, 0)` first. It inherits FieldScene's scroll offset, so without it enemies render off-screen. Screen shake temporarily offsets the camera (`setCamera(sx, sy)`) for sprites, then **resets to `(0, 0)`** before drawing UI elements (log, prompt box, panels) so they stay stable.
- The "▶ Name, type a PROMPT:" label is drawn on the canvas **above** the DOM input box (label at y=190, input at y=203). Keep it above the input, or the opaque input covers it.
- Two-line action log is a `logs` buffer (last 2) rendered mid-screen, not a single `log` string.
- BattleScene listens to `window resize` to reposition the DOM prompt input via `repositionInput()`. Don't remove this or the input drifts on viewport changes.
- `bgTheme` (from `GameState.mapId` at construction time) controls whether the battle backdrop draws town houses or route trees.

## Field/map gotchas (hard-won)
- NPCs are solid (`collide` checks NPC tiles). **Map spawn points must not overlap an NPC tile** — route spawn once equaled the Sign NPC and trapped the player. Also a spawn must not sit on the `O` exit tile (caused an infinite town↔route flip).
- `FieldScene` gates NPC interaction with `wasActive` so the Enter that closes the last dialogue line doesn't immediately reopen it. Keep that guard.
- On map transition, `gotoOtherMap` sets `newScene.transitionLock` so you don't bounce straight back. The `transitioning` flag also blocks re-entry during fade.

## Deploy (Railway)
Railway auto-detects Node, runs `npm run build` then `npm start` (see `railway.json`). Set `AI_GATEWAY_TOKEN` and `AI_GATEWAY_MODEL` in the Railway dashboard. No Dockerfile needed.

## Environment note (this sandbox)
Node is not on the default `PATH` here; prepend `~/.local/node20/bin` (Node 18+, since `server.js` uses global `fetch`).
