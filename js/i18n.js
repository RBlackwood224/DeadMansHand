// ============================================================
//  DEAD MAN'S HAND — texts (English / Hungarian) + taunts
// ============================================================
'use strict';

const I18N = {
  en: {
    subtitle: 'A Wild West Poker Saloon',
    yourName: 'Your name, stranger',
    solo: 'Play vs. AI',
    host: 'Open a saloon (online)',
    join: 'Join a saloon',
    rules: 'Rules',
    music: 'Music',
    settings: 'Settings',
    fullscreen: 'Full screen',
    github: 'More games (GitHub)',
    back: 'Back',
    language: 'Language',
    musicVol: 'Music volume',
    sfxVol: 'Sound effects',
    musicOn: 'Music on',
    musicHelp: 'Put your mp3 files into the "music" folder with these names:',
    trackMenu: 'Menu theme',
    trackGame: 'Saloon tune',
    play: 'Play',
    stop: 'Stop',
    missing: '(file not found)',
    shuffle: 'Shuffle in-game tracks',
    lobby: 'Saloon lobby',
    soloSetup: 'New game vs. AI',
    gameMode: 'Game',
    holdem: "Texas Hold'em",
    draw: 'Five-Card Draw',
    blinds: 'Blinds',
    startMoney: 'Starting money',
    dealer: 'First dealer',
    random: 'Random',
    timer: 'Turn time',
    sec: 'sec',
    aiCount: 'AI players',
    allowRejoin: 'Players may leave and come back',
    allowLoans: 'Loans allowed ("Spare some cash?")',
    roomCode: 'Saloon code',
    shareLink: 'Send this link to your pardners:',
    copy: 'Copy',
    copied: 'Copied!',
    start: 'Deal the cards!',
    waitingHost: 'Waiting for the host to start…',
    players: 'At the saloon',
    enterCode: 'Saloon code',
    connect: 'Ride in',
    connecting: 'Riding in…',
    connFail: 'Could not reach that saloon.',
    hostLeft: 'The host closed the saloon.',
    fold: 'Fold',
    check: 'Check',
    call: 'Call',
    bet: 'Bet',
    raise: 'Raise',
    allin: 'All in',
    halfPot: '½ pot',
    pot: 'Pot',
    drawBtn: 'Swap',
    standPat: 'Stand pat',
    drawHint: 'Click cards to swap (max 3, or 4 if you keep an ace)',
    say: 'Say it!',
    tauntHint: 'Mouse wheel: pick a taunt',
    yourTurn: 'Your turn!',
    winChance: 'win',
    hostTag: 'host',
    wanted: 'WANTED', reward: 'REWARD', captured: 'CAPTURED',
    allowTroll: 'The barkeep keeps order (no endless all-in trolling)',
    trollFine: 'Hey cowboy! That ain\'t poker, that\'s robbery. Half your money goes to the table!',
    trollWarn: 'Last warning! One more stunt like that and my shotgun does the talkin\'!',
    trollBang: 'I warned ya!',
    trollFineNote: '{n} was fined ${a} for all-in trolling – shared among the table',
    trollWarnNote: '{n} got a last warning from the barkeep',
    trollBangNote: 'The barkeep had enough of {n}. ${a} shared among the table',
    trollYou1: 'Fined for all-in trolling!', trollYou1b: 'Half your money went to the others. Play nice!',
    trollYou2: 'LAST WARNING!', trollYou2b: 'Keep shoving and the barkeep shoots you out of the saloon.',
    badName: 'Watch your mouth, partner – pick another name.',
    whisky: 'Whiskey – $5', noWhiskyMoney: 'No money, no whiskey, cowboy!', whiskyNote: '{n} orders a whiskey', glug: '*glug glug*', hic: '*hic!*',
    ready: 'Ready!', notReady: 'Not ready', readyTag: 'ready', notReadyTag: 'not ready',
    readyCount: '{a}/{b} players ready – you can deal any time', autoStart: 'Everyone is ready – dealing in {n}…',
    pressReady: 'Press "Ready!" when you are set.', waitingOthers: 'Waiting for the others… (the host can start any time)',
    idleMsg: 'You weren\'t ready, so you sat this one out.', sitIn: 'Deal me in!', satOut: '{n} wasn\'t ready and sits this one out',
    sitsIn: '{n} wants in – sits down after this hand', allReady: 'Everyone is ready!',
    say_fold: 'Fold!', say_check: 'Check.', say_call: 'Call {a}', say_bet: 'Bet {a}!', say_raise: 'Raise to {a}!', say_allin: 'ALL IN!',
    say_draw: 'Swapping {n}', say_pat: 'Standing pat.',
    folded: 'You folded',
    waitingSeat: 'You are standing at the bar — you sit down after this hand.',
    spectating: 'You are watching the game.',
    broke: "You're broke, cowboy!",
    loanBtn: 'Spare some cash, partner?',
    loanAsk: '{n} is broke and begs for a loan!',
    loanGive: 'Lend',
    loanNo: 'Not a cent!',
    loanGot: '{n} got a loan of ${a}',
    loanNone: 'Nobody lent {n} a dime. Out!',
    debt: 'owes',
    repaid: '{n} paid back ${a} (+20%)',
    kickVote: 'Shoot {n} out of the saloon?',
    kickStart: 'Shoot',
    yes: 'Yes, shoot!',
    no: 'Let them be',
    kicked: 'YOU GOT SHOT!',
    kickedSub: 'The saloon voted you out. Rest in peace, partner.',
    voteFailed: '{n} survives… for now.',
    wins: '{n} wins ${a}',
    with: 'with',
    gameOver: 'Game over',
    champion: '{n} takes all the money!',
    newGame: 'New game',
    toMenu: 'Main menu',
    menu: 'Menu',
    resume: 'Back to the table',
    leave: 'Leave the saloon',
    hand: 'Hand',
    mode: 'Game',
    rotate: 'Turn your phone sideways',
    sitsDown: '{n} sits down',
    standsUp: '{n} leaves the table',
    joined: '{n} walks into the saloon',
    left: '{n} left the saloon',
    rejoinNo: 'Coming back is not allowed in this saloon.',
    kickedBan: 'You were shot in this saloon. No coming back.',
    full: 'The saloon is full — you can watch.',
    needPlayers: 'Need at least 2 players.',
    clickToStart: 'click anywhere',
    dealerBtn: 'Dealer',
    sb: 'small blind', bb: 'big blind',
    actions: { fold: 'FOLD', check: 'CHECK', call: 'CALL', bet: 'BET', raise: 'RAISE', allin: 'ALL IN!', draw: 'SWAPS', pat: 'STANDS PAT' },
    cats: ['High card', 'Pair', 'Two pair', 'Three of a kind', 'Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush', 'Royal flush'],
    rulesHtml: `
<h3>Hand rankings (best first)</h3>
<ol>
<li><b>Royal flush</b> – A K Q J 10 of the same suit</li>
<li><b>Straight flush</b> – five in a row, same suit</li>
<li><b>Four of a kind</b> – four cards of one rank</li>
<li><b>Full house</b> – three of a kind + a pair</li>
<li><b>Flush</b> – five cards of the same suit</li>
<li><b>Straight</b> – five in a row (A can be low: A-2-3-4-5)</li>
<li><b>Three of a kind</b></li>
<li><b>Two pair</b></li>
<li><b>Pair</b></li>
<li><b>High card</b></li>
</ol>
<h3>Texas Hold'em</h3>
<p>Everyone gets 2 secret cards. Five shared cards are dealt to the middle: first 3 (the flop), then 1 (the turn), then 1 more (the river). There is a betting round before the flop and after each new card. Your hand is the best 5 cards out of your 2 + the 5 on the table.</p>
<h3>Five-Card Draw (the old saloon way)</h3>
<p>Everyone gets 5 secret cards. Betting round. Then each player may swap up to 3 cards (4 if the card kept is an ace) for new ones. Second betting round, then showdown.</p>
<h3>Betting</h3>
<p>The two players left of the dealer put in the small and big blind. On your turn you can <b>fold</b>, <b>check</b> (if nobody bet), <b>call</b> the bet, or <b>raise</b>. No limit: you can go all in any time. If you go all in, you can only win what you could match from each player (side pots).</p>
<h3>House rules of this saloon</h3>
<ul>
<li><b>Clock:</b> you have a limited time to act. If you sleep, you automatically check — or fold if there is a bet.</li>
<li><b>Taunts:</b> scroll the mouse wheel to pick a taunt, click "Say it!" (or press T). No chat window — only friendly insults.</li>
<li><b>Loans:</b> if you go broke and at least 3 players are at the table, you can beg for a loan. Everyone decides how much to give. You pay it back automatically with 20% interest from your winnings. If you go broke again: you're out for good.</li>
<li><b>Shooting:</b> click on a player and start a vote. If the majority agrees, the troublemaker gets shot out of the saloon. The host cannot be shot.</li>
<li><b>Ready:</b> in an online saloon everybody presses "Ready!". When all are ready, the cards are dealt automatically. The host can also deal any time – whoever wasn't ready sits that game out and can press "Deal me in!" to join from the next hand.</li>
<li><b>Late arrivals</b> stand at the bar until the hand ends, then take an empty seat or an AI player's seat.</li>
<li><b>Broke players</b> may stay and watch.</li>
<li><b>The barkeep keeps order:</b> going all in again and again with a big stack until everybody folds is not poker. 4 such hands out of 5 → half your money is shared among the others. 4 more in the next 5 hands → last warning. 2 more in the next 3 hands → BANG, you're shot out and your money is shared. Can be switched off in the lobby.</li>
<li><b>Whiskey:</b> press the 🥃 button and the barkeep brings you a glass for $5. The game goes on while you drink – but the room spins a little afterwards.</li>
<li><b>Win chance:</b> above your cards you see your hand and your estimated chance to win against the players still in. Only you can see it.</li>
</ul>`
  },
  hu: {
    subtitle: 'Vadnyugati pókerkocsma',
    yourName: 'A neved, idegen',
    solo: 'Játék gép ellen',
    host: 'Kocsma nyitása (online)',
    join: 'Csatlakozás kocsmához',
    rules: 'Szabályok',
    music: 'Zene',
    settings: 'Beállítások',
    fullscreen: 'Teljes képernyő',
    github: 'Többi játékom (GitHub)',
    back: 'Vissza',
    language: 'Nyelv',
    musicVol: 'Zene hangereje',
    sfxVol: 'Effektek hangereje',
    musicOn: 'Zene bekapcsolva',
    musicHelp: 'Tedd az mp3 fájlokat a "music" mappába ezekkel a nevekkel:',
    trackMenu: 'Menüzene',
    trackGame: 'Kocsmazene',
    play: 'Lejátszás',
    stop: 'Állj',
    missing: '(nincs meg a fájl)',
    shuffle: 'Játék közben véletlenszerű sorrend',
    lobby: 'Kocsmai váró',
    soloSetup: 'Új játék gép ellen',
    gameMode: 'Játék',
    holdem: "Texas Hold'em",
    draw: '5 lapos póker',
    blinds: 'Vakok (blind)',
    startMoney: 'Kezdőpénz',
    dealer: 'Első osztó',
    random: 'Véletlen',
    timer: 'Gondolkodási idő',
    sec: 'mp',
    aiCount: 'Gépi játékosok',
    allowRejoin: 'Ki lehet lépni és vissza lehet jönni',
    allowLoans: 'Kölcsön engedélyezve ("Aggy mán kőccsön!")',
    roomCode: 'Kocsmakód',
    shareLink: 'Ezt a linket küldd el a cimboráknak:',
    copy: 'Másolás',
    copied: 'Kimásolva!',
    start: 'Osztás!',
    waitingHost: 'Várunk, amíg a házigazda elindítja…',
    players: 'A kocsmában',
    enterCode: 'Kocsmakód',
    connect: 'Belovagolok',
    connecting: 'Lovagolok…',
    connFail: 'Nem találom ezt a kocsmát.',
    hostLeft: 'A házigazda bezárta a kocsmát.',
    fold: 'Dobok',
    check: 'Passz',
    call: 'Megadom',
    bet: 'Tét',
    raise: 'Emelek',
    allin: 'All in',
    halfPot: '½ kassza',
    pot: 'Kassza',
    drawBtn: 'Csere',
    standPat: 'Nem cserélek',
    drawHint: 'Kattints a cserélendő lapokra (legfeljebb 3, vagy 4, ha ászt tartasz meg)',
    say: 'Mondd!',
    tauntHint: 'Egérgörgő: beszólás kiválasztása',
    yourTurn: 'Te jössz!',
    winChance: 'esély',
    hostTag: 'házigazda',
    wanted: 'KÖRÖZÉS', reward: 'VÉRDÍJ', captured: 'ELFOGVA',
    allowTroll: 'A kocsmáros rendet tart (all-in trollkodás tiltva)',
    trollFine: 'Hé, cowboy! Ez nem póker, ez rablás. A pénzed fele a többieké!',
    trollWarn: 'Utolsó figyelmeztetés! Még egy ilyen, és a puskám beszél!',
    trollBang: 'Megmondtam!',
    trollFineNote: '{n} bírságot kapott all-in trollkodásért: ${a} – szétosztva a többieknek',
    trollWarnNote: '{n} utolsó figyelmeztetést kapott a kocsmárostól',
    trollBangNote: 'A kocsmárosnak elege lett {n} cimborából. ${a} szétosztva a többieknek',
    trollYou1: 'Bírság all-in trollkodásért!', trollYou1b: 'A pénzed fele a többiekhez került. Játssz rendesen!',
    trollYou2: 'UTOLSÓ FIGYELMEZTETÉS!', trollYou2b: 'Ha így folytatod, a kocsmáros kilő a kocsmából.',
    badName: 'Ilyen nevet itt nem lehet, cimbora – válassz másikat.',
    whisky: 'Whisky – $5', noWhiskyMoney: 'Pénz nélkül nincs whisky, cowboy!', whiskyNote: '{n} rendelt egy whiskyt', glug: '*glugy-glugy*', hic: '*hukk!*',
    ready: 'Kész vagyok!', notReady: 'Mégse', readyTag: 'kész', notReadyTag: 'még nincs kész',
    readyCount: '{a}/{b} játékos kész – bármikor oszthatsz', autoStart: 'Mindenki kész – osztás {n}…',
    pressReady: 'Nyomd meg a „Kész vagyok!” gombot, ha mehet.', waitingOthers: 'Várunk a többiekre… (a házigazda bármikor indíthat)',
    idleMsg: 'Nem nyomtad meg a „Kész vagyok!” gombot, ezért kimaradtál.', sitIn: 'Beszállok!', satOut: '{n} nem volt kész, kimarad',
    sitsIn: '{n} beszáll – a kör végén leül', allReady: 'Mindenki kész!',
    say_fold: 'Dobok!', say_check: 'Passz.', say_call: 'Megadom: {a}', say_bet: 'Tét: {a}!', say_raise: 'Emelek: {a}!', say_allin: 'ALL IN!',
    say_draw: 'Cserélek {n} lapot', say_pat: 'Nem cserélek.',
    folded: 'Dobtál',
    waitingSeat: 'A pultnál állsz — a kör végén leülsz.',
    spectating: 'Nézőként vagy itt.',
    broke: 'Elfogyott a pénzed, cowboy!',
    loanBtn: 'Aggy mán kőccsön!',
    loanAsk: '{n} leégett és kölcsönért könyörög!',
    loanGive: 'Adok',
    loanNo: 'Egy vasat se!',
    loanGot: '{n} kapott ${a} kölcsönt',
    loanNone: 'Senki sem adott egy vasat se {n} cimborának. Kiesett!',
    debt: 'tartozik',
    repaid: '{n} visszafizetett: ${a} (+20% kamat)',
    kickVote: 'Lelőjük {n} cimborát?',
    kickStart: 'Lelövés',
    yes: 'Igen, lőjük le!',
    no: 'Hagyjuk',
    kicked: 'LELŐTTEK!',
    kickedSub: 'A kocsma kiszavazott. Nyugodj békében, cimbora.',
    voteFailed: '{n} túlélte… egyelőre.',
    wins: '{n} nyert ${a}',
    with: '–',
    gameOver: 'Vége a játéknak',
    champion: '{n} elvitte az összes pénzt!',
    newGame: 'Új játék',
    toMenu: 'Főmenü',
    menu: 'Menü',
    resume: 'Vissza az asztalhoz',
    leave: 'Kilépés a kocsmából',
    hand: 'Kör',
    mode: 'Játék',
    rotate: 'Fordítsd el a telefont fekvőbe',
    sitsDown: '{n} leül az asztalhoz',
    standsUp: '{n} feláll az asztaltól',
    joined: '{n} betoppant a kocsmába',
    left: '{n} elhagyta a kocsmát',
    rejoinNo: 'Ebbe a kocsmába nem lehet visszajönni.',
    kickedBan: 'Téged már lelőttek itt. Nincs visszaút.',
    full: 'Tele a kocsma — nézőként maradhatsz.',
    needPlayers: 'Legalább 2 játékos kell.',
    clickToStart: 'kattints bárhová',
    dealerBtn: 'Osztó',
    sb: 'kis vak', bb: 'nagy vak',
    actions: { fold: 'DOB', check: 'PASSZ', call: 'MEGAD', bet: 'TÉT', raise: 'EMEL', allin: 'ALL IN!', draw: 'CSERÉL', pat: 'NEM CSERÉL' },
    cats: ['Magas lap', 'Pár', 'Két pár', 'Drill', 'Sor', 'Flöss', 'Full', 'Póker', 'Színsor', 'Royal flöss'],
    rulesHtml: `
<h3>Kézértékek (a legerősebbtől)</h3>
<ol>
<li><b>Royal flöss</b> – A K Q J 10 egy színben</li>
<li><b>Színsor</b> – öt egymást követő lap egy színben</li>
<li><b>Póker</b> – négy egyforma</li>
<li><b>Full</b> – drill + pár</li>
<li><b>Flöss</b> – öt lap egy színben</li>
<li><b>Sor</b> – öt egymást követő lap (az ász lehet alul is: A-2-3-4-5)</li>
<li><b>Drill</b> – három egyforma</li>
<li><b>Két pár</b></li>
<li><b>Pár</b></li>
<li><b>Magas lap</b></li>
</ol>
<h3>Texas Hold'em</h3>
<p>Mindenki kap 2 titkos lapot. Középre öt közös lap kerül: először 3 (flop), aztán 1 (turn), végül még 1 (river). Licitkör van a flop előtt és minden új lap után. A kezed a 2 saját és az 5 közös lap közül a legjobb 5 lap.</p>
<h3>5 lapos póker (a régi kocsmai fajta)</h3>
<p>Mindenki kap 5 titkos lapot. Licitkör. Utána mindenki cserélhet legfeljebb 3 lapot (4-et, ha a megtartott lap ász). Második licitkör, majd mutatás.</p>
<h3>Licitálás</h3>
<p>Az osztótól balra ülő két játékos teszi be a kis és a nagy vakot. Amikor te jössz: <b>dobhatsz</b>, <b>passzolhatsz</b> (ha senki nem tett), <b>megadhatod</b> a tétet, vagy <b>emelhetsz</b>. Nincs limit: bármikor mehetsz all-in. Ha all-in mész, mindenkitől csak annyit nyerhetsz, amennyit te is be tudtál tenni (mellékkassza).</p>
<h3>A kocsma házirendje</h3>
<ul>
<li><b>Óra:</b> korlátozott ideig gondolkodhatsz. Ha elalszol, automatikusan passzolsz — vagy dobsz, ha van tét.</li>
<li><b>Beszólások:</b> görgővel választasz, a "Mondd!" gombbal (vagy T billentyűvel) mondod. Nincs chatablak — csak baráti átkok.</li>
<li><b>Kölcsön:</b> ha leégsz és legalább 3-an vagytok, kérhetsz kölcsönt. Mindenki eldönti, mennyit ad. A nyereményeidből automatikusan visszafizeted 20% kamattal. Ha megint leégsz: végleg kiestél.</li>
<li><b>Lelövés:</b> kattints egy játékosra és indíts szavazást. Ha a többség igent mond, a bajkeverőt kilövik a kocsmából. A házigazdát nem lehet lelőni.</li>
<li><b>Kész gomb:</b> online mindenki megnyomja a „Kész vagyok!” gombot. Ha mindenki kész, magától indul az osztás. A házigazda bármikor indíthat – aki nem volt kész, kimarad, és a „Beszállok!” gombbal a következő körtől beül.</li>
<li><b>Késők</b> a pultnál állnak a kör végéig, aztán leülnek egy üres helyre vagy egy gépi játékos helyére.</li>
<li><b>Leégett játékosok</b> nézőként maradhatnak.</li>
<li><b>A kocsmáros rendet tart:</b> nagy pénzzel újra és újra all in menni, amíg mindenki eldob – az nem póker. 5 körből 4 ilyen → a pénzed fele szétosztva a többieknek. A következő 5 körben még 4 → utolsó figyelmeztetés. A következő 3 körben még 2 → BANG, kilőnek, a pénzed szétosztva. A váróban kikapcsolható.</li>
<li><b>Whisky:</b> a 🥃 gombbal rendelhetsz, 5 dollár egy pohár. A kocsmáros kihozza, megiszod, a játék közben megy tovább – csak utána egy kicsit forog a kocsma.</li>
<li><b>Nyerési esély:</b> a lapjaid fölött látod a kezed értékét és a becsült esélyedet a bent maradt játékosok ellen. Ezt csak te látod.</li>
</ul>`
  }
};

// Taunts: same index in both languages, so each player reads them in their own language.
const TAUNTS = {
  hu: [
    'Égjen oda a lángosod!',
    'Pisiljen a kutya a kalapodba!',
    'Rúgjon meg a saját lovad!',
    'Legyen homok a babodban!',
    'Másszon skorpió a csizmádba!',
    'Csússzon le a gatyád a templom előtt!',
    'Egye meg a moly a vasárnapi gatyádat!',
    'Rozsdásodjon be a pisztolyod!',
    'Mindig langyos legyen a söröd!',
    'Vizezze a kocsmáros a whiskydet!',
    'Csak kettesek jöjjenek a kezedbe!',
    'Költözzön bolha a bajszodba!',
    'Fújja le a szél a bajszodat!',
    'Essél bele a lóitatóba!',
    'Csípjen meg a saját tyúkod!',
    'Csak a postakocsi porát nyeld!',
    'A kecském jobban játszik nálad!',
    'Még a keselyű se enne meg téged!',
    'Menj haza tehenet fejni, cowboy!',
    'Kár azért a kalapért azon az üres fejen!',
    'Köszi a pénzt, jövő héten is gyere!',
    'Szólj, ha megtanultál játszani!',
    'Még a seriff is szégyelli, hogy ismer!',
    'Ilyen lappal én az asztal alá bújnék!',
    'Fogd a kalapod, mert az is az enyém lesz!',
    'Soha többé ne egyél rendes pörköltet!',
    'Ragadjon a gatyád a székhez!',
    'Legyen tele a csizmád tehénlepénnyel!',
    'Szökjön meg a lovad egy öszvérrel!',
    'Áldják meg a galambok a kalapodat!',
    'Bőgjön a szamár az ablakod alatt egész éjjel!',
    'Csípjen meg a darázs ott, ahol a legjobban fáj!',
    'Olyan szerencséd legyen, mint a pulykának karácsonykor!',
    'Pörkölje meg a gyertya a bajszodat!',
    'Hú, ez fájt, mi? Hehe!',
    'Ne sírj, sós lesz tőle a whisky!',
    'Ezzel a blöffel egy vak lovat se versz át!',
    'Tedd zsebre a büszkeségedet, más úgysem maradt!',
    'Hívjátok a sírásót, ennek már annyi!',
    'Találjon meg a legkövérebb szúnyog!',
    'Aludjon rajtad egy tehén!',
    'Csak így tovább, cimbora, gyűjtöm a pénzed!',
    'Szép lap volt, kár, hogy nem a tiéd!',
    'Jó szerencsét… kelleni fog!',
    'Yiiihaaa!',
    'Szép játék volt, partner.'
  ],
  en: [
    'May your flapjacks always burn!',
    'May a coyote pee in your hat!',
    'May your own horse kick you!',
    'May there be sand in your beans!',
    'May a scorpion crawl into your boot!',
    'May your britches drop in front of the church!',
    'May moths eat your Sunday pants!',
    'May your six-shooter rust shut!',
    'May your beer always be warm!',
    'May the barkeep water down your whiskey!',
    'May you draw nothing but deuces!',
    'May fleas move into your mustache!',
    'May the wind blow your mustache clean off!',
    'Go fall in the horse trough!',
    'May your own chicken peck you!',
    'May you eat the stagecoach\'s dust forever!',
    'My goat plays better than you!',
    'Even the vultures would pass on you!',
    'Go home and milk your cows, cowboy!',
    'Shame about the nice hat on that empty head!',
    'Thanks for the cash, come back next week!',
    'Holler when you learn to play!',
    'Even the sheriff is ashamed of you!',
    'With a hand like that I\'d hide under the table!',
    'Hold onto your hat, it\'s mine next!',
    'May you never eat a decent stew again!',
    'May your pants glue to that chair!',
    'May your boots be full of cow pies!',
    'May your horse elope with a mule!',
    'May the pigeons bless your hat!',
    'May a donkey bray under your window all night!',
    'May a wasp sting you where it hurts most!',
    'May your luck be like a turkey\'s at Thanksgiving!',
    'May a candle singe your mustache!',
    'Ooh, that stung, didn\'t it? Heh!',
    'Don\'t cry, you\'ll make the whiskey salty!',
    'That bluff wouldn\'t fool a blind horse!',
    'Pocket your pride, it\'s all you got left!',
    'Somebody call the undertaker!',
    'May the fattest mosquito find your neck!',
    'May a cow sleep on top of you!',
    'Keep it comin\', partner, I\'m collectin\'!',
    'Nice hand — shame it wasn\'t yours!',
    'Good luck… you\'ll need it!',
    'Yeeeehaw!',
    'Good game, partner.'
  ]
};

// Short reactions the AI uses (index shared across languages)
const REACT = {
  hu: {
    win: ['Hehe, ez az enyém!', 'Gyere csak, pénzecske!', 'Yiiihaaa!', 'Na ki a király?', 'Köszönöm szépen!'],
    lose: ['Átkozott lapok!', 'Ez nem igaz…', 'Pfff.', 'A nagyanyám jobban osztott!', 'Na várj csak…'],
    think: ['Hmm…', 'Lássuk csak…', 'Ejha.', 'Na ne…'],
    allin: ['Mindent bele!', 'Vagy minden, vagy semmi!', 'Ez volt a lovam ára…'],
    fold: ['Ez most nem az én lapom.', 'Passzolnám… vagyis inkább dobok.', 'Na, ezt kihagyom.'],
    leave: ['Na, megyek, vár az asszony.', 'Viszlát, cowboyok!', 'Ennyi volt, megyek fejni.'],
    broke: ['Elfogyott a pénzem!', 'Odalett a lovam ára…'],
    lendYes: ['Itt van, de nehogy elidd!', 'Na jó, de visszakérem kamattal!', 'Fogd, szegény pára.'],
    lendNo: ['Egy vasat se!', 'Kérj a serifftől!', 'Menj dolgozni!', 'Majd ha fagy!'],
    thanks: ['Köszi, partner!', 'Na, visszajött a pénzem!', 'Pontos ember vagy!'],
    shot: ['Jaj ne!', 'Ááá!', 'Ez nem igazság!'],
    beg: ['Aggy mán kőccsön!', 'Cimborák, egy kis kölcsön? Visszaadom, becsszó!', 'Csak pár dollárt, a lovam életére!', 'Ki segít ki egy leégett cowboyt?'],
    byeBroke: ['Na, nekem ennyi volt. Viszlát, cowboyok!', 'Elfogyott a pénzem, megyek haza. Sziasztok!', 'Ma nem az én napom. Isten veletek!', 'Megyek, mielőtt a lovamat is elveszítem. Viszlát!'],
    order: ['Úgy érzem, hörpintenem kell!', 'Kocsmáros! Egy pusztulatos whiskyt!', 'Erre inni kell…', 'Egy kis bátorító, és jöhet a következő!',
      'Hozz egy whiskyt, de duplát!', 'A szerencsémre!', 'Ezt most nem bírom szárazon.', 'Egészségünkre, cimborák!',
      'Ide egy whiskyt, mielőtt elsírom magam!', 'Kocsmáros, a szokásosat!', 'Egy pohárral, a lovam emlékére!', 'Ennyi szívást csak whiskyvel lehet túlélni.'],
    gun: ['Bumm!', 'Viszlát!', 'Erre ment ki!']
  },
  en: {
    win: ['Heh, that\'s mine!', 'Come to papa, money!', 'Yeeeehaw!', 'Who\'s the king now?', 'Much obliged!'],
    lose: ['Dang cards!', 'Ain\'t no way…', 'Pfff.', 'My granny deals better!', 'You just wait…'],
    think: ['Hmm…', 'Let me see…', 'Well well.', 'Oh no…'],
    allin: ['Everything I got!', 'All or nothin\'!', 'That was my horse money…'],
    fold: ['Not my hand.', 'I\'ll sit this one out.', 'Nope.'],
    leave: ['Well, the missus is waitin\'.', 'So long, cowboys!', 'That\'s it, I\'m off to milk the cows.'],
    broke: ['I\'m broke!', 'There goes my horse money…'],
    lendYes: ['Here, don\'t drink it all!', 'Fine, but I want it back with interest!', 'Take it, poor critter.'],
    lendNo: ['Not a cent!', 'Ask the sheriff!', 'Go get a job!', 'When pigs fly!'],
    thanks: ['Thanks, partner!', 'My money came home!', 'An honest man!'],
    shot: ['Oh no!', 'Aaargh!', 'That ain\'t fair!'],
    beg: ['Spare some cash, partner?', 'Pals, a little loan? I swear I\'ll pay it back!', 'Just a few dollars, on my horse\'s life!', 'Who\'ll help out a broke cowboy?'],
    byeBroke: ['Well, that\'s me done. So long, cowboys!', 'Out of money, I\'m headin\' home. Bye now!', 'Not my day. Take care, partners!', 'Better go before I lose my horse too. Adios!'],
    order: ['I feel a sip comin\' on!', 'Barkeep! A whiskey that\'ll knock me flat!', 'I\'ll drink to that…', 'A little courage before the next hand!',
      'Whiskey, barkeep – make it a double!', 'To my luck!', 'Can\'t take this one dry.', 'Cheers, partners!',
      'Whiskey, before I start cryin\'!', 'Barkeep, the usual!', 'One for my poor old horse!', 'Only whiskey gets a man through cards like these.'],
    gun: ['Bang!', 'Adios!', 'He went that way!']
  }
};
