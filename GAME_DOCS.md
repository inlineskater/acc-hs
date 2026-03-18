# Serce Ksiąg — Game Documentation

> Tax-office-themed Hearthstone clone. Two files only: `party/server.ts` (game logic) and `public/index.html` (UI + client JS). Built on PartyKit (WebSocket rooms).

---

## Architecture

```
party/server.ts       TypeScript, runs on PartyKit edge
public/index.html     Single-file frontend (HTML + CSS + JS inline)
start.js              Dev launcher (PartyKit + cloudflared)
```

- Server holds all game state. Client is a dumb renderer — it sends actions, server validates and broadcasts the new state.
- Every state update: `{ type:"update", state: GameState, events: AnimEvent[] }`.
- Animations (`AnimEvent`) are `-dmg`/`+heal` pop-ups played client-side.

---

## Key Types (`server.ts`)

### `CardDef`
```ts
{
  id, name, art, cost, type: "minion"|"spell"|"weapon",
  atk?, hp?,
  keywords?: ["taunt"|"charge"|"divine_shield"|"windfury"],
  battlecry?, bcText?,       // bc effect id + display text
  deathrattle?, drText?,
  spellEffect?, spellText?,
  weaponAtk?, durability?,
  combo?, comboText?,        // rogue combo mechanic
  legendary?,                // 1 copy in deck, gold border
}
```

### `BoardMinion` extends `CardDef`
Adds runtime state: `uid, curHp, maxHp, canAtk, fresh, divineShield?, silenced?`

### `PlayerState`
```ts
{
  id, hp (max 30), armor,
  maxMana, mana,
  deck: BoardMinion[], hand: BoardMinion[], board: BoardMinion[],
  weapon: Weapon | null,
  cls,                    // "mage"|"warrior"|"rogue"|"priest"
  heroPowerUsed, canHeroAtk, heroAtkVal,
  playedThisTurn,         // tracks Rogue combo
  fatigue,                // increments each draw on empty deck, damages for that amount
  mulliganDone,
  botLevel,               // 0 = human, 1-4 = bot difficulty
}
```

### `GameState`
```ts
{
  phase: "waiting"|"mulligan"|"playing"|"over",
  players: { [id]: PlayerState },
  playerOrder: [p1id, p2id],
  activePlayer: string,
  turn: number,
  winner: string | null,
  log: string,
}
```

---

## Game Flow

```
waiting → (2nd player joins) → mulligan → (both confirm) → playing → over
```

1. **Waiting**: room open, one player connected.
2. **Mulligan**: both players get 3 cards. P2 also gets a coin. Players select cards to replace then click confirm. Bot auto-confirms. When both done → `startPlaying()`.
3. **Playing**: turn-based. Active player sends actions; server validates, broadcasts.
4. **Over**: `checkWin()` sets phase when either hero reaches ≤0 HP.

### Turn start (server-side, in `end_turn` handler)
- `opp.maxMana = min(10, ceil(turn/2) + 1)` — mana ramps fast for short games
- Opponent draws 1 card (with fatigue if deck empty)
- All minions unfresh, `canAtk = true`
- `heroPowerUsed = false`
- If opponent is bot → `runBotTurn()` after 900ms

---

## Deck Building

- Each class has **8 CardDefs** in their array: 7 standard + 1 legendary.
- `buildDeck()` produces 15 cards: `[...standards(7), ...standards(7), legendary(1)]`, shuffled.
- `cloneCard()` gives each card a unique `uid` at runtime.

---

## Card Classes & Card IDs

### Mage (`mage`) — Mag Podatkowy 🧙
| id   | name               | cost | type    | effect/keyword           |
|------|--------------------|------|---------|--------------------------|
| m1   | Iskra Skarbowa     | 1    | minion  | 1/2, charge              |
| m2   | Gardziel Podatku   | 2    | minion  | 2/3, bc: 1 dmg hero      |
| ms1  | Korekta Podatkowa  | 1    | spell   | draw2                    |
| ms2  | Zawieja Audytu     | 3    | spell   | deal2all (enemies+hero)  |
| m3   | Strażnik KPiR      | 4    | minion  | 1/7, taunt               |
| ms3  | Kulka Ognia        | 4    | spell   | deal4face (targeted)     |
| mw1  | Różdżka Kontroli   | 3    | weapon  | 3/2                      |
| mL   | Wielki Inkasent    | 7    | minion  | 5/7, bc: deal1all+draw1  | ★ LEGENDARY

Hero Power (2 mana): deal 1 dmg to any target (hero or minion).

### Warrior (`warrior`) — Wojownik Księgi ⚔️
| id   | name               | cost | type    | effect/keyword           |
|------|--------------------|------|---------|--------------------------|
| w1   | Oblężnik Bilansu   | 1    | minion  | 2/2                      |
| w2   | Inkasent Długów    | 2    | minion  | 2/3, bc: +2 armor        |
| w3   | Tarcza Leasingu    | 2    | minion  | 1/6, taunt               |
| ws1  | Fortyfikacja       | 3    | spell   | +6 armor                 |
| w4   | Komornik Sądowy    | 3    | minion  | 4/2, bc: +3 armor        |
| ww1  | Topór Amortyzacji  | 2    | weapon  | 3/2                      |
| ws2  | Nalot Komornika    | 4    | spell   | deal3all (minions only)  |
| wL   | Generał Długów     | 7    | minion  | 7/7, taunt, bc: +4 armor | ★ LEGENDARY

Hero Power (2 mana): +2 armor (no target needed).

### Rogue (`rogue`) — Łotr Podatkowy 🃏
| id   | name               | cost | type    | effect/keyword                  |
|------|--------------------|----- |---------|---------------------------------|
| r1   | Kieszonkowiec VAT  | 1    | minion  | 1/2, combo: 1 dmg hero          |
| r2   | Przemytnik Ulg     | 2    | minion  | 3/2, combo: draw1               |
| r3   | Agent Rejestrowy   | 3    | minion  | 3/2, bc: draw1                  |
| r4   | Fałszerz Bilansu   | 3    | minion  | 2/4, combo: 2 dmg hero          |
| rs1  | Trucizna Faktur    | 2    | spell   | deal2all (enemies+hero)         |
| rs2  | Sztylet Audytu     | 3    | spell   | deal4face (targeted)            |
| rw1  | Sztylet Egzekutora | 3    | weapon  | 3/3                             |
| rL   | Mistrz Cienia      | 6    | minion  | 6/5, bc: draw1, combo: 3 dmg hero | ★ LEGENDARY

Hero Power (2 mana): equip 1/2 dagger (sets weapon, `heroAtkVal = 1`).

**Combo mechanic**: if `me.playedThisTurn` is `true` when a combo card is played, `applyCombo()` fires in addition to the battlecry.

### Priest (`priest`) — Kapłan Bilansowy ✝️
| id   | name               | cost | type    | effect/keyword                    |
|------|--------------------|------|---------|-----------------------------------|
| p1   | Młodszy Referent   | 1    | minion  | 1/3                               |
| p2   | Archiwista Duszy   | 2    | minion  | 1/4, bc: heal 2 self              |
| p3   | Mnich Podatkowy    | 3    | minion  | 2/6, taunt                        |
| p4   | Uzdrowiciel ZUS    | 3    | minion  | 2/4, bc: heal2target (any)        |
| ps1  | Modlitwa Audytu    | 1    | spell   | heal 2 self                       |
| ps2  | Uzdrowienie Masowe | 3    | spell   | heal 2 all own minions + self     |
| ps3  | Wielka Łaska       | 5    | spell   | heal6target (targeted)            |
| pL   | Arcykapłan VAT     | 7    | minion  | 5/8, taunt, bc: heal4target       | ★ LEGENDARY

Hero Power (2 mana): heal 2 HP to any target (hero or minion). Uses `healMode` flag + target selection UI.

---

## Server Actions (WebSocket messages)

### Client → Server

| `type`       | extra fields                                                                 |
|--------------|------------------------------------------------------------------------------|
| `join`       | `cls`, `vsBot?: bool`, `botLevel?: 1-4`                                      |
| `mulligan`   | `replace: uid[]` — card UIDs to swap (coin uid ignored)                      |
| `play_card`  | `cardUid`, `targetUid?`, `targetType?`                                       |
| `attack`     | `attackerUid`, `targetUid?`, `targetType: "hero"\|"minion"`                  |
| `hero_attack`| `targetUid?`, `targetType: "hero"\|"minion"`                                 |
| `hero_power` | `targetUid?`, `targetType?` (varies by class — see below)                   |
| `end_turn`   | —                                                                            |

### `targetType` values used in `hero_power` / `play_card`
| value         | meaning                        |
|---------------|--------------------------------|
| `"hero"`      | opponent hero                  |
| `"hero_me"`   | own hero                       |
| `"hero_opp"`  | opponent hero (priest heal)    |
| `"minion"`    | opponent minion (by targetUid) |
| `"minion_me"` | own minion (by targetUid)      |
| `"minion_opp"`| opponent minion (by targetUid) |

### Server → Client
```json
{ "type": "update", "state": GameState, "events": AnimEvent[] }
{ "type": "you", "id": "senderId" }
```

---

## Effect IDs Reference

### Battlecry (`card.battlecry`)
| id              | effect                                          |
|-----------------|-------------------------------------------------|
| `deal1`         | 1 dmg to opp hero                               |
| `deal2`         | 2 dmg to opp hero                               |
| `deal1all`      | 1 dmg to all opp minions + hero                 |
| `deal1all_draw1`| 1 dmg all opp + hero, draw 1                   |
| `draw1`         | draw 1 card                                     |
| `armor2/3/4`    | +N armor                                        |
| `heal2self`     | heal 2 own hero                                 |
| `heal2target`   | heal 2 to targetUid/targetType                  |
| `heal4target`   | heal 4 to targetUid/targetType                  |

### Spell effect (`card.spellEffect`)
| id           | effect                                                     |
|--------------|------------------------------------------------------------|
| `deal4face`  | 4 dmg to targetUid (minion_opp/minion_me) or opp hero      |
| `deal6face`  | 6 dmg to opp hero                                          |
| `deal2all`   | 2 dmg all opp minions + opp hero                           |
| `deal3all`   | 3 dmg all opp minions (no face)                            |
| `draw2`      | draw 2 cards                                               |
| `armor4/6`   | +N armor                                                   |
| `armor6draw1`| +6 armor + draw 1                                          |
| `mana1`      | +1 mana this turn (coin)                                   |
| `heal2self`  | heal 2 own hero                                            |
| `heal4self`  | heal 4 own hero                                            |
| `heal2all`   | heal 2 all own minions + own hero                          |
| `heal6target`| heal 6 to targetUid/targetType                             |
| `buff_weapon`| +2 atk to own weapon                                      |
| `buff_all`   | +2/+2 to all own minions                                   |

### Combo (`card.combo`)
`deal1`, `deal2`, `deal3`, `draw1`, `deal1all` — same semantics as battlecry.

---

## Fatigue
When a draw is attempted with an empty deck:
```ts
p.fatigue++;
p.hp -= p.fatigue;
pendingEvents.push({ kind:'damage', targetId:'hero_'+idx, amount:p.fatigue });
```
First empty draw = 1 dmg, second = 2 dmg, etc.

---

## Bot AI (`server.ts`)

Entry point: `runBotTurn(botId, safety=0)` — recursive `setTimeout` loop.
Each tick calls `getNextBotMove()` → executes via `handle()` → schedules next tick.
Safety limit: 25 actions per turn (then forces `end_turn`).

Action priority order:
1. Play a card (highest-cost first on L3/L4)
2. Attack with a minion
3. Use hero power
4. Hero weapon attack
5. End turn

**Difficulty levels** (delay between actions):
| Level | Name       | Delay  | Strategy                                      |
|-------|------------|--------|-----------------------------------------------|
| 1     | Żółtodziób | 1100ms | Random card, 60% random minion / 40% face     |
| 2     | Normalny   | 850ms  | Cheapest card first, always face              |
| 3     | Trudny     | 650ms  | Highest-cost card, kill high-ATK minions      |
| 4     | Ekspert    | 450ms  | Favorable trades, remove threats              |

All levels respect **taunt** (forced target). Mage L3+ uses hero power to finish 1-HP minions. Priest always heals self.

---

## Frontend (`public/index.html`) — Key Sections

### Screens
| id       | shown when                              |
|----------|-----------------------------------------|
| `#lobby` | before connecting / choosing class      |
| `#gs`    | in-game (board screen)                  |
| `#goov`  | game over overlay (absolute, z:300)     |

### Important DOM IDs
```
#board           main game board (relative positioned)
#ac              SVG canvas for attack arrow
#spell-overlay   targeting mode tint (pointer-events:none — clicks pass through)
#mulligan-overlay mulligan screen
#my-port / #opp-port  hero portraits (clickable)
#hpbtn           hero power gem button
#my-wpn-slot / #opp-wpn-slot  weapon card slots (left of hero)
#eotn            End Turn button
#lg              log bar text
```

### JS State Variables
```js
ws, myId, roomId, gameState   // connection + server state mirror
selAtk          // uid of selected attacker, or '__hero__' for hero weapon
pendingSpell    // CardDef waiting for target
pendingSpellIsHeal  // true if spell heals (different target logic)
heroPowerMode   // true while mage is picking hero power target
healMode        // true while priest is picking hero power heal target
dragStart/Current  // for attack arrow drawing
mulliganSelected  // Set of uids selected for swap
mulliganConfirmed // bool: player clicked confirm
isBotGame, botDifficulty
```

### Mode Cancellation
`cancelModes()` clears: `pendingSpell`, `pendingSpellIsHeal`, `heroPowerMode`, `healMode`, `selAtk` and hides `#spell-overlay`.

Document click handler cancels all modes when clicking outside `.minion`, `.hero-port`, `.hp-gem`.

### `#spell-overlay` — IMPORTANT
This div covers the entire board with a blue tint when a target is being selected (spell, hero power). It has **`pointer-events:none`** so clicks pass through to minions and hero portraits below. The `.spell-msg` text inside is also `pointer-events:none`. Do NOT remove `pointer-events:none` from this element or targeting will break.

### Hero Power Flow (mage example)
1. Click `#hpbtn` → `activateHeroPower()`
2. Sets `heroPowerMode = true`, adds `.on` to `#spell-overlay`, calls `render()`
3. `render()` sets `hp-gem` class to `hp-gem active`, lights opp hero as `attackable`
4. Player clicks opp hero → `targetHero('opp')` → sends `{type:'hero_power', targetType:'hero'}`
5. Or clicks opp minion → `clickOppMinion()` → sends `{type:'hero_power', targetUid, targetType:'minion'}`
6. After send: `cancelModes()` clears all flags

### Taunt Rules
- **Attacks** (minion and hero weapon): blocked by taunt → must target a taunt minion.
- **Hero power** and **spells**: NOT blocked by taunt — can target hero freely.
- In `render()`: `canTargetOppHero = ((!oppHasTaunt && selAtk) || heroPowerMode || (pendingSpell && !pendingSpellIsHeal))`

### Weapon Slot
`setWeaponSlot(slotId, weapon)` renders a `.wpn-card` inside `#my-wpn-slot` / `#opp-wpn-slot`. ATK badge (gold pentagon, `.wpn-atk`) and durability badge (blue circle, `.wpn-dur`). Empty slot = empty innerHTML.

### Card Sizes (CSS)
| element     | width  | height  | art    | name font |
|-------------|--------|---------|--------|-----------|
| `.minion`   | 86px   | 122px   | 32px   | 9px       |
| `.hand-card`| 76px   | 108px   | 26px   | 9px       |
| `.mul-card` | 68px   | 96px    | 22px   | 6px       |
| `.bck`      | 46px   | 66px    | —      | —         |
| `.wpn-card` | 46px   | 58px    | 20px   | —         |

ATK/HP badges: 28×28px (minion), 26×26px (hand card).
Cost gem: 26×26px (minion), 22×22px (hand card). Positioned `top:-9px;left:50%`.

### Sound Effects
Lazy `AudioContext` (created on first beep, avoids autoplay policy):
```js
SFX.play()    // card played — two ascending tones
SFX.attack()  // minion/hero attacks — low sawtooth thud
SFX.heal()    // heal — two ascending soft tones
SFX.win()     // victory fanfare
SFX.lose()    // defeat descending tones
```

### Animations
`playAnimEvents(events)` — each `AnimEvent` spawns a `.dmg-pop` div (red for damage, green for heal) floating up from the target element. Also triggers `.atk-flash` CSS class briefly.

---

## How to Add a New Card

1. Add `CardDef` to the relevant `*_CARDS` array in `server.ts`.
2. If new `battlecry` effect: add case to `applyBattlecry()`.
3. If new `spellEffect`: add case to `applySpell()`.
4. If it needs a target: add the `spellEffect` id to `needsTarget()` in `index.html`.
5. If bot should handle it intelligently: update `botBuildPlayCard()`.
6. If legendary (1 copy): set `legendary: true` — deck builder handles the rest.

## How to Add a New Class

1. Add 7 standard + 1 legendary `CardDef`s to a new `*_CARDS` array.
2. Add entry to `CLASSES` record (server + client both have one).
3. Add hero power logic to `hero_power` case in `handle()`.
4. Add hero power bot logic to `botBuildHeroPower()`.
5. Add class card + hero power text to lobby HTML in `index.html`.
6. Add class to `ALL_CLASSES` array (for bot random class selection).

---

## Known Quirks / Gotchas

- **Bot is always P2.** `playerOrder[0]` is the human who joined. Bot is always `playerOrder[1]`. Bot room ID is never shared (generated internally).
- **`mulliganDone: true`** is set on the bot immediately so `startPlaying()` fires as soon as the human confirms.
- **Coin (`id:"coin"`)** is excluded from mulligan replacement by `c.id !== 'coin'` filter on the server.
- **Mana ramp formula**: `ceil(turn/2) + 1` — turn 1→2 mana, turn 3→3, turn 5→4, etc. Max 10.
- **Board limit**: 7 minions per side. Playing a minion when full silently returns the card to hand.
- **`fresh` flag**: minions can't attack the turn they're played unless they have `charge`. `fresh` is set `false` on turn start (`end_turn` handler).
- **`canHeroAtk`**: set `true` when weapon equipped or rogue hero power used. Reset to `false` after attacking. Reset to `!!weapon` at start of opponent's turn.
- **Hero weapon durability**: decremented on every hero attack. Hits 0 → `weapon = null`, `heroAtkVal = 0`.
- **`dealDamageToHero`**: armor absorbs first. Animation event always fires (even if armor absorbed all — shows 0 effectively, but amount sent is the pre-armor value; could be improved).
- **`deal2all` / `deal3all` difference**: `deal2all` hits minions AND face; `deal3all` hits minions only.
- **Priest heal on opp hero**: client sends `targetType:'hero_opp'`; `resolveHealTarget` maps this to `opp`. This lets priest heal the enemy (rarely useful but valid).
