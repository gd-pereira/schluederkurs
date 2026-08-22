# Incompetent Chambers

Asymmetrical co-op escape room (hackathon).

## Stack

- Vite
- React + TypeScript
- Tailwind CSS
- Node HTTP + WebSocket (`ws`) for lobby / sync

## Everyday local testing (easiest)

One terminal:

```bash
npm run dev:all
```

That starts:

- **WebSocket + static server** on `http://localhost:8080`
- **Vite** (hot reload) on `http://localhost:5173`

Use the **Vite URL** (`5173`) while developing — it talks to WS on `8080` automatically.

### Solo (Partner sim)

1. Open `http://localhost:5173` (or `http://localhost:5173/?solo=1`)
2. Landing → **Solo** → pick Pod A or B
3. Watch the briefing (or Skip), then use the **Solo sim** buttons under the pod for the other player

### Two-player (real multiplayer)

1. Keep `npm run dev:all` running
2. Open **two** browser windows on `http://localhost:5173`
3. Window A: **Start Game** → copy the 4-letter code
4. Window B: **Join Lobby** → paste code → **Join**
5. Both click **Ready** when peers show `2/2`
6. Briefing → lights up — ghost is the other player; no Partner sim

Tip: use a normal window + an Incognito/Private window so you don’t share the same tab state.

## Demo checklist (judges)

1. `npm run dev:all` → open **two** windows on `http://localhost:5173`
2. **Start Game** / **Join Lobby** + Copy code → both **Ready** at `2/2`
3. Skip or watch briefing → lights into pods
4. **Pod A:** lever → wrench → (wait for wipe) vase `8977` → locker fuse → fuse bay 70% → bypass hold  
5. **Pod B:** lever → rag → wipe wall → keypad 80% (code from A) → yield if A needs power → bypass hold  
6. **Solo:** Solo → Ready → briefing → use **Solo sim** “Next: …” buttons under the pod in order (lever → wipe → keypad → yield/bypass)
7. Mid-game partner disconnect ends the match (Back to lobby) — no mid-game reconnect
8. Escape → **Play again** returns to landing without refreshing

Friend art: drop skill-named PNGs into `public/assets/` (see `src/game/assets.ts`).

### Production-like check (after build)

```bash
npm run build
npm start
```

Then open `http://localhost:8080` twice (same Create/Join flow). No Vite — this is what deplo.io runs.

## Setup (first time)

```bash
npm install
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev:all` | **Recommended** — WS server + Vite together |
| `npm run dev` | Vite only (needs `npm run server` in another terminal) |
| `npm run server` | Node static + WebSocket on `:8080` |
| `npm run build` | Production build → `dist/` |
| `npm start` | Same as `server` (deplo.io) |
| `npm run lint` | Lint |

Optional: `VITE_WS_URL=ws://localhost:8080` / `VITE_API_URL=http://localhost:8080` (defaults when on Vite’s port).

Scores: `GET/POST http://localhost:8080/api/highscores` (in-memory on the Node server; escape overlay uses this, falls back to localStorage).

## Deploy (deplo.io)

- Build outputs to `dist/`
- Runtime: `Procfile` → `npm start` → `node server/index.mjs`
- Ensure Cockpit **Sub Path** is empty (repo root)
- Build env: `BP_INCLUDE_NODEJS_RUNTIME=true` (optional: `BP_STATIC_WEBROOT=dist`)
