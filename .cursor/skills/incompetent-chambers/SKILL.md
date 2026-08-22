---
name: incompetent-chambers
description: >-
  Locked design and engineering rules for Incompetent Chambers / Project Synapse —
  asymmetrical 2-player co-op escape room (Vite + React + Tailwind, DOM 2.5D,
  WebSocket on deplo.io). Use when building game features, tasks, power grid,
  overworld movement, assets, multiplayer sync, or hackathon scope decisions.
---

# Incompetent Chambers — Project Skill

## Stack (locked)

- Vite + React + TypeScript + Tailwind (not Next.js)
- World: DOM sprites, 1280×720 per pod
- Movement: rAF + refs — **never** `setState` player x/y every frame
- Multiplayer later: WebSocket on deplo.io; DB = lobby + highscore only
- Match state ephemeral (memory/WS)

## Interaction model (locked)

- **Mode A (overworld):** WASD, Y-sort, collision, flashlight when dark, `[E]` prompts
- **Mode B (task):** Among Us–style centered modal; `inputLocked`; no walking until closed
- Every real puzzle action is a **task modal**, not inline world fiddling

## 2.5D rules

- Tall PNG / placeholder, **tiny foot AABB** for collision
- Y-sort by foot bottom (`z-index = floor(foot.y + foot.h)`)
- Shadows in-engine, not baked into assets
- Interact radius ~80px around footprint; key **E**

## Power (locked)

- Shared 100% grid; devices **reserve** while task open (tug-of-war)
- Keypad (B): 80% reserve; Fuse (A): 70% reserve
- Lights hysteresis ~off &lt;25%, on &gt;35%
- Gate sync window ~1.2s

## Phases (v1 only — no fifth puzzle)

0. Lobby → Ready → gate slam → blackout  
1. Dual local levers → grid on  
2. B rag wipe → A smash vase → code `8977`  
3. B keypad 80% → A gets fuse  
4. A fuse 70% → B yields → sync bypass → escape + highscore  

## Out of v1

Wire/Morse/frequency minigames, WebRTC, split-screen, Pixi/Three, long inventory, mid-game reconnect polish.

## Asset filenames

`floor_tile`, `wall_h`, `gate_left`/`gate_right`, `breaker_box`, `vase_pedestal`, `painting`, `gate_console`, `locker`, `cart`, `item_lever`, `item_rag`, `item_wrench`, `item_fuse`, `modal_grime_wall`, `modal_vase_1..4`, `modal_keypad`, optional `player`.

## Build order

1. WASD + walls + Y-sort  
2. Flashlight  
3. Ready → gate → blackout  
4. WS ghost + power bars  
5. Lever task  
6. Rag → smash → keypad → fuse  
7. Gate sync + score  
8. AI hint lines  

## Pitch

Resource-conflict escape room; Among Us is visual/task language only — not the genre claim.
