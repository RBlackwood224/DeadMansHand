# Dead Man's Hand

Vadnyugati first-person pixel art póker a böngészőben (HTML + CSS + vanilla JS, canvas).

## Indítás
- **Helyben:** a mappában indíts egy kis webszervert (pl. `python -m http.server`), és nyisd meg a `http://localhost:8000` címet.
  (Fájlból dupla kattintással is elindul, de az online játékhoz webszerver kell.)
- **GitHub Pages:** töltsd fel a mappa tartalmát egy repóba, és kapcsold be a Pages-t – ugyanúgy, mint a Deep Line-nál.

## Fájlok
- `index.html`, `style.css`
- `js/poker.js` – pakli, kézértékelés, nyerési esély
- `js/engine.js` – a játék motorja (osztás, licit, mellékkasszák, kölcsön, lelövés, időzítő)
- `js/art.js` – minden pixel art (kocsma, figurák, kártyák, pénz)
- `js/roster.js` – a 12 figura kinézete és AI személyisége
- `js/i18n.js` – magyar/angol szövegek, szabályok, beszólások
- `js/audio.js` – hangeffektek + zenelejátszó
- `js/net.js` – online játék (PeerJS)
- `js/main.js` – menük, kirajzolás, irányítás
- `music/` – ide jönnek az mp3-ak (lásd music/README.txt)

## Irányítás
- Egér a kártyáidra: felemeled a lapokat. Telefonon: koppintás.
- Egérgörgő: beszólás választás, **T** vagy „Mondd!” gomb: kimondod.
- **F** dob, **C** passz/megad, **R** emel, **1–5** lapok kijelölése cseréhez, **Enter** csere, **Esc** menü.
- Kattints egy másik játékosra: lelövés szavazás.

## Online
A házigazda megnyitja a kocsmát, a többiek a linkkel vagy az 5 betűs kóddal csatlakoznak.
A játék a házigazda gépén fut, ő nem lőhető le, és ha kilép, vége a kocsmának.
