# Dead Man's Hand 🤠

A first-person pixel-art poker game set in an old Wild West saloon. Runs right in the browser – no install, no account.

**▶ Play it here:** https://rblackwood224.github.io/DeadMansHand/

---

## What is this?

You sit at a poker table in a smoky saloon, holding your cards in your left hand. Around you sit up to five funny characters: they puff cigars, cough, blink, sweat when they go all in, and throw insults at you when they win. Behind them the piano player keeps playing, the barkeep polishes glasses, and every now and then someone walks in through the swinging doors – or a dog runs past.

Play alone against the AI, or open your own saloon online and invite your friends.

## Features

- **Two games:** Texas Hold'em and old-school **Five-Card Draw**
- **Up to 6 players** at one table – friends online, empty chairs filled with AI
- **12 characters** with their own look and playing style: careful Old Gus, bluffing One-Eyed Jack, Whiskey Pete who calls everything…
- **First-person hand:** your cards rest at the bottom of the screen, hover over them and your character lifts them up
- **Your win chance:** only you can see it, right above your cards (e.g. *Pair · win 58%*)
- **Real money on the table:** dollar bills and coins pile up, no chips – just like in the old days
- **Turn clock:** no 10-minute thinkers. Time runs out → you check, or fold if there's a bet
- **Taunts instead of chat:** 46 friendly insults in speech bubbles (*"May a coyote pee in your hat!"*). Pick one with the mouse wheel
- **"Spare some cash, partner?"** – go broke and beg the table for a loan. You pay it back with **20% interest** from your winnings. Go broke again and you're out for good
- **Whiskey** – press 🥃 and for $5 the barkeep brings you a glass. The game goes on, but the saloon spins a bit afterwards
- **No all-in trolling** – shove every hand until everyone folds and the barkeep fines you, warns you, and finally shoots you out (can be switched off)
- **Shoot troublemakers out of the saloon** – majority vote, the barkeep grabs his shotgun, BANG, and the poor soul flies out the door. The undertaker shows up soon after
- **Late arrivals** wait at the bar until the hand ends, then take a free chair or an AI's seat
- **Broke players** can stay and watch
- **English and Hungarian**
- **Phone support** (landscape)

## Controls

| Action | Mouse | Keyboard | Phone |
|---|---|---|---|
| Look at your cards | Hover over them | – | Tap your cards |
| Fold | **Fold** button | `F` | **Fold** button |
| Check / Call | **Check / Call** button | `C` | **Check / Call** button |
| Bet / Raise | Slider + **Raise** button | `R` | Slider + **Raise** button |
| Pick cards to swap (Draw) | Click the cards | `1`–`5`, `Enter` | Tap the cards |
| Choose a taunt | Mouse wheel | `↑` `↓` | ◀ ▶ arrows |
| Say it | **Say it!** | `T` | **Say it!** |
| Start a shooting vote | Click a player | – | Tap a player |
| Menu | ☰ | `Esc` | ☰ |

## How to play

**Texas Hold'em:** everyone gets 2 secret cards. Five shared cards come to the middle – 3 (flop), then 1 (turn), then 1 (river) – with a betting round before each. Best 5 cards out of 7 wins.

**Five-Card Draw:** everyone gets 5 secret cards. Bet, then swap up to 3 cards (4 if you keep an ace), bet again, show.

No limit – you can go all in any time. Side pots are handled automatically. The full rules and hand rankings are in the game under **Rules**.

## Playing together

1. The host clicks **Open a saloon (online)** and gets a **5-letter code** and a link.
2. Friends open the link (or **Join a saloon** + the code).
3. The host sets blinds, starting money (max $5,000), turn time, number of AI players, the first dealer, and ticks whether players can **leave and come back** and whether **loans** are allowed.
4. **Deal the cards!**

Everyone sees the table from their own chair and only their own cards. The cards are dealt on the host's computer and each player only receives their own hand.

## Running it yourself

Keep the files together in one folder and open `index.html` through any web server. For online play the game needs to be hosted over HTTPS – GitHub Pages works perfectly.

Music goes into the `music` folder: `menu.mp3`, `saloon1.mp3`, `saloon2.mp3`, `saloon3.mp3`. If a file is missing the game simply skips it.

## Under the hood

Plain HTML, CSS and JavaScript with a canvas. All the pixel art – the saloon, the characters, the cards – is drawn in code. Sound effects are made live with the Web Audio API, online play uses PeerJS. The music is my own C64-style tracks, made with Suno.

## Known quirks

- The host can't be shot – the game runs on their computer. If the host leaves, the saloon closes for everyone.
- If the host minimizes the browser, the online game can slow down or freeze.
- On phones it only plays in landscape. iPhone Safari has no true fullscreen.
- The win chance is an estimate, not a promise. Poker is still poker.

## Feedback

Found a bug or have an idea? Open an issue or send me a message. Have fun at the table, partner!
