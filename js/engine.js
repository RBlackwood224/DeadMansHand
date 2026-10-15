// ============================================================
//  DEAD MAN'S HAND — game engine (runs on the host / in solo)
//  The engine is the single source of truth. Clients only send
//  intents and receive a personalised (card-hiding) view.
// ============================================================
'use strict';

class Engine {
  constructor(settings, io) {
    this.s = Object.assign({ mode: 'holdem', sb: 10, bb: 20, start: 1000, dealer: -1, timer: 15, ai: 3, rejoin: true, loans: true, antiTroll: true }, settings || {});
    this.io = io;                 // { emit(ev), changed(), kick(pid) }
    this.seats = [null, null, null, null, null, null];
    this.specs = [];              // standing people: {pid,name,char,human,reason:'waiting'|'broke'|'watch',stack,debts,loanUsed}
    this.phase = 'lobby';
    this.round = '';
    this.handNo = 0;
    this.board = [];
    this.deck = [];
    this.dealer = -1;
    this.toAct = -1;
    this.curBet = 0;
    this.minRaise = 0;
    this.raises = 0;
    this.deadline = 0;
    this.aiAt = 0;
    this.deadMoney = 0;
    this.result = null;
    this.vote = null;
    this.loan = null;
    this.kicked = new Set();
    this.bank = {};
    this.waitAt = 0; this.waitFn = null;
    this.firstHand = true;
    this.hostPid = null;
    this.winner = null;
    this.lastTaunt = {};
    this.aiSeq = 0;
  }

  now() { return Date.now(); }
  emit(e) { this.io.emit && this.io.emit(e); }
  changed() { this.io.changed && this.io.changed(); }
  wait(ms, fn) { this.waitAt = this.now() + ms; this.waitFn = fn; }

  // ---------- people ----------
  allPeople() { return this.seats.filter(Boolean).concat(this.specs); }
  findPid(pid) {
    const seat = this.seats.findIndex(p => p && p.pid === pid);
    if (seat >= 0) return { where: 'seat', seat, p: this.seats[seat] };
    const i = this.specs.findIndex(p => p.pid === pid);
    if (i >= 0) return { where: 'spec', i, p: this.specs[i] };
    return null;
  }
  usedChars() { return new Set(this.allPeople().map(p => p.char)); }
  pickChar(avoidName) {
    const used = this.usedChars();
    const free = ROSTER.map((r, i) => i).filter(i => !used.has(i) && ROSTER[i].name !== avoidName);
    const pool = free.length ? free : ROSTER.map((r, i) => i);
    return pool[Math.floor(Math.random() * pool.length)];
  }
  humans() { return this.allPeople().filter(p => p.human); }
  freeSeat() { return this.seats.findIndex(p => !p); }

  newPlayer(o) {
    return Object.assign({ stack: 0, bet: 0, total: 0, folded: true, allIn: false, acted: false, cards: [], lastAct: '',
      loanUsed: false, debts: [], broke: false, brokeAt: 0, human: false }, o);
  }

  uniqueName(name) {
    name = (name || 'Cowboy').trim().slice(0, 14) || 'Cowboy';
    // no rude names in this saloon
    if (typeof NameFilter !== 'undefined' && NameFilter.isBad(name)) name = 'Cowboy ' + (10 + Math.floor(Math.random() * 89));
    const taken = new Set(this.allPeople().map(p => p.name.toLowerCase()));
    if (!taken.has(name.toLowerCase())) return name;
    for (let i = 2; i < 99; i++) { const n = name.slice(0, 12) + ' ' + i; if (!taken.has(n.toLowerCase())) return n; }
    return name;
  }

  // returns {ok, reason}
  addHuman(pid, name, isHost) {
    const key = (name || '').trim().toLowerCase();
    if (this.kicked.has(key)) return { ok: false, reason: 'kickedBan' };
    if (isHost) this.hostPid = pid;
    const banked = this.bank[key];
    name = this.uniqueName(name);
    const char = this.pickChar();
    if (this.phase === 'lobby') {
      const seat = this.freeSeat();
      const p = this.newPlayer({ pid, name, char, human: true, isHost: !!isHost });
      if (seat >= 0) this.seats[seat] = p;
      else { p.reason = 'watch'; this.specs.push(p); }
      this.emit({ type: 'note', key: 'joined', n: name });
      this.changed();
      return { ok: true };
    }
    // game in progress: stand at the bar
    const p = this.newPlayer({ pid, name, char, human: true, reason: 'waiting', stack: this.s.start });
    if (banked) {
      if (!this.s.rejoin) { p.reason = 'watch'; p.stack = 0; }
      else { p.stack = banked.stack; p.debts = banked.debts || []; p.loanUsed = !!banked.loanUsed; if (p.stack <= 0) p.reason = 'watch'; }
      delete this.bank[key];
    }
    this.specs.push(p);
    this.emit({ type: 'note', key: 'joined', n: name });
    this.changed();
    return { ok: true, watch: p.reason === 'watch' };
  }

  addAI() {
    const seat = this.freeSeat();
    if (seat < 0) return false;
    const used = new Set(this.allPeople().map(p => p.name));
    const free = ROSTER.map((r, i) => i).filter(i => !used.has(ROSTER[i].name) && !this.usedChars().has(i));
    if (!free.length) return false;
    const char = free[Math.floor(Math.random() * free.length)];
    const r = ROSTER[char];
    this.seats[seat] = this.newPlayer({ pid: 'ai' + (++this.aiSeq), name: r.name, char, human: false, stack: this.s.start,
      t: r.t, a: r.a, b: r.b });
    return true;
  }

  setLook(pid) { // lobby: cycle character look
    const f = this.findPid(pid); if (!f) return;
    const used = this.usedChars();
    let c = f.p.char;
    for (let i = 0; i < ROSTER.length; i++) { c = (c + 1) % ROSTER.length; if (!used.has(c)) break; }
    f.p.char = c; this.changed();
  }

  inHand(p) { return p && !p.folded && p.cards.length > 0; }
  canAct(p) { return this.inHand(p) && !p.allIn; }
  handLive() { return ['bet', 'draw', 'deal', 'runout'].includes(this.phase); }
  nextSeat(from, pred) {
    for (let k = 1; k <= 6; k++) { const i = (from + k) % 6; if (pred(this.seats[i], i)) return i; }
    return -1;
  }

  removeFromSeat(seat, bankIt) {
    const p = this.seats[seat]; if (!p) return;
    if (this.handLive() || this.phase === 'handover') {
      if (this.handLive()) {
        if (this.phase === 'bet' && this.toAct === seat && this.inHand(p)) { this.act(seat, 'fold'); }
        else if (this.phase === 'draw' && this.toAct === seat) { this.doDraw(seat, []); }
      }
      if (this.handLive()) this.deadMoney += p.total;
      p.folded = true;
    }
    if (bankIt && p.human && this.phase !== 'lobby') this.bank[p.name.toLowerCase()] = { stack: p.stack, debts: p.debts, loanUsed: p.loanUsed };
    this.seats[seat] = null;
    if (this.loan && this.loan.pid === p.pid) this.loan = null;
    if (this.handLive() && this.phase === 'bet') {
      const live = this.seats.filter(q => this.inHand(q));
      if (live.length === 1) this.winByFold(live[0]);
      else if (this.toAct === seat || this.toAct < 0) { /* handled */ }
    }
  }

  removeHuman(pid) {
    const f = this.findPid(pid); if (!f) return;
    const name = f.p.name;
    if (f.where === 'seat') this.removeFromSeat(f.seat, this.s.rejoin);
    else {
      if (this.s.rejoin && f.p.stack > 0 && this.phase !== 'lobby') this.bank[name.toLowerCase()] = { stack: f.p.stack, debts: f.p.debts, loanUsed: f.p.loanUsed };
      this.specs.splice(f.i, 1);
    }
    if (this.vote && (this.vote.target === pid)) this.vote = null;
    this.emit({ type: 'note', key: 'left', n: name });
    this.changed();
  }

  updateSettings(o) {
    if (this.phase !== 'lobby') return;
    const S = this.s;
    if (o.mode === 'holdem' || o.mode === 'draw') S.mode = o.mode;
    if (o.bb) { S.bb = Math.max(2, Math.min(500, o.bb | 0)); S.sb = Math.floor(S.bb / 2); }
    if (o.start) S.start = Math.max(100, Math.min(5000, o.start | 0));
    if (o.dealer !== undefined) S.dealer = o.dealer | 0;
    if (o.timer) S.timer = Math.max(5, Math.min(60, o.timer | 0));
    if (o.ai !== undefined) S.ai = Math.max(0, Math.min(5, o.ai | 0));
    if (o.rejoin !== undefined) S.rejoin = !!o.rejoin;
    if (o.loans !== undefined) S.loans = !!o.loans;
    if (o.antiTroll !== undefined) S.antiTroll = !!o.antiTroll;
    this.changed();
  }

  // ---------- game flow ----------
  start() {
    this.autoStartAt = 0;
    // AIs fill seats
    for (let i = 0; i < 6; i++) if (this.seats[i] && !this.seats[i].human) this.seats[i] = null;
    // players who did not press "Ready" sit this one out (they can deal themselves in later)
    const idle = [];
    for (let i = 0; i < 6; i++) { const p = this.seats[i]; if (p && p.human && p.pid !== this.hostPid && !p.ready) { idle.push([i, p]); this.seats[i] = null; } }
    let want = this.s.ai;
    while (want > 0 && this.addAI()) want--;
    const seated = this.seats.filter(Boolean);
    if (seated.length < 2) {
      for (let i = 0; i < 6; i++) if (this.seats[i] && !this.seats[i].human) this.seats[i] = null;
      idle.forEach(([i, p]) => { this.seats[i] = p; });
      return false;
    }
    idle.forEach(([i, p]) => { p.reason = 'idle'; p.cards = []; p.folded = true; this.specs.push(p); this.emit({ type: 'note', key: 'satOut', n: p.name }); });
    this.seats.forEach(p => { if (p) p.ready = false; });
    seated.forEach(p => { p.stack = this.s.start; p.debts = []; p.loanUsed = false; p.broke = false; });
    this.specs.forEach(p => { if (p.human) { p.stack = this.s.start; if (p.reason !== 'idle') p.reason = 'waiting'; } });
    this.handNo = 0; this.firstHand = true; this.winner = null; this.bank = {};
    this.dealer = (this.s.dealer >= 0 && this.seats[this.s.dealer]) ? this.s.dealer
      : this.seats.map((p, i) => p ? i : -1).filter(i => i >= 0)[Math.floor(Math.random() * seated.length)];
    this.phase = 'between';
    this.wait(600, () => this.startHand());
    this.changed();
    return true;
  }

  backToLobby() {
    // everyone (humans) sits back down, AIs leave
    this.allPeople().forEach(p => { p.ready = false; });
    this.autoStartAt = 0; this.waitFn = null; this.toAct = -1; this.deadMoney = 0;
    this.phase = 'lobby'; this.result = null; this.board = []; this.vote = null; this.loan = null; this.winner = null;
    for (let i = 0; i < 6; i++) { const p = this.seats[i]; if (p && !p.human) this.seats[i] = null; if (p) { p.cards = []; p.folded = true; p.bet = 0; p.total = 0; p.lastAct = ''; } }
    this.specs = this.specs.filter(p => p.human);
    for (let k = this.specs.length - 1; k >= 0; k--) {
      const seat = this.freeSeat(); if (seat < 0) break;
      const p = this.specs.splice(k, 1)[0]; p.reason = ''; this.seats[seat] = p;
    }
    this.changed();
  }

  seatWaiters() {
    const waiting = this.specs.filter(p => p.reason === 'waiting' && p.stack > 0);
    for (const w of waiting) {
      let seat = this.freeSeat();
      if (seat < 0) {
        // an AI gives up its chair
        const aiSeats = this.seats.map((p, i) => (p && !p.human) ? i : -1).filter(i => i >= 0);
        if (!aiSeats.length) continue;
        // prefer an AI that owes nobody money and isn't begging for a loan right now
        const free = aiSeats.filter(i => !(this.seats[i].debts || []).length && !this.seats[i].broke && !(this.loan && this.loan.pid === this.seats[i].pid));
        const pool = free.length ? free : aiSeats;
        seat = pool[Math.floor(Math.random() * pool.length)];
        const ai = this.seats[seat];
        if (this.loan && this.loan.pid === ai.pid) this.loan = null;
        // leaving with a debt: pay it all back (with interest) before going
        (ai.debts || []).forEach(d => {
          const lender = this.allPeople().find(q => q.pid === d.pid);
          const pay = Math.min(d.amt, ai.stack);
          if (!lender || pay <= 0) return;
          ai.stack -= pay; lender.stack += pay;
          this.emit({ type: 'repay', from: ai.pid, to: lender.pid, n: ai.name, a: pay });
        });
        ai.debts = [];
        this.emit({ type: 'say', pid: ai.pid, cat: 'leave', i: Math.floor(Math.random() * 3) });
        this.emit({ type: 'walkout', char: ai.char, n: ai.name, replaced: true });
        this.emit({ type: 'note', key: 'standsUp', n: ai.name });
        this.seats[seat] = null;
      }
      this.specs.splice(this.specs.indexOf(w), 1);
      w.reason = '';
      this.seats[seat] = this.newPlayer(Object.assign({}, w, { folded: true, cards: [] }));
      this.emit({ type: 'note', key: 'sitsDown', n: w.name });
    }
  }

  startHand() {
    this.result = null; this.board = []; this.deadMoney = 0; this.vote = this.vote; this.toAct = -1;
    this.seatWaiters();
    const act = this.seats.map((p, i) => (p && p.stack > 0 && !p.broke) ? i : -1).filter(i => i >= 0);
    if (act.length < 2) return this.gameOver();
    const ok = (p) => p && p.stack > 0 && !p.broke;
    if (this.firstHand) { if (!ok(this.seats[this.dealer])) this.dealer = this.nextSeat(this.dealer, ok); this.firstHand = false; }
    else this.dealer = this.nextSeat(this.dealer, ok);
    this.handNo++;
    this.seats.forEach(p => { if (p) { p.bet = 0; p.total = 0; p.folded = !ok(p); p.allIn = false; p.acted = false; p.cards = []; p.lastAct = ''; p.discarded = 0;
      p.handStart = p.stack; p.dealtIn = ok(p); p.shoveTry = false; p.trollHand = false; } });
    this.dealtCount = act.length;
    this.deck = Poker.newDeck();
    let sbSeat, bbSeat;
    if (act.length === 2) { sbSeat = this.dealer; bbSeat = this.nextSeat(this.dealer, ok); }
    else { sbSeat = this.nextSeat(this.dealer, ok); bbSeat = this.nextSeat(sbSeat, ok); }
    this.post(sbSeat, this.s.sb); this.post(bbSeat, this.s.bb);
    this.seats[sbSeat].lastAct = 'sb'; this.seats[bbSeat].lastAct = 'bb';
    this.sbSeat = sbSeat; this.bbSeat = bbSeat;
    const n = this.s.mode === 'holdem' ? 2 : 5;
    const order = [];
    let s = this.dealer;
    for (let k = 0; k < act.length; k++) { s = this.nextSeat(s, ok); order.push(s); }
    for (let r = 0; r < n; r++) order.forEach(i => this.seats[i].cards.push(this.deck.pop()));
    this.emit({ type: 'deal', order: order.map(i => this.seats[i].pid), n });
    this.phase = 'deal';
    this.round = this.s.mode === 'holdem' ? 'pre' : 'bet1';
    this.curBet = this.s.bb; this.minRaise = this.s.bb; this.raises = 0;
    this.changed();
    this.wait(400 + order.length * n * 110, () => {
      this.phase = 'bet';
      const first = this.nextSeat(bbSeat, (p) => this.canAct(p));
      if (first < 0 || this.roundDone()) this.endStreet();
      else this.setTurn(first);
    });
  }

  post(seat, amt) {
    const p = this.seats[seat];
    const pay = Math.min(amt, p.stack);
    p.stack -= pay; p.bet += pay; p.total += pay;
    if (p.stack === 0) p.allIn = true;
    return pay;
  }

  setTurn(seat) {
    this.toAct = seat;
    const p = this.seats[seat];
    this.deadline = this.now() + this.s.timer * 1000;
    if (p && !p.human) this.aiAt = this.now() + 700 + Math.random() * 1600;
    if (p && p.human) this.emit({ type: 'turn', pid: p.pid });
    this.changed();
  }

  potTotal() { return this.seats.reduce((a, p) => a + (p ? p.total : 0), 0) + this.deadMoney; }
  potCollected() { return this.seats.reduce((a, p) => a + (p ? p.total - p.bet : 0), 0) + this.deadMoney; }

  act(seat, a, amt) {
    if (this.phase !== 'bet' || seat !== this.toAct) return false;
    const p = this.seats[seat]; if (!this.canAct(p)) return false;
    const toCall = this.curBet - p.bet;
    let label = a;
    if (a === 'check' && toCall > 0) a = 'fold';
    if (a === 'fold') { p.folded = true; label = 'fold'; }
    else if (a === 'check') { label = 'check'; }
    else if (a === 'call') {
      if (toCall <= 0) label = 'check';
      else { this.post(seat, toCall); label = p.allIn ? 'allin' : 'call'; }
    } else if (a === 'raise' || a === 'bet' || a === 'allin') {
      const maxTo = p.bet + p.stack;
      let to = a === 'allin' ? maxTo : Math.floor(amt || 0);
      const minTo = this.curBet + this.minRaise;
      if (to < minTo) to = minTo;
      if (to > maxTo) to = maxTo;
      if (to <= this.curBet) { // can only call
        this.post(seat, Math.min(toCall, p.stack)); label = p.allIn ? 'allin' : (toCall > 0 ? 'call' : 'check');
      } else {
        const raiseBy = to - this.curBet;
        this.post(seat, to - p.bet);
        const full = raiseBy >= this.minRaise;
        if (full) this.minRaise = raiseBy;
        label = p.allIn ? 'allin' : (this.curBet === 0 ? 'bet' : 'raise');
        this.curBet = to;
        this.raises++;
        if (full || true) this.seats.forEach((q, i) => { if (q && i !== seat && this.canAct(q)) q.acted = false; });
      }
    }
    p.acted = true; p.lastAct = label;
    // all-in right away with a deep stack against 3+ players = suspicious
    if (label === 'allin' && p.human && (this.round === 'pre' || this.round === 'bet1') && this.dealtCount >= 3 && p.handStart >= 15 * this.s.bb) p.shoveTry = true;
    this.emit({ type: 'act', pid: p.pid, a: label, amt: p.bet });
    if (label === 'allin' && !p.human && Math.random() < 0.6) this.emit({ type: 'say', pid: p.pid, cat: 'allin', i: rndI(3) });
    if (label === 'fold' && !p.human && Math.random() < 0.12) this.emit({ type: 'say', pid: p.pid, cat: 'fold', i: rndI(3) });
    this.afterAction();
    return true;
  }

  afterAction() {
    const live = this.seats.filter(p => this.inHand(p));
    if (live.length === 1) return this.winByFold(live[0]);
    if (this.roundDone()) { this.toAct = -1; this.changed(); this.wait(650, () => this.endStreet()); return; }
    const nx = this.nextSeat(this.toAct, (p) => this.canAct(p) && (!p.acted || p.bet < this.curBet));
    if (nx < 0) { this.toAct = -1; this.wait(650, () => this.endStreet()); return; }
    this.setTurn(nx);
  }

  roundDone() {
    const can = this.seats.filter(p => this.canAct(p));
    if (can.length === 0) return true;
    const maxBet = Math.max(0, ...this.seats.filter(Boolean).map(p => p.bet));
    if (can.length === 1) return can[0].bet >= maxBet;
    return can.every(p => p.acted && p.bet === this.curBet);
  }

  endStreet() {
    this.seats.forEach(p => { if (p) { p.bet = 0; p.acted = false; if (p.lastAct !== 'allin' && p.lastAct !== 'fold') p.lastAct = ''; } });
    this.curBet = 0; this.minRaise = this.s.bb; this.raises = 0; this.toAct = -1;
    this.emit({ type: 'collect' });
    const able = this.seats.filter(p => this.canAct(p)).length;
    if (this.s.mode === 'holdem') {
      const next = { pre: 'flop', flop: 'turn', turn: 'river', river: 'show' }[this.round];
      if (next === 'show') return this.showdown();
      this.round = next;
      this.deck.pop(); // burn
      const n = next === 'flop' ? 3 : 1;
      for (let i = 0; i < n; i++) this.board.push(this.deck.pop());
      this.emit({ type: 'board', n });
      this.phase = able >= 2 ? 'deal' : 'runout';
      this.changed();
      this.wait(able >= 2 ? 700 : 1300, () => {
        if (able >= 2) { this.phase = 'bet'; this.setTurn(this.nextSeat(this.dealer, (p) => this.canAct(p))); }
        else this.endStreet();
      });
    } else {
      if (this.round === 'bet1') {
        this.round = 'draw'; this.phase = 'draw';
        const first = this.nextSeat(this.dealer, (p) => this.inHand(p));
        this.setDrawTurn(first);
      } else return this.showdown();
    }
  }

  setDrawTurn(seat) {
    this.toAct = seat;
    const p = this.seats[seat];
    this.deadline = this.now() + this.s.timer * 1000;
    if (p && !p.human) this.aiAt = this.now() + 600 + Math.random() * 1200;
    if (p && p.human) this.emit({ type: 'turn', pid: p.pid, draw: true });
    this.changed();
  }

  doDraw(seat, idx) {
    if (this.phase !== 'draw' || seat !== this.toAct) return false;
    const p = this.seats[seat];
    idx = Array.from(new Set((idx || []).map(i => i | 0).filter(i => i >= 0 && i < 5)));
    if (!Poker.maxDiscardFor(p.cards, idx)) idx = idx.slice(0, 3);
    idx.forEach(i => { p.cards[i] = this.deck.pop(); });
    p.discarded = idx.length;
    p.lastAct = idx.length ? 'draw' : 'pat';
    this.emit({ type: 'draw', pid: p.pid, n: idx.length, idx });
    // order: from left of dealer around to dealer
    const order = []; let s = this.dealer;
    for (let k = 0; k < 6; k++) { s = (s + 1) % 6; if (this.inHand(this.seats[s])) order.push(s); }
    const pos = order.indexOf(seat);
    if (pos >= 0 && pos < order.length - 1) { this.setDrawTurn(order[pos + 1]); return true; }
    // drawing done
    this.toAct = -1;
    this.round = 'bet2';
    this.seats.forEach(q => { if (q && q.lastAct !== 'allin' && q.lastAct !== 'fold') q.lastAct = ''; });
    const able = this.seats.filter(q => this.canAct(q)).length;
    this.phase = 'deal';
    this.changed();
    this.wait(700, () => {
      if (able >= 2) { this.phase = 'bet'; this.setTurn(this.nextSeat(this.dealer, (q) => this.canAct(q))); }
      else this.showdown();
    });
    return true;
  }

  doDrawSkip(seat) {
    // continue the draw round after a player who can no longer draw
    const order = []; let s = this.dealer;
    for (let k = 0; k < 6; k++) { s = (s + 1) % 6; if (this.inHand(this.seats[s])) order.push(s); }
    const next = order.find(i => ((i - this.dealer + 6) % 6) > ((seat - this.dealer + 6) % 6));
    if (next !== undefined) { this.setDrawTurn(next); return; }
    this.round = 'bet2'; this.phase = 'deal'; this.changed();
    this.wait(700, () => { if (this.seats.filter(q => this.canAct(q)).length >= 2) { this.phase = 'bet'; this.setTurn(this.nextSeat(this.dealer, (q) => this.canAct(q))); } else this.showdown(); });
  }

  winByFold(p) {
    this.toAct = -1;
    if (p.shoveTry) p.trollHand = true; // nobody dared to call: classic all-in troll
    const amt = this.potTotal();
    p.stack += amt;
    this.seats.forEach(q => { if (q) q.bet = 0; });
    this.result = { winners: [{ pid: p.pid, name: p.name, amt, cat: -1 }], shown: {}, best: {} };
    this.emit({ type: 'win', winners: this.result.winners });
    this.repay(p, amt);
    this.aiWinChat(p, amt);
    this.handover();
  }

  showdown() {
    this.toAct = -1;
    this.phase = 'showdown';
    const live = this.seats.map((p, i) => this.inHand(p) ? i : -1).filter(i => i >= 0);
    const ev = {}, best = {}, shown = {};
    live.forEach(i => {
      const p = this.seats[i];
      const e = Poker.evalBest(this.s.mode === 'holdem' ? p.cards.concat(this.board) : p.cards);
      ev[i] = e; best[i] = e.best; shown[i] = p.cards.slice();
    });
    // refund uncalled excess
    const totals = this.seats.map(p => p ? p.total : 0);
    const sorted = totals.slice().sort((a, b) => b - a);
    if (sorted[0] > sorted[1]) {
      const top = totals.indexOf(sorted[0]);
      const ex = sorted[0] - sorted[1];
      this.seats[top].total -= ex; this.seats[top].stack += ex;
    }
    // pots
    const levels = Array.from(new Set(live.map(i => this.seats[i].total))).sort((a, b) => a - b);
    let prev = 0; const won = {};
    let dead = this.deadMoney;
    levels.forEach((L, li) => {
      let pot = 0;
      this.seats.forEach(p => { if (p) pot += Math.max(0, Math.min(p.total, L) - Math.min(p.total, prev)); });
      if (li === levels.length - 1) this.seats.forEach(p => { if (p && p.total > L) pot += p.total - L; });
      pot += dead; dead = 0;
      const elig = live.filter(i => this.seats[i].total >= L);
      let bestS = -1; elig.forEach(i => { if (ev[i].score > bestS) bestS = ev[i].score; });
      const ws = elig.filter(i => ev[i].score === bestS);
      // odd chips go to first winner left of the dealer
      ws.sort((a, b) => ((a - this.dealer + 5) % 6) - ((b - this.dealer + 5) % 6));
      const share = Math.floor(pot / ws.length);
      let rem = pot - share * ws.length;
      ws.forEach(i => { const g = share + (rem > 0 ? 1 : 0); if (rem > 0) rem--; won[i] = (won[i] || 0) + g; });
      prev = L;
    });
    const winners = [];
    Object.keys(won).forEach(k => {
      const i = +k, p = this.seats[i];
      p.stack += won[i];
      winners.push({ pid: p.pid, name: p.name, amt: won[i], cat: ev[i].cat });
    });
    winners.sort((a, b) => b.amt - a.amt);
    this.seats.forEach(q => { if (q) q.bet = 0; });
    const cats = {}; live.forEach(i => cats[i] = ev[i].cat);
    this.result = { winners, shown, best, cats };
    this.emit({ type: 'win', winners, showdown: true });
    winners.forEach(w => { const p = this.seats.find(q => q && q.pid === w.pid); if (p) { this.repay(p, w.amt); } });
    if (winners[0]) { const p = this.seats.find(q => q && q.pid === winners[0].pid); if (p) this.aiWinChat(p, winners[0].amt); }
    live.forEach(i => { const p = this.seats[i]; if (!p.human && !won[i] && Math.random() < 0.3) this.emit({ type: 'say', pid: p.pid, cat: 'lose', i: rndI(5), delay: 900 }); });
    this.handover();
  }

  aiWinChat(p, amt) {
    if (p.human) return;
    if (amt >= this.s.bb * 8 && Math.random() < 0.55) this.emit({ type: 'taunt', pid: p.pid, i: rndI(TAUNTS.en.length), delay: 700 });
    else if (Math.random() < 0.3) this.emit({ type: 'say', pid: p.pid, cat: 'win', i: rndI(5), delay: 700 });
  }

  // loan repayment with 20% interest, from the winnings
  repay(p, won) {
    if (!p.debts || !p.debts.length) return;
    let budget = won;
    for (const d of p.debts) {
      if (budget <= 0) break;
      const lender = this.allPeople().find(q => q.pid === d.pid);
      if (!lender) { d.amt = 0; continue; }
      const pay = Math.min(d.amt, budget, p.stack);
      if (pay <= 0) continue;
      p.stack -= pay; lender.stack += pay; d.amt -= pay; budget -= pay;
      this.emit({ type: 'repay', from: p.pid, to: lender.pid, n: p.name, a: pay });
      if (!lender.human && Math.random() < 0.6) this.emit({ type: 'say', pid: lender.pid, cat: 'thanks', i: rndI(3), delay: 1200 });
    }
    p.debts = p.debts.filter(d => d.amt > 0);
  }

  handover() {
    this.phase = 'handover';
    this.changed();
    const showMs = this.result && Object.keys(this.result.shown).length ? 5200 : 3200;
    this.wait(showMs, () => this.endHand());
  }

  // ---------- the barkeep keeps order: punishing endless all-in trolling ----------
  // stage 1: 4 troll hands out of the last 5 -> half his money is shared among the others
  // stage 2: 4 more in the next 5 hands      -> last warning, the shotgun comes out
  // stage 3: 2 more in the next 3 hands      -> BANG, the rest of his money is shared out
  checkTrolls() {
    const bang = [];
    this.seats.forEach((p, i) => {
      if (!p || !p.human || !p.dealtIn) return;
      const T = p.tr || (p.tr = { lvl: 0, hist: [], win: 0, cnt: 0 });
      const troll = !!p.trollHand; p.trollHand = false;
      if (T.lvl === 0) {
        T.hist.push(troll); if (T.hist.length > 5) T.hist.shift();
        if (T.hist.filter(Boolean).length >= 4) {
          const amt = Math.floor(p.stack / 2);
          p.stack -= amt; this.shareOut(amt, p);
          T.lvl = 1; T.win = 0; T.cnt = 0; T.hist = [];
          this.emit({ type: 'troll', pid: p.pid, n: p.name, lvl: 1, a: amt });
        }
      } else if (T.lvl === 1) {
        T.win++; if (troll) T.cnt++;
        if (T.cnt >= 4) { T.lvl = 2; T.win = 0; T.cnt = 0; this.emit({ type: 'troll', pid: p.pid, n: p.name, lvl: 2 }); }
        else if (T.win >= 5) { T.lvl = 0; T.hist = []; }
      } else if (T.lvl === 2) {
        T.win++; if (troll) T.cnt++;
        if (T.cnt >= 2) bang.push(i);
        else if (T.win >= 3) { T.lvl = 0; T.hist = []; }
      }
    });
    bang.forEach(i => {
      const p = this.seats[i]; if (!p) return;
      const amt = p.stack; p.stack = 0; this.shareOut(amt, p);
      p.tr = { lvl: 0, hist: [], win: 0, cnt: 0 };
      this.emit({ type: 'troll', pid: p.pid, n: p.name, lvl: 3, a: amt, host: p.pid === this.hostPid });
      if (p.pid === this.hostPid) this.toSpectator(i, 'broke'); // the host can't be shot – he just loses everything
      else this.shoot(p.pid);
    });
  }
  shareOut(amt, from) {
    const others = this.seats.filter(q => q && q !== from);
    if (!others.length || amt <= 0) return;
    const share = Math.floor(amt / others.length);
    let rem = amt - share * others.length;
    others.forEach(q => { q.stack += share + (rem > 0 ? 1 : 0); if (rem > 0) rem--; if (q.broke && q.stack > 0) q.broke = false; });
  }

  endHand() {
    if (this.s.antiTroll) this.checkTrolls();
    // busts
    this.seats.forEach((p, i) => {
      if (!p || p.stack > 0 || p.broke) return;
      if (!p.human) {
        const others = this.seats.filter(q => q && q !== p && q.stack > 0).length;
        // some AIs beg for a loan, the others say goodbye and leave
        if (this.s.loans && !p.loanUsed && others >= 2 && Math.random() < 0.45) {
          p.broke = true; p.brokeAt = this.now(); p.cards = []; p.loanAskAt = this.now() + 1200 + Math.random() * 1500;
          this.emit({ type: 'say', pid: p.pid, cat: 'broke', i: rndI(2) });
        } else this.aiLeaves(i);
        return;
      }
      const others = this.seats.filter(q => q && q !== p && q.stack > 0).length;
      if (this.s.loans && !p.loanUsed && others >= 2) { p.broke = true; p.brokeAt = this.now(); p.cards = []; }
      else this.toSpectator(i, 'broke');
    });
    // now and then a thirsty AI orders a drink
    if (Math.random() < 0.08) { const ais = this.seats.filter(p => p && !p.human); if (ais.length) this.orderWhisky(ais[Math.floor(Math.random() * ais.length)].pid); }
    this.phase = 'between';
    this.changed();
    this.wait(400, () => this.startHand());
  }

  aiLeaves(seat) {
    const p = this.seats[seat]; if (!p) return;
    this.emit({ type: 'say', pid: p.pid, cat: 'byeBroke', i: rndI(4) });
    this.emit({ type: 'walkout', char: p.char });
    this.emit({ type: 'note', key: 'standsUp', n: p.name });
    if (this.loan && this.loan.pid === p.pid) this.loan = null;
    this.seats[seat] = null;
  }

  toSpectator(seat, reason) {
    const p = this.seats[seat]; if (!p) return;
    this.seats[seat] = null;
    p.reason = reason; p.broke = false; p.cards = []; p.folded = true;
    this.specs.push(p);
    this.emit({ type: 'note', key: 'standsUp', n: p.name });
  }

  gameOver() {
    this.phase = 'gameover';
    const w = this.seats.filter(p => p && p.stack > 0).sort((a, b) => b.stack - a.stack)[0];
    this.winner = w ? { pid: w.pid, name: w.name } : null;
    this.toAct = -1;
    this.emit({ type: 'gameover', winner: this.winner });
    this.changed();
  }

  // ---------- loans ----------
  requestLoan(pid) {
    const f = this.findPid(pid); if (!f || f.where !== 'seat' || !f.p.broke || this.loan) return;
    const lenders = this.seats.filter(q => q && q.pid !== pid && q.stack > 0).map(q => q.pid);
    if (lenders.length < 2) return;
    this.loan = { pid, name: f.p.name, offers: {}, lenders, deadline: this.now() + 15000, aiAt: {} };
    lenders.forEach(l => { const q = this.findPid(l).p; if (!q.human) this.loan.aiAt[l] = this.now() + 1500 + Math.random() * 5000; });
    this.emit({ type: 'loanReq', pid, n: f.p.name });
    this.changed();
  }
  offerLoan(pid, amt) {
    const L = this.loan; if (!L || !L.lenders.includes(pid) || L.offers[pid] !== undefined) return;
    const f = this.findPid(pid); if (!f) return;
    amt = Math.max(0, Math.min(Math.floor(amt || 0), Math.floor(f.p.stack / 2)));
    L.offers[pid] = amt;
    this.emit({ type: 'loanOffer', pid, amt });
    if (!f.p.human) this.emit({ type: 'say', pid, cat: amt > 0 ? 'lendYes' : 'lendNo', i: rndI(amt > 0 ? 3 : 4) });
    if (L.lenders.every(l => L.offers[l] !== undefined)) this.resolveLoan();
    else this.changed();
  }
  resolveLoan() {
    const L = this.loan; if (!L) return;
    this.loan = null;
    const f = this.findPid(L.pid);
    if (!f || f.where !== 'seat') { this.changed(); return; }
    const p = f.p;
    let total = 0;
    L.lenders.forEach(l => {
      const amt = L.offers[l] || 0; if (amt <= 0) return;
      const lf = this.findPid(l); if (!lf) return;
      const give = Math.min(amt, lf.p.stack); if (give <= 0) return;
      lf.p.stack -= give; total += give;
      p.debts.push({ pid: l, name: lf.p.name, amt: Math.ceil(give * 12 / 10) });
    });
    p.loanUsed = true; p.broke = false;
    if (total > 0) { p.stack = total; this.emit({ type: 'loanDone', pid: p.pid, n: p.name, a: total }); }
    else {
      this.emit({ type: 'loanFail', pid: p.pid, n: p.name });
      if (p.human) this.toSpectator(f.seat, 'broke');
      else { const seat = f.seat; this.aiLeaves(seat); }
    }
    this.changed();
  }

  // ---------- shooting (kick vote) ----------
  startVote(initPid, target) {
    if (this.vote || target === this.hostPid || initPid === target) return;
    const tf = this.findPid(target), inf = this.findPid(initPid);
    if (!tf || !inf) return;
    const voters = this.humans().filter(p => p.pid !== target).map(p => p.pid);
    this.vote = { target, tname: tf.p.name, init: initPid, yes: [initPid], no: [], voters, deadline: this.now() + 15000 };
    this.emit({ type: 'vote', n: tf.p.name, by: inf.p.name });
    this.checkVote();
    this.changed();
  }
  castVote(pid, yes) {
    const V = this.vote; if (!V || !V.voters.includes(pid) || V.yes.includes(pid) || V.no.includes(pid)) return;
    (yes ? V.yes : V.no).push(pid);
    this.checkVote(); this.changed();
  }
  checkVote(timeout) {
    const V = this.vote; if (!V) return;
    const need = Math.floor(V.voters.length / 2) + 1;
    if (V.yes.length >= need) { this.vote = null; this.shoot(V.target); }
    else if (timeout || V.voters.length - V.no.length < need) { this.vote = null; this.emit({ type: 'note', key: 'voteFailed', n: V.tname }); }
  }
  shoot(pid) {
    const f = this.findPid(pid); if (!f) return;
    const p = f.p;
    this.kicked.add(p.name.toLowerCase());
    this.emit({ type: 'shoot', pid, n: p.name, char: p.char, seat: f.where === 'seat' ? f.seat : -1 });
    if (p.human) this.io.kick && this.io.kick(pid);
    if (f.where === 'seat') {
      // the seat empties a moment later (after the flying animation)
      p.shot = true;
      if (this.handLive()) {
        if (this.phase === 'bet' && this.toAct === f.seat) this.act(f.seat, 'fold');
        else if (this.phase === 'draw' && this.toAct === f.seat) this.doDraw(f.seat, []);
        p.folded = true;
      }
      const seat = f.seat;
      this.deadMoney += this.handLive() ? p.total : 0;
      this.seats[seat] = null;
      if (this.loan && this.loan.pid === pid) this.loan = null;
      if (this.phase === 'bet') {
        const live = this.seats.filter(q => this.inHand(q));
        if (live.length === 1) this.winByFold(live[0]);
        else if (this.roundDone() && this.toAct === -1) { /* already moving */ }
      }
      const left = this.seats.filter(q => q && (q.stack > 0 || q.broke)).length;
      if (left < 2 && this.phase !== 'lobby' && this.phase !== 'gameover' && this.phase !== 'handover') this.wait(1500, () => this.gameOver());
    } else this.specs.splice(f.i, 1);
    this.changed();
  }

  // ---------- intents from players ----------
  handle(pid, m) {
    if (!m || typeof m !== 'object') return;
    const f = this.findPid(pid);
    switch (m.t) {
      case 'act': if (f && f.where === 'seat') this.act(f.seat, m.a, m.amt); break;
      case 'draw': if (f && f.where === 'seat') this.doDraw(f.seat, m.idx); break;
      case 'taunt': {
        if (!f) break;
        const t = this.now(); if (this.lastTaunt[pid] && t - this.lastTaunt[pid] < 2500) break;
        this.lastTaunt[pid] = t;
        const i = m.i | 0; if (i < 0 || i >= TAUNTS.en.length) break;
        this.emit({ type: 'taunt', pid, i });
        // sometimes the AI answers back
        if (Math.random() < 0.35) {
          const ais = this.seats.filter(p => p && !p.human);
          if (ais.length) this.emit({ type: 'taunt', pid: ais[rndI(ais.length)].pid, i: rndI(TAUNTS.en.length), delay: 1600 + Math.random() * 1200 });
        }
        break;
      }
      case 'kick': this.startVote(pid, m.target); break;
      case 'vote': this.castVote(pid, !!m.yes); break;
      case 'loanReq': this.requestLoan(pid); break;
      case 'loanGive': this.offerLoan(pid, m.amt); break;
      case 'look': if (this.phase === 'lobby') this.setLook(pid); break;
      case 'whisky': if (f) this.orderWhisky(pid); break;
      case 'rename': {
        if (!f || this.phase !== 'lobby') break;
        const old = f.p.name; f.p.name = '\u0000';
        const nn = this.uniqueName(String(m.name || '').slice(0, 14));
        if (this.kicked.has(nn.toLowerCase())) { f.p.name = old; break; }
        f.p.name = nn; this.changed();
        break;
      }
      case 'ready':
        if (this.phase === 'lobby' && f && f.where === 'seat' && pid !== this.hostPid) { f.p.ready = !!m.on; this.checkAutoStart(); this.changed(); }
        break;
      case 'sitin':
        if (f && f.where === 'spec' && f.p.reason === 'idle') { f.p.reason = 'waiting'; if (f.p.stack <= 0) f.p.stack = this.s.start; this.emit({ type: 'note', key: 'sitsIn', n: f.p.name }); this.changed(); }
        break;
    }
  }

  // a glass of whiskey, on the house – the barkeep brings it, the game goes on
  orderWhisky(pid) {
    const f = this.findPid(pid); if (!f) return;
    this.whiskyAt = this.whiskyAt || {};
    const t = this.now();
    if (this.whiskyAt[pid] && t - this.whiskyAt[pid] < 20000) return;
    if (this.lastWhisky && t - this.lastWhisky < 4500) return; // the barkeep is busy
    if ((f.p.stack || 0) < 5) { this.emit({ type: 'noMoney', pid }); return; } // no money, no whiskey
    f.p.stack -= 5; // $5 a glass
    this.whiskyAt[pid] = t; this.lastWhisky = t;
    this.emit({ type: 'whisky', pid, n: f.p.name, i: Math.floor(Math.random() * 12) });
  }

  // everyone (except the host) pressed Ready -> start automatically after a short countdown
  checkAutoStart() {
    const others = this.seats.filter(p => p && p.human && p.pid !== this.hostPid);
    const enough = this.seats.filter(Boolean).length + this.s.ai >= 2;
    const all = others.length > 0 && others.every(p => p.ready) && enough;
    if (all && !this.autoStartAt) { this.autoStartAt = this.now() + 3500; this.emit({ type: 'note', key: 'allReady' }); }
    if (!all) this.autoStartAt = 0;
  }

  // ---------- clock ----------
  tick() {
    const t = this.now();
    if (this.phase === 'lobby') { this.checkAutoStart(); if (this.autoStartAt && t >= this.autoStartAt) { this.autoStartAt = 0; this.start(); } }
    if (this.waitFn && t >= this.waitAt) { const fn = this.waitFn; this.waitFn = null; fn(); }
    if ((this.phase === 'bet' || this.phase === 'draw') && this.toAct >= 0) {
      const p = this.seats[this.toAct];
      if (!p || (this.phase === 'bet' && !this.canAct(p)) || (this.phase === 'draw' && !this.inHand(p))) {
        // safety: the player to act vanished or cannot act any more -> move on
        if (this.phase === 'bet') { this.afterAction(); } else { const tA = this.toAct; this.toAct = -1; this.doDrawSkip(tA); }
      }
      else if (!p.human && t >= this.aiAt) this.aiMove(this.toAct);
      else if (p.human && t >= this.deadline) {
        if (this.phase === 'bet') this.act(this.toAct, p.bet >= this.curBet ? 'check' : 'fold');
        else this.doDraw(this.toAct, []);
      }
    }
    if (this.vote && t >= this.vote.deadline) this.checkVote(true);
    if (this.loan) {
      const L = this.loan;
      for (const l in L.aiAt) if (t >= L.aiAt[l]) {
        delete L.aiAt[l];
        const q = this.findPid(l);
        if (q) { const give = Math.random() < 0.55 ? Math.round(q.p.stack * (0.05 + Math.random() * 0.2) / 10) * 10 : 0; this.offerLoan(l, give); }
        if (!this.loan) break;
      }
      if (this.loan && t >= this.loan.deadline) { this.loan.lenders.forEach(l => { if (this.loan && this.loan.offers[l] === undefined) this.loan.offers[l] = 0; }); this.resolveLoan(); }
    }
    // broke people who never asked for a loan
    this.seats.forEach((p, i) => {
      if (!p || !p.broke) return;
      // a broke AI begs the table for a loan
      if (!p.human && p.loanAskAt && t >= p.loanAskAt && !this.loan) {
        p.loanAskAt = 0;
        const lenders = this.seats.filter(q => q && q.pid !== p.pid && q.stack > 0).length;
        if (lenders >= 2) { this.emit({ type: 'say', pid: p.pid, cat: 'beg', i: rndI(4) }); this.requestLoan(p.pid); }
        else { this.aiLeaves(i); this.changed(); }
        return;
      }
      if (!(this.loan && this.loan.pid === p.pid) && t - p.brokeAt > 25000) {
        p.broke = false;
        if (p.human) this.toSpectator(i, 'broke'); else this.aiLeaves(i);
        this.changed();
      }
    });
  }

  // ---------- AI ----------
  aiMove(seat) {
    const p = this.seats[seat];
    if (this.phase === 'draw') {
      const idx = Poker.chooseDiscards(p.cards, 4);
      return this.doDraw(seat, idx);
    }
    const d = this.aiDecide(seat);
    this.act(seat, d.a, d.amt);
  }

  aiDecide(seat) {
    const p = this.seats[seat];
    const opp = this.seats.filter((q, i) => i !== seat && this.inHand(q)).length;
    const toCall = this.curBet - p.bet;
    const pot = this.potTotal();
    let eq;
    if (this.s.mode === 'holdem') eq = Poker.equity('holdem', p.cards, this.board, opp, 220);
    else if (this.round === 'bet1') { const s = Poker.drawStrength(p.cards); eq = Math.pow(s, 0.6 + 0.4 * opp); }
    else eq = Poker.equity('draw', p.cards, [], Math.min(5, Math.ceil(opp * 1.4)), 220);
    const e = eq + (Math.random() - 0.5) * 0.1 + (p.a - 0.5) * 0.05;
    const R = Math.random();
    const bb = this.s.bb;
    const nice = (x) => Math.max(bb, Math.round(x / this.s.sb) * this.s.sb);
    const raiseTo = (frac) => {
      let to = this.curBet + Math.max(this.minRaise, nice(pot * frac));
      if (to >= p.bet + p.stack * 0.75) return { a: 'allin' };
      return { a: 'raise', amt: to };
    };
    if (toCall <= 0) {
      if (e > 0.62 - p.a * 0.15 && R < 0.5 + p.a * 0.4) return raiseTo(0.45 + Math.random() * 0.55);
      if (R < p.b) return raiseTo(0.5);
      return { a: 'check' };
    }
    const potOdds = toCall / (pot + toCall);
    const big = toCall > p.stack * 0.5;
    if (this.raises < 4 && e > 0.78 && R < 0.4 + p.a * 0.5) return raiseTo(0.6 + Math.random() * 0.6);
    if (e > potOdds + p.t * 0.12 + (big ? 0.12 : 0)) return { a: 'call' };
    if (this.raises < 3 && R < p.b * 0.4 && toCall < p.stack * 0.3) return raiseTo(0.7);
    // cheap to stay in?
    if (toCall <= bb && e > 0.18 && R < 0.5) return { a: 'call' };
    return { a: 'fold' };
  }

  // ---------- views ----------
  viewFor(pid) {
    const t = this.now();
    const showAll = this.result && this.result.shown;
    const me = this.findPid(pid);
    const seatView = (p, i) => {
      if (!p) return null;
      const shown = showAll && this.result.shown[i];
      return {
        pid: p.pid, name: p.name, char: p.char, human: p.human, stack: p.stack, bet: p.bet, folded: p.folded, allIn: p.allIn,
        lastAct: p.lastAct, n: p.cards.length, cards: (p.pid === pid || shown) ? p.cards.slice() : null,
        broke: p.broke, debt: (p.debts || []).reduce((a, d) => a + d.amt, 0), isHost: p.pid === this.hostPid, ready: !!p.ready,
        best: showAll && this.result.best[i] ? this.result.best[i] : null, cat: showAll && this.result.cats ? this.result.cats[i] : undefined,
        discarded: p.discarded || 0, loanUsed: p.loanUsed, troll: p.tr ? p.tr.lvl : 0
      };
    };
    const V = this.vote, L = this.loan;
    return {
      phase: this.phase, round: this.round, handNo: this.handNo, mode: this.s.mode,
      s: { sb: this.s.sb, bb: this.s.bb, timer: this.s.timer, loans: this.s.loans, antiTroll: this.s.antiTroll, rejoin: this.s.rejoin, start: this.s.start, ai: this.s.ai, dealer: this.s.dealer },
      board: this.board.slice(), pot: this.potCollected(), potTotal: this.potTotal(), curBet: this.curBet, minRaise: this.minRaise,
      toAct: this.toAct, left: Math.max(0, this.deadline - t), dealer: this.dealer, sbSeat: this.sbSeat, bbSeat: this.bbSeat,
      me: pid, hostPid: this.hostPid,
      seats: this.seats.map(seatView),
      specs: this.specs.map(p => ({ pid: p.pid, name: p.name, char: p.char, human: p.human, reason: p.reason, stack: p.stack })),
      result: this.result ? { winners: this.result.winners } : null,
      vote: V ? { target: V.target, n: V.tname, yes: V.yes.length, no: V.no.length, voters: V.voters.length, left: Math.max(0, V.deadline - t),
        canVote: V.voters.includes(pid) && !V.yes.includes(pid) && !V.no.includes(pid) } : null,
      loan: L ? { pid: L.pid, n: L.name, left: Math.max(0, L.deadline - t), canGive: L.lenders.includes(pid) && L.offers[pid] === undefined,
        max: me ? Math.floor(me.p.stack / 2) : 0 } : null,
      loanPossible: !!(me && me.where === 'seat' && me.p.broke && !this.loan && this.seats.filter(q => q && q.pid !== pid && q.stack > 0).length >= 2),
      winner: this.winner,
      autoLeft: this.autoStartAt ? Math.max(0, this.autoStartAt - t) : 0
    };
  }
}

function rndI(n) { return Math.floor(Math.random() * n); }
