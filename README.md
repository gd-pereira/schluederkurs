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
2. Lobby → **Solo** → **Ready**
3. Use the **Solo sim** buttons under the pod for the other player

### Two-player (real multiplayer)

1. Keep `npm run dev:all` running
2. Open **two** browser windows on `http://localhost:5173`
3. Window A: **Create room** → copy the 4-letter code
4. Window B: **Join room** → paste code → **Join**
5. Both click **Ready** when peers show `2/2`
6. Play — ghost is the other player; no Partner sim

Tip: use a normal window + an Incognito/Private window so you don’t share the same tab state.

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
