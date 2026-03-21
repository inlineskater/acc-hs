# CLAUDE.md

## Commands

```bash
npm run dev      # PartyKit dev server at http://localhost:1999
npm run deploy   # Deploy to PartyKit cloud
npm start        # Standalone Node.js server (no PartyKit, uses server.js)
```

## Architecture

The game has **three runtime modes**:

1. **GitHub Pages (primary)** — `public/index.html` runs the entire game in the browser,
   no server required. All game state, bot AI, and logic live in the frontend JS.
   Deployed automatically via GitHub Actions on every push to `master`.

2. **PartyKit multiplayer** — `party/server.ts` is a TypeScript server for real-time
   multiplayer. Frontend connects via WebSocket. Deploy with `npm run deploy`.

3. **Standalone Node.js** — `server.js` is a plain-JS WebSocket server mirroring
   `server.ts`. Run with `npm start`. Alternative to PartyKit for local LAN play.

## Key Files

| File | Purpose |
|------|---------|
| `public/index.html` | The entire game — HTML + CSS + vanilla JS (~2500 lines). Runs standalone in browser. |
| `party/server.ts` | PartyKit server — TypeScript, for multiplayer hosting |
| `server.js` | Standalone Node.js WebSocket server — JS mirror of server.ts |
| `start.js` | Wrapper that launches server.js with extra startup logic |
| `partykit.json` | PartyKit config — main: server.ts, serve: public/ |
| `cards.csv` | Card data reference only — NOT loaded at runtime |
| `GAME_DOCS.md` | Game design documentation and card reference |
| `.github/workflows/` | GitHub Actions — deploys public/ to GitHub Pages on push |

## Gotchas

- **Card data is hardcoded** in `public/index.html`, `server.js`, and `party/server.ts`
  as JS/TS arrays. `cards.csv` is a reference export only — changes there don't affect the game.
- **Game content (card names, UI text) is in Polish.**
- The game runs **fully offline** from `public/index.html` — no server or internet needed.
- After `npx partykit deploy`, update `PARTYKIT_HOST` in `public/index.html` with
  your PartyKit username, then deploy again.
- `start.js` wraps `server.js` with some startup logic for the standalone server.

## Game Features

- 4 hero classes: Mage, Warrior, Rogue, Priest (Polish-themed)
- 1–3 bots per game, 4 difficulty levels
- Campaign mode with 8 chapters and special rules
- Neon cyberpunk UI, dark/light theme toggle
- Mechanics: taunt, charge, divine shield, deathrattle, combo, battlecry, end-of-turn effects
- Bot turn slide-up log panel showing each action
- Board minion hover tooltips
- Armor badge stacks above HP badge on hero portraits
