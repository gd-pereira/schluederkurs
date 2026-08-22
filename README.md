# Incompetent Chambers

Asymmetrical co-op escape room (hackathon).

## Stack

- Vite
- React + TypeScript
- Tailwind CSS
- Node HTTP + WebSocket (`ws`) for lobby / sync

## Setup

```bash
npm install
npm run build
npm start
```

Local **dev** (client + server):

```bash
# terminal 1 — API / WS + (after build) static
npm run server

# terminal 2 — Vite HMR (points WS at :8080)
npm run dev
```

Set `VITE_WS_URL=ws://localhost:8080` if needed (default in client).

Solo without multiplayer: open the app with `?solo=1` and use Partner sim.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Vite local client |
| `npm run build` | Production build → `dist/` |
| `npm start` / `npm run server` | Node static + WebSocket (`PORT`) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Lint |

## Deploy (deplo.io)

- Build outputs to `dist/`
- Runtime: `Procfile` → `npm start` → `node server/index.mjs`
- Ensure Cockpit **Sub Path** is empty (repo root)
- Build env: `BP_INCLUDE_NODEJS_RUNTIME=true` (optional: `BP_STATIC_WEBROOT=dist`)
