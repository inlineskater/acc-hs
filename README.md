# Serce Ksiąg – Multiplayer Setup

## Struktura projektu

```
serce-ksiag/
├── party/
│   └── server.ts     ← Partykit server (cała logika gry)
├── public/
│   └── index.html    ← Klient (HTML/JS)
├── partykit.json
└── package.json
```

## Uruchomienie lokalne (dev)

```bash
cd serce-ksiag
npm install
npx partykit dev
```

Gra dostępna na: http://localhost:1999

## Deploy na Partykit (darmowy hosting)

### 1. Zaloguj się do Partykit

```bash
npx partykit login
```

Otworzy się przeglądarka — zaloguj przez GitHub.

### 2. Deploy

```bash
npx partykit deploy
```

Otrzymasz URL w stylu:
```
https://serce-ksiag.TWOJA_NAZWA.partykit.dev
```

### 3. Zaktualizuj PARTYKIT_HOST w index.html

W pliku `public/index.html` znajdź linię:

```js
const PARTYKIT_HOST = window.location.hostname === 'localhost'
  ? 'localhost:1999'
  : 'serce-ksiag.YOUR_USERNAME.partykit.dev'; // <-- CHANGE THIS after deploy
```

Zamień `YOUR_USERNAME` na swoją nazwę użytkownika Partykit (taką samą jak GitHub).

### 4. Deploy ponownie po zmianie

```bash
npx partykit deploy
```

## Jak grać w 2 osoby

1. Gracz 1 otwiera grę → wybiera klasę → klika **Stwórz Pokój**
2. Gracz 1 widzi 4-literowy kod pokoju (np. `K4BZ`)
3. Gracz 2 otwiera grę → wpisuje kod → klika **Dołącz**
4. Gra startuje automatycznie!

Alternatywnie: Gracz 1 klika "Skopiuj link zaproszenia" i wysyła link do gracza 2.

## Funkcje gry

### Karty
- **Minionki** — klasyczne karty z atakiem i HP
- **Czary** — natychmiastowy efekt (damage, dobieranie, pancerz)
- **Bronie** — ekwipunek na bohatera dający mu atak

### Mechaniki
- **Prowokacja (Taunt)** — musi być zabita przed atakiem na bohatera
- **Szarża (Charge)** — może atakować od razu po zagraniu
- **Okrzyk Bitewny (Battlecry)** — efekt przy zagraniu
- **Grzechotka Śmierci (Deathrattle)** — efekt przy śmierci
- **Hero Power** — 2 many, raz na turę (Mag: 1 dmg, Wojownik: +2 pancerza)
- **Broń bohatera** — kliknij portret bohatera aby atakować

### Ataki
1. Kliknij swoją kartę na planszy → pojawia się złota strzałka
2. Przeciągnij/kliknij cel (karta wroga lub portret bohatera)

### Lina (Rope)
- 20 sekund na turę
- Lina wypala się od prawej → automatyczny koniec tury

## Darmowe limity Partykit

- Bez limitu połączeń jednoczesnych
- Bez limitu pokoi
- 1GB transfer/miesiąc (wystarczy na tysiące gier)

## Potencjalne rozszerzenia

- [ ] Więcej klas (Łotr, Kapłan, Druid...)
- [ ] Konstruktor talii
- [ ] System rankingowy (Partykit + localStorage)
- [ ] Animacje sieciowe (damage events przez WS)
- [ ] Obserwatorzy (spectators)
