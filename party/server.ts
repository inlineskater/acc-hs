import type * as Party from "partykit/server";

// ── Types ──────────────────────────────────────────────────────────────────
type Keyword = "taunt" | "charge" | "divine_shield" | "windfury";

interface CardDef {
  id: string;
  name: string;
  art: string;
  cost: number;
  type: "minion" | "spell" | "weapon";
  atk?: number;
  hp?: number;
  keywords?: Keyword[];
  battlecry?: string;
  deathrattle?: string;
  bcText?: string;
  drText?: string;
  spellEffect?: string;
  spellText?: string;
  weaponAtk?: number;
  durability?: number;
  combo?: string;
  comboText?: string;
  endOfTurn?: string;
  eotText?: string;
  legendary?: boolean;
}

interface BoardMinion extends CardDef {
  uid: string;
  curHp: number;
  maxHp: number;
  canAtk: boolean;
  fresh: boolean;
  divineShield?: boolean;
  silenced?: boolean;
}

interface Weapon {
  uid: string;
  name: string;
  art: string;
  atk: number;
  durability: number;
  cost: number;
}

interface PlayerState {
  id: string;
  hp: number;
  maxMana: number;
  mana: number;
  armor: number;
  deck: BoardMinion[];
  hand: BoardMinion[];
  board: BoardMinion[];
  weapon: Weapon | null;
  cls: string;
  heroPowerUsed: boolean;
  canHeroAtk: boolean;
  heroAtkVal: number;
  playedThisTurn: boolean;
  fatigue: number;
  mulliganDone: boolean;
  botLevel: number; // 0 = human, 1-4 = bot difficulty
}

interface GameState {
  phase: "waiting" | "mulligan" | "playing" | "over";
  players: { [id: string]: PlayerState };
  playerOrder: string[];
  activePlayer: string;
  turn: number;
  winner: string | null;
  log: string;
}

interface AnimEvent { kind: 'damage' | 'heal' | 'attack_anim'; targetId: string; amount: number; attackerId?: string; }

// ── Card Database ──────────────────────────────────────────────────────────
const MAGE_CARDS: CardDef[] = [
  { id:"m1",  name:"Iskra Skarbowa",     art:"⚡", cost:1, type:"minion", atk:1, hp:2, keywords:["charge"], bcText:"Szarża." },
  { id:"m2",  name:"Gardziel Podatku",   art:"🐉", cost:2, type:"minion", atk:2, hp:3, battlecry:"deal1", bcText:"Okrzyk: 1 dmg dowolnemu celowi." },
  { id:"ms1", name:"Korekta Podatkowa",  art:"📜", cost:1, type:"spell", spellEffect:"draw2", spellText:"Dobierz 2 karty." },
  { id:"ms2", name:"Zawieja Audytu",     art:"🌀", cost:3, type:"spell", spellEffect:"deal2all", spellText:"Zadaj 2 obrażenia wszystkim wrogom." },
  { id:"m3",  name:"Strażnik KPiR",      art:"🗿", cost:4, type:"minion", atk:1, hp:7, keywords:["taunt"], bcText:"Prowokacja." },
  { id:"ms3", name:"Kulka Ognia",        art:"☄️", cost:4, type:"spell", spellEffect:"deal4face", spellText:"Zadaj 4 obrażenia dowolnemu celowi." },
  { id:"mw1", name:"Różdżka Kontroli",   art:"🔮", cost:3, type:"weapon", weaponAtk:3, durability:2, bcText:"Broń: 3/2" },
  { id:"m4",  name:"Audytor Duchów",     art:"👻", cost:2, type:"minion", atk:2, hp:2, deathrattle:"deal2random", drText:"Pośm.: 2 dmg losowemu wrogowi." },
  { id:"m5",  name:"Płomyk Audytu",     art:"🔥", cost:3, type:"minion", atk:2, hp:3, endOfTurn:"deal1random", eotText:"Koniec tury: 1 dmg losowemu wrogowi." },
  { id:"mL",  name:"Wielki Inkasent",    art:"🧿", cost:7, type:"minion", atk:5, hp:7, battlecry:"deal1all_draw1", bcText:"Okrzyk: 1 dmg wszystkim wrogom i dobierz kartę.", legendary:true },
];

const WAR_CARDS: CardDef[] = [
  { id:"w1",  name:"Oblężnik Bilansu",   art:"⛏️", cost:1, type:"minion", atk:2, hp:2 },
  { id:"w2",  name:"Inkasent Długów",    art:"🦁", cost:2, type:"minion", atk:2, hp:3, battlecry:"armor2", bcText:"Okrzyk: +2 pancerza." },
  { id:"w3",  name:"Tarcza Leasingu",    art:"🐢", cost:2, type:"minion", atk:1, hp:6, keywords:["taunt"], bcText:"Prowokacja." },
  { id:"ws1", name:"Fortyfikacja",       art:"🏰", cost:3, type:"spell", spellEffect:"armor6", spellText:"Zyskaj 6 pancerza." },
  { id:"w4",  name:"Komornik Sądowy",    art:"🦅", cost:3, type:"minion", atk:4, hp:2, battlecry:"armor3", bcText:"Okrzyk: +3 pancerza." },
  { id:"ww1", name:"Topór Amortyzacji",  art:"⚒️", cost:2, type:"weapon", weaponAtk:3, durability:2, bcText:"Broń: 3/2" },
  { id:"ws2", name:"Nalot Komornika",    art:"💥", cost:4, type:"spell", spellEffect:"deal3all", spellText:"Zadaj 3 obrażenia wszystkim wrogim minionkom." },
  { id:"w5",  name:"Tarcza Duszy",       art:"💀", cost:3, type:"minion", atk:2, hp:4, keywords:["taunt"], deathrattle:"armor3", drText:"Prowokacja. Pośm.: +3 pancerza." },
  { id:"w6",  name:"Strażnik Nocny",    art:"🌙", cost:4, type:"minion", atk:3, hp:5, endOfTurn:"buff1_0", eotText:"Koniec tury: +1 ATK losowemu minionkowi." },
  { id:"wL",  name:"Generał Długów",     art:"🐲", cost:7, type:"minion", atk:7, hp:7, keywords:["taunt"], battlecry:"armor4", bcText:"Prowokacja. Okrzyk: +4 pancerza.", legendary:true },
];

const ROGUE_CARDS: CardDef[] = [
  { id:"r1",  name:"Kieszonkowiec VAT",  art:"🦊", cost:1, type:"minion", atk:1, hp:2, combo:"deal1", comboText:"Combo: 1 dmg bohaterowi." },
  { id:"r2",  name:"Przemytnik Ulg",     art:"🦇", cost:2, type:"minion", atk:3, hp:2, combo:"draw1", comboText:"Combo: dobierz kartę." },
  { id:"r3",  name:"Agent Rejestrowy",   art:"🐍", cost:3, type:"minion", atk:3, hp:2, battlecry:"draw1", bcText:"Okrzyk: dobierz kartę." },
  { id:"r4",  name:"Fałszerz Bilansu",   art:"🦂", cost:3, type:"minion", atk:2, hp:4, combo:"deal2", comboText:"Combo: 2 dmg bohaterowi." },
  { id:"rs1", name:"Trucizna Faktur",    art:"☠️", cost:2, type:"spell", spellEffect:"deal2all", spellText:"Zadaj 2 obrażenia wszystkim wrogom." },
  { id:"rs2", name:"Sztylet Audytu",     art:"🗡️", cost:3, type:"spell", spellEffect:"deal4face", spellText:"Zadaj 4 obrażenia dowolnemu celowi." },
  { id:"rw1", name:"Sztylet Egzekutora", art:"⚔️", cost:3, type:"weapon", weaponAtk:3, durability:3, bcText:"Broń: 3/3" },
  { id:"r5",  name:"Szpieg Wieczny",     art:"🦎", cost:2, type:"minion", atk:2, hp:1, deathrattle:"draw1", drText:"Pośm.: dobierz kartę." },
  { id:"r6",  name:"Podrzutnik Danych", art:"📡", cost:3, type:"minion", atk:2, hp:3, endOfTurn:"deal1random", eotText:"Koniec tury: 1 dmg losowemu wrogowi." },
  { id:"rL",  name:"Mistrz Cienia",      art:"🐺", cost:6, type:"minion", atk:6, hp:5, battlecry:"draw1", bcText:"Okrzyk: dobierz kartę.", combo:"deal3", comboText:"Combo: 3 dmg bohaterowi.", legendary:true },
];

const PRIEST_CARDS: CardDef[] = [
  { id:"p1",  name:"Młodszy Referent",   art:"🕊️", cost:1, type:"minion", atk:1, hp:3 },
  { id:"p2",  name:"Archiwista Duszy",   art:"🦉", cost:2, type:"minion", atk:1, hp:4, battlecry:"heal2self", bcText:"Okrzyk: przywróć 2 HP sobie." },
  { id:"p3",  name:"Mnich Podatkowy",    art:"🐻", cost:3, type:"minion", atk:2, hp:6, keywords:["taunt"], bcText:"Prowokacja." },
  { id:"p4",  name:"Uzdrowiciel ZUS",    art:"🦌", cost:3, type:"minion", atk:2, hp:4, battlecry:"heal2target", bcText:"Okrzyk: przywróć 2 HP dowolnemu." },
  { id:"ps1", name:"Modlitwa Audytu",    art:"✨", cost:1, type:"spell", spellEffect:"heal2self", spellText:"Przywróć 2 HP swojemu bohaterowi." },
  { id:"ps2", name:"Uzdrowienie Masowe", art:"🌈", cost:3, type:"spell", spellEffect:"heal2all", spellText:"Przywróć 2 HP wszystkim swoim minionkom i bohaterowi." },
  { id:"ps3", name:"Wielka Łaska",       art:"🌟", cost:5, type:"spell", spellEffect:"heal6target", spellText:"Przywróć 6 HP dowolnemu celowi." },
  { id:"p5",  name:"Anioł Rejestrowy",   art:"👼", cost:4, type:"minion", atk:2, hp:5, deathrattle:"heal3self", drText:"Pośm.: przywróć 3 HP bohaterowi." },
  { id:"p6",  name:"Mnich Wieczorny",   art:"🕯️", cost:2, type:"minion", atk:1, hp:4, endOfTurn:"heal2self", eotText:"Koniec tury: przywróć 2 HP bohaterowi." },
  { id:"pL",  name:"Arcykapłan VAT",     art:"🦄", cost:7, type:"minion", atk:5, hp:8, keywords:["taunt"], battlecry:"heal4target", bcText:"Prowokacja. Okrzyk: przywróć 4 HP dowolnemu.", legendary:true },
];

const CLASSES: Record<string, { art: string; cls: string; heroPowerText: string; heroPowerArt: string; cards: CardDef[] }> = {
  mage:    { art:"🧙", cls:"Mag Podatkowy",    heroPowerText:"Zadaj 1 obrażenie dowolnemu celowi.", heroPowerArt:"🔥", cards:MAGE_CARDS },
  warrior: { art:"⚔️", cls:"Wojownik Księgi",  heroPowerText:"Zyskaj 2 pancerza.",                  heroPowerArt:"🛡️", cards:WAR_CARDS },
  rogue:   { art:"🃏", cls:"Łotr Podatkowy",   heroPowerText:"Wyekwipuj sztylet 1/2.",              heroPowerArt:"🗡️", cards:ROGUE_CARDS },
  priest:  { art:"✝️", cls:"Kapłan Bilansowy", heroPowerText:"Przywróć 2 HP dowolnemu celowi.",     heroPowerArt:"💚", cards:PRIEST_CARDS },
};

const ALL_CLASSES = ['mage', 'warrior', 'rogue', 'priest'];

// ── Helpers ────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 8); }

function cloneCard(c: CardDef): BoardMinion {
  return {
    ...c,
    uid: uid(),
    curHp: c.hp ?? 1,
    maxHp: c.hp ?? 1,
    canAtk: false,
    fresh: true,
    divineShield: c.keywords?.includes("divine_shield"),
  } as BoardMinion;
}

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function buildDeck(cls: string): BoardMinion[] {
  const pool = CLASSES[cls].cards;
  const standards = pool.filter(c => !c.legendary);
  const legendary = pool.find(c => c.legendary)!;
  // 15 cards: 8 standards + 6 random duplicates + 1 legendary
  const extra = shuffle(standards).slice(0, 6);
  return shuffle([...standards, ...extra, legendary]).map(c => cloneCard(c));
}

function hasTaunt(board: BoardMinion[]): boolean {
  return board.some(c => !c.silenced && c.keywords?.includes("taunt"));
}

function mkPlayer(id: string, cls: string, botLevel = 0): PlayerState {
  return {
    id, hp:15, maxMana:1, mana:1, armor:0,
    deck: buildDeck(cls), hand:[], board:[], weapon:null, cls,
    heroPowerUsed:false, canHeroAtk:false, heroAtkVal:0,
    playedThisTurn:false, fatigue:0, mulliganDone:false, botLevel,
  };
}

// ── Server ─────────────────────────────────────────────────────────────────
export default class SerceKsiagServer implements Party.Server {
  state: GameState = {
    phase: "waiting",
    players: {},
    playerOrder: [],
    activePlayer: "",
    turn: 1,
    winner: null,
    log: "Oczekiwanie na graczy...",
  };
  pendingEvents: AnimEvent[] = [];

  constructor(readonly room: Party.Room) {}

  broadcast(msg: object) { this.room.broadcast(JSON.stringify(msg)); }

  sendState() {
    this.broadcast({ type:"update", state:this.state, events:this.pendingEvents });
    this.pendingEvents = [];
  }

  onConnect(conn: Party.Connection) {
    conn.send(JSON.stringify({ type:"update", state:this.state, events:[] }));
  }

  onMessage(raw: string, sender: Party.Connection) {
    const msg = JSON.parse(raw);
    if (msg.type === "join") sender.send(JSON.stringify({ type:"you", id:sender.id }));
    this.handle(msg, sender.id);
  }

  // ── drawCards with fatigue ─────────────────────────────────────────────
  drawCards(p: PlayerState, n = 1) {
    for (let i = 0; i < n; i++) {
      if (p.deck.length > 0 && p.hand.length < 7) {
        p.hand.push(p.deck.shift()!);
      } else if (p.deck.length === 0) {
        p.fatigue++;
        p.hp -= p.fatigue;
        const idx = this.state.playerOrder.indexOf(p.id);
        if (idx !== -1) this.pendingEvents.push({ kind:'damage', targetId:'hero_'+idx, amount:p.fatigue });
      }
    }
  }

  // ── Main message handler ───────────────────────────────────────────────
  handle(msg: any, senderId: string) {
    const s = this.state;

    // ── JOIN ──
    if (msg.type === "join") {
      if (s.playerOrder.length >= 2) return;
      if (s.players[senderId]) return;
      const cls = msg.cls as string;
      if (!CLASSES[cls]) return;

      const p = mkPlayer(senderId, cls, 0);
      s.players[senderId] = p;
      s.playerOrder.push(senderId);

      // Bot mode: create P2 automatically
      if (msg.vsBot && s.playerOrder.length === 1) {
        const botLevel = Math.max(1, Math.min(4, msg.botLevel ?? 1));
        const botCls = ALL_CLASSES[Math.floor(Math.random() * 4)];
        const botId = 'bot_' + uid();
        const botP = mkPlayer(botId, botCls, botLevel);
        botP.mulliganDone = true; // bot skips mulligan
        s.players[botId] = botP;
        s.playerOrder.push(botId);
      }

      if (s.playerOrder.length === 2) {
        s.phase = "mulligan";
        const p0 = s.players[s.playerOrder[0]];
        const p1 = s.players[s.playerOrder[1]];
        this.drawCards(p0, 3);
        this.drawCards(p1, 3);
        const coin = cloneCard({ id:"coin", name:"Moneta", art:"🪙", cost:0, type:"spell", spellEffect:"mana1", spellText:"Zyskaj 1 manę w tej turze." });
        p1.hand.push(coin);
        s.log = "Wymień karty przed grą!";
        // If both done already (both bots, impossible in practice but safe)
        if (p0.mulliganDone && p1.mulliganDone) this.startPlaying();
      } else {
        s.log = "Czekanie na drugiego gracza...";
      }
      this.sendState();
      return;
    }

    // ── MULLIGAN ──
    if (msg.type === "mulligan") {
      if (s.phase !== "mulligan") return;
      const me = s.players[senderId];
      if (!me || me.mulliganDone || me.botLevel > 0) return;
      const oppId = s.playerOrder.find(id => id !== senderId)!;
      const opp = s.players[oppId];
      const replaceUids: string[] = Array.isArray(msg.replace) ? msg.replace : [];
      const toReplace = me.hand.filter(c => replaceUids.includes(c.uid) && c.id !== 'coin');
      me.hand = me.hand.filter(c => !toReplace.includes(c));
      me.deck.push(...toReplace.map(c => cloneCard(c)));
      me.deck = shuffle(me.deck);
      this.drawCards(me, toReplace.length);
      me.mulliganDone = true;
      if (opp.mulliganDone) {
        this.startPlaying();
      } else {
        s.log = "Czekanie na przeciwnika...";
      }
      this.sendState();
      return;
    }

    if (s.phase !== "playing") return;
    if (senderId !== s.activePlayer) return;

    const me = s.players[senderId];
    const oppId = s.playerOrder.find(id => id !== senderId)!;
    const opp = s.players[oppId];

    switch (msg.type) {

      case "play_card": {
        const idx = me.hand.findIndex(c => c.uid === msg.cardUid);
        if (idx === -1) return;
        const card = me.hand[idx];
        if (me.mana < card.cost) return;
        const hadPlayed = me.playedThisTurn;
        me.mana -= card.cost;
        me.hand.splice(idx, 1);
        me.playedThisTurn = true;
        if (card.type === "minion") {
          if (me.board.length >= 4) { me.hand.push(card); me.mana += card.cost; me.playedThisTurn = hadPlayed; return; }
          card.canAtk = !!card.keywords?.includes("charge");
          card.fresh = !card.keywords?.includes("charge");
          me.board.push(card);
          this.applyBattlecry(card, me, opp, msg.targetUid, msg.targetType);
          if (hadPlayed && card.combo) this.applyCombo(card, me, opp);
          s.log = `${me.cls}: zagrano ${card.name}`;
        } else if (card.type === "spell") {
          this.applySpell(card, me, opp, msg.targetUid, msg.targetType);
          s.log = `${me.cls}: zagrano czar ${card.name}`;
        } else if (card.type === "weapon") {
          me.weapon = { uid:uid(), name:card.name, art:card.art, atk:card.weaponAtk!, durability:card.durability!, cost:card.cost };
          me.heroAtkVal = card.weaponAtk!;
          s.log = `${me.cls}: wyekwipowano ${card.name}`;
        }
        this.checkDead(me, opp);
        this.checkWin(me, opp);
        break;
      }

      case "attack": {
        const attacker = me.board.find(c => c.uid === msg.attackerUid);
        if (!attacker || !attacker.canAtk) return;
        if (attacker.fresh && !attacker.keywords?.includes("charge")) return;
        if (msg.targetType === "hero") {
          if (hasTaunt(opp.board)) return;
          const oppIdx = s.playerOrder.indexOf(oppId);
          this.pendingEvents.push({ kind:'attack_anim', attackerId:attacker.uid, targetId:`hero_${oppIdx}`, amount:0 });
          this.dealDamageToHero(opp, attacker.atk!);
          attacker.canAtk = false;
          s.log = `${attacker.name} atakuje bohatera za ${attacker.atk}!`;
        } else {
          const defender = opp.board.find(c => c.uid === msg.targetUid);
          if (!defender) return;
          if (!defender.keywords?.includes("taunt") && hasTaunt(opp.board)) return;
          this.pendingEvents.push({ kind:'attack_anim', attackerId:attacker.uid, targetId:defender.uid, amount:0 });
          this.minionCombat(attacker, defender);
          s.log = `${attacker.name} atakuje ${defender.name}`;
        }
        this.checkDead(me, opp);
        this.checkWin(me, opp);
        break;
      }

      case "hero_attack": {
        if (!me.canHeroAtk || me.heroAtkVal === 0) return;
        const meIdx = s.playerOrder.indexOf(senderId);
        if (msg.targetType === "hero") {
          if (hasTaunt(opp.board)) return;
          const oppIdx = s.playerOrder.indexOf(oppId);
          this.pendingEvents.push({ kind:'attack_anim', attackerId:`hero_${meIdx}`, targetId:`hero_${oppIdx}`, amount:0 });
          this.dealDamageToHero(opp, me.heroAtkVal);
          s.log = `${me.cls} atakuje bohaterem za ${me.heroAtkVal}!`;
        } else {
          const def = opp.board.find(c => c.uid === msg.targetUid);
          if (!def) return;
          if (!def.keywords?.includes("taunt") && hasTaunt(opp.board)) return;
          this.pendingEvents.push({ kind:'attack_anim', attackerId:`hero_${meIdx}`, targetId:def.uid, amount:0 });
          def.curHp -= me.heroAtkVal;
          this.pendingEvents.push({ kind:'damage', targetId:def.uid, amount:me.heroAtkVal });
          s.log = `Bohater atakuje ${def.name}`;
        }
        if (me.weapon) {
          me.weapon.durability--;
          if (me.weapon.durability <= 0) { me.weapon = null; me.heroAtkVal = 0; }
        }
        me.canHeroAtk = false;
        this.checkDead(me, opp);
        this.checkWin(me, opp);
        break;
      }

      case "hero_power": {
        if (me.heroPowerUsed || me.mana < 2) return;
        me.mana -= 2;
        me.heroPowerUsed = true;
        if (me.cls === "mage") {
          if (msg.targetType === "hero") {
            this.dealDamageToHero(opp, 1);
            s.log = "Hero Power: 1 obrażenie bohaterowi!";
          } else if (msg.targetUid) {
            const def = opp.board.find(c => c.uid === msg.targetUid) ?? me.board.find(c => c.uid === msg.targetUid);
            if (def) { def.curHp -= 1; this.pendingEvents.push({ kind:'damage', targetId:def.uid, amount:1 }); s.log = `Hero Power: 1 obrażenie ${def.name}!`; }
          }
        } else if (me.cls === "warrior") {
          me.armor += 2; s.log = "Hero Power: +2 pancerza!";
        } else if (me.cls === "rogue") {
          me.weapon = { uid:uid(), name:'Ukryty Ostrze', art:'🗡️', atk:1, durability:2, cost:2 };
          me.heroAtkVal = 1; me.canHeroAtk = true;
          s.log = "Hero Power: Wyekwipowano sztylet 1/2!";
        } else if (me.cls === "priest") {
          const target = this.resolveHealTarget(me, opp, msg.targetUid, msg.targetType);
          if (target) {
            if ('maxMana' in target) this.healHero(target as PlayerState, 2);
            else this.healMinion(target as BoardMinion, 2);
            s.log = "Hero Power: Przywrócono 2 HP!";
          }
        }
        this.checkDead(me, opp);
        this.checkWin(me, opp);
        break;
      }

      case "end_turn": {
        // Apply end-of-turn effects before passing
        this.applyEndOfTurnEffects(me, opp);
        this.checkDead(me, opp);
        this.checkWin(me, opp);
        if (s.phase === 'over') break;

        me.board.forEach(c => { c.fresh = false; c.canAtk = true; });
        me.playedThisTurn = false;
        s.activePlayer = oppId;
        s.turn++;
        opp.maxMana = Math.min(10, Math.ceil(s.turn / 2));
        opp.mana = opp.maxMana;
        opp.heroPowerUsed = false;
        opp.canHeroAtk = !!opp.weapon;
        this.drawCards(opp, 1);
        opp.board.forEach(c => { c.fresh = false; c.canAtk = true; });
        s.log = opp.botLevel > 0
          ? `Bot (${['','Żółtodziób','Normalny','Trudny','Ekspert'][opp.botLevel]}) myśli...`
          : `Tura gracza ${s.playerOrder.indexOf(oppId) + 1}`;
        if (opp.botLevel > 0) {
          setTimeout(() => this.runBotTurn(oppId), 900);
        }
        break;
      }
    }

    this.sendState();
  }

  startPlaying() {
    const s = this.state;
    s.phase = "playing";
    s.activePlayer = s.playerOrder[0];
    s.turn = 1;
    s.players[s.playerOrder[0]].maxMana = 1;
    s.players[s.playerOrder[0]].mana = 1;
    s.players[s.playerOrder[1]].maxMana = 1;
    s.players[s.playerOrder[1]].mana = 1;
    s.log = "Gra rozpoczęta! Tura gracza 1.";
    // If first player is a bot (shouldn't happen normally), start bot turn
    if (s.players[s.playerOrder[0]].botLevel > 0) {
      setTimeout(() => this.runBotTurn(s.playerOrder[0]), 1200);
    }
  }

  // ── Damage / Heal ──────────────────────────────────────────────────────
  dealDamageToHero(p: PlayerState, amount: number) {
    const absorbed = Math.min(p.armor, amount);
    p.armor -= absorbed;
    const actual = amount - absorbed;
    p.hp -= actual;
    const idx = this.state.playerOrder.indexOf(p.id);
    if (idx !== -1) this.pendingEvents.push({ kind:'damage', targetId:'hero_'+idx, amount:actual > 0 ? actual : amount });
  }

  healHero(p: PlayerState, amount: number) {
    const actual = Math.min(15 - p.hp, amount);
    p.hp += actual;
    if (actual > 0) {
      const idx = this.state.playerOrder.indexOf(p.id);
      if (idx !== -1) this.pendingEvents.push({ kind:'heal', targetId:'hero_'+idx, amount:actual });
    }
  }

  healMinion(m: BoardMinion, amount: number) {
    const actual = Math.min(m.maxHp - m.curHp, amount);
    m.curHp += actual;
    if (actual > 0) this.pendingEvents.push({ kind:'heal', targetId:m.uid, amount:actual });
  }

  resolveHealTarget(me: PlayerState, opp: PlayerState, targetUid?: string, targetType?: string): PlayerState | BoardMinion | null {
    if (targetType === 'hero_me') return me;
    if (targetType === 'hero_opp') return opp;
    if (targetType === 'minion_me' && targetUid) return me.board.find(m => m.uid === targetUid) ?? null;
    if (targetType === 'minion_opp' && targetUid) return opp.board.find(m => m.uid === targetUid) ?? null;
    return null;
  }

  minionCombat(a: BoardMinion, d: BoardMinion) {
    if (d.divineShield) d.divineShield = false;
    else { d.curHp -= a.atk!; this.pendingEvents.push({ kind:'damage', targetId:d.uid, amount:a.atk! }); }
    if (a.divineShield) a.divineShield = false;
    else { a.curHp -= d.atk!; this.pendingEvents.push({ kind:'damage', targetId:a.uid, amount:d.atk! }); }
    a.canAtk = false;
  }

  // ── Card effects ───────────────────────────────────────────────────────
  applyBattlecry(card: BoardMinion, me: PlayerState, opp: PlayerState, targetUid?: string, targetType?: string) {
    switch (card.battlecry) {
      case "deal1": {
        if (targetType === 'minion_opp' && targetUid) {
          const def = opp.board.find(c => c.uid === targetUid);
          if (def) { def.curHp -= 1; this.pendingEvents.push({ kind:'damage', targetId:def.uid, amount:1 }); }
        } else if (targetType === 'minion_me' && targetUid) {
          const def = me.board.find(c => c.uid === targetUid);
          if (def) { def.curHp -= 1; this.pendingEvents.push({ kind:'damage', targetId:def.uid, amount:1 }); }
        } else { this.dealDamageToHero(opp, 1); }
        break;
      }
      case "deal2": {
        if (targetType === 'minion_opp' && targetUid) {
          const def = opp.board.find(c => c.uid === targetUid);
          if (def) { def.curHp -= 2; this.pendingEvents.push({ kind:'damage', targetId:def.uid, amount:2 }); }
        } else if (targetType === 'minion_me' && targetUid) {
          const def = me.board.find(c => c.uid === targetUid);
          if (def) { def.curHp -= 2; this.pendingEvents.push({ kind:'damage', targetId:def.uid, amount:2 }); }
        } else { this.dealDamageToHero(opp, 2); }
        break;
      }
      case "deal1all":
        opp.board.forEach(c => { c.curHp -= 1; this.pendingEvents.push({ kind:'damage', targetId:c.uid, amount:1 }); });
        this.dealDamageToHero(opp, 1); break;
      case "deal1all_draw1":
        opp.board.forEach(c => { c.curHp -= 1; this.pendingEvents.push({ kind:'damage', targetId:c.uid, amount:1 }); });
        this.dealDamageToHero(opp, 1);
        this.drawCards(me, 1); break;
      case "draw1": this.drawCards(me, 1); break;
      case "armor2": me.armor += 2; break;
      case "armor3": me.armor += 3; break;
      case "armor4": me.armor += 4; break;
      case "heal2self": this.healHero(me, 2); break;
      case "heal2target": {
        const t = this.resolveHealTarget(me, opp, targetUid, targetType);
        if (t) { if ('maxMana' in t) this.healHero(t as PlayerState, 2); else this.healMinion(t as BoardMinion, 2); } break;
      }
      case "heal4target": {
        const t = this.resolveHealTarget(me, opp, targetUid, targetType);
        if (t) { if ('maxMana' in t) this.healHero(t as PlayerState, 4); else this.healMinion(t as BoardMinion, 4); } break;
      }
    }
  }

  applySpell(card: BoardMinion, me: PlayerState, opp: PlayerState, targetUid?: string, targetType?: string) {
    const eff = (card as any).spellEffect as string;
    switch (eff) {
      case "deal4face":
        if (targetType === 'minion_opp' && targetUid) {
          const def = opp.board.find(c => c.uid === targetUid);
          if (def) { def.curHp -= 4; this.pendingEvents.push({ kind:'damage', targetId:def.uid, amount:4 }); }
        } else if (targetType === 'minion_me' && targetUid) {
          const def = me.board.find(c => c.uid === targetUid);
          if (def) { def.curHp -= 4; this.pendingEvents.push({ kind:'damage', targetId:def.uid, amount:4 }); }
        } else { this.dealDamageToHero(opp, 4); }
        break;
      case "deal6face": this.dealDamageToHero(opp, 6); break;
      case "deal2all":
        opp.board.forEach(c => { c.curHp -= 2; this.pendingEvents.push({ kind:'damage', targetId:c.uid, amount:2 }); });
        this.dealDamageToHero(opp, 2); break;
      case "deal3all":
        opp.board.forEach(c => { c.curHp -= 3; this.pendingEvents.push({ kind:'damage', targetId:c.uid, amount:3 }); }); break;
      case "draw2": this.drawCards(me, 2); break;
      case "armor4": me.armor += 4; break;
      case "armor6": me.armor += 6; break;
      case "armor6draw1": me.armor += 6; this.drawCards(me, 1); break;
      case "mana1": me.mana = Math.min(me.mana + 1, me.maxMana + 1); break;
      case "buff_weapon": if (me.weapon) { me.weapon.atk += 2; me.heroAtkVal += 2; } break;
      case "buff_all": me.board.forEach(c => { c.atk = (c.atk ?? 0) + 2; c.curHp += 2; c.maxHp += 2; }); break;
      case "heal2self": this.healHero(me, 2); break;
      case "heal4self": this.healHero(me, 4); break;
      case "heal2all": me.board.forEach(m => this.healMinion(m, 2)); this.healHero(me, 2); break;
      case "heal6target": {
        const t = this.resolveHealTarget(me, opp, targetUid, targetType);
        if (t) { if ('maxMana' in t) this.healHero(t as PlayerState, 6); else this.healMinion(t as BoardMinion, 6); } break;
      }
    }
  }

  applyCombo(card: BoardMinion, me: PlayerState, opp: PlayerState) {
    switch (card.combo) {
      case 'deal1': this.dealDamageToHero(opp, 1); break;
      case 'deal2': this.dealDamageToHero(opp, 2); break;
      case 'deal3': this.dealDamageToHero(opp, 3); break;
      case 'draw1': this.drawCards(me, 1); break;
      case 'deal1all':
        opp.board.forEach(m => { m.curHp -= 1; this.pendingEvents.push({ kind:'damage', targetId:m.uid, amount:1 }); });
        this.dealDamageToHero(opp, 1); break;
    }
  }

  checkDead(me: PlayerState, opp: PlayerState) {
    // Loop to handle chain deaths from deathrattles
    let changed = true;
    while (changed) {
      changed = false;
      const meDead = me.board.filter(c => c.curHp <= 0);
      const oppDead = opp.board.filter(c => c.curHp <= 0);
      if (meDead.length || oppDead.length) {
        changed = true;
        me.board = me.board.filter(c => c.curHp > 0);
        opp.board = opp.board.filter(c => c.curHp > 0);
        meDead.forEach(c => { if (c.deathrattle && !c.silenced) this.applyDeathrattle(c, me, opp); });
        oppDead.forEach(c => { if (c.deathrattle && !c.silenced) this.applyDeathrattle(c, opp, me); });
      }
    }
  }

  applyDeathrattle(card: BoardMinion, owner: PlayerState, enemy: PlayerState) {
    switch (card.deathrattle) {
      case 'deal2random': {
        const targets = [...enemy.board];
        if (targets.length) {
          const t = targets[Math.floor(Math.random() * targets.length)];
          t.curHp -= 2;
          this.pendingEvents.push({ kind:'damage', targetId:t.uid, amount:2 });
        } else {
          this.dealDamageToHero(enemy, 2);
        }
        break;
      }
      case 'armor3':
        owner.armor += 3;
        break;
      case 'draw1':
        this.drawCards(owner, 1);
        break;
      case 'heal3self': {
        owner.hp = Math.min(30, owner.hp + 3);
        const ownerIdx = this.state.playerOrder.indexOf(owner.id);
        this.pendingEvents.push({ kind:'heal', targetId:`hero_${ownerIdx}`, amount:3 });
        break;
      }
    }
  }

  applyEndOfTurnEffects(me: PlayerState, opp: PlayerState) {
    me.board.forEach(c => {
      if (!c.endOfTurn || c.silenced) return;
      switch (c.endOfTurn) {
        case 'deal1random': {
          const targets = [...opp.board];
          if (targets.length) {
            const t = targets[Math.floor(Math.random() * targets.length)];
            t.curHp -= 1;
            this.pendingEvents.push({ kind:'damage', targetId:t.uid, amount:1 });
          } else {
            this.dealDamageToHero(opp, 1);
          }
          break;
        }
        case 'buff1_0': {
          const friends = me.board.filter(f => f.uid !== c.uid);
          if (friends.length) {
            const t = friends[Math.floor(Math.random() * friends.length)];
            t.atk = (t.atk ?? 0) + 1;
          }
          break;
        }
        case 'heal2self': {
          me.hp = Math.min(30, me.hp + 2);
          const meIdx = this.state.playerOrder.indexOf(me.id);
          this.pendingEvents.push({ kind:'heal', targetId:`hero_${meIdx}`, amount:2 });
          break;
        }
      }
    });
  }

  checkWin(me: PlayerState, opp: PlayerState) {
    const s = this.state;
    if (opp.hp <= 0) { s.phase = "over"; s.winner = me.id; s.log = `${me.cls} wygrywa!`; }
    if (me.hp <= 0)  { s.phase = "over"; s.winner = opp.id; s.log = `${opp.cls} wygrywa!`; }
  }

  // ── Bot AI ─────────────────────────────────────────────────────────────
  runBotTurn(botId: string, safety = 0) {
    if (safety > 25) {
      this.handle({ type:'end_turn' }, botId);
      return;
    }
    const delay = [0, 1100, 850, 650, 450][this.state.players[botId]?.botLevel ?? 1];
    setTimeout(() => {
      if (this.state.phase !== 'playing' || this.state.activePlayer !== botId) return;
      const move = this.getNextBotMove(botId);
      if (!move) return;
      this.handle(move, botId);
      if (move.type !== 'end_turn' && this.state.phase === 'playing' && this.state.activePlayer === botId) {
        this.runBotTurn(botId, safety + 1);
      }
    }, delay);
  }

  getNextBotMove(botId: string): any | null {
    const s = this.state;
    if (s.phase !== 'playing' || s.activePlayer !== botId) return null;
    const bot = s.players[botId];
    const humanId = s.playerOrder.find(id => id !== botId)!;
    const human = s.players[humanId];
    const lvl = bot.botLevel;
    const rng = () => Math.random();

    const taunts = human.board.filter(c => !c.silenced && c.keywords?.includes('taunt'));
    const attackers = bot.board.filter(c => c.canAtk);
    const playable = bot.hand.filter(c =>
      c.cost <= bot.mana && (c.type !== 'minion' || bot.board.length < 4)
    );

    // L4: Check for lethal — can we kill the hero this turn?
    if (lvl >= 4 && taunts.length === 0) {
      const totalBoardDmg = attackers.reduce((s, c) => s + (c.atk ?? 0), 0);
      const heroDmg = bot.canHeroAtk ? bot.heroAtkVal : 0;
      const spellDmg = playable.filter(c => c.spellEffect?.includes('deal') && !c.spellEffect?.includes('all'))
        .reduce((s, c) => {
          if (c.spellEffect === 'deal4face') return s + 4;
          if (c.spellEffect === 'deal6face') return s + 6;
          return s;
        }, 0);
      const effectiveHp = human.hp + human.armor;
      if (totalBoardDmg + heroDmg + spellDmg >= effectiveHp) {
        // Go for lethal! Play damage spells first, then attack face
        const dmgSpell = playable.find(c => ['deal4face','deal6face'].includes(c.spellEffect ?? ''));
        if (dmgSpell) return this.botBuildPlayCard(dmgSpell, bot, human, lvl);
        if (attackers.length > 0) return { type:'attack', attackerUid:attackers[0].uid, targetType:'hero' };
        if (bot.canHeroAtk && bot.heroAtkVal > 0) return { type:'hero_attack', targetType:'hero' };
      }
    }

    // 1. Play a card
    if (playable.length > 0) {
      let card: BoardMinion;
      if (lvl === 1) {
        card = playable[Math.floor(rng() * playable.length)];
      } else if (lvl === 2) {
        card = [...playable].sort((a, b) => a.cost - b.cost)[0];
      } else if (lvl === 3) {
        card = [...playable].sort((a, b) => b.cost - a.cost)[0];
      } else {
        // L4: Play removal/spells first, then highest-cost minion
        const spells = playable.filter(c => c.type === 'spell' && c.spellEffect?.includes('deal'));
        if (spells.length > 0 && human.board.length > 0) {
          card = spells.sort((a, b) => b.cost - a.cost)[0];
        } else {
          card = [...playable].sort((a, b) => b.cost - a.cost)[0];
        }
      }
      return this.botBuildPlayCard(card, bot, human, lvl);
    }

    // 2. Attack with a minion
    if (attackers.length > 0) {
      const attacker = lvl === 1
        ? attackers[Math.floor(rng() * attackers.length)]
        : attackers[0];
      const move = this.botBuildMinionAttack(attacker, human, lvl);
      if (move) return move;
    }

    // 3. Use hero power
    if (!bot.heroPowerUsed && bot.mana >= 2) {
      return this.botBuildHeroPower(bot, human, lvl);
    }

    // 4. Hero weapon attack
    if (bot.canHeroAtk && bot.heroAtkVal > 0) {
      return this.botBuildHeroAttack(bot, human, lvl);
    }

    return { type:'end_turn' };
  }

  botBuildPlayCard(card: BoardMinion, bot: PlayerState, human: PlayerState, lvl: number): any {
    const msg: any = { type:'play_card', cardUid:card.uid };
    const eff = (card as any).spellEffect as string | undefined;

    // Targeted spells: deal4face / deal6face
    if (eff === 'deal4face' || eff === 'deal6face') {
      const dmg = eff === 'deal4face' ? 4 : 6;
      if (lvl >= 3 && human.board.length > 0) {
        // Kill a minion we can exactly kill (efficient) — L3+
        const killable = human.board.filter(c => c.curHp <= dmg);
        if (killable.length > 0) {
          const target = killable.sort((a,b) => b.curHp - a.curHp)[0]; // biggest killable
          msg.targetUid = target.uid;
          msg.targetType = 'minion_opp';
          return msg;
        }
      }
      // Default: target face
      msg.targetType = 'hero';
      return msg;
    }

    // Heal spells: target own hero
    if (eff?.includes('heal')) {
      msg.targetType = 'hero_me';
      return msg;
    }

    // Battlecry heal targets
    if (card.battlecry === 'heal2target' || card.battlecry === 'heal4target') {
      msg.targetType = 'hero_me';
      return msg;
    }

    // Battlecry damage targets (deal1, deal2)
    if (card.battlecry === 'deal1' || card.battlecry === 'deal2') {
      const dmg = card.battlecry === 'deal1' ? 1 : 2;
      if (lvl >= 3 && human.board.length > 0) {
        const killable = human.board.filter(c => c.curHp <= dmg);
        if (killable.length > 0) {
          const target = killable.sort((a,b) => (b.atk ?? 0) - (a.atk ?? 0))[0];
          msg.targetUid = target.uid;
          msg.targetType = 'minion_opp';
          return msg;
        }
      }
      msg.targetType = 'hero';
      return msg;
    }

    return msg;
  }

  botBuildMinionAttack(attacker: BoardMinion, human: PlayerState, lvl: number): any | null {
    const taunts = human.board.filter(c => !c.silenced && c.keywords?.includes('taunt'));

    // Always attack taunt first (forced)
    if (taunts.length > 0) {
      const target = taunts[0];
      return { type:'attack', attackerUid:attacker.uid, targetUid:target.uid, targetType:'minion' };
    }

    if (lvl === 1) {
      // Random: 40% hit face, 60% hit random minion
      if (human.board.length > 0 && Math.random() < 0.6) {
        const t = human.board[Math.floor(Math.random() * human.board.length)];
        return { type:'attack', attackerUid:attacker.uid, targetUid:t.uid, targetType:'minion' };
      }
      return { type:'attack', attackerUid:attacker.uid, targetType:'hero' };
    }

    if (lvl === 2) {
      // Always attack face
      return { type:'attack', attackerUid:attacker.uid, targetType:'hero' };
    }

    if (lvl === 3) {
      // Kill highest-ATK minion if it's threatening (ATK >= 3)
      if (human.board.length > 0) {
        const sorted = [...human.board].sort((a, b) => (b.atk ?? 0) - (a.atk ?? 0));
        if ((sorted[0].atk ?? 0) >= 3) {
          return { type:'attack', attackerUid:attacker.uid, targetUid:sorted[0].uid, targetType:'minion' };
        }
      }
      return { type:'attack', attackerUid:attacker.uid, targetType:'hero' };
    }

    // Level 4: smart value trades
    if (human.board.length > 0) {
      // Favorable trade: we kill it and survive
      const favorable = human.board.find(t =>
        (attacker.atk ?? 0) >= t.curHp && attacker.curHp > (t.atk ?? 0)
      );
      if (favorable) return { type:'attack', attackerUid:attacker.uid, targetUid:favorable.uid, targetType:'minion' };

      // Kill a dangerous minion even at cost (high ATK threat)
      const dangerous = [...human.board].sort((a, b) => (b.atk ?? 0) - (a.atk ?? 0))[0];
      if ((dangerous.atk ?? 0) >= attacker.curHp) {
        // It would kill us eventually anyway — trade
        return { type:'attack', attackerUid:attacker.uid, targetUid:dangerous.uid, targetType:'minion' };
      }
    }
    return { type:'attack', attackerUid:attacker.uid, targetType:'hero' };
  }

  botBuildHeroPower(bot: PlayerState, human: PlayerState, lvl: number): any {
    if (bot.cls === 'warrior' || bot.cls === 'rogue') return { type:'hero_power' };

    if (bot.cls === 'mage') {
      // L3+: kill a 1-HP minion if possible
      if (lvl >= 3) {
        const oneHp = human.board.find(c => c.curHp === 1);
        if (oneHp) return { type:'hero_power', targetUid:oneHp.uid, targetType:'minion' };
      }
      return { type:'hero_power', targetType:'hero' };
    }

    if (bot.cls === 'priest') {
      return { type:'hero_power', targetType:'hero_me' };
    }

    return { type:'hero_power' };
  }

  botBuildHeroAttack(bot: PlayerState, human: PlayerState, lvl: number): any {
    const taunts = human.board.filter(c => !c.silenced && c.keywords?.includes('taunt'));
    if (taunts.length > 0) {
      return { type:'hero_attack', targetUid:taunts[0].uid, targetType:'minion' };
    }
    if (lvl <= 2) return { type:'hero_attack', targetType:'hero' };
    // L3-4: hit dangerous minion, else face
    if (human.board.length > 0) {
      const dangerous = [...human.board].sort((a, b) => (b.atk ?? 0) - (a.atk ?? 0))[0];
      if ((dangerous.atk ?? 0) >= 2) {
        return { type:'hero_attack', targetUid:dangerous.uid, targetType:'minion' };
      }
    }
    return { type:'hero_attack', targetType:'hero' };
  }
}
