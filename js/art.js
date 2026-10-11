// ============================================================
//  DEAD MAN'S HAND — pixel art (everything is drawn with code)
//  Low-res scene: 480 x 270
// ============================================================
'use strict';

const Art = (() => {
  const W = 480, H = 270;
  const TABLE = { cx: 240, cy: 222, rx: 232, ry: 88 };

  function R(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function P(c, x, y, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), 1, 1); }
  // seeded random for static decoration
  let seed = 7;
  function srnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.max(0, Math.min(255, Math.round(r * f))); g = Math.max(0, Math.min(255, Math.round(g * f))); b = Math.max(0, Math.min(255, Math.round(b * f)));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function rimY(x) {
    const d = (x - TABLE.cx) / TABLE.rx;
    if (Math.abs(d) >= 1) return TABLE.cy;
    return TABLE.cy - TABLE.ry * Math.sqrt(1 - d * d);
  }

  // ---------- tiny pixel font (3x5) for card ranks ----------
  const FONT = {
    'A': ['.X.', 'X.X', 'XXX', 'X.X', 'X.X'], '2': ['XX.', '..X', '.X.', 'X..', 'XXX'], '3': ['XX.', '..X', '.X.', '..X', 'XX.'],
    '4': ['X.X', 'X.X', 'XXX', '..X', '..X'], '5': ['XXX', 'X..', 'XX.', '..X', 'XX.'], '6': ['.XX', 'X..', 'XXX', 'X.X', 'XXX'],
    '7': ['XXX', '..X', '.X.', '.X.', '.X.'], '8': ['XXX', 'X.X', 'XXX', 'X.X', 'XXX'], '9': ['XXX', 'X.X', 'XXX', '..X', 'XX.'],
    '1': ['.X', 'XX', '.X', '.X', '.X'], '0': ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'], 'J': ['..X', '..X', '..X', 'X.X', '.X.'],
    'Q': ['XXX', 'X.X', 'X.X', 'XX.', '.XX'], 'K': ['X.X', 'X.X', 'XX.', 'X.X', 'X.X'], 'D': ['XX.', 'X.X', 'X.X', 'X.X', 'XX.'],
    'X': ['X.X', 'X.X', '.X.', 'X.X', 'X.X'], '$': ['.X.', 'XXX', 'XX.', '.XX', 'XXX']
  };
  function text(c, str, x, y, col, s) {
    s = s || 1;
    for (const ch of str) {
      const g = FONT[ch]; if (!g) { x += 2 * s; continue; }
      for (let r = 0; r < 5; r++) for (let k = 0; k < g[r].length; k++) if (g[r][k] === 'X') R(c, x + k * s, y + r * s, s, s, col);
      x += (g[0].length + 1) * s;
    }
  }
  function textW(str, s) { s = s || 1; let w = 0; for (const ch of str) { const g = FONT[ch]; w += ((g ? g[0].length : 1) + 1) * s; } return w - s; }

  const SUIT5 = [
    ['..X..', '.XXX.', 'XXXXX', '..X..', '.XXX.'], // spade
    ['.X.X.', 'XXXXX', 'XXXXX', '.XXX.', '..X..'], // heart
    ['..X..', '.XXX.', 'XXXXX', '.XXX.', '..X..'], // diamond
    ['.XXX.', '.XXX.', 'XXXXX', 'XXXXX', '..X..']  // club
  ];
  const SUIT7 = [
    ['...X...', '..XXX..', '.XXXXX.', 'XXXXXXX', 'XXXXXXX', '...X...', '..XXX..'],
    ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'],
    ['...X...', '..XXX..', '.XXXXX.', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'],
    ['..XXX..', '..XXX..', 'XX.X.XX', 'XXXXXXX', 'XX.X.XX', '...X...', '..XXX..']
  ];
  function glyph(c, g, x, y, col, s) {
    s = s || 1;
    for (let r = 0; r < g.length; r++) for (let k = 0; k < g[r].length; k++) if (g[r][k] === 'X') R(c, x + k * s, y + r * s, s, s, col);
  }

  const CARD_W = { big: 34, mid: 22, small: 14, tiny: 10 };
  const CARD_H = { big: 48, mid: 30, small: 19, tiny: 14 };
  const RED = '#c4262e', BLK = '#1d1a20', PAPER = '#f4ead2', PAPER2 = '#e3d5b4';

  function cardFrame(c, x, y, w, h, fill) {
    R(c, x + 1, y, w - 2, h, '#2a1a10');
    R(c, x, y + 1, w, h - 2, '#2a1a10');
    R(c, x + 1, y + 1, w - 2, h - 2, fill);
  }

  function drawCard(c, card, x, y, size, opts) {
    opts = opts || {};
    const w = CARD_W[size], h = CARD_H[size];
    x = Math.round(x); y = Math.round(y);
    if (card === null || card === undefined || card < 0) return drawBack(c, x, y, size);
    const r = Poker.rankOf(card), s = Poker.suitOf(card);
    const col = (s === 1 || s === 2) ? RED : BLK;
    cardFrame(c, x, y, w, h, opts.dim ? PAPER2 : PAPER);
    R(c, x + 1, y + h - 3, w - 2, 2, PAPER2);
    const rk = Poker.RANK_CH[r];
    if (size === 'big') {
      text(c, rk, x + 3, y + 3, col, 2);
      glyph(c, SUIT5[s], x + 3, y + 15, col, 1);
      if (r > 10) { // face card: big letter with little crown
        text(c, rk, x + 14, y + 18, col, 3);
        R(c, x + 14, y + 13, 9, 1, '#d8a531'); P(c, x + 14, y + 12, '#d8a531'); P(c, x + 18, y + 11, '#d8a531'); P(c, x + 22, y + 12, '#d8a531');
        glyph(c, SUIT7[s], x + 24, y + 37, col, 1);
      } else glyph(c, SUIT7[s], x + 13, y + 24, col, 2);
    } else if (size === 'mid') {
      text(c, rk, x + 2, y + 2, col, 1);
      glyph(c, SUIT5[s], x + 2, y + 9, col, 1);
      glyph(c, SUIT7[s], x + 10, y + 15, col, 1);
    } else if (size === 'small') {
      text(c, rk, x + 2, y + 2, col, 1);
      glyph(c, SUIT5[s], x + 7, y + 11, col, 1);
    } else {
      text(c, rk, x + 2, y + 2, col, 1);
      glyph(c, SUIT5[s], x + 3, y + 8, col, 1);
    }
    if (opts.glow) { c.strokeStyle = '#ffd34d'; c.lineWidth = 1; c.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1); }
    if (opts.dim) { c.fillStyle = 'rgba(30,20,10,0.35)'; c.fillRect(x, y, w, h); }
  }

  function drawBack(c, x, y, size) {
    const w = CARD_W[size], h = CARD_H[size];
    cardFrame(c, x, y, w, h, '#f0e6cc');
    R(c, x + 2, y + 2, w - 4, h - 4, '#8e1f24');
    for (let yy = 0; yy < h - 6; yy++) for (let xx = 0; xx < w - 6; xx++) if ((xx + yy) % 4 === 0 || (xx - yy + 400) % 4 === 0) P(c, x + 3 + xx, y + 3 + yy, '#b8353a');
    if (size === 'big' || size === 'mid') { const cx = x + w / 2 - 2, cy = y + h / 2 - 2; glyph(c, SUIT5[0], cx - 0, cy, '#f0e6cc', 1); }
  }

  // ---------- money ----------
  function coinStack(c, x, y, n, gold) {
    const a = gold ? '#e8b730' : '#c9ccd2', b = gold ? '#a87a12' : '#868a93', hi = gold ? '#fff0a0' : '#ffffff';
    for (let i = 0; i < n; i++) {
      const yy = y - i * 2;
      R(c, x + 1, yy, 5, 1, b); R(c, x, yy - 1, 7, 1, a); R(c, x + 1, yy - 2, 5, 1, a);
    }
    P(c, x + 2, y - n * 2, hi);
  }
  function bill(c, x, y, rot) {
    R(c, x, y, 11, 6, '#2e5e2e'); R(c, x + 1, y + 1, 9, 4, '#76a668'); R(c, x + 4, y + 2, 3, 2, '#3d6e3a');
    if (rot) R(c, x + 10, y - 1, 1, 1, '#2e5e2e');
  }
  function bundle(c, x, y, h) {
    for (let i = 0; i < h; i++) { R(c, x, y - i, 12, 6, i % 2 ? '#3a6b38' : '#2e5e2e'); }
    R(c, x + 1, y - h + 1, 10, 4, '#7fb06f'); R(c, x + 4, y - h + 1, 3, 4, '#e8dfc8'); R(c, x + 5, y - h + 2, 1, 2, '#c33');
  }
  // a pile representing an amount relative to the big blind
  function money(c, x, y, amount, bb) {
    if (!amount || amount <= 0) return;
    const units = amount / Math.max(1, bb);
    x = Math.round(x); y = Math.round(y);
    const bundles = Math.min(4, Math.floor(units / 25));
    const bills = Math.min(4, Math.floor((units % 25) / 5) + (units >= 5 ? 0 : 0));
    const coins = Math.max(1, Math.min(14, Math.ceil((units % 5) * 2) + (units < 1 ? 1 : 0)));
    let ox = 0;
    for (let i = 0; i < bundles; i++) { bundle(c, x + ox - 6, y - 2, 3 + (i % 2)); ox += 7; }
    for (let i = 0; i < bills; i++) bill(c, x - 10 + i * 3, y + 1 + (i % 2), i % 2);
    const st = Math.ceil(coins / 5);
    for (let i = 0; i < st; i++) coinStack(c, x + 6 + i * 6 + ox / 2, y + 4, Math.min(5, coins - i * 5), i % 2 === 0);
  }

  // ---------- static background ----------
  function makeBackground() {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    seed = 11;
    // wall planks
    for (let x = 0; x < W; x += 12) {
      const base = (x / 12) % 2 ? '#6b4226' : '#623c22';
      R(c, x, 0, 12, 124, base);
      R(c, x, 0, 1, 124, '#3d2414');
      for (let k = 0; k < 6; k++) { const yy = srnd() * 120; R(c, x + 2 + srnd() * 8, yy, 1, 3 + srnd() * 6, shade(base, 0.82)); }
      if (srnd() < 0.4) { const kx = x + 3 + srnd() * 6, ky = 10 + srnd() * 60; R(c, kx, ky, 3, 2, '#4a2c17'); P(c, kx + 1, ky, '#2e1a0e'); }
    }
    // wainscot
    R(c, 0, 84, W, 40, '#4c2d18');
    for (let x = 4; x < W; x += 24) { R(c, x, 90, 20, 28, '#55331c'); R(c, x, 90, 20, 1, '#3a2213'); R(c, x, 90, 1, 28, '#3a2213'); R(c, x + 19, 90, 1, 28, '#6a4226'); R(c, x, 117, 20, 1, '#6a4226'); }
    R(c, 0, 82, W, 3, '#7a4d2b'); R(c, 0, 82, W, 1, '#9a6a3c'); R(c, 0, 85, W, 1, '#2e1a0e');
    // ceiling beam
    R(c, 0, 0, W, 7, '#3b2414'); R(c, 0, 7, W, 1, '#24150b'); R(c, 0, 2, W, 1, '#4f311c');
    // floor
    for (let y = 124; y < 150; y += 4) { R(c, 0, y, W, 4, (y / 4) % 2 ? '#5b3a20' : '#53351d'); R(c, 0, y, W, 1, '#3b2414'); }
    for (let i = 0; i < 40; i++) R(c, srnd() * W, 124 + Math.floor(srnd() * 6) * 4, 1, 4, '#3b2414');

    // ---- doors (frame + outside) ----
    const dx = 166, dw = 46;
    R(c, dx - 3, 40, dw + 6, 84, '#3a2213');
    R(c, dx, 44, dw, 80, '#f0c070'); // outside sky
    for (let y = 44; y < 70; y++) R(c, dx, y, dw, 1, y < 54 ? '#f7d48a' : (y < 62 ? '#f2c070' : '#eab060'));
    R(c, dx, 70, dw, 54, '#e0a860');
    R(c, dx + 4, 64, 10, 6, '#c08050'); R(c, dx + 30, 62, 14, 8, '#b87848'); // mesas
    R(c, dx + 20, 66, 2, 6, '#5a7a3a'); R(c, dx + 18, 67, 1, 3, '#5a7a3a'); R(c, dx + 22, 68, 1, 2, '#5a7a3a'); // cactus
    R(c, dx, 108, dw, 16, '#d89a50');
    R(c, dx - 5, 38, dw + 10, 4, '#7a4d2b'); // lintel
    // sign over the door
    R(c, dx - 2, 26, dw + 4, 10, '#2e1a0e'); R(c, dx - 1, 27, dw + 2, 8, '#8a5a2e');

    // ---- bull skull (left of sign) ----
    const sx = 140, sy = 18;
    R(c, sx, sy + 2, 8, 7, '#efe6cf'); R(c, sx + 1, sy + 9, 6, 3, '#e0d6bc'); R(c, sx - 5, sy, 5, 2, '#efe6cf'); R(c, sx + 8, sy, 5, 2, '#efe6cf');
    P(c, sx - 6, sy - 1, '#efe6cf'); P(c, sx + 13, sy - 1, '#efe6cf'); R(c, sx + 1, sy + 4, 2, 2, '#2e1a0e'); R(c, sx + 5, sy + 4, 2, 2, '#2e1a0e'); P(c, sx + 3, sy + 10, '#7a6a50'); P(c, sx + 4, sy + 10, '#7a6a50');

    // ---- wanted posters ----
    poster(c, 92, 26); poster(c, 262, 24); poster(c, 290, 34);

    // ---- piano (left) ----
    const px = 6;
    R(c, px, 68, 78, 56, '#2a1a10'); R(c, px + 2, 70, 74, 20, '#3a2418'); R(c, px + 4, 72, 70, 16, '#4a2e1c');
    R(c, px + 8, 74, 26, 12, '#3a2418'); R(c, px + 40, 74, 26, 12, '#3a2418');
    R(c, px, 90, 78, 3, '#5a3a24');
    R(c, px + 3, 93, 72, 5, '#efe6cf'); for (let k = 0; k < 72; k += 3) R(c, px + 3 + k, 93, 1, 5, '#b8ad94');
    for (let k = 0; k < 72; k += 6) if ((k / 6) % 7 !== 2 && (k / 6) % 7 !== 6) R(c, px + 5 + k, 93, 2, 3, '#151010');
    R(c, px + 2, 98, 74, 26, '#3a2418'); R(c, px + 8, 102, 26, 18, '#2e1d12'); R(c, px + 44, 102, 26, 18, '#2e1d12');
    // candles on piano
    R(c, px + 10, 60, 3, 8, '#efe6cf'); R(c, px + 60, 62, 3, 6, '#efe6cf'); R(c, px + 9, 67, 5, 1, '#b08a3a'); R(c, px + 59, 67, 5, 1, '#b08a3a');
    // piano stool
    R(c, px + 28, 112, 22, 3, '#5a3a24'); R(c, px + 30, 115, 2, 9, '#3a2418'); R(c, px + 46, 115, 2, 9, '#3a2418');

    // ---- bar (right) ----
    const bx = 336;
    // mirror
    R(c, bx + 18, 14, 112, 44, '#b08a3a'); R(c, bx + 20, 16, 108, 40, '#7d8c96');
    for (let i = 0; i < 40; i++) R(c, bx + 20 + i + 10, 16 + i, 3, 1, 'rgba(255,255,255,0.18)');
    for (let i = 0; i < 30; i++) R(c, bx + 20 + i + 60, 16 + i, 2, 1, 'rgba(255,255,255,0.12)');
    // shelves with bottles
    for (const yy of [64, 78]) {
      R(c, bx + 8, yy, 136, 2, '#7a4d2b'); R(c, bx + 8, yy + 2, 136, 1, '#2e1a0e');
      for (let x = bx + 12; x < bx + 140; x += 7 + Math.floor(srnd() * 4)) {
        const col = ['#5a7a2a', '#8a3a1a', '#3a5a7a', '#b08a3a', '#6a2a4a', '#2a2a2a'][Math.floor(srnd() * 6)];
        const hgt = 7 + Math.floor(srnd() * 5);
        R(c, x, yy - hgt, 4, hgt, col); R(c, x + 1, yy - hgt - 3, 2, 3, col); P(c, x + 1, yy - hgt + 2, 'rgba(255,255,255,0.4)');
        if (srnd() < 0.5) R(c, x, yy - hgt + 3, 4, 3, '#e8dfc8');
      }
    }
    // counter
    R(c, bx, 92, W - bx, 32, '#5e361b');
    for (let x = bx + 4; x < W; x += 20) { R(c, x, 98, 16, 22, '#6e4122'); R(c, x, 98, 16, 1, '#4a2a14'); R(c, x + 15, 98, 1, 22, '#83532d'); }
    R(c, bx - 2, 88, W - bx + 2, 5, '#a46d3c'); R(c, bx - 2, 88, W - bx + 2, 1, '#c88a50'); R(c, bx - 2, 93, W - bx + 2, 1, '#3a2213');
    R(c, bx, 119, W - bx, 2, '#c9a24a'); // brass rail
    // spittoon
    R(c, bx - 14, 118, 9, 6, '#b8902e'); R(c, bx - 15, 116, 11, 2, '#d8b04a'); R(c, bx - 13, 118, 2, 4, '#e8d070');
    // glasses on counter
    for (const gx of [bx + 20, bx + 96, bx + 104]) { R(c, gx, 83, 4, 5, 'rgba(220,235,240,0.55)'); R(c, gx, 86, 4, 2, '#c08a2a'); }
    R(c, bx + 60, 78, 5, 10, '#6a3a1a'); R(c, bx + 61, 74, 3, 4, '#6a3a1a'); R(c, bx + 60, 81, 5, 3, '#e8dfc8'); // bottle on bar

    // clock between mirror and door
    R(c, 300, 60, 12, 20, '#3a2213'); R(c, 302, 62, 8, 8, '#efe6cf'); P(c, 306, 63, '#222'); P(c, 306, 64, '#222'); P(c, 307, 66, '#222'); R(c, 305, 72, 2, 6, '#b08a3a');

    // hat rack near the door
    R(c, 222, 52, 2, 72, '#3a2213'); R(c, 218, 52, 10, 2, '#3a2213');
    R(c, 214, 46, 12, 3, '#6b4a2a'); R(c, 216, 42, 8, 4, '#6b4a2a');

    drawTable(c);
    return cv;
  }

  function poster(c, x, y) {
    R(c, x, y, 22, 28, '#e8d5a3'); R(c, x, y, 22, 1, '#c8b07a'); R(c, x + 21, y, 1, 28, '#b89a64');
    R(c, x + 3, y + 3, 16, 2, '#6a2a1a'); // WANTED line
    R(c, x + 7, y + 7, 8, 9, '#b89a64'); R(c, x + 8, y + 8, 6, 6, '#d8c08a'); R(c, x + 9, y + 10, 1, 1, '#3a2213'); R(c, x + 12, y + 10, 1, 1, '#3a2213');
    R(c, x + 6, y + 6, 10, 2, '#5a3a1a'); R(c, x + 9, y + 13, 4, 1, '#5a3a1a');
    R(c, x + 4, y + 19, 14, 1, '#8a6a4a'); R(c, x + 5, y + 22, 12, 2, '#6a2a1a');
    P(c, x + 10, y + 1, '#5a5a5a');
  }

  function drawTable(c) {
    const { cx, cy, rx, ry } = TABLE;
    for (let y = Math.floor(cy - ry); y < H; y++) {
      const d = (y - cy) / ry; if (Math.abs(d) > 1) continue;
      const hw = rx * Math.sqrt(1 - d * d);
      R(c, cx - hw, y, hw * 2, 1, '#4a2a14');
    }
    // rim highlight band
    const rx2 = rx - 3, ry2 = ry - 2;
    for (let y = Math.floor(cy - ry2); y < H; y++) {
      const d = (y - cy) / ry2; if (Math.abs(d) > 1) continue;
      const hw = rx2 * Math.sqrt(1 - d * d);
      R(c, cx - hw, y, hw * 2, 1, '#7a4a24');
    }
    const rx3 = rx - 7, ry3 = ry - 6;
    for (let y = Math.floor(cy - ry3); y < H; y++) {
      const d = (y - cy) / ry3; if (Math.abs(d) > 1) continue;
      const hw = rx3 * Math.sqrt(1 - d * d);
      R(c, cx - hw, y, hw * 2, 1, '#5a3418');
    }
    // felt
    const rx4 = rx - 10, ry4 = ry - 9;
    seed = 3;
    for (let y = Math.floor(cy - ry4); y < H; y++) {
      const d = (y - cy) / ry4; if (Math.abs(d) > 1) continue;
      const hw = rx4 * Math.sqrt(1 - d * d);
      R(c, cx - hw, y, hw * 2, 1, '#2d6a3a');
      for (let x = Math.ceil(cx - hw); x < cx + hw; x++) {
        const dx = (x - cx) / rx4, dy = (y - (cy - 20)) / (ry4 * 1.1);
        const l = dx * dx + dy * dy;
        if (l < 0.25) { if ((x + y) % 2 === 0 || l < 0.12) P(c, x, y, '#357a43'); }
        else if (l > 0.75 && (x + y) % 2 === 0) P(c, x, y, '#255a31');
        if (srnd() < 0.02) P(c, x, y, '#24572f');
      }
    }
    // inner stitched line
    const rx5 = rx - 22, ry5 = ry - 18;
    for (let a = 0; a < Math.PI * 2; a += 0.012) {
      const x = cx + Math.cos(a) * rx5, y = cy + Math.sin(a) * ry5;
      if (y < H && Math.floor(a * 100) % 3 !== 0) P(c, x, y, '#3f8a4c');
    }
    // a few scratches / whiskey ring
    for (let a = 0; a < Math.PI * 2; a += 0.2) P(c, 395 + Math.cos(a) * 6, 238 + Math.sin(a) * 3, '#2a6236');
  }

  // ---------- characters ----------
  // ch: roster entry, st: state {t, blink, talk, mood, look, cards, standing, legs, pockets}
  function drawChar(c, ch, x, yb, st) {
    st = st || {};
    const t = st.t || 0;
    const build = ch.build || 'normal';
    const SW = { thin: 22, normal: 28, fat: 34, lady: 24 }[build];
    const HW = { thin: 14, normal: 16, fat: 18, lady: 14 }[build];
    const HH = 15;
    let sway = ch.extra === 'drunk' ? Math.round(Math.sin(t / 700) * 1.2) : 0;
    const breathe = Math.round((Math.sin(t / 900 + x) + 1) * 0.5);
    x = Math.round(x + sway);
    const coat = ch.coat, coatD = shade(coat, 0.72), coatL = shade(coat, 1.2);
    const skin = ch.skin, skinD = shade(skin, 0.82), skinDD = shade(skin, 0.65);

    // legs when standing / walking
    if (st.legs) {
      const step = st.walk ? Math.floor(t / 140) % 2 : 0;
      const pants = shade(coat, 0.6);
      const lh = 20;
      R(c, x - 7, yb, 6, lh - (step ? 1 : 0), pants); R(c, x + 1, yb, 6, lh - (step ? 0 : 1), pants);
      R(c, x - 8 + (step ? 1 : 0), yb + lh - 3, 8, 3, '#2a1a10'); R(c, x + 1 - (step ? 1 : 0), yb + lh - 3, 8, 3, '#2a1a10');
      if (build === 'lady') { R(c, x - 10, yb, 20, lh - 3, coat); R(c, x - 10, yb + lh - 4, 20, 1, coatD); }
    }

    const top = yb - 24 + breathe;
    // longbeard / lady hair behind shoulders
    if (ch.face === 'lady') { R(c, x - HW / 2 - 2, top - 14, 4, 18, ch.hair); R(c, x + HW / 2 - 2, top - 14, 4, 18, ch.hair); }
    // torso
    R(c, x - SW / 2 + 2, top, SW - 4, 2, coat);
    R(c, x - SW / 2, top + 2, SW, yb - top - 2, coat);
    R(c, x - SW / 2, top + 2, 1, yb - top - 2, coatD); R(c, x + SW / 2 - 1, top + 2, 1, yb - top - 2, coatD);
    R(c, x - SW / 2 + 1, top + 2, 2, 1, coatL);
    // shirt V
    for (let i = 0; i < 11; i++) { const w = Math.max(0, 7 - Math.floor(i * 0.7)); if (w > 0) R(c, x - Math.floor(w / 2), top + i, w, 1, ch.shirt); }
    if (ch.vest) { R(c, x - 7, top + 2, 4, yb - top - 4, ch.vest); R(c, x + 3, top + 2, 4, yb - top - 4, ch.vest); P(c, x - 5, top + 9, '#e8c050'); P(c, x + 5, top + 12, '#e8c050'); }
    if (build === 'fat') { R(c, x - 6, yb - 8, 12, 6, ch.vest || ch.shirt); R(c, x - 3, yb - 6, 1, 1, '#e8c050'); R(c, x - 2, yb - 5, 6, 1, '#e8c050'); }
    // lapels
    R(c, x - 5, top + 1, 1, 8, coatD); R(c, x + 4, top + 1, 1, 8, coatD);
    // neck accessories
    const ny = top - 1;
    if (ch.neck === 'bowtie') { R(c, x - 4, ny + 1, 3, 3, '#1a1a1a'); R(c, x + 1, ny + 1, 3, 3, '#1a1a1a'); R(c, x - 1, ny + 2, 2, 1, '#333'); }
    if (ch.neck === 'bandana') { R(c, x - 5, ny, 10, 2, '#b83a2e'); R(c, x - 3, ny + 2, 6, 2, '#b83a2e'); R(c, x - 1, ny + 4, 2, 2, '#b83a2e'); P(c, x - 2, ny + 1, '#f0e0d0'); P(c, x + 2, ny + 2, '#f0e0d0'); }
    if (ch.neck === 'tie') { R(c, x - 1, ny + 1, 2, 10, '#5a1a1a'); }
    if (ch.neck === 'pearls') { for (let k = -4; k <= 4; k += 2) P(c, x + k, ny + 3 + (Math.abs(k) < 3 ? 1 : 0), '#ffffff'); }
    if (ch.neck === 'shawl') { R(c, x - SW / 2, top + 1, SW, 5, '#7a6a8a'); for (let k = 0; k < SW; k += 3) P(c, x - SW / 2 + k, top + 6, '#7a6a8a'); }
    if (ch.extra === 'badge') { glyph(c, ['..X..', 'XXXXX', '.XXX.', '.X.X.'], x - 11 + (build === 'fat' ? -2 : 0), top + 6, '#e8c050', 1); }
    if (ch.extra === 'dirty') { P(c, x - 8, top + 10, coatD); P(c, x + 6, top + 14, coatD); P(c, x - 3, top + 16, coatD); }
    if (st.pockets) { R(c, x - SW / 2 + 1, yb - 4, 4, 4, '#efe6cf'); R(c, x + SW / 2 - 5, yb - 4, 4, 4, '#efe6cf'); }

    // arms
    if (st.standing || st.legs) {
      R(c, x - SW / 2 - 3, top + 3, 4, yb - top - 3, coat); R(c, x + SW / 2 - 1, top + 3, 4, yb - top - 3, coat);
      R(c, x - SW / 2 - 3, top + 3, 1, yb - top - 3, coatD); R(c, x + SW / 2 + 2, top + 3, 1, yb - top - 3, coatD);
      if (st.drink) { R(c, x + SW / 2 - 2, yb - 4, 4, 4, skin); R(c, x + SW / 2 - 2, yb - 9, 4, 5, 'rgba(220,235,240,0.7)'); R(c, x + SW / 2 - 2, yb - 7, 4, 3, '#c08a2a'); }
      else R(c, x + SW / 2 - 1, yb - 1, 4, 3, skin);
      R(c, x - SW / 2 - 3, yb - 1, 4, 3, skin);
    } else if (st.cards > 0) {
      // holding cards in front of the chest
      R(c, x - SW / 2 - 2, top + 4, 5, yb - top - 6, coat); R(c, x + SW / 2 - 3, top + 4, 5, yb - top - 6, coat);
      R(c, x - SW / 2 + 1, yb - 7, 8, 4, coat); R(c, x + SW / 2 - 9, yb - 7, 8, 4, coat);
      const n = Math.min(st.cards, 5);
      const fw = 4 + (n - 1) * 2;
      const cx0 = x - Math.floor(fw / 2);
      for (let i = 0; i < n; i++) {
        const yy = yb - 15 - (i === 0 || i === n - 1 ? 0 : 1);
        R(c, cx0 + i * 2, yy, 4, 7, '#f0e6cc'); R(c, cx0 + i * 2 + 1, yy + 1, 3, 5, '#a02828');
      }
      R(c, x - 6, yb - 9, 5, 4, skin); R(c, x + 1, yb - 9, 5, 4, skin); P(c, x - 2, yb - 10, skin); P(c, x + 1, yb - 10, skin);
      R(c, x - 6, yb - 6, 5, 1, skinD); R(c, x + 1, yb - 6, 5, 1, skinD);
    } else {
      // arms resting on the table
      R(c, x - SW / 2 - 2, top + 4, 5, yb - top - 2, coat); R(c, x + SW / 2 - 3, top + 4, 5, yb - top - 2, coat);
      R(c, x - SW / 2 - 2, yb - 3, 12, 5, coat); R(c, x + SW / 2 - 10, yb - 3, 12, 5, coat);
      R(c, x - SW / 2 + 9, yb - 2, 5, 4, skin); R(c, x + SW / 2 - 14, yb - 2, 5, 4, skin);
      R(c, x - SW / 2 - 2, yb + 1, 12, 1, coatD); R(c, x + SW / 2 - 10, yb + 1, 12, 1, coatD);
    }

    // neck + head
    const hy = top - 3 - HH;
    const hx = x - HW / 2;
    R(c, x - 3, top - 4, 6, 4, skinD);
    if (!st.noHead) drawHead(c, ch, hx, hy, HW, HH, st);
    return { hx, hy, HW, HH, mouthX: x + 3, mouthY: hy + 12 };
  }

  function drawHead(c, ch, hx, hy, HW, HH, st) {
    const t = st.t || 0;
    const skin = ch.skin, skinD = shade(skin, 0.84), skinDD = shade(skin, 0.66);
    const cx = hx + HW / 2;
    // head shape
    R(c, hx + 1, hy, HW - 2, HH, skin); R(c, hx, hy + 2, HW, HH - 5, skin);
    R(c, hx + HW - 2, hy + 2, 1, HH - 4, skinD); R(c, hx + 2, hy + HH - 1, HW - 4, 1, skinD);
    // ears
    R(c, hx - 1, hy + 6, 2, 3, skinD); R(c, hx + HW - 1, hy + 6, 2, 3, skinD);
    // hair at the sides / back
    if (ch.hat !== 'bun') { R(c, hx, hy + 1, 2, 5, ch.hair); R(c, hx + HW - 2, hy + 1, 2, 5, ch.hair); R(c, hx + 1, hy, HW - 2, 3, ch.hair); }
    else { R(c, hx, hy, HW, 4, ch.hair); R(c, hx, hy + 4, 2, 4, ch.hair); R(c, hx + HW - 2, hy + 4, 2, 4, ch.hair); R(c, cx - 4, hy - 5, 8, 6, ch.hair); R(c, cx - 3, hy - 6, 6, 1, ch.hair); P(c, cx - 2, hy - 4, shade(ch.hair, 1.15)); R(c, cx + 2, hy - 7, 1, 4, '#b08a3a'); }
    // cheeks
    if (ch.face === 'granny' || ch.face === 'lady' || ch.extra === 'drunk') { R(c, hx + 2, hy + 10, 2, 1, '#e88a7a'); R(c, hx + HW - 4, hy + 10, 2, 1, '#e88a7a'); }
    if (ch.face === 'freckles') { P(c, hx + 3, hy + 9, '#c8704a'); P(c, hx + 4, hy + 10, '#c8704a'); P(c, hx + HW - 4, hy + 9, '#c8704a'); P(c, hx + HW - 5, hy + 10, '#c8704a'); }
    if (ch.extra === 'scar') { R(c, hx + HW - 5, hy + 8, 1, 4, '#b06a5a'); }
    if (ch.extra === 'dirty') { P(c, hx + 3, hy + 11, skinDD); P(c, hx + HW - 3, hy + 4, skinDD); }
    if (ch.face === 'granny') { R(c, hx + 2, hy + 4, 3, 1, skinD); R(c, hx + HW - 5, hy + 4, 3, 1, skinD); }

    // eyes
    const look = st.look || 0;
    const ey = hy + 6;
    const lx = cx - 4, rx = cx + 2;
    const mood = st.mood || 0;
    const browC = shade(ch.hair, 0.8);
    // brows
    if (mood < 0) { P(c, lx - 1, ey - 1, browC); R(c, lx, ey - 2, 2, 1, browC); R(c, rx, ey - 2, 2, 1, browC); P(c, rx + 2, ey - 1, browC); }
    else if (mood > 0) { R(c, lx - 1, ey - 3, 3, 1, browC); R(c, rx, ey - 3, 3, 1, browC); }
    else { R(c, lx - 1, ey - 2, 3, 1, browC); R(c, rx, ey - 2, 3, 1, browC); }
    if (st.blink) { R(c, lx - 1, ey + 1, 3, 1, skinDD); R(c, rx, ey + 1, 3, 1, skinDD); }
    else {
      R(c, lx - 1, ey, 3, 2, '#f4f0e6'); R(c, rx, ey, 3, 2, '#f4f0e6');
      R(c, lx + look, ey, 1, 2, '#1a1410'); R(c, rx + 1 + look, ey, 1, 2, '#1a1410');
      if (ch.eye === 'sad') { R(c, lx - 1, ey, 3, 1, skinD); R(c, rx, ey, 3, 1, skinD); }
    }
    if (ch.face === 'lady') { P(c, lx - 2, ey - 1, '#1a1410'); P(c, rx + 3, ey - 1, '#1a1410'); P(c, hx + 3, hy + 11, '#3a2010'); }
    if (ch.eye === 'patch') { R(c, rx - 1, ey - 1, 4, 4, '#111'); R(c, hx, ey - 3, HW, 1, '#111'); }
    if (ch.eye === 'monocle') { c.strokeStyle = '#e8c050'; c.lineWidth = 1; c.strokeRect(rx - 1.5, ey - 1.5, 5, 5); R(c, rx + 3, ey + 3, 1, 6, '#e8c050'); }
    if (ch.eye === 'glasses') { c.strokeStyle = '#9a9aa0'; c.lineWidth = 1; c.strokeRect(lx - 1.5, ey - 0.5, 4, 3); c.strokeRect(rx - 0.5, ey - 0.5, 4, 3); R(c, lx + 2, ey, 1, 1, '#9a9aa0'); }

    // nose
    const nx = cx - 1, ny = hy + 8;
    if (ch.nose === 'red') { R(c, nx - 1, ny, 4, 3, '#d4503e'); P(c, nx, ny, '#f08a7a'); }
    else if (ch.nose === 'big') { R(c, nx - 1, ny, 3, 3, skinD); R(c, nx, ny + 1, 3, 2, skinDD); P(c, nx - 1, ny, shade(skin, 1.08)); }
    else if (ch.nose === 'long') { R(c, nx, ny - 1, 2, 4, skinD); P(c, nx + 1, ny + 3, skinDD); }
    else if (ch.nose === 'small') { P(c, nx + 1, ny + 1, skinDD); }
    else { R(c, nx, ny, 2, 2, skinD); P(c, nx + 1, ny + 2, skinDD); }

    // mouth
    const my = hy + 12;
    const talkOpen = st.talk && Math.floor(t / 110) % 2 === 0;
    const lip = ch.face === 'lady' ? '#c42a3a' : '#6a2a1a';
    if (talkOpen) { R(c, cx - 2, my - 1, 4, 3, '#3a1010'); R(c, cx - 1, my + 1, 2, 1, '#c85050'); }
    else if (mood > 0) { R(c, cx - 3, my, 6, 1, lip); P(c, cx - 4, my - 1, lip); P(c, cx + 3, my - 1, lip); if (ch.extra === 'goldtooth') P(c, cx, my, '#f0c040'); }
    else if (mood < 0) { R(c, cx - 2, my - 1, 4, 1, lip); P(c, cx - 3, my, lip); P(c, cx + 2, my, lip); }
    else R(c, cx - 2, my, 4, 1, lip);

    // facial hair
    const hc = ch.hair;
    if (ch.face === 'stubble') { for (let yy = my - 2; yy < hy + HH; yy++) for (let xx = hx + 2; xx < hx + HW - 2; xx++) if ((xx * 3 + yy * 5) % 4 === 0 && !(yy === my && Math.abs(xx - cx) < 3)) P(c, xx, yy, skinDD); }
    if (ch.face === 'mustache') { R(c, cx - 4, my - 2, 8, 2, hc); P(c, cx - 5, my - 1, hc); P(c, cx + 4, my - 1, hc); }
    if (ch.face === 'handlebar') { R(c, cx - 5, my - 2, 10, 2, hc); R(c, cx - 7, my - 3, 2, 2, hc); R(c, cx + 5, my - 3, 2, 2, hc); P(c, cx - 8, my - 4, hc); P(c, cx + 7, my - 4, hc); }
    if (ch.face === 'pencil') { R(c, cx - 3, my - 1, 6, 1, hc); }
    if (ch.face === 'beard' || ch.face === 'longbeard') {
      const long = ch.face === 'longbeard';
      R(c, hx, my - 3, 2, 6, hc); R(c, hx + HW - 2, my - 3, 2, 6, hc);
      R(c, hx + 1, my + 1, HW - 2, 3, hc); R(c, hx + 3, my + 4, HW - 6, 2, hc);
      R(c, cx - 4, my - 2, 8, 2, hc);
      if (long) { R(c, hx + 2, my + 4, HW - 4, 6, hc); R(c, hx + 4, my + 10, HW - 8, 4, hc); R(c, cx - 2, my + 14, 4, 2, hc); P(c, cx - 2, my + 6, shade(hc, 0.85)); P(c, cx + 2, my + 9, shade(hc, 0.85)); }
      if (talkOpen) R(c, cx - 2, my, 4, 2, '#3a1010');
    }
    if (ch.face === 'mutton') { R(c, hx, hy + 5, 3, 9, hc); R(c, hx + HW - 3, hy + 5, 3, 9, hc); R(c, hx + 2, my - 1, 3, 3, hc); R(c, hx + HW - 5, my - 1, 3, 3, hc); R(c, cx - 4, my - 2, 8, 2, hc); }

    // smoking things
    const sx = cx + 3, sy = my;
    const glow = (Math.floor(t / 300) % 3) ? '#ff8a2a' : '#ffd060';
    if (ch.smoke === 'cigar') { R(c, sx, sy, 6, 2, '#6a3a1a'); R(c, sx + 1, sy, 1, 2, '#c8a050'); P(c, sx + 6, sy, glow); P(c, sx + 6, sy + 1, '#888'); }
    if (ch.smoke === 'cig') { R(c, sx, sy, 5, 1, '#f0f0e8'); P(c, sx + 5, sy, glow); }
    if (ch.smoke === 'holder') { R(c, sx, sy, 3, 1, '#111'); P(c, sx + 3, sy - 1, '#111'); P(c, sx + 4, sy - 1, '#111'); R(c, sx + 5, sy - 2, 3, 1, '#f0f0e8'); P(c, sx + 8, sy - 2, glow); }
    if (ch.smoke === 'pipe') { R(c, sx, sy + 1, 4, 1, '#3a2010'); R(c, sx + 3, sy - 1, 3, 3, '#6a3a1a'); P(c, sx + 4, sy - 1, glow); }
    if (ch.smoke === 'toothpick') { P(c, sx, sy, '#e8d0a0'); P(c, sx + 1, sy, '#e8d0a0'); P(c, sx + 2, sy - 1, '#e8d0a0'); P(c, sx + 3, sy - 1, '#e8d0a0'); }
    if (ch.smoke === 'straw') { for (let k = 0; k < 6; k++) P(c, sx + k, sy - Math.floor(k / 2), '#e8c84a'); }
    if (ch.smoke === 'chew') { P(c, hx + HW - 3, my - 1, skinD); R(c, hx + HW - 4, my - 2, 2, 2, skin); }
    if (st.sweat) { P(c, hx + 1, hy + 3, '#bfe4ff'); P(c, hx + 1, hy + 4, '#8ac8f0'); }

    if (!st.noHat) drawHat(c, ch, hx, hy, HW, t);
  }

  function drawHat(c, ch, hx, hy, HW, t) {
    const hc = ch.hatC, hd = shade(hc, 0.7), hl = shade(hc, 1.25);
    const cx = hx + HW / 2;
    switch (ch.hat) {
      case 'cowboy': {
        R(c, hx - 5, hy + 1, HW + 10, 2, hc); P(c, hx - 6, hy, hc); P(c, hx + HW + 5, hy, hc); R(c, hx - 4, hy + 3, HW + 8, 1, hd);
        R(c, hx + 1, hy - 6, HW - 2, 7, hc); R(c, hx + 2, hy - 7, HW - 4, 1, hc); P(c, cx - 1, hy - 7, hd); P(c, cx, hy - 7, hd); R(c, cx - 1, hy - 6, 2, 2, hd);
        R(c, hx + 1, hy - 1, HW - 2, 2, hd); R(c, hx + 2, hy - 5, 1, 4, hl);
        break;
      }
      case 'bigcowboy': {
        R(c, hx - 8, hy + 2, HW + 16, 2, hc); P(c, hx - 9, hy + 1, hc); P(c, hx + HW + 8, hy + 1, hc); R(c, hx - 7, hy + 4, HW + 14, 1, hd);
        R(c, hx, hy - 8, HW, 10, hc); R(c, hx + 1, hy - 9, HW - 2, 1, hc); R(c, cx - 1, hy - 9, 2, 3, hd);
        R(c, hx, hy, HW, 2, '#7a4a24'); R(c, hx + 1, hy - 7, 1, 6, hl);
        break;
      }
      case 'tophat': {
        R(c, hx - 2, hy + 1, HW + 4, 2, hc); R(c, hx + 1, hy - 13, HW - 2, 14, hc); R(c, hx + 1, hy - 3, HW - 2, 2, '#4a4a52');
        R(c, hx + 2, hy - 12, 1, 9, hl);
        break;
      }
      case 'bowler': {
        R(c, hx - 2, hy + 1, HW + 4, 1, hc); R(c, hx, hy - 3, HW, 4, hc); R(c, hx + 2, hy - 5, HW - 4, 2, hc); R(c, hx + 4, hy - 6, HW - 8, 1, hc);
        R(c, hx, hy - 1, HW, 1, '#555'); P(c, hx + 3, hy - 4, hl);
        break;
      }
      case 'feather': {
        R(c, hx - 4, hy + 1, HW + 8, 2, hc); R(c, hx + 1, hy - 4, HW - 2, 5, hc); R(c, hx + 1, hy - 1, HW - 2, 1, '#e8c050');
        const fx = hx + HW - 2;
        for (let k = 0; k < 10; k++) { const yy = hy - 4 - k; const xx = fx + Math.round(Math.sin((k + t / 400) / 3) * 2) + (k > 6 ? k - 6 : 0); R(c, xx, yy, 3, 1, k % 2 ? '#f6e8f0' : '#e8a8c8'); }
        R(c, hx + 2, hy - 2, 3, 2, '#e8506a');
        break;
      }
      case 'floppy': {
        R(c, hx - 4, hy + 1, HW + 8, 2, hc); R(c, hx - 5, hy + 3, 2, 2, hc); R(c, hx + HW + 3, hy + 3, 2, 2, hc);
        R(c, hx, hy - 5, HW, 6, hc); R(c, hx + 2, hy - 6, HW - 4, 1, hc); R(c, hx + 3, hy - 3, 3, 3, hd); P(c, hx + 4, hy - 2, hl);
        R(c, hx + HW - 5, hy - 4, 1, 2, '#e8dfc8');
        break;
      }
      case 'flat': {
        R(c, hx - 4, hy + 1, HW + 8, 1, hc); R(c, hx - 4, hy + 2, HW + 8, 1, hd); R(c, hx + 1, hy - 4, HW - 2, 5, hc); R(c, hx + 1, hy - 1, HW - 2, 1, '#8a2a2a');
        break;
      }
      case 'furcap': {
        R(c, hx - 1, hy - 4, HW + 2, 6, hc); R(c, hx, hy - 5, HW, 1, hc);
        for (let k = 0; k < HW; k += 2) P(c, hx + k, hy - 4 + (k % 4 ? 1 : 3), hd);
        // tail
        for (let k = 0; k < 14; k++) R(c, hx + HW + 1 - Math.floor(k / 6), hy - 2 + k, 3, 1, (Math.floor(k / 2) % 2) ? '#3a2416' : '#b08860');
        break;
      }
      case 'bun': break;
    }
  }

  // bartender behind the counter
  const BARMAN = { skin: '#eab08a', hat: 'none', hair: '#222', face: 'handlebar', nose: 'big', coat: '#f2efe6', shirt: '#f2efe6', neck: 'bowtie', build: 'normal' };
  function drawBartender(c, x, t) {
    const yb = 90;
    const ch = BARMAN;
    const top = yb - 22;
    R(c, x - 14, top, 28, 22, '#efe9da'); R(c, x - 14, top, 1, 22, '#c8c2b0'); R(c, x + 13, top, 1, 22, '#c8c2b0');
    R(c, x - 7, top + 2, 14, 20, '#fbfbf6'); // apron
    R(c, x - 15, top + 6, 3, 2, '#b8302e'); R(c, x + 12, top + 6, 3, 2, '#b8302e'); // arm garters
    R(c, x - 4, top + 1, 3, 3, '#1a1a1a'); R(c, x + 1, top + 1, 3, 3, '#1a1a1a');
    // polishing a glass
    const a = t / 260;
    const gx = x + 6 + Math.round(Math.cos(a) * 2), gy = top + 10 + Math.round(Math.sin(a) * 1);
    R(c, x + 8, top + 4, 4, 10, '#efe9da');
    R(c, gx - 1, gy - 2, 6, 7, 'rgba(220,235,240,0.75)'); R(c, gx + Math.round(Math.sin(a) * 2), gy, 4, 4, '#f4f0e6'); R(c, gx, gy + 4, 4, 2, '#eab08a');
    const hx = x - 8, hy = top - 18;
    R(c, x - 3, top - 4, 6, 4, shade(ch.skin, 0.84));
    drawHead(c, ch, hx, hy, 16, 15, { t, blink: Math.floor(t / 2900) % 7 === 0 && (t % 2900) < 160, mood: 0, look: Math.round(Math.sin(t / 3000)), noHat: true });
    R(c, hx + 1, hy, 14, 2, '#222'); R(c, hx + 7, hy, 1, 2, '#e8e8e8'); // slick parting
  }

  // piano player seen from behind
  function drawPianist(c, t) {
    const x = 45, yb = 112;
    const bob = Math.floor(t / 250) % 2;
    R(c, x - 12, yb - 22 + bob, 24, 22, '#4a2e4e'); R(c, x - 12, yb - 22 + bob, 1, 22, '#3a223e');
    R(c, x - 1, yb - 22 + bob, 2, 12, '#3a223e');
    // arms reaching to the keys
    const hand = Math.floor(t / 120) % 4;
    R(c, x - 16, yb - 18 + bob, 5, 6, '#4a2e4e'); R(c, x + 11, yb - 18 + bob, 5, 6, '#4a2e4e');
    R(c, x - 18, yb - 21 - (hand === 1 ? 1 : 0), 4, 3, '#eab08a'); R(c, x + 14, yb - 21 - (hand === 3 ? 1 : 0), 4, 3, '#eab08a');
    R(c, x - 6, yb - 34 + bob, 12, 12, '#3a2416'); R(c, x - 5, yb - 35 + bob, 10, 1, '#3a2416');
    R(c, x - 6, yb - 25 + bob, 12, 3, '#eab08a');
    R(c, x - 10, yb - 36 + bob, 20, 2, '#2a2a2a'); R(c, x - 6, yb - 41 + bob, 12, 5, '#2a2a2a'); R(c, x - 6, yb - 37 + bob, 12, 1, '#8a2a2a');
    // stool
  }

  // swinging doors (dynamic)
  function drawDoors(c, swing) {
    const dx = 166, dw = 46;
    const sw = Math.max(0, Math.min(1, Math.abs(swing)));
    const pw = Math.max(3, Math.round(22 * (1 - sw * 0.75)));
    for (const side of [0, 1]) {
      const x0 = side ? dx + dw - pw : dx;
      R(c, x0, 72, pw, 36, '#8a5a2e');
      R(c, x0, 72, pw, 2, '#a8743e'); R(c, x0, 106, pw, 2, '#5e3a1c');
      for (let y = 77; y < 104; y += 4) R(c, x0 + 1, y, pw - 2, 1, '#5e3a1c');
      if (!side) R(c, x0 + pw - 1, 72, 1, 36, '#5e3a1c'); else R(c, x0, 72, 1, 36, '#5e3a1c');
      // scalloped top
      R(c, x0 + (side ? 0 : pw - 4), 70, 4, 2, '#8a5a2e');
    }
  }

  // sign text drawn in pixels: "SALOON"
  const SALOON = {
    S: ['XXX', 'X..', 'XXX', '..X', 'XXX'], A: ['XXX', 'X.X', 'XXX', 'X.X', 'X.X'], L: ['X..', 'X..', 'X..', 'X..', 'XXX'],
    O: ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'], N: ['X.X', 'XXX', 'XXX', 'X.X', 'X.X']
  };
  function drawSign(c) {
    let x = 172; const y = 29;
    for (const ch of 'SALOON') { glyph(c, SALOON[ch], x + 1, y + 1, '#2e1a0e', 1); glyph(c, SALOON[ch], x, y, '#f4d070', 1); x += 6; }
  }

  // lamps with flicker
  function drawLamps(c, t) {
    const fl = 0.85 + Math.sin(t / 90) * 0.05 + Math.sin(t / 37) * 0.04;
    // chandelier
    R(c, 239, 7, 2, 10, '#2a1a10');
    R(c, 222, 17, 36, 2, '#4a2e18'); R(c, 226, 19, 28, 1, '#2a1a10');
    for (const lx of [224, 233, 246, 255]) { R(c, lx, 13, 2, 4, '#efe6cf'); P(c, lx, 11, '#ffd060'); P(c, lx + 1, 12, '#ff9a30'); P(c, lx, 12, '#ffe8a0'); }
    // wall lamps
    for (const [lx, ly] of [[128, 50], [318, 46], [250, 64]]) { R(c, lx, ly, 4, 6, '#b08a3a'); R(c, lx - 1, ly - 6, 6, 6, 'rgba(255,220,140,0.7)'); P(c, lx + 1, ly - 3, '#fff2b0'); }
    // glow
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(240, 30, 2, 240, 30, 160);
    g.addColorStop(0, `rgba(255,190,90,${0.20 * fl})`); g.addColorStop(1, 'rgba(255,170,60,0)');
    c.fillStyle = g; c.fillRect(60, 0, 360, 200);
    const g2 = c.createRadialGradient(240, 190, 4, 240, 190, 150);
    g2.addColorStop(0, `rgba(255,220,140,${0.10 * fl})`); g2.addColorStop(1, 'rgba(255,200,120,0)');
    c.fillStyle = g2; c.fillRect(60, 100, 360, 170);
    for (const [lx, ly] of [[130, 46], [320, 42], [252, 60]]) {
      const g3 = c.createRadialGradient(lx, ly, 1, lx, ly, 34);
      g3.addColorStop(0, `rgba(255,200,110,${0.22 * fl})`); g3.addColorStop(1, 'rgba(255,180,90,0)');
      c.fillStyle = g3; c.fillRect(lx - 34, ly - 34, 68, 68);
    }
    c.restore();
  }

  function vignette(c) {
    const g = c.createRadialGradient(240, 150, 120, 240, 150, 300);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(20,8,0,0.55)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }

  // dog walking across
  function drawDog(c, x, y, t, dir) {
    const step = Math.floor(t / 120) % 2;
    c.save();
    if (dir < 0) { c.translate(Math.round(x) * 2 + 16, 0); c.scale(-1, 1); }
    const col = '#a8743e', d = '#7a4f28';
    R(c, x, y - 8, 12, 5, col); R(c, x + 10, y - 11, 6, 5, col); R(c, x + 15, y - 9, 2, 2, d); P(c, x + 13, y - 10, '#111');
    R(c, x + 10, y - 12, 2, 2, d);
    R(c, x + 1, y - 3, 2, 3 - step, d); R(c, x + 4, y - 3, 2, 3 - (1 - step), d); R(c, x + 8, y - 3, 2, 3 - step, d); R(c, x + 10, y - 3, 2, 3 - (1 - step), d);
    const wag = Math.floor(t / 90) % 2;
    R(c, x - 3, y - 10 + wag, 3, 1, col); P(c, x - 4, y - 11 + wag, col);
    P(c, x + 14, y - 6, '#e85a6a');
    c.restore();
  }

  function drawTumbleweed(c, x, y, t) {
    const a = t / 120;
    for (let k = 0; k < 14; k++) {
      const ang = a + k * 0.9, rr = 3 + (k % 3) * 1.5;
      P(c, x + Math.cos(ang) * rr, y - 5 + Math.sin(ang) * rr, k % 2 ? '#b08850' : '#8a6a3a');
    }
  }

  // dealer button
  function dealerButton(c, x, y) {
    x = Math.round(x); y = Math.round(y);
    R(c, x - 3, y - 2, 7, 5, '#f4ead2'); R(c, x - 2, y - 3, 5, 7, '#f4ead2'); R(c, x - 2, y + 3, 5, 1, '#9a8a6a');
    glyph(c, ['XX.', 'X.X', 'XX.'], x - 1, y - 1, '#2a1a10', 1);
  }

  // whiskey glass on the table (first person)
  function myGlass(c, x, y, lvl) {
    R(c, x, y, 12, 14, 'rgba(210,230,240,0.45)'); R(c, x, y + 13, 12, 2, 'rgba(230,240,250,0.8)');
    R(c, x + 1, y + 14 - lvl, 10, lvl - 1, '#c27a1e'); R(c, x + 1, y + 14 - lvl, 10, 1, '#e8a840');
    R(c, x + 1, y + 1, 1, 10, 'rgba(255,255,255,0.6)');
  }

  // first-person left hand (behind/front parts)
  // first-person left hand. x0 = left edge of first card, top = card top, w = width of the card fan
  function handBack(c, x0, top, w, sleeve, skin) {
    skin = skin || '#e8a77c';
    const sd = shade(skin, 0.8), sl = shade(skin, 1.08), slv = shade(sleeve, 0.75);
    // fingers peeking out on the right edge, behind the cards
    for (let k = 0; k < 4; k++) {
      const fy = top + 12 + k * 7;
      R(c, x0 + w - 4, fy, 8 - (k === 3 ? 2 : 0), 6, skin); R(c, x0 + w + 2 - (k === 3 ? 2 : 0), fy + 1, 1, 4, sd); R(c, x0 + w - 4, fy + 5, 7, 1, sd);
    }
    // palm under the lower-left part of the cards
    const pw = Math.min(40, Math.round(w * 0.45));
    R(c, x0 + 1, top + 36, pw, 22, skin); R(c, x0 - 1, top + 40, pw + 2, 18, skin);
    R(c, x0 + pw, top + 40, 1, 16, sd); R(c, x0 - 1, top + 57, pw + 2, 1, sd);
    // sleeve + cuff coming from the bottom-left corner
    for (let i = 0; i < 40; i++) R(c, x0 - 40 + i, top + 58 + Math.floor((40 - i) * 0.15), 26, 60, i < 2 ? slv : sleeve);
    R(c, x0 - 4, top + 55, pw + 6, 5, '#e8dfc8'); R(c, x0 - 4, top + 59, pw + 6, 1, '#b8ad94');
  }
  function handFront(c, x0, top, skin) {
    skin = skin || '#e8a77c';
    const sd = shade(skin, 0.78), sl = shade(skin, 1.12);
    // thumb pressing on the first card, coming up diagonally from the palm
    for (let k = 0; k < 6; k++) {
      const yy = top + 50 - k * 4, xx = x0 + 2 + k;
      R(c, xx, yy, 9, 5, skin); P(c, xx, yy, sd); R(c, xx, yy + 1, 1, 4, sd);
    }
    R(c, x0 + 8, top + 22, 8, 5, skin); R(c, x0 + 9, top + 21, 6, 1, skin);
    R(c, x0 + 9, top + 22, 5, 3, sl); R(c, x0 + 9, top + 25, 5, 1, sd); // nail
    R(c, x0 + 16, top + 23, 1, 10, sd);
  }

  return { W, H, TABLE, R, P, shade, rimY, text, textW, glyph, SUIT5, CARD_W, CARD_H, drawCard, drawBack, money, coinStack,
    makeBackground, drawChar, drawHead, drawHat, drawBartender, drawPianist, drawDoors, drawSign, drawLamps, vignette,
    drawDog, drawTumbleweed, dealerButton, myGlass, handBack, handFront, poster };
})();
