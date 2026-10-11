// ============================================================
//  DEAD MAN'S HAND — poker core: deck, hand evaluation, equity
// ============================================================
'use strict';

const Poker = (() => {
  // A card is an int 0..51 : rank = (c >> 2) + 2  (2..14), suit = c & 3 (0 spade,1 heart,2 diamond,3 club)
  const rankOf = c => (c >> 2) + 2;
  const suitOf = c => c & 3;
  const RANK_CH = { 2:'2',3:'3',4:'4',5:'5',6:'6',7:'7',8:'8',9:'9',10:'10',11:'J',12:'Q',13:'K',14:'A' };

  function rnd(n) {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n;
    }
    return Math.floor(Math.random() * n);
  }

  function newDeck() {
    const d = [];
    for (let i = 0; i < 52; i++) d.push(i);
    for (let i = d.length - 1; i > 0; i--) { const j = rnd(i + 1); [d[i], d[j]] = [d[j], d[i]]; }
    return d;
  }

  // category: 0 high card, 1 pair, 2 two pair, 3 trips, 4 straight, 5 flush, 6 full house, 7 quads, 8 straight flush, 9 royal
  function eval5(cs) {
    const r = cs.map(rankOf).sort((a, b) => b - a);
    const flush = cs.every(c => suitOf(c) === suitOf(cs[0]));
    const cnt = {};
    r.forEach(x => cnt[x] = (cnt[x] || 0) + 1);
    const groups = Object.keys(cnt).map(Number).sort((a, b) => (cnt[b] - cnt[a]) || (b - a));
    let straightHigh = 0;
    if (groups.length === 5) {
      if (r[0] - r[4] === 4) straightHigh = r[0];
      else if (r[0] === 14 && r[1] === 5 && r[4] === 2) straightHigh = 5; // wheel
    }
    let cat, ks;
    if (straightHigh && flush) { cat = straightHigh === 14 ? 9 : 8; ks = [straightHigh]; }
    else if (cnt[groups[0]] === 4) { cat = 7; ks = groups; }
    else if (cnt[groups[0]] === 3 && cnt[groups[1]] === 2) { cat = 6; ks = groups; }
    else if (flush) { cat = 5; ks = r; }
    else if (straightHigh) { cat = 4; ks = [straightHigh]; }
    else if (cnt[groups[0]] === 3) { cat = 3; ks = groups; }
    else if (cnt[groups[0]] === 2 && cnt[groups[1]] === 2) { cat = 2; ks = groups; }
    else if (cnt[groups[0]] === 2) { cat = 1; ks = groups; }
    else { cat = 0; ks = r; }
    let score = cat;
    for (let i = 0; i < 5; i++) score = score * 15 + (ks[i] || 0);
    return { score, cat };
  }

  // best 5 out of n (5..7)
  function evalBest(cs) {
    if (cs.length <= 5) { const e = eval5(cs); e.best = cs.slice(); return e; }
    let best = null;
    const n = cs.length;
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
      const five = cs.filter((_, i) => i !== a && i !== b);
      if (n === 7) { const e = eval5(five); if (!best || e.score > best.score) { best = e; best.best = five; } }
      else { // n === 6 : drop one
        for (let k = 0; k < n; k++) {
          const f = cs.filter((_, i) => i !== k);
          const e = eval5(f); if (!best || e.score > best.score) { best = e; best.best = f; }
        }
        return best;
      }
    }
    return best;
  }

  // quick 7-card evaluator for Monte Carlo (no best-five bookkeeping)
  function score7(cs) {
    let best = -1;
    const n = cs.length;
    if (n === 5) return eval5(cs).score;
    if (n === 6) { for (let k = 0; k < 6; k++) { const s = eval5(cs.filter((_, i) => i !== k)).score; if (s > best) best = s; } return best; }
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
      const five = [];
      for (let i = 0; i < n; i++) if (i !== a && i !== b) five.push(cs[i]);
      const s = eval5(five).score; if (s > best) best = s;
    }
    return best;
  }

  // Monte Carlo equity. mode 'holdem' : hole 2 + board ; mode 'draw' : 5-card hand
  function equity(mode, hole, board, nOpp, iters) {
    nOpp = Math.max(1, Math.min(nOpp, 5));
    iters = iters || 250;
    const known = new Set(hole.concat(board));
    const rest = [];
    for (let i = 0; i < 52; i++) if (!known.has(i)) rest.push(i);
    let win = 0;
    for (let it = 0; it < iters; it++) {
      // partial shuffle
      const need = (mode === 'holdem' ? (5 - board.length) + nOpp * 2 : nOpp * 5);
      for (let i = 0; i < need; i++) {
        const j = i + Math.floor(Math.random() * (rest.length - i));
        const t = rest[i]; rest[i] = rest[j]; rest[j] = t;
      }
      let p = 0;
      if (mode === 'holdem') {
        const b = board.concat(rest.slice(0, 5 - board.length)); p = 5 - board.length;
        const me = score7(hole.concat(b));
        let bestOpp = -1, ties = 0;
        for (let o = 0; o < nOpp; o++) {
          const s = score7([rest[p], rest[p + 1]].concat(b)); p += 2;
          if (s > bestOpp) { bestOpp = s; ties = 0; } if (s === bestOpp) ties++;
        }
        if (me > bestOpp) win += 1; else if (me === bestOpp) win += 1 / (ties + 1);
      } else {
        const me = eval5(hole).score;
        let bestOpp = -1;
        for (let o = 0; o < nOpp; o++) {
          // opponents in draw poker improve: give them 7 random cards, best 5 (rough model of a draw)
          const s = eval5(rest.slice(p, p + 5)).score; p += 5;
          if (s > bestOpp) bestOpp = s;
        }
        if (me > bestOpp) win += 1; else if (me === bestOpp) win += 0.5;
      }
    }
    return win / iters;
  }

  // five-card draw: heuristic strength of the current (pre-draw) hand
  function drawStrength(hand) {
    const e = eval5(hand);
    const r = hand.map(rankOf).sort((a, b) => b - a);
    const base = [0.12, 0.38, 0.62, 0.74, 0.84, 0.88, 0.93, 0.98, 0.995, 1][e.cat];
    let s = base;
    if (e.cat === 0) s += (r[0] - 8) * 0.02;
    if (e.cat === 1) { const pr = pairRank(hand); s += (pr - 8) * 0.018; }
    const d = drawInfo(hand);
    if (e.cat === 0 && (d.flush4 || d.straight4)) s = Math.max(s, 0.34);
    return Math.max(0.02, Math.min(1, s));
  }
  function pairRank(hand) {
    const cnt = {}; hand.forEach(c => { const r = rankOf(c); cnt[r] = (cnt[r] || 0) + 1; });
    let best = 0; for (const k in cnt) if (cnt[k] >= 2 && +k > best) best = +k; return best;
  }
  function drawInfo(hand) {
    const bySuit = [[], [], [], []];
    hand.forEach((c, i) => bySuit[suitOf(c)].push(i));
    let flush4 = null;
    bySuit.forEach(a => { if (a.length === 4) flush4 = a; });
    // open-ended-ish straight: 4 distinct ranks within a span of 4 (or A-2-3-4)
    let straight4 = null;
    for (let skip = 0; skip < 5; skip++) {
      const idx = [0, 1, 2, 3, 4].filter(i => i !== skip);
      const rs = idx.map(i => rankOf(hand[i])).sort((a, b) => a - b);
      const distinct = new Set(rs).size === 4;
      if (!distinct) continue;
      if (rs[3] - rs[0] <= 4) { straight4 = idx; break; }
      if (rs[3] === 14 && rs[2] <= 5) { straight4 = idx; break; }
    }
    return { flush4, straight4 };
  }

  // AI discard choice for five-card draw. returns indices to discard
  function chooseDiscards(hand, maxDiscard) {
    const e = eval5(hand);
    const cnt = {}; hand.forEach(c => { const r = rankOf(c); cnt[r] = (cnt[r] || 0) + 1; });
    const keepIdx = new Set();
    if (e.cat >= 4 && e.cat !== 7) return [];
    if (e.cat === 7 || e.cat === 3 || e.cat === 2 || e.cat === 1) {
      hand.forEach((c, i) => { if (cnt[rankOf(c)] >= 2) keepIdx.add(i); });
      // with one pair keep an ace kicker sometimes
      if (e.cat === 1 && Math.random() < 0.3) {
        const ai = hand.findIndex(c => rankOf(c) === 14 && cnt[14] === 1); if (ai >= 0) keepIdx.add(ai);
      }
    } else {
      const d = drawInfo(hand);
      if (d.flush4) d.flush4.forEach(i => keepIdx.add(i));
      else if (d.straight4) d.straight4.forEach(i => keepIdx.add(i));
      else {
        // keep the two highest cards (or just the ace)
        const order = hand.map((c, i) => [rankOf(c), i]).sort((a, b) => b[0] - a[0]);
        if (order[0][0] === 14 && maxDiscard >= 4) keepIdx.add(order[0][1]);
        else { keepIdx.add(order[0][1]); keepIdx.add(order[1][1]); }
      }
    }
    let disc = [0, 1, 2, 3, 4].filter(i => !keepIdx.has(i));
    if (disc.length > maxDiscard) disc = disc.slice(0, maxDiscard);
    return disc;
  }

  // max discard: 3, or 4 when the remaining card is an ace
  function maxDiscardFor(hand, idx) {
    if (idx.length <= 3) return true;
    if (idx.length === 4) {
      const kept = [0, 1, 2, 3, 4].filter(i => !idx.includes(i));
      return kept.length === 1 && rankOf(hand[kept[0]]) === 14;
    }
    return false;
  }

  // Chen-ish preflop strength 0..1
  function preflopStrength(h) {
    const a = rankOf(h[0]), b = rankOf(h[1]);
    const hi = Math.max(a, b), lo = Math.min(a, b);
    const suited = suitOf(h[0]) === suitOf(h[1]);
    let s = { 14: 10, 13: 8, 12: 7, 11: 6 }[hi] || hi / 2;
    if (a === b) s = Math.max(5, s * 2);
    if (suited) s += 2;
    const gap = hi - lo - 1;
    if (a !== b) { if (gap === 1) s -= 1; else if (gap === 2) s -= 2; else if (gap === 3) s -= 4; else if (gap >= 4) s -= 5; }
    if (a !== b && gap <= 1 && hi < 12) s += 1;
    return Math.max(0, Math.min(1, (s + 1) / 21));
  }

  return { rankOf, suitOf, RANK_CH, newDeck, eval5, evalBest, equity, drawStrength, chooseDiscards, maxDiscardFor, preflopStrength, drawInfo };
})();
