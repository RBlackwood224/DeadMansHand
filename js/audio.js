// ============================================================
//  DEAD MAN'S HAND — sound effects (synthesised) + music player
// ============================================================
'use strict';

const Sound = (() => {
  let ctx = null, sfxGain = null;
  let sfxVol = 0.7, musicVol = 0.5, musicOn = true, shuffle = true;
  const TRACKS = { menu: 'music/menu.mp3', game: ['music/saloon1.mp3', 'music/saloon2.mp3', 'music/saloon3.mp3'] };
  const missing = new Set();
  const el = new Audio();
  el.preload = 'auto';
  let want = null;        // 'menu' | 'game' | null
  let gameIdx = 0;
  let failCount = 0;

  try {
    const s = JSON.parse(localStorage.getItem('dmh_audio') || '{}');
    if (typeof s.sfx === 'number') sfxVol = s.sfx;
    if (typeof s.music === 'number') musicVol = s.music;
    if (typeof s.on === 'boolean') musicOn = s.on;
    if (typeof s.shuffle === 'boolean') shuffle = s.shuffle;
  } catch (e) { }
  function save() { try { localStorage.setItem('dmh_audio', JSON.stringify({ sfx: sfxVol, music: musicVol, on: musicOn, shuffle })); } catch (e) { } }

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      sfxGain = ctx.createGain(); sfxGain.gain.value = sfxVol; sfxGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function noise(dur) {
    const b = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = b; return s;
  }
  function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  function tone(type, f, t, dur, vol, f2) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    env(g, t, 0.005, vol, dur); o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + dur + 0.05);
  }
  function burst(t, dur, vol, freq, q, type) {
    const n = noise(dur), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1;
    env(g, t, 0.002, vol, dur); n.connect(f); f.connect(g); g.connect(sfxGain); n.start(t); n.stop(t + dur + 0.02);
  }

  function play(name, opt) {
    if (!ensure() || sfxVol <= 0) return;
    const t = ctx.currentTime;
    switch (name) {
      case 'card': burst(t, 0.06, 0.5, 3000, 0.8); burst(t + 0.02, 0.04, 0.25, 6000, 1); break;
      case 'flip': burst(t, 0.05, 0.4, 2400, 0.7); tone('triangle', 900, t, 0.04, 0.05); break;
      case 'chips': for (let i = 0; i < 4; i++) { tone('sine', 2400 + Math.random() * 1600, t + i * 0.045, 0.08, 0.12); tone('square', 4200 + Math.random() * 900, t + i * 0.045, 0.03, 0.02); } break;
      case 'coins': for (let i = 0; i < 10; i++) tone('sine', 2000 + Math.random() * 2500, t + i * 0.05 + Math.random() * 0.02, 0.1, 0.1); break;
      case 'knock': burst(t, 0.07, 0.9, 180, 3, 'lowpass'); burst(t + 0.13, 0.07, 0.9, 180, 3, 'lowpass'); break;
      case 'fold': burst(t, 0.18, 0.3, 1200, 0.5); break;
      case 'turn': tone('square', 880, t, 0.08, 0.08); tone('square', 1320, t + 0.09, 0.12, 0.08); break;
      case 'tick': tone('square', 1500, t, 0.03, 0.05); break;
      case 'win': [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone('square', f, t + i * 0.09, 0.12, 0.07)); break;
      case 'lose': [392, 370, 349, 262].forEach((f, i) => tone('square', f, t + i * 0.16, 0.18, 0.06)); break;
      case 'allin': tone('sawtooth', 110, t, 0.5, 0.12, 55); burst(t, 0.3, 0.3, 300, 1); break;
      case 'bang': {
        burst(t, 0.5, 1.4, 900, 0.4, 'lowpass'); burst(t, 0.12, 1.0, 3000, 0.3);
        tone('sine', 120, t, 0.35, 0.6, 40);
        for (let i = 1; i < 4; i++) burst(t + i * 0.18, 0.3, 0.25 / i, 700, 0.4, 'lowpass');
        break;
      }
      case 'ricochet': tone('sine', 2600, t, 0.5, 0.08, 900); break;
      case 'babble': { const p = (opt && opt.pitch) || 1; const n = 4 + Math.floor(Math.random() * 5); for (let i = 0; i < n; i++) tone('square', (220 + Math.random() * 260) * p, t + i * 0.075, 0.05, 0.04); break; }
      case 'click': tone('square', 1200, t, 0.03, 0.05); break;
      case 'door': burst(t, 0.25, 0.25, 400, 2); tone('triangle', 300, t, 0.2, 0.04, 200); break;
      case 'cough': burst(t, 0.12, 0.5, 500, 1); burst(t + 0.2, 0.1, 0.4, 450, 1); break;
      case 'gulp': for (let i = 0; i < 3; i++) { tone('sine', 180 + Math.random() * 40, t + i * 0.28, 0.14, 0.25, 90); burst(t + i * 0.28, 0.08, 0.15, 400, 2, 'lowpass'); } break;
      case 'hic': tone('sine', 300, t, 0.12, 0.2, 900); tone('square', 600, t + 0.02, 0.05, 0.03); break;
      case 'glass': tone('sine', 3200, t, 0.25, 0.08); tone('sine', 4100, t + 0.01, 0.2, 0.05); break;
      case 'bark': tone('sawtooth', 500, t, 0.08, 0.1, 300); tone('sawtooth', 520, t + 0.15, 0.08, 0.1, 280); break;
    }
  }

  // ---------- music ----------
  el.addEventListener('ended', () => { if (want === 'game') nextGame(); else if (want === 'menu') { el.currentTime = 0; el.play().catch(() => { }); } });
  el.addEventListener('error', () => {
    if (el.src) missing.add(srcName(el.src));
    failCount++;
    if (want === 'game' && failCount < 4) nextGame();
  });
  function srcName(s) { const i = s.indexOf('music/'); return i >= 0 ? s.slice(i) : s; }
  function load(src) { failCount = src === el._last ? failCount : failCount; el._last = src; el.src = src; el.volume = musicVol; if (musicOn) el.play().catch(() => { }); }
  function nextGame() {
    const list = TRACKS.game;
    if (shuffle) { let n = Math.floor(Math.random() * list.length); if (n === gameIdx && list.length > 1) n = (n + 1) % list.length; gameIdx = n; }
    else gameIdx = (gameIdx + 1) % list.length;
    load(list[gameIdx]);
  }
  function music(which) {
    if (want === which && !el.paused) return;
    want = which; failCount = 0;
    if (!musicOn || !which) { el.pause(); return; }
    if (which === 'menu') load(TRACKS.menu);
    else { gameIdx = Math.floor(Math.random() * TRACKS.game.length) - 1; nextGame(); }
  }
  function preview(src) { want = null; failCount = 0; el.loop = false; load(src); }
  function stopMusic() { el.pause(); }
  function resumeWanted() { if (musicOn && want) { if (el.src && el.paused) el.play().catch(() => { }); else if (!el.src) music(want); } }

  return {
    play, ensure, music, preview, stopMusic, resumeWanted, TRACKS, missing,
    get sfxVol() { return sfxVol; }, set sfxVol(v) { sfxVol = v; if (sfxGain) sfxGain.gain.value = v; save(); },
    get musicVol() { return musicVol; }, set musicVol(v) { musicVol = v; el.volume = v; save(); },
    get musicOn() { return musicOn; }, set musicOn(v) { musicOn = v; save(); if (!v) el.pause(); else resumeWanted(); },
    get shuffle() { return shuffle; }, set shuffle(v) { shuffle = v; save(); },
    get playing() { return !el.paused; }, get current() { return el.src ? srcName(el.src) : ''; }
  };
})();
