# Serce Ksiag

A Hearthstone-inspired card game with a tax-office theme, playable entirely in the browser. Built with vanilla JS — no frameworks, no build step, no server required.

**Play it:** https://inlineskater.github.io/acc-hs/

---

## What it is

Single-file browser game (~2500 lines, `public/index.html`). Choose a hero class, fight 1–3 bots, and survive the bureaucracy. Game content is in Polish.

**Heroes:** Mage, Warrior, Rogue, Priest — each with a unique hero power and 8-card deck.

**Mechanics:** taunt, charge, divine shield, deathrattle, combo, battlecry, end-of-turn effects, fatigue, armor, weapons.

**Modes:**
- Quick game — pick class, pick number of bots (1–3) and difficulty (1–4)
- Campaign — 8 chapters with story and special rules

---

## Run locally

```bash
# Just open the file — no server needed
open public/index.html
```

Or serve it with any static server:

```bash
npx serve public
```

---

## Alternative: WebSocket server mode

Two server implementations exist for real-time multiplayer experiments:

```bash
npm install

# Standalone Node.js WebSocket server
npm start

# PartyKit (deploy to PartyKit cloud)
npm run dev      # local dev at localhost:1999
npm run deploy   # deploy to partykit.dev
```

When using a server, the frontend connects via WebSocket automatically (it detects `localhost` vs production host).

---

## Project structure

```
public/
  index.html        The entire game (HTML + CSS + JS)
party/
  server.ts         PartyKit TypeScript server (multiplayer)
server.js           Standalone Node.js WebSocket server
start.js            Launcher wrapper for server.js
cards.csv           Card data reference (not loaded at runtime)
GAME_DOCS.md        Game design and card reference documentation
```

---

## GitHub Pages deployment

Pushes to `master` automatically deploy `public/` via GitHub Actions. No configuration needed.
