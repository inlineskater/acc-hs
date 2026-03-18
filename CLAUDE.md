# CLAUDE.md

## Commands

```bash
npm run dev      # PartyKit dev server at http://localhost:1999
npm run deploy   # Deploy to PartyKit cloud
npm start        # Standalone Node.js server (no PartyKit, uses server.js)
```

## Architecture

Two separate server implementations exist:
- `party/server.ts` — PartyKit server (TypeScript). **Primary** for multiplayer hosting.
  All game logic lives here. Compiled/run by PartyKit runtime.
- `server.js` — Standalone Node.js WebSocket server. Alternative for local play
  without PartyKit. Mirrors the logic in server.ts but in plain JS.
- `public/index.html` — Single-file frontend (HTML + vanilla JS, ~1100 lines).
  Connects to whichever server is running via WebSocket.

## Key Files

| File | Purpose |
|------|---------|
| `party/server.ts` | PartyKit server — game state, turn logic, card effects |
| `public/index.html` | Client UI — rendering, animations, WS message handling |
| `server.js` | Standalone Node.js mirror of server.ts |
| `partykit.json` | PartyKit config — main: server.ts, serve: public/ |
| `cards.csv` | Card data reference (NOT loaded at runtime — cards are hardcoded in servers) |
| `GAME_DOCS.md` | Game design documentation |

## Gotchas

- Card data is **hardcoded** in both `server.js` and `party/server.ts` as JS/TS arrays.
  `cards.csv` is a reference/export only — changes there don't affect the game.
- Game content (card names, UI text) is in **Polish**.
- After `npx partykit deploy`, update `PARTYKIT_HOST` in `public/index.html` with
  your PartyKit username, then deploy again.
- `start.js` wraps `server.js` with some startup logic for the standalone server.
