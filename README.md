# Incompetent Chambers

Asymmetrical co-op escape room (hackathon).

## Stack

- Vite
- React + TypeScript
- Tailwind CSS

## Setup

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build → `dist/` |
| `npm start` | Serve `dist/` (used by deplo.io) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Lint |

## Deploy (deplo.io)

- Build outputs to `dist/`
- Runtime start command comes from `Procfile` → `npm start`
- Ensure Cockpit **Sub Path** is empty (repo root)
- Build env: `BP_INCLUDE_NODEJS_RUNTIME=true` (optional: `BP_STATIC_WEBROOT=dist`)
