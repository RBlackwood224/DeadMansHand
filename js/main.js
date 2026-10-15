// ============================================================
//  DEAD MAN'S HAND — app: screens, rendering, input, sessions
// ============================================================
'use strict';

(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const frame = $('#frame');
  const scene = $('#scene'), sc = scene.getContext('2d');
  const overlay = $('#overlay'), oc = overlay.getContext('2d');
  sc.imageSmoothingEnabled = false;
  const W = 480, H = 270;

  // ---------------- settings ----------------
  let lang = 'hu';
  let myName = '';
  try {
    lang = localStorage.getItem('dmh_lang') || ((navigator.language || '').startsWith('hu') ? 'hu' : 'en');
    myName = localStorage.getItem('dmh_name') || '';
  } catch (e) { }
  if (!I18N[lang]) lang = 'en';

  function T(key, vars) {
    let s = (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }
  const money = (n) => '$' + Math.round(n || 0).toLocaleString('en-US');

  function applyI18n() {
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach(el => { el.textContent = T(el.dataset.i18n); });
    $('#rulesBody').innerHTML = T('rulesHtml');
    $$('.lang').forEach(b => b.classList.toggle('on', b.dataset.lang === lang));
    $('#setLang').value = lang; $('#pLang').value = lang;
    renderTaunt(); buildTrackList();
    const wb = document.querySelector('#btnWhisky'); if (wb) wb.title = T('whisky');
    if (S) { refreshHud(); renderLobby(); }
  }
  function setLang(l) { lang = l; try { localStorage.setItem('dmh_lang', l); } catch (e) { } applyI18n(); }

  // ---------------- layout ----------------
  let U = 2;
  function layout() {
    const vw = window.innerWidth, vh = window.innerHeight;
    let w = vw, h = vw * 9 / 16;
    if (h > vh) { h = vh; w = vh * 16 / 9; }
    frame.style.width = w + 'px'; frame.style.height = h + 'px';
    frame.style.left = ((vw - w) / 2) + 'px'; frame.style.top = ((vh - h) / 2) + 'px';
    U = w / W;
    frame.style.setProperty('--u', U + 'px');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    overlay.width = Math.round(w * dpr); overlay.height = Math.round(h * dpr);
    document.body.classList.toggle('portrait', vh > vw && Math.min(vw, vh) < 700);
  }
  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', () => setTimeout(layout, 200));
  layout();

  // ---------------- full screen (mainly for phones) ----------------
  const docEl = document.documentElement;
  const fsSupported = !!(docEl.requestFullscreen || docEl.webkitRequestFullscreen);
  if (!fsSupported) document.body.classList.add('no-fs');
  const isFs = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  function toggleFullscreen() {
    Sound.play('click');
    if (isFs()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    const p = (docEl.requestFullscreen || docEl.webkitRequestFullscreen).call(docEl);
    // on phones also try to lock landscape (not supported everywhere, that's fine)
    if (p && p.then) p.then(() => { try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => { }); } catch (e) { } }).catch(() => { });
  }
  document.addEventListener('fullscreenchange', () => setTimeout(layout, 100));
  document.addEventListener('webkitfullscreenchange', () => setTimeout(layout, 100));
  $$('[data-fs]').forEach(b => b.addEventListener('click', toggleFullscreen));
  $('#btnFs').addEventListener('click', toggleFullscreen);
  $('#btnWhisky').addEventListener('click', () => {
    if (!S || !S.view) return;
    const b = $('#btnWhisky');
    if (b.classList.contains('cool')) return;
    const mine = me() || meSpec();
    if (!mine || (mine.stack || 0) < 5) { toast(T('noWhiskyMoney')); Sound.play('click'); return; }
    Sound.play('click');
    sendIntent({ t: 'whisky' });
    b.classList.add('cool'); setTimeout(() => b.classList.remove('cool'), 20000);
  });

  // ---------------- screens ----------------
  function show(id) {
    $$('.screen').forEach(s => s.classList.toggle('hidden', s.id !== id));
    if (id && id !== 'scr-pause' && id !== 'scr-end') document.body.classList.remove('ingame');
  }
  function hideScreens() { $$('.screen').forEach(s => s.classList.add('hidden')); }

  $$('[data-go]').forEach(b => b.addEventListener('click', () => {
    Sound.play('click');
    const g = b.dataset.go;
    if (g === 'main') { show('scr-main'); if (rulesFromPause) { rulesFromPause = false; show('scr-pause'); } }
    else if (g === 'rules') show('scr-rules');
    else if (g === 'settings') { syncAudioUI(); show('scr-settings'); }
    else if (g === 'music') { syncAudioUI(); buildTrackList(); show('scr-music'); }
    else if (g === 'join') { show('scr-join'); $('#joinMsg').textContent = ''; $('#joinName').value = nameInput.value; }
    else if (g === 'solo') startSession('solo');
    else if (g === 'host') startSession('host');
  }));
  $$('.lang').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
  $('#setLang').addEventListener('change', e => setLang(e.target.value));
  $('#pLang').addEventListener('change', e => setLang(e.target.value));
  const nameInput = $('#nameInput');
  nameInput.value = myName;
  nameInput.addEventListener('input', () => {
    nameInput.style.color = NameFilter.isBad(nameInput.value) ? '#b01818' : ''; myName = nameInput.value.trim(); try { localStorage.setItem('dmh_name', myName); } catch (e) { } });
  function setMyName(n) {
    myName = n; try { localStorage.setItem('dmh_name', n); } catch (e) { }
    for (const id of ['#nameInput', '#joinName', '#lobbyName']) { const el = $(id); if (el && el !== document.activeElement) el.value = n; }
  }
  $('#joinName').value = myName;
  $('#joinName').addEventListener('input', e => { e.target.style.color = NameFilter.isBad(e.target.value) ? '#b01818' : ''; nameInput.value = e.target.value; setMyName(e.target.value.trim()); });
  let renameT = null;
  function nameOk(n, warnEl) {
    const bad = NameFilter.isBad(n);
    if (warnEl) { warnEl.textContent = bad ? T('badName') : ''; warnEl.classList.toggle('hidden', !bad); }
    return !bad;
  }
  $('#lobbyName').addEventListener('input', e => {
    const n = e.target.value.trim(); if (!n) return;
    if (!nameOk(n, $('#nameWarn'))) return;
    setMyName(n);
    clearTimeout(renameT); renameT = setTimeout(() => sendIntent({ t: 'rename', name: n }), 400);
  });
  $('#lobbyName').addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });
  function getName() {
    let n = (nameInput.value || '').trim();
    if (n && NameFilter.isBad(n)) { n = ''; nameInput.value = ''; }
    if (!n) { n = 'Cowboy ' + (10 + Math.floor(Math.random() * 89)); nameInput.value = n; myName = n; try { localStorage.setItem('dmh_name', n); } catch (e) { } }
    return n.slice(0, 14);
  }

  // ---------------- audio UI ----------------
  function syncAudioUI() {
    for (const id of ['#setMusic', '#pMusic', '#musVol']) $(id).value = Math.round(Sound.musicVol * 100);
    for (const id of ['#setSfx', '#pSfx']) $(id).value = Math.round(Sound.sfxVol * 100);
    for (const id of ['#setMusicOn', '#pMusicOn', '#musMusicOn']) $(id).checked = Sound.musicOn;
    $('#musShuffle').checked = Sound.shuffle;
  }
  for (const id of ['#setMusic', '#pMusic', '#musVol']) $(id).addEventListener('input', e => { Sound.musicVol = e.target.value / 100; syncAudioUI(); });
  for (const id of ['#setSfx', '#pSfx']) $(id).addEventListener('input', e => { Sound.sfxVol = e.target.value / 100; syncAudioUI(); });
  for (const id of ['#setSfx', '#pSfx']) $(id).addEventListener('change', () => Sound.play('chips'));
  for (const id of ['#setMusicOn', '#pMusicOn', '#musMusicOn']) $(id).addEventListener('change', e => { Sound.musicOn = e.target.checked; syncAudioUI(); });
  $('#musShuffle').addEventListener('change', e => { Sound.shuffle = e.target.checked; });

  function buildTrackList() {
    const box = $('#trackList'); if (!box) return;
    box.innerHTML = '';
    const list = [[T('trackMenu'), Sound.TRACKS.menu]].concat(Sound.TRACKS.game.map((s, i) => [T('trackGame') + ' ' + (i + 1), s]));
    list.forEach(([label, src]) => {
      const row = document.createElement('div'); row.className = 'field';
      const miss = Sound.missing.has(src);
      row.innerHTML = `<span>${label} <small style="opacity:.7">— ${src}</small> ${miss ? '<small style="color:#a02020">' + T('missing') + '</small>' : ''}</span>`;
      const b = document.createElement('button'); b.className = 'wood small'; b.textContent = T('play');
      b.addEventListener('click', () => { Sound.ensure(); Sound.preview(src); setTimeout(buildTrackList, 900); });
      row.appendChild(b); box.appendChild(row);
    });
    const stop = document.createElement('button'); stop.className = 'wood small'; stop.textContent = T('stop');
    stop.addEventListener('click', () => { Sound.stopMusic(); });
    box.appendChild(stop);
  }

  // first click unlocks audio
  let audioUnlocked = false;
  function unlock() {
    if (audioUnlocked) return; audioUnlocked = true;
    Sound.ensure();
    if (!S || !S.view || S.view.phase === 'lobby') Sound.music('menu'); else Sound.music('game');
  }
  window.addEventListener('pointerdown', unlock, { once: false });
  window.addEventListener('keydown', unlock);

  // ============================================================
  //  SESSION
  // ============================================================
  let S = null;       // { role, eng, net, me, view }
  let hostTimer = null, dirty = false, lastFlush = 0;

  function startSession(role) {
    endSession(true);
    const name = getName();
    Sound.ensure();
    if (role === 'host' && !Net.available()) { alert('PeerJS could not load (no internet?).'); return; }
    S = { role, me: role === 'client' ? null : 'host', view: null };
    if (role === 'solo' || role === 'host') {
      const eng = new Engine({ ai: role === 'solo' ? 4 : 0, timer: 15, start: 1000, bb: 20, sb: 10 }, {
        emit: (e) => hostEmit(e), changed: () => { dirty = true; }, kick: (pid) => { if (S.net) S.net.kick(pid); }
      });
      S.eng = eng;
      eng.addHuman('host', name, true);
      if (role === 'host') {
        S.net = Net.host({
          onReady: (code) => { S.code = code; renderLobby(); },
          onError: (e) => { $('#lobbyMsg').textContent = 'Online error: ' + (e.type || e); },
          onHello: (pid, nm) => eng.addHuman(pid, nm, false),
          onJoined: () => { dirty = true; },
          onMsg: (pid, m) => eng.handle(pid, m),
          onLeave: (pid) => eng.removeHuman(pid)
        });
      }
      hostTimer = setInterval(hostLoop, 80);
      dirty = true; hostLoop();
    }
    show('scr-lobby');
    renderLobby();
  }

  function hostLoop() {
    if (!S || !S.eng) return;
    S.eng.tick();
    const t = Date.now();
    if (dirty || t - lastFlush > 1000) {
      dirty = false; lastFlush = t;
      if (S.net) for (const pid of S.net.pids()) S.net.send(pid, { t: 'state', s: S.eng.viewFor(pid) });
      onState(S.eng.viewFor(S.me));
    }
  }
  function hostEmit(e) {
    if (S && S.net) S.net.broadcast({ t: 'ev', e });
    const ev = e;
    if (ev.delay) setTimeout(() => onEvent(ev), ev.delay); else onEvent(ev);
  }

  function joinSession(code) {
    endSession(true);
    const name = getName();
    if (!Net.available()) { $('#joinMsg').textContent = 'PeerJS could not load (no internet?).'; return; }
    $('#joinMsg').textContent = T('connecting');
    S = { role: 'client', me: null, view: null };
    S.net = Net.join(code, name, {
      onMsg: (m) => {
        if (!m) return;
        if (m.t === 'welcome') { S.me = m.pid; S.code = code.toUpperCase(); show('scr-lobby'); }
        else if (m.t === 'state') onState(m.s);
        else if (m.t === 'ev') { const e = m.e; if (e.delay) setTimeout(() => onEvent(e), e.delay); else onEvent(e); }
        else if (m.t === 'reject') { $('#joinMsg').textContent = T(m.reason); const n = S.net; S = null; n.close(); show('scr-join'); }
        else if (m.t === 'kicked') { S.kicked = true; setTimeout(showKicked, 1700); }
      },
      onClose: () => { if (S && S.kicked) return; endSession(true); show('scr-main'); toastMenu(T('hostLeft')); },
      onError: () => { $('#joinMsg').textContent = T('connFail'); S = null; }
    });
  }
  $('#btnConnect').addEventListener('click', () => { const c = $('#joinCode').value.trim(); if (c.length >= 4) joinSession(c); });

  function endSession(silent) {
    if (hostTimer) { clearInterval(hostTimer); hostTimer = null; }
    if (S && S.net) { try { S.net.close(); } catch (e) { } }
    S = null;
    resetVisuals();
    $('#hud').classList.add('hidden');
    document.body.classList.remove('ingame');
    if (audioUnlocked) Sound.music('menu');
  }
  function toastMenu(msg) { $('#joinMsg').textContent = msg; alert(msg); }

  function sendIntent(m) {
    if (!S) return;
    if (S.role === 'client') S.net.send(m); else { S.eng.handle(S.me, m); dirty = true; }
  }

  // ============================================================
  //  STATE + EVENTS
  // ============================================================
  let prevPhase = null;
  function onState(v) {
    if (!S) return;
    const old = S.view;
    S.view = v;
    if (v.phase === 'lobby') {
      if (prevPhase && prevPhase !== 'lobby') { show('scr-lobby'); $('#hud').classList.add('hidden'); Sound.music('menu'); }
      renderLobby();
    } else {
      if (prevPhase === 'lobby' || prevPhase === null) {
        hideScreens(); $('#hud').classList.remove('hidden'); document.body.classList.add('ingame');
        if (audioUnlocked) Sound.music('game');
        resetVisuals();
      }
      if (old && old.handNo !== v.handNo) { boardTimes = []; selected.clear(); }
      if (v.phase === 'gameover' && prevPhase !== 'gameover') showGameOver(v);
    }
    prevPhase = v.phase;
    if (v.phase !== 'lobby') updatePosters(v); else posters = [];
    refreshHud();
  }

  // visual state
  let bubbles = {}, tags = {}, cstate = {}, fx = [], smoke = [], walkers = [], notes = [];
  let boardTimes = [], dealInfo = null, flashUntil = 0, shakeUntil = 0, bang = null, bartenderGun = 0, doorSwing = 0;
  let banner = null;
  // WANTED posters on the wall: our own characters (name -> {char, captured})
  let posters = [];
  const POSTER_SLOTS = [[12, 30], [38, 31], [64, 30], [90, 31], [234, 31], [258, 30]];
  function updatePosters(v) {
    if (!v) return;
    const people = v.seats.filter(Boolean).concat(v.specs);
    const ordered = people.filter(p => p.human).concat(people.filter(p => !p.human)); // humans first
    ordered.forEach(p => {
      let ps = posters.find(q => q.name === p.name && !q.vacant);
      if (!ps) {
        ps = { name: p.name, char: p.char, human: p.human, captured: false };
        // a new face takes the place of a bot that gave up its chair, then an empty spot,
        // and when the wall is full it goes over an old crossed-out poster
        let idx = posters.findIndex(q => q.vacant);
        if (idx < 0 && posters.length < POSTER_SLOTS.length) idx = posters.length;
        if (idx < 0) idx = posters.findIndex(q => q.captured && !(barman && barman.name === q.name) && (!q.paintT0 || performance.now() - q.paintT0 > 1500));
        if (idx < 0) return; // the wall is full
        posters[idx] = ps;
      }
      ps.char = p.char; ps.stack = p.stack;
      const seated = v.seats.some(q => q && q.name === p.name);
      if (p.reason === 'broke') capturePoster(p.name);
      else if (seated && p.stack > 0 && (ps.captured || ps.queued)) { ps.captured = false; ps.queued = false; ps.paintT0 = 0; } // back in the game
    });
    // anybody who is gone from the saloon gets a red X (a bot that just gave its seat to a player does not)
    posters.forEach(ps => { if (!ps.vacant && !people.some(p => p.name === ps.name)) capturePoster(ps.name); });
  }
  function capturePoster(name) {
    const ps = posters.find(q => q.name === name);
    if (!ps || ps.captured || ps.queued) return;
    ps.queued = true;
    barQueue.push({ type: 'paint', name });
  }
  function jobTarget(job) {
    if (job.type === 'paint') {
      const i = posters.findIndex(q => q.name === job.name);
      return i >= 0 && POSTER_SLOTS[i] ? POSTER_SLOTS[i][0] + 10 : null;
    }
    let tx = 452;
    const s = seatOf(job.pid);
    if (s >= 0) { const vp = vpOf(s); if (vp !== 0) tx = VP[vp].x + (VP[vp].x < 240 ? 30 : -30); }
    else { const sp = specSpot(job.pid); if (sp) tx = sp.x + 14; }
    return tx;
  }
  let barkeepAim = 0;
  // the barkeep does one job at a time (bring a whiskey, paint an X on a poster...) – the rest waits in line
  let barQueue = [], barkeepDraw = null, barmanX = 410;
  let barman = null, myDrink = null, wobbleT0 = 0, wobbleUntil = 0, myGlassLvl = 8, drinkers = {};
  function resetVisuals() { bubbles = {}; tags = {}; fx = []; boardTimes = []; dealInfo = null; selected.clear(); bang = null; }

  function seatOf(pid) { const v = S && S.view; if (!v) return -1; return v.seats.findIndex(p => p && p.pid === pid); }
  function mySeat() { return seatOf(S && S.me); }
  function baseSeat() { const m = mySeat(); return m >= 0 ? m : 0; }
  function vpOf(seat) { return (seat - baseSeat() + 6) % 6; }
  function personByPid(pid) {
    const v = S && S.view; if (!v) return null;
    return v.seats.find(p => p && p.pid === pid) || v.specs.find(p => p.pid === pid) || null;
  }

  function onEvent(e) {
    if (!S) return;
    const now = performance.now();
    switch (e.type) {
      case 'deal': {
        dealInfo = { t0: now, order: e.order, n: e.n };
        boardTimes = []; selected.clear();
        const v = S.view;
        e.order.forEach((pid, pos) => {
          for (let r = 0; r < e.n; r++) {
            const delay = (r * e.order.length + pos) * 110;
            fx.push({ type: 'fly', t0: now + delay, dur: 260, pid, from: dealerPos(), sfx: true });
          }
        });
        break;
      }
      case 'act': {
        const s = seatOf(e.pid);
        const lab = (I18N[lang].actions[e.a] || e.a.toUpperCase()) + ((e.a === 'call' || e.a === 'raise' || e.a === 'bet' || e.a === 'allin') ? ' ' + money(e.amt) : '');
        tags[e.pid] = { text: lab, until: now + 2600, a: e.a };
        actBubble(e.pid, T('say_' + e.a, { a: money(e.amt) }), e.a);
        if (e.a === 'fold') Sound.play('fold');
        else if (e.a === 'check') Sound.play('knock');
        else if (e.a === 'allin') { Sound.play('allin'); Sound.play('chips'); }
        else Sound.play('chips');
        if (s >= 0 && e.a !== 'fold' && e.a !== 'check') fx.push({ type: 'money', t0: now, dur: 350, from: stackPos(vpOf(s)), to: betPos(vpOf(s)), amt: 3 });
        moodFor(e.pid, e.a === 'fold' ? -1 : 0, 2000);
        break;
      }
      case 'draw': {
        tags[e.pid] = { text: e.n ? I18N[lang].actions.draw + ' ' + e.n : I18N[lang].actions.pat, until: now + 2600 };
        actBubble(e.pid, e.n ? T('say_draw', { n: e.n }) : T('say_pat'), e.n ? 'draw' : 'check');
        for (let i = 0; i < e.n; i++) setTimeout(() => Sound.play('card'), i * 120);
        if (e.pid === S.me) selected.clear();
        break;
      }
      case 'board': {
        const cur = S.view ? S.view.board.length : 0;
        for (let i = 0; i < e.n; i++) { boardTimes[cur + i] = now + 150 + i * 170; setTimeout(() => Sound.play('flip'), 150 + i * 170); }
        break;
      }
      case 'collect': {
        const v = S.view; if (!v) break;
        v.seats.forEach((p, i) => { if (p && p.bet > 0) fx.push({ type: 'money', t0: now, dur: 380, from: betPos(vpOf(i)), to: [240, 206], amt: 3 }); });
        if (v.seats.some(p => p && p.bet > 0)) Sound.play('chips');
        break;
      }
      case 'win': {
        const parts = e.winners.map(w => {
          const cat = (w.cat >= 0 && e.showdown) ? ' ' + T('with') + ' ' + I18N[lang].cats[w.cat] : '';
          return T('wins', { n: w.name, a: Math.round(w.amt).toLocaleString('en-US') }) + cat;
        });
        showBanner(parts[0], parts.slice(1).join(' · '));
        setTimeout(() => Sound.play('coins'), 300);
        e.winners.forEach(w => {
          const s = seatOf(w.pid);
          if (s >= 0) fx.push({ type: 'money', t0: now + 300, dur: 600, from: [240, 206], to: stackPos(vpOf(s)), amt: 6 });
          moodFor(w.pid, 1, 5000);
        });
        const iWon = e.winners.some(w => w.pid === S.me);
        const v = S.view;
        if (iWon) Sound.play('win');
        else if (v) {
          const me = v.seats[mySeat()];
          if (me && v.seats.some(p => p && p.pid === S.me) && me.n > 0) { Sound.play('lose'); glowTaunt(); }
        }
        if (v) v.seats.forEach(p => { if (p && !e.winners.some(w => w.pid === p.pid) && !p.folded) moodFor(p.pid, -1, 5000); });
        break;
      }
      case 'taunt': {
        const tx = TAUNTS[lang][e.i] || '';
        say(e.pid, tx, 4200);
        break;
      }
      case 'say': {
        const arr = REACT[lang][e.cat]; if (!arr) break;
        say(e.pid, arr[e.i % arr.length], 3200);
        break;
      }
      case 'turn': if (e.pid === S.me) Sound.play('turn'); break;
      case 'shoot': {
        const s = seatOf(e.pid);
        let from = [240, 120];
        if (s >= 0) { const vp = vpOf(s); from = vp === 0 ? [240, 230] : [VP[vp].x, VP[vp].yb - 20]; }
        else { const sp = specSpot(e.pid); if (sp) from = [sp.x, sp.yb - 20]; }
        // at the bar he grabs the shotgun – out on the floor he pulls his revolver
        if (barman) barkeepDraw = { until: now + 1700, fireAt: now + 450, tx: from[0] };
        else bartenderGun = now + 1600;
        setTimeout(() => {
          Sound.play('bang'); flashUntil = performance.now() + 160; shakeUntil = performance.now() + 380;
          bang = { t0: performance.now() };
          if (e.pid !== S.me) fx.push({ type: 'flyer', t0: performance.now(), dur: 1500, from, char: e.char });
          setTimeout(() => Sound.play('ricochet'), 300);
        }, 450);
        setTimeout(() => capturePoster(e.n), 1800);
        setTimeout(() => walkers.push(makeWalker('undertaker')), 3500);
        const v = S.view;
        if (v) { const ai = v.seats.find(p => p && !p.human && p.pid !== e.pid); if (ai) setTimeout(() => say(ai.pid, REACT[lang].gun[Math.floor(Math.random() * 3)], 2500), 1400); }
        break;
      }
      case 'walkout': {
        walkers.push(makeWalker('leaver', e.char));
        if (e.replaced) { const ps = posters.find(q => q.name === e.n); if (ps) ps.vacant = true; } // a player takes over this bot's poster
        break;
      }
      case 'noMoney': if (e.pid === S.me) { toast(T('noWhiskyMoney')); $('#btnWhisky').classList.remove('cool'); } break;
      case 'troll': {
        if (e.lvl === 1) {
          barkeepAim = now + 3500;
          say('barkeep', T('trollFine'), 5000);
          toast(T('trollFineNote', { n: e.n, a: e.a.toLocaleString('en-US') })); Sound.play('coins');
          if (e.pid === S.me) showBanner(T('trollYou1'), T('trollYou1b'));
        } else if (e.lvl === 2) {
          if (barman) { const s2 = seatOf(e.pid); barkeepDraw = { until: now + 3200, fireAt: 0, tx: s2 >= 0 && vpOf(s2) !== 0 ? VP[vpOf(s2)].x : 240 }; }
          else barkeepAim = now + 6000;
          say('barkeep', T('trollWarn'), 5500);
          toast(T('trollWarnNote', { n: e.n })); Sound.play('allin');
          if (e.pid === S.me) showBanner(T('trollYou2'), T('trollYou2b'));
        } else {
          say('barkeep', T('trollBang'), 3000);
          toast(T('trollBangNote', { n: e.n, a: e.a.toLocaleString('en-US') }));
          if (e.host) { // the host can't be shot – he only loses everything
            setTimeout(() => { Sound.play('bang'); flashUntil = performance.now() + 160; shakeUntil = performance.now() + 380; bang = { t0: performance.now() }; }, 450);
            if (barman) barkeepDraw = { until: now + 1700, fireAt: now + 450, tx: 240 };
            else bartenderGun = now + 1600;
          }
        }
        break;
      }
      case 'whisky': {
        barQueue.push({ type: 'whisky', pid: e.pid });
        const lines = REACT[lang].order; if (lines) say(e.pid, lines[(e.i || 0) % lines.length], 2600);
        if (e.pid !== S.me) toast(T('whiskyNote', { n: e.n }));
        Sound.play('glass');
        break;
      }
      case 'note': toast(T(e.key, { n: e.n })); break;
      case 'vote': toast(T('kickVote', { n: e.n })); Sound.play('turn'); break;
      case 'loanReq': toast(T('loanAsk', { n: e.n })); Sound.play('turn'); break;
      case 'loanDone': toast(T('loanGot', { n: e.n, a: e.a.toLocaleString('en-US') })); Sound.play('coins'); break;
      case 'loanFail': toast(T('loanNone', { n: e.n })); break;
      case 'repay': toast(T('repaid', { n: e.n, a: e.a.toLocaleString('en-US') })); break;
      case 'gameover': break;
    }
  }

  function say(pid, text, ms) {
    const now = performance.now();
    bubbles[pid] = { text, until: now + ms, t0: now };
    const p = personByPid(pid);
    const ch = p ? ROSTER[p.char] : null;
    const pitch = ch && (ch.build === 'lady') ? 1.5 : (ch && ch.build === 'fat' ? 0.7 : 1);
    Sound.play('babble', { pitch });
  }
  // big, coloured speech bubble for actions (fold, check, raise...) so nobody misses them
  const ACT_COL = { fold: '#8a2a1a', check: '#2a4a8a', call: '#2a6a2a', bet: '#a8640a', raise: '#a8640a', allin: '#b01818', draw: '#5a3a8a' };
  function actBubble(pid, text, a) {
    const now = performance.now();
    const cur = bubbles[pid];
    if (cur && !cur.act && cur.until > now + 400) return; // don't hide a taunt
    bubbles[pid] = { text, until: now + 2400, t0: now, act: true, col: ACT_COL[a] || '#2a160a', big: a === 'allin' };
  }
  function moodFor(pid, m, ms) { const c = getCS(pid); c.mood = m; c.moodUntil = performance.now() + ms; }

  function showBanner(main, sub) {
    const b = $('#banner');
    b.innerHTML = '';
    b.appendChild(document.createTextNode(main));
    if (sub) { const s = document.createElement('small'); s.textContent = sub; b.appendChild(s); }
    b.classList.add('show');
    clearTimeout(showBanner.t); showBanner.t = setTimeout(() => b.classList.remove('show'), 4200);
  }
  function toast(msg) {
    const box = $('#toasts');
    const d = document.createElement('div'); d.className = 'toast'; d.textContent = msg;
    box.appendChild(d); setTimeout(() => d.remove(), 5000);
    while (box.children.length > 5) box.firstChild.remove();
  }

  // ============================================================
  //  TAUNTS
  // ============================================================
  let tauntIdx = 0;
  function renderTaunt() { const el = $('#tText'); if (el) el.textContent = '"' + TAUNTS[lang][tauntIdx] + '"'; }
  function cycleTaunt(d) { tauntIdx = (tauntIdx + d + TAUNTS[lang].length) % TAUNTS[lang].length; renderTaunt(); Sound.play('click'); }
  function sayTaunt() {
    sendIntent({ t: 'taunt', i: tauntIdx });
    $('#taunt').classList.remove('glow');
  }
  function glowTaunt() { $('#taunt').classList.add('glow'); clearTimeout(glowTaunt.t); glowTaunt.t = setTimeout(() => $('#taunt').classList.remove('glow'), 6000); }
  $('#tPrev').addEventListener('click', () => cycleTaunt(-1));
  $('#tNext').addEventListener('click', () => cycleTaunt(1));
  $('#tSay').addEventListener('click', sayTaunt);
  tauntIdx = Math.floor(Math.random() * 20);

  // ============================================================
  //  HUD
  // ============================================================
  const selected = new Set();
  let handPinned = false;

  function me() { const v = S && S.view; if (!v) return null; return v.seats.find(p => p && p.pid === S.me) || null; }
  function meSpec() { const v = S && S.view; if (!v) return null; return v.specs.find(p => p.pid === S.me) || null; }

  function refreshHud() {
    const v = S && S.view;
    if (!v || v.phase === 'lobby') return;
    // info
    const modeName = v.mode === 'holdem' ? T('holdem') : T('draw');
    $('#info').innerHTML = `${modeName}<br>${T('blinds')}: ${money(v.s.sb)}/${money(v.s.bb)} · ${T('hand')} #${v.handNo}` + (S.code ? `<br>${T('roomCode')}: ${S.code}` : '');
    const m = me(), seat = mySeat();
    const myTurn = m && v.toAct === seat;
    // whiskey button greyed out without money
    { const mine = me() || meSpec(); $('#btnWhisky').classList.toggle('broke', !mine || (mine.stack || 0) < 5); }
    // betting
    const showAct = myTurn && v.phase === 'bet';
    $('#actions').classList.toggle('hidden', !showAct);
    if (showAct) updateActions(v, m);
    const showDraw = myTurn && v.phase === 'draw';
    $('#drawbar').classList.toggle('hidden', !showDraw);
    if (showDraw) updateDrawBtn();
    // status
    const st = $('#status');
    let html = '';
    const sp = meSpec();
    if (sp) {
      html = `<div class="msg">${sp.reason === 'waiting' ? T('waitingSeat') : sp.reason === 'idle' ? T('idleMsg') : (sp.reason === 'broke' ? T('broke') + ' ' + T('spectating') : T('spectating'))}</div>`;
      if (sp.reason === 'idle') html += `<button class="wood gold" id="stSitIn">${T('sitIn')}</button>`;
      if (S.role !== 'client' && sp.reason === 'broke') html += `<button class="wood small" id="stNew">${T('newGame')}</button>`;
    } else if (m && m.broke) {
      html = `<div class="msg">${T('broke')}</div>`;
      if (v.loanPossible) html += `<button class="wood gold" id="stLoan">${T('loanBtn')}</button>`;
    }
    if (st.dataset.h !== html) {
      st.dataset.h = html; st.innerHTML = html;
      const lb = $('#stLoan'); if (lb) lb.addEventListener('click', () => { sendIntent({ t: 'loanReq' }); Sound.play('babble'); });
      const si = $('#stSitIn'); if (si) si.addEventListener('click', () => { sendIntent({ t: 'sitin' }); Sound.play('click'); });
      const nb = $('#stNew'); if (nb) nb.addEventListener('click', () => { S.eng.backToLobby(); dirty = true; });
    }
    updatePopup(v);
  }

  // ---- betting controls ----
  let raiseAmt = 0;
  function betLimits(v, m) {
    const toCall = Math.max(0, v.curBet - m.bet);
    const maxTo = m.bet + m.stack;
    const minTo = Math.min(maxTo, v.curBet + v.minRaise);
    return { toCall, maxTo, minTo, canRaise: maxTo > v.curBet && m.stack > toCall };
  }
  function updateActions(v, m) {
    const L = betLimits(v, m);
    if (raiseAmt < L.minTo || raiseAmt > L.maxTo || updateActions.hand !== v.handNo + ':' + v.round + ':' + v.curBet) { raiseAmt = L.minTo; updateActions.hand = v.handNo + ':' + v.round + ':' + v.curBet; }
    $('#aFold').textContent = T('fold');
    $('#aCall').textContent = L.toCall > 0 ? (m.stack <= L.toCall ? T('allin') + ' ' + money(m.stack) : T('call') + ' ' + money(L.toCall)) : T('check');
    $('#raiseBox').classList.toggle('hidden', !L.canRaise);
    $('#aRaise').classList.toggle('hidden', !L.canRaise);
    const sl = $('#raiseSlider');
    sl.min = L.minTo; sl.max = L.maxTo; sl.step = Math.max(1, v.s.sb); sl.value = raiseAmt;
    setRaiseLabel(v, m);
  }
  function setRaiseLabel(v, m) {
    const L = betLimits(v, m);
    const word = raiseAmt >= L.maxTo ? T('allin') : (v.curBet === 0 ? T('bet') : T('raise'));
    $('#aRaise').textContent = word + ' ' + money(raiseAmt);
  }
  $('#raiseSlider').addEventListener('input', e => { const v = S.view, m = me(); if (!m) return; raiseAmt = +e.target.value; setRaiseLabel(v, m); });
  function nudge(d) {
    const v = S.view, m = me(); if (!m) return; const L = betLimits(v, m);
    raiseAmt = Math.max(L.minTo, Math.min(L.maxTo, raiseAmt + d * Math.max(v.s.bb, 1)));
    $('#raiseSlider').value = raiseAmt; setRaiseLabel(v, m);
  }
  $('#rMinus').addEventListener('click', () => nudge(-1));
  $('#rPlus').addEventListener('click', () => nudge(1));
  $$('.chip[data-q]').forEach(b => b.addEventListener('click', () => {
    const v = S.view, m = me(); if (!m) return; const L = betLimits(v, m);
    const pot = v.potTotal + L.toCall;
    let to = b.dataset.q === 'max' ? L.maxTo : v.curBet + Math.round((b.dataset.q === 'half' ? pot / 2 : pot) / v.s.sb) * v.s.sb;
    raiseAmt = Math.max(L.minTo, Math.min(L.maxTo, to));
    $('#raiseSlider').value = raiseAmt; setRaiseLabel(v, m); Sound.play('click');
  }));
  function doAct(a) {
    const v = S && S.view, m = me(); if (!v || !m || v.toAct !== mySeat() || v.phase !== 'bet') return;
    if (a === 'call') { const L = betLimits(v, m); sendIntent({ t: 'act', a: L.toCall > 0 ? 'call' : 'check' }); }
    else if (a === 'raise') { const L = betLimits(v, m); if (!L.canRaise) return; sendIntent({ t: 'act', a: raiseAmt >= L.maxTo ? 'allin' : 'raise', amt: raiseAmt }); }
    else sendIntent({ t: 'act', a });
    $('#actions').classList.add('hidden');
  }
  $('#aFold').addEventListener('click', () => doAct('fold'));
  $('#aCall').addEventListener('click', () => doAct('call'));
  $('#aRaise').addEventListener('click', () => doAct('raise'));

  // ---- draw controls ----
  function updateDrawBtn() { $('#dSwap').textContent = T('drawBtn') + ' (' + selected.size + ')'; $('#dSwap').disabled = selected.size === 0; }
  function doDraw(pat) {
    const v = S && S.view, m = me(); if (!v || !m || v.phase !== 'draw' || v.toAct !== mySeat()) return;
    let idx = pat ? [] : Array.from(selected);
    if (!Poker.maxDiscardFor(m.cards, idx)) { toast(T('drawHint')); return; }
    sendIntent({ t: 'draw', idx });
    selected.clear();
    $('#drawbar').classList.add('hidden');
  }
  $('#dSwap').addEventListener('click', () => doDraw(false));
  $('#dPat').addEventListener('click', () => doDraw(true));
  function toggleSelect(i) {
    const v = S && S.view, m = me(); if (!v || !m || v.phase !== 'draw' || v.toAct !== mySeat()) return;
    if (selected.has(i)) selected.delete(i);
    else { if (selected.size >= 4) return; selected.add(i); }
    Sound.play('card'); updateDrawBtn();
  }

  // ---- popups (vote / loan) ----
  let popupKey = '', loanAmt = 0;
  function updatePopup(v) {
    const pop = $('#popup');
    let key = '';
    if (v.vote && v.vote.canVote) key = 'vote:' + v.vote.target;
    else if (v.loan && v.loan.canGive) key = 'loan:' + v.loan.pid;
    if (key !== popupKey) {
      popupKey = key;
      if (!key) { pop.classList.add('hidden'); pop.innerHTML = ''; return; }
      pop.classList.remove('hidden');
      if (key.startsWith('vote')) {
        pop.innerHTML = `<h3>${escapeHtml(T('kickVote', { n: v.vote.n }))}</h3><div class="row"><button class="wood red" id="vYes">${T('yes')}</button><button class="wood" id="vNo">${T('no')}</button></div><div class="time" id="popTime"></div>`;
        $('#vYes').addEventListener('click', () => { sendIntent({ t: 'vote', yes: true }); });
        $('#vNo').addEventListener('click', () => { sendIntent({ t: 'vote', yes: false }); });
      } else {
        const max = v.loan.max;
        loanAmt = Math.min(max, Math.max(0, Math.round(max / 4 / 10) * 10));
        pop.innerHTML = `<h3>${escapeHtml(T('loanAsk', { n: v.loan.n }))}</h3>
          <div class="row"><input type="range" id="lnSl" min="0" max="${max}" step="10" value="${loanAmt}"><span class="amt" id="lnAmt">${money(loanAmt)}</span></div>
          <div class="row"><button class="wood gold" id="lnGive">${T('loanGive')}</button><button class="wood red" id="lnNo">${T('loanNo')}</button></div><div class="time" id="popTime"></div>`;
        $('#lnSl').addEventListener('input', e => { loanAmt = +e.target.value; $('#lnAmt').textContent = money(loanAmt); });
        $('#lnGive').addEventListener('click', () => sendIntent({ t: 'loanGive', amt: loanAmt }));
        $('#lnNo').addEventListener('click', () => sendIntent({ t: 'loanGive', amt: 0 }));
      }
    }
    const pt = $('#popTime');
    if (pt) { const left = key.startsWith('vote') ? v.vote.left : v.loan.left; pt.textContent = Math.ceil(left / 1000) + ' ' + T('sec') + (key.startsWith('vote') ? `  ·  ✔ ${v.vote.yes}  ✘ ${v.vote.no}` : ''); }
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  // ---- end screens ----
  function showGameOver(v) {
    const w = v.winner;
    $('#endTitle').textContent = T('gameOver');
    $('#endText').textContent = w ? T('champion', { n: w.name }) : '';
    $('#btnNewGame').classList.toggle('hidden', S.role === 'client');
    drawEndArt(w ? (personByPid(w.pid) || {}).char : null, false);
    show('scr-end'); document.body.classList.add('ingame');
    if (w && w.pid === S.me) Sound.play('win');
  }
  function showKicked() {
    const n = S && S.net; S = null;
    if (hostTimer) { clearInterval(hostTimer); hostTimer = null; }
    try { n && n.close(); } catch (e) { }
    $('#hud').classList.add('hidden');
    $('#endTitle').textContent = T('kicked');
    $('#endText').textContent = T('kickedSub');
    $('#btnNewGame').classList.add('hidden');
    drawEndArt(null, true);
    show('scr-end');
    Sound.play('bang');
  }
  function drawEndArt(ch, tomb) {
    const c = $('#endArt').getContext('2d'); c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, 80, 70);
    if (tomb) {
      Art.R(c, 0, 58, 80, 12, '#8a6a3a'); Art.R(c, 24, 14, 32, 46, '#8a8a90'); Art.R(c, 28, 10, 24, 4, '#8a8a90'); Art.R(c, 32, 8, 16, 2, '#8a8a90');
      Art.R(c, 26, 16, 2, 42, '#a8a8b0');
      Art.R(c, 34, 20, 12, 2, '#55555c'); Art.R(c, 39, 17, 2, 10, '#55555c');
      Art.R(c, 30, 32, 20, 1, '#55555c'); Art.R(c, 30, 36, 20, 1, '#55555c'); Art.R(c, 30, 40, 14, 1, '#55555c');
      Art.R(c, 14, 50, 3, 8, '#5a7a3a'); Art.R(c, 11, 52, 3, 2, '#5a7a3a'); Art.R(c, 62, 54, 8, 4, '#a8743e');
    } else if (ch !== null && ch !== undefined) {
      Art.money(c, 40, 64, 2000, 20);
      Art.drawChar(c, ROSTER[ch], 40, 58, { t: 0, mood: 1, standing: true });
    }
  }
  $('#btnNewGame').addEventListener('click', () => { if (S && S.eng) { S.eng.backToLobby(); dirty = true; prevPhase = 'x'; } });
  $('#btnEndMenu').addEventListener('click', () => { endSession(); show('scr-main'); });

  // ---- pause ----
  let rulesFromPause = false;
  $('#btnMenu').addEventListener('click', () => { syncAudioUI(); show('scr-pause'); document.body.classList.add('ingame'); });
  $('#btnResume').addEventListener('click', () => hideScreens());
  $('#btnPauseRules').addEventListener('click', () => { rulesFromPause = true; show('scr-rules'); });
  $('#btnLeave').addEventListener('click', () => { endSession(); show('scr-main'); });

  // ============================================================
  //  LOBBY
  // ============================================================
  function renderLobby() {
    if (!S) return;
    const v = S.view;
    const isHost = S.role !== 'client';
    $('#lobbyTitle').textContent = S.role === 'solo' ? T('soloSetup') : T('lobby');
    $('#shareBox').classList.toggle('hidden', S.role === 'solo');
    $('#rowRejoin').classList.toggle('hidden', S.role === 'solo');
    if (S.code) {
      $('#roomCode').textContent = S.code;
      $('#shareLink').value = location.origin + location.pathname + '?join=' + S.code;
    } else { $('#roomCode').textContent = '…'; $('#shareLink').value = ''; }
    $('#btnStart').classList.toggle('hidden', !isHost);
    $$('.lobbyset select, .lobbyset input[type=checkbox]').forEach(el => el.disabled = !isHost);
    if (!v) return;
    const s = v.s;
    $('#lMode').value = v.mode; $('#lBlinds').value = String(s.bb); $('#lStart').value = String(s.start);
    $('#lTimer').value = String(s.timer); $('#lAI').value = String(s.ai);
    $('#lRejoin').checked = s.rejoin; $('#lLoans').checked = s.loans; $('#lTroll').checked = s.antiTroll !== false;
    // dealer options
    const dl = $('#lDealer');
    const opts = [['-1', T('random')]].concat(v.seats.map((p, i) => p ? [String(i), p.name] : null).filter(Boolean));
    const sig = JSON.stringify(opts);
    if (dl.dataset.sig !== sig) { dl.dataset.sig = sig; dl.innerHTML = opts.map(o => `<option value="${o[0]}">${escapeHtml(o[1])}</option>`).join(''); }
    dl.value = String(s.dealer);
    // players
    const list = $('#playerList');
    const people = v.seats.filter(Boolean).concat(v.specs);
    const psig = JSON.stringify(people.map(p => [p.pid, p.name, p.char, p.ready])) + lang;
    if (list.dataset.sig !== psig) {
      list.dataset.sig = psig; list.innerHTML = '';
      people.forEach(p => {
        const row = document.createElement('div'); row.className = 'pl';
        const cv = document.createElement('canvas'); cv.width = 32; cv.height = 32;
        const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
        Art.drawHead(c, ROSTER[p.char], 8, 14, 16, 15, { t: 0, mood: 1 });
        row.appendChild(cv);
        const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = p.name; row.appendChild(nm);
        if (p.isHost) { const tg = document.createElement('span'); tg.className = 'tag'; tg.textContent = '★ ' + T('hostTag'); row.appendChild(tg); }
        else if (p.human && S.role !== 'solo' && v.seats.includes(p)) {
          const tg = document.createElement('span'); tg.className = 'tag ' + (p.ready ? 'ok' : 'notok');
          tg.textContent = p.ready ? '✔ ' + T('readyTag') : '⌛ ' + T('notReadyTag'); row.appendChild(tg);
        }
        if (p.pid === S.me) {
          const b = document.createElement('button'); b.className = 'wood small'; b.textContent = '🎭';
          b.title = 'Look'; b.addEventListener('click', () => { sendIntent({ t: 'look' }); Sound.play('click'); });
          row.appendChild(b);
        }
        list.appendChild(row);
      });
      const n = v.seats.filter(Boolean).length;
      for (let i = 0; i < Math.min(s.ai, 6 - n); i++) {
        const row = document.createElement('div'); row.className = 'pl';
        row.innerHTML = `<span class="tag">🤖 AI #${i + 1}</span>`;
        list.appendChild(row);
      }
    }
    // my name field
    const myP = v.seats.find(p => p && p.pid === S.me) || v.specs.find(p => p.pid === S.me);
    const ln = $('#lobbyName');
    if (myP && ln !== document.activeElement && ln.value !== myP.name) ln.value = myP.name;
    // ready button (guests only) + status line
    const meSeat = v.seats.find(p => p && p.pid === S.me);
    const rb = $('#btnReady');
    rb.classList.toggle('hidden', S.role !== 'client' || !meSeat);
    if (meSeat) { rb.textContent = meSeat.ready ? T('notReady') : T('ready'); rb.classList.toggle('gold', !meSeat.ready); }
    const guests = v.seats.filter(p => p && p.human && !p.isHost);
    let msg = '';
    if (v.autoLeft > 0) msg = T('autoStart', { n: Math.ceil(v.autoLeft / 1000) });
    else if (S.role === 'host') msg = guests.length ? T('readyCount', { a: guests.filter(p => p.ready).length, b: guests.length }) : '';
    else if (S.role === 'client') msg = meSeat && meSeat.ready ? T('waitingOthers') : T('pressReady');
    $('#lobbyMsg').textContent = msg;
  }
  $('#btnReady').addEventListener('click', () => {
    const v = S && S.view; if (!v) return;
    const meSeat = v.seats.find(p => p && p.pid === S.me);
    if (!meSeat) return;
    Sound.ensure(); Sound.play('click');
    sendIntent({ t: 'ready', on: !meSeat.ready });
  });
  function pushSettings() {
    if (!S || !S.eng) return;
    S.eng.updateSettings({
      mode: $('#lMode').value, bb: +$('#lBlinds').value, start: +$('#lStart').value, timer: +$('#lTimer').value,
      ai: +$('#lAI').value, dealer: +$('#lDealer').value, rejoin: $('#lRejoin').checked, loans: $('#lLoans').checked, antiTroll: $('#lTroll').checked
    });
    dirty = true;
    $('#playerList').dataset.sig = '';
  }
  $$('.lobbyset select, .lobbyset input[type=checkbox]').forEach(el => el.addEventListener('change', pushSettings));
  $('#btnStart').addEventListener('click', () => {
    if (!S || !S.eng) return;
    Sound.ensure();
    if (!S.eng.start()) { $('#lobbyMsg').textContent = T('needPlayers'); return; }
    dirty = true; hostLoop();
  });
  $('#btnLobbyBack').addEventListener('click', () => { endSession(); show('scr-main'); });
  $('#btnCopy').addEventListener('click', () => {
    const inp = $('#shareLink'); inp.select();
    (navigator.clipboard ? navigator.clipboard.writeText(inp.value) : Promise.reject()).catch(() => document.execCommand('copy'));
    $('#btnCopy').textContent = T('copied'); setTimeout(() => $('#btnCopy').textContent = T('copy'), 1500);
  });

  // ============================================================
  //  SCENE GEOMETRY
  // ============================================================
  const VP = [{ x: 240, yb: 300 }];
  for (const x of [52, 132, 240, 348, 428]) VP.push({ x, yb: Math.round(Art.rimY(x)) + 6 });
  const SPOTS = [
    { cards: null, stack: [196, 256], bet: [252, 232], btn: [292, 246] },
    { cards: [100, 196], stack: [72, 210], bet: [142, 212], btn: [120, 224] },
    { cards: [126, 160], stack: [160, 166], bet: [172, 182], btn: [146, 176] },
    { cards: [226, 148], stack: [270, 154], bet: [240, 160], btn: [208, 156] },
    { cards: [340, 160], stack: [322, 166], bet: [310, 182], btn: [336, 176] },
    { cards: [380, 196], stack: [408, 210], bet: [338, 212], btn: [360, 224] }
  ];
  const OFF_W = 80, OFF_H = 100, OFF_CX = 40, OFF_YB = 94;
  const offCanvas = [], offCtxs = [];
  function offCtx(vp) {
    if (!offCanvas[vp]) { const cv = document.createElement('canvas'); cv.width = OFF_W; cv.height = OFF_H; offCanvas[vp] = cv; offCtxs[vp] = cv.getContext('2d'); }
    return offCtxs[vp];
  }
  const STAND = [{ x: 96, yb: 112 }, { x: 290, yb: 112 }, { x: 186, yb: 110 }, { x: 384, yb: 112 }, { x: 60, yb: 114 }];
  function stackPos(vp) { return SPOTS[vp].stack; }
  function betPos(vp) { return SPOTS[vp].bet; }
  function dealerPos() { const v = S && S.view; if (!v || v.dealer < 0) return [240, 170]; return SPOTS[vpOf(v.dealer)].btn; }
  function specSpot(pid) {
    const v = S && S.view; if (!v) return null;
    const list = v.specs.filter(p => p.pid !== S.me);
    const i = list.findIndex(p => p.pid === pid);
    return i >= 0 ? STAND[i % STAND.length] : null;
  }
  function cardTarget(pid) {
    const s = seatOf(pid); if (s < 0) return [240, 200];
    const vp = vpOf(s);
    if (vp === 0) return [60, 262];
    return [VP[vp].x - 4, VP[vp].yb - 30];
  }

  // ============================================================
  //  CHARACTER STATE (blink, look, smoke...)
  // ============================================================
  function getCS(pid) {
    let c = cstate[pid];
    if (!c) {
      const n = performance.now();
      c = cstate[pid] = { blinkAt: n + 1000 + Math.random() * 3000, look: 0, lookAt: n + Math.random() * 4000, mood: 0, moodUntil: 0, smokeAt: n, coughAt: n + 15000 + Math.random() * 30000, mx: 0, my: 0 };
    }
    return c;
  }
  function charSt(pid, now) {
    const c = getCS(pid);
    if (now > c.blinkAt + 140) c.blinkAt = now + 2000 + Math.random() * 4000;
    if (now > c.lookAt) { c.look = [-1, 0, 0, 1][Math.floor(Math.random() * 4)]; c.lookAt = now + 1500 + Math.random() * 4000; }
    const b = bubbles[pid];
    return { t: now, blink: now > c.blinkAt && now < c.blinkAt + 140, look: c.look, mood: now < c.moodUntil ? c.mood : 0, talk: b && now < b.t0 + Math.min(1800, b.until - b.t0) };
  }

  // ============================================================
  //  WALKERS (background life)
  // ============================================================
  const DOOR_X = 189;
  function makeWalker(kind, char) {
    const v = S && S.view;
    const used = new Set(v ? v.seats.filter(Boolean).map(p => p.char).concat(v.specs.map(p => p.char)) : []);
    if (kind === 'patron' || kind === 'leaver') {
      if (char === undefined) {
        const free = ROSTER.map((r, i) => i).filter(i => !used.has(i));
        char = free.length ? free[Math.floor(Math.random() * free.length)] : Math.floor(Math.random() * ROSTER.length);
      }
      const pts = [-24, DOOR_X, 505];
      let a = pts[Math.floor(Math.random() * 3)], b;
      do { b = pts[Math.floor(Math.random() * 3)]; } while (b === a);
      if (kind === 'leaver') { a = 330; b = DOOR_X; }
      return { kind: 'patron', char, x: a, to: b, speed: 0.018 + Math.random() * 0.012, drink: Math.random() < 0.4, fromDoor: a === DOOR_X, toDoor: b === DOOR_X, born: performance.now() };
    }
    if (kind === 'npc') { // a colourful western character passing through
      const pool = NPCS.filter(n => !n.girl && !walkers.some(w => w.npc === n));
      const npc = pool[Math.floor(Math.random() * pool.length)] || NPCS[3];
      const pts = [-24, DOOR_X, 505];
      let a = pts[Math.floor(Math.random() * 3)], b;
      do { b = pts[Math.floor(Math.random() * 3)]; } while (b === a);
      return { kind: 'patron', npc, x: a, to: b, speed: npc.extra === 'drunk' ? 0.012 : 0.016 + Math.random() * 0.01, drink: false, fromDoor: a === DOOR_X, toDoor: b === DOOR_X, born: performance.now() };
    }
    if (kind === 'girl') {
      const pool = NPCS.filter(n => n.girl && !walkers.some(w => w.npc === n));
      if (!pool.length) return null;
      const npc = pool[Math.floor(Math.random() * pool.length)];
      return { kind: 'patron', npc, x: DOOR_X, to: char, speed: 0.02, fromDoor: true, toDoor: false, barfly: true, spot: char, born: performance.now() };
    }
    if (kind === 'dog') { const l = Math.random() < 0.5; return { kind, x: l ? -20 : 500, to: l ? 500 : -20, speed: 0.04 }; }
    if (kind === 'tumble') return { kind, x: DOOR_X, to: Math.random() < 0.5 ? -20 : 500, speed: 0.05, fromDoor: true };
    if (kind === 'undertaker') return { kind: 'patron', char: 5, x: DOOR_X, to: 240, back: true, speed: 0.02, fromDoor: true, toDoor: false, pause: 0, born: performance.now() };
  }
  // ---- day / night: everybody's clock is the same, so online players see the same sky ----
  const DAY_CYCLE = 16 * 60; // seconds: 6 min day, 1.5 min sunset, 7 min night, 1.5 min sunrise
  function dayState() {
    const t = (((Date.now() / 1000) + (window.__dayOffset || 0)) % DAY_CYCLE + DAY_CYCLE) % DAY_CYCLE;
    const D = 360, DUSK = 90, N = 420;
    let dark, red;
    if (t < D) { dark = 0; red = 0; }
    else if (t < D + DUSK) { const f = (t - D) / DUSK; dark = f; red = Math.sin(f * Math.PI); }
    else if (t < D + DUSK + N) { dark = 1; red = 0; }
    else { const f = (t - D - DUSK - N) / DUSK; dark = 1 - f; red = Math.sin(f * Math.PI); }
    return { dark, red };
  }
  const BAR_SPOTS = [470, 96, 284];
  const DANCE_SPOT = 314;
  let nextWalker = performance.now() + 3000;
  function updateWalkers(now, dt) {
    const DS = dayState();
    // at night more people come in for a drink and stay at the bar; in the morning they go home
    const flies = walkers.filter(w => w.kind === 'patron' && w.barfly && !w.leaving);
    if (DS.dark > 0.7 && flies.length < 3 && Math.random() < dt / 9000) {
      const used = new Set(walkers.filter(w => w.barfly).map(w => w.spot));
      const spot = BAR_SPOTS.find(x => !used.has(x));
      if (spot !== undefined) { const w = makeWalker('patron'); w.x = DOOR_X; w.fromDoor = true; w.to = spot; w.toDoor = false; w.barfly = true; w.spot = spot; w.drink = true; walkers.push(w); }
    }
    // in the evening a couple of saloon girls come in: one dances by the clock, one chats at the bar
    const girls = walkers.filter(w => w.npc && w.npc.girl && !w.leaving);
    if (DS.dark > 0.6 && girls.length < 2 && Math.random() < dt / 7000) {
      const dancing = girls.some(w => w.dance);
      const used = new Set(walkers.filter(w => w.barfly).map(w => w.spot));
      const spot = !dancing ? DANCE_SPOT : BAR_SPOTS.find(x => !used.has(x));
      if (spot !== undefined) { const w = makeWalker('girl', spot); if (w) { w.dance = !dancing; walkers.push(w); } }
    }
    if (DS.dark < 0.3) walkers.filter(w => w.npc && w.npc.girl && !w.leaving).forEach(w => { w.leaving = true; w.idle = false; w.to = DOOR_X; w.toDoor = true; });
    if (DS.dark < 0.3) flies.forEach(w => { w.leaving = true; w.idle = false; w.to = DOOR_X; w.toDoor = true; w.pause = 0; });
    if (now > nextWalker) {
      nextWalker = now + (7000 + Math.random() * 9000) * (1 - DS.dark * 0.45);
      const r = Math.random();
      if (r < 0.3) walkers.push(makeWalker('patron'));
      else if (r < 0.62) walkers.push(makeWalker('npc'));
      else if (r < 0.84) walkers.push(makeWalker('dog'));
      else walkers.push(makeWalker('tumble'));
    }
    walkers.forEach(w => {
      if (w.fromDoor && !w.doorDone) { doorSwing = 1; w.doorDone = true; Sound.play('door'); }
      if (w.pause && now < w.pause) return;
      if (w.idle) { if (Math.random() < dt / 7000) w.dir = -w.dir || 1; return; } // hanging out at the bar
      const dir = Math.sign(w.to - w.x);
      w.dir = dir || w.dir || 1;
      w.x += dir * w.speed * dt;
      if ((dir > 0 && w.x >= w.to) || (dir < 0 && w.x <= w.to) || dir === 0) {
        if (w.back) { w.back = false; w.pause = now + 2600; w.to = DOOR_X; w.toDoor = true; return; }
        if (w.barfly && !w.leaving) { w.idle = true; w.x = w.to; return; }
        if (w.toDoor) { doorSwing = 1; Sound.play('door'); }
        w.dead = true;
      }
      if (w.kind === 'dog' && !w.barked && Math.abs(w.x - 240) < 30 && Math.random() < 0.02) { w.barked = true; Sound.play('bark'); }
    });
    walkers = walkers.filter(w => !w.dead);
  }

  // ============================================================
  //  RENDER
  // ============================================================
  const bg = Art.makeBackground();
  // old sepia photos for the posters (cached per character)
  const posterCache = {};
  function posterImg(ch, captured) {
    const key = ch + ':' + captured;
    if (posterCache[key]) return posterCache[key];
    const cv = document.createElement('canvas'); cv.width = 22; cv.height = 30;
    const c = cv.getContext('2d');
    Art.wantedPoster(c, 0, 1, ROSTER[ch], captured);
    const img = c.getImageData(0, 0, 22, 30), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const r = d[i], g = d[i + 1], b = d[i + 2];
      d[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
      d[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
      d[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
    }
    c.putImageData(img, 0, 0);
    return (posterCache[key] = cv);
  }
  const MENU_POSTERS = [2, 9, 10].map(i => ({ name: ROSTER[i].name, char: i, stack: 1000 + i * 250 }));
  let last = performance.now();
  let handLift = 0, hoverCard = -1;
  let mouse = { x: -1, y: -1, inside: false };
  const demo = makeDemo();

  function makeDemo() {
    const chars = ROSTER.map((r, i) => i).sort(() => Math.random() - 0.5).slice(0, 5);
    return [null].concat(chars.map((c, i) => ({ pid: 'demo' + i, name: ROSTER[c].name, char: c, n: 0, stack: 1000, folded: true, bet: 0, demo: true })));
  }

  function frameLoop(now) {
    const dt = Math.min(60, now - last); last = now;
    updateWalkers(now, dt);
    drawScene(now, dt);
    drawOverlay(now);
    hudTick(now);
    requestAnimationFrame(frameLoop);
  }

  let lastTickSec = -1;
  function hudTick(now) {
    const v = S && S.view;
    if (!v || v.phase === 'lobby') return;
    // countdown sound for me
    if (v.toAct >= 0 && v.toAct === mySeat() && (v.phase === 'bet' || v.phase === 'draw')) {
      const left = turnLeft(v);
      const sec = Math.ceil(left / 1000);
      if (sec <= 5 && sec > 0 && sec !== lastTickSec) { lastTickSec = sec; Sound.play('tick'); }
    }
    if (v.vote || v.loan) updatePopup(v);
  }
  // local countdown based on time of state arrival
  let stateAt = performance.now(), stateLeft = 0, stateKey = '';
  function turnLeft(v) {
    const key = v.handNo + ':' + v.toAct + ':' + v.round + ':' + v.phase;
    if (key !== stateKey) { stateKey = key; stateAt = performance.now(); stateLeft = v.left; }
    return Math.max(0, stateLeft - (performance.now() - stateAt));
  }

  function drawScene(now, dt) {
    const c = sc;
    c.save();
    const wob = now < wobbleUntil ? Math.min(1, (wobbleUntil - now) / 1200) * Math.min(1, (now - wobbleT0) / 400) : 0;
    if (wob > 0) { c.translate(240, 135); c.rotate(Math.sin(now / 420) * 0.025 * wob); c.translate(-240 + Math.sin(now / 260) * 4 * wob, -135 + Math.cos(now / 330) * 2 * wob); }
    if (now < shakeUntil) c.translate(Math.round((Math.random() - 0.5) * 4), Math.round((Math.random() - 0.5) * 3));
    c.drawImage(bg, 0, 0);
    Art.drawSign(c);
    // wanted names: poster faces stay, names drawn in overlay
    doorSwing = Math.max(0, doorSwing - dt / 900);
    const DSs = dayState();
    Art.drawOutside(c, DSs.dark, DSs.red, now);
    Art.doorLight(c, DSs.dark);
    Art.drawDoors(c, Math.sin(now / 90) * doorSwing);
    Art.drawLampFixtures(c, now, Math.min(1, DSs.dark * 1.4));
    // wanted posters (our characters in a game, outlaws from the roster in the menu)
    const plist = posters.length ? posters : MENU_POSTERS;
    plist.forEach((ps, i) => { const sl = POSTER_SLOTS[i]; if (sl && ps && !ps.vacant) c.drawImage(posterImg(ps.char, !!ps.captured), sl[0], sl[1] - 1); });
    Art.drawPianist(c, now);
    if (!barman) Art.drawBartender(c, 410, now);
    if (now < barkeepAim && !(now < bartenderGun) && !barman) { // the barkeep shows his shotgun as a warning
      const gx = 380, gy = 76 + Math.round(Math.sin(now / 300));
      Art.R(c, gx, gy, 26, 3, '#3a3a40'); Art.R(c, gx + 20, gy + 2, 8, 4, '#6a3a1a'); Art.R(c, gx - 2, gy - 1, 3, 2, '#3a3a40');
    }
    if (now < bartenderGun && !barman) { // the bartender pulls his shotgun
      const gx = 380, gy = 76;
      Art.R(c, gx, gy, 26, 3, '#3a3a40'); Art.R(c, gx + 20, gy + 2, 8, 4, '#6a3a1a'); Art.R(c, gx - 2, gy - 1, 3, 2, '#3a3a40');
      if (now > bartenderGun - 1150 && now < bartenderGun - 1000) { Art.R(c, gx - 8, gy - 3, 7, 7, '#ffe060'); Art.R(c, gx - 12, gy - 1, 4, 3, '#ff9a30'); }
    }
    // piano notes
    if (Math.random() < dt / 700) notes.push({ x: 30 + Math.random() * 30, y: 66, t0: now });
    notes = notes.filter(n => now - n.t0 < 2200);
    notes.forEach(n => { const a = (now - n.t0) / 2200; const y = n.y - a * 30, x = n.x + Math.sin(a * 6) * 3; Art.R(c, x, y, 2, 2, '#f4ead2'); Art.R(c, x + 1, y - 4, 1, 4, '#f4ead2'); Art.R(c, x + 2, y - 4, 2, 1, '#f4ead2'); });

    const v = (S && S.view && S.view.phase !== 'lobby') ? S.view : null;
    const lobbyV = S && S.view && S.view.phase === 'lobby' ? S.view : null;

    // walkers (behind everyone)
    walkers.forEach(w => {
      if (w.kind === 'dog') Art.drawDog(c, w.x, 134, now, w.dir);
      else if (w.kind === 'tumble') Art.drawTumbleweed(c, w.x, 132, now * (w.dir || 1));
      else {
        const ch = w.npc || ROSTER[w.char];
        const dancing = w.dance && w.idle;
        const wx = dancing ? w.x + Math.sin(now / 320) * 3 : w.x;
        Art.drawChar(c, ch, wx, 108, { t: now, legs: true, walk: !w.idle && !(w.pause && now < w.pause), drink: w.drink, dance: dancing, mood: (w.char === 5 && !w.npc) ? -1 : (dancing ? 1 : 0), look: dancing ? Math.round(Math.sin(now / 900)) : (w.dir || 0) });
        if (ch.prop) drawProp(c, ch, wx, 108, now);
      }
    });

    // the barkeep at work: bringing a whiskey or painting an X on a wanted poster
    if (!barman && barQueue.length) {
      const job = barQueue.shift();
      const tx = jobTarget(job);
      if (tx === null) { if (job.type === 'paint') { const ps = posters.find(q => q.name === job.name); if (ps) { ps.captured = true; ps.paintT0 = 0; } } }
      else barman = Object.assign(job, { t0: now, tx, served: false });
    }
    if (barman) {
      const drawing = barkeepDraw && now < barkeepDraw.until;
      if (drawing) barman.t0 += dt; // he stops to deal with the troublemaker, then goes on with his job
      const B = barman, el = now - B.t0;
      const dist = Math.abs(B.tx - 410), walk = Math.max(700, dist / 0.13), hold = B.type === 'paint' ? 1500 : 600;
      let x, going = true, painting = false;
      if (el < walk) x = 410 + (B.tx - 410) * (el / walk);
      else if (el < walk + hold) {
        x = B.tx;
        if (!B.served) {
          B.served = true;
          if (B.type === 'whisky') serveWhisky(B.pid, now);
          else { const ps = posters.find(q => q.name === B.name); if (ps) { ps.captured = true; ps.paintT0 = now; Sound.play('fold'); } }
        }
        painting = B.type === 'paint';
      }
      else if (el < walk * 2 + hold) { going = false; x = B.tx + (410 - B.tx) * ((el - walk - hold) / walk); }
      else { barman = null; x = 410; }
      if (barman) {
        barmanX = x;
        const D = drawing ? barkeepDraw : null;
        const dir = D ? (Math.sign(D.tx - x) || -1) : 0;
        Art.drawChar(c, BARKEEP, x, 108, { t: now, legs: true, walk: !D && (el < walk || el > walk + hold), drink: !D && going && B.type === 'whisky', look: D ? dir : (going ? Math.sign(B.tx - 410) : Math.sign(410 - B.tx)), mood: D ? -1 : (painting ? 0 : 1) });
        if (D) { // revolver drawn
          const hx = Math.round(x + (dir > 0 ? 14 : -17)), hy = 95;
          Art.R(c, hx, hy + 1, 4, 3, '#eab08a');
          Art.R(c, dir > 0 ? hx + 3 : hx - 6, hy, 7, 2, '#3a3a40'); Art.R(c, dir > 0 ? hx + 9 : hx - 8, hy, 2, 1, '#55555c');
          Art.R(c, dir > 0 ? hx + 2 : hx, hy + 2, 2, 3, '#6a3a1a');
          if (D.fireAt && now >= D.fireAt && now < D.fireAt + 130) { const mx = dir > 0 ? hx + 11 : hx - 13; Art.R(c, mx, hy - 2, 5, 5, '#ffe060'); Art.R(c, dir > 0 ? mx + 5 : mx - 3, hy - 1, 3, 3, '#ff9a30'); }
        }
        if (!D && B.type === 'paint' && going) { // brush in his hand, painting high on the wall
          const hx = Math.round(x + 15), hy = painting ? 70 + Math.round(Math.sin(now / 90) * 3) : 100;
          Art.R(c, hx, hy, 2, 108 - hy - 6, '#7a4a24'); Art.R(c, hx - 1, hy - 4, 4, 5, '#3a2a1a'); Art.R(c, hx - 1, hy - 6, 4, 2, '#b01818');
          Art.R(c, x + 14, 101, 4, 4, '#eab08a');
        }
      } else Art.drawBartender(c, 410, now);
    }
    // standing spectators
    if (v) {
      v.specs.filter(p => p.pid !== S.me).forEach((p, i) => {
        const sp = STAND[i % STAND.length];
        const st = charSt(p.pid, now); st.legs = true; st.pockets = p.reason === 'broke'; if (p.reason === 'broke') st.mood = -1;
        st.drink = p.reason === 'waiting';
        const r = Art.drawChar(c, ROSTER[p.char], sp.x, sp.yb, st);
        p._head = r;
      });
    }

    // seated characters: far ones first
    const seats = v ? v.seats : demo;
    const order = [3, 2, 4, 1, 5];
    const flyingPid = fx.filter(f => f.type === 'flyer').map(f => f.pid);
    for (const vp of order) {
      const seat = v ? (vp + baseSeat()) % 6 : vp;
      const p = seats[seat];
      if (!p) continue;
      const P = VP[vp];
      const st = charSt(p.pid, now);
      const shown = v && v.result && p.cards && v.phase === 'handover';
      st.cards = (!v || p.folded || shown || p.broke) ? 0 : dealtCount(p, now);
      if (p.allIn && v) st.sweat = true;
      if (p.broke) st.mood = -1;
      // seated opponents are drawn at 2x (they are close to us)
      const oc2 = offCtx(vp);
      oc2.clearRect(0, 0, OFF_W, OFF_H);
      const r = Art.drawChar(oc2, ROSTER[p.char], OFF_CX, OFF_YB, st);
      sc.drawImage(offCanvas[vp], P.x - OFF_CX * 2, P.yb - OFF_YB * 2, OFF_W * 2, OFF_H * 2);
      const toS = (lx, ly) => [P.x + (lx - OFF_CX) * 2, P.yb + (ly - OFF_YB) * 2];
      const mouth = toS(r.mouthX, r.mouthY), head = toS(r.hx, r.hy);
      const cs = getCS(p.pid); cs.mx = mouth[0]; cs.my = mouth[1]; cs.hy = head[1];
      if (drinkers[p.pid] && now < drinkers[p.pid]) { const gx = mouth[0] - 2, gy = mouth[1] - 4; Art.R(c, gx, gy, 9, 12, 'rgba(220,235,240,0.7)'); Art.R(c, gx + 1, gy + 5, 7, 6, '#c27a1e'); Art.R(c, gx + 1, gy + 1, 1, 9, 'rgba(255,255,255,0.7)'); }
      // smoke
      const sm = ROSTER[p.char].smoke;
      if (sm && sm !== 'chew' && sm !== 'toothpick' && sm !== 'straw') {
        const tip = toS(r.mouthX + (sm === 'holder' ? 8 : sm === 'pipe' ? 4 : 6), r.mouthY - (sm === 'holder' ? 2 : sm === 'pipe' ? 1 : 0));
        if (now > cs.smokeAt) { cs.smokeAt = now + 140 + Math.random() * 180; smoke.push({ x: tip[0], y: tip[1], vx: (Math.random() - 0.3) * 0.008, t0: now, life: 1900 + Math.random() * 900, s2: true }); }
        if (now > cs.coughAt) {
          cs.coughAt = now + 25000 + Math.random() * 40000;
          for (let k = 0; k < 10; k++) smoke.push({ x: mouth[0], y: mouth[1], vx: (Math.random() - 0.5) * 0.04, vy: -0.01 - Math.random() * 0.025, t0: now, life: 1400, big: true, s2: true });
          if (v && !bubbles[p.pid]) { bubbles[p.pid] = { text: lang === 'hu' ? '*köhh-köhh*' : '*cough cough*', until: now + 1600, t0: now }; Sound.play('cough'); }
        }
      }
    }
    // smoke particles
    smoke = smoke.filter(s => now - s.t0 < s.life);
    smoke.forEach(s => {
      const a = (now - s.t0) / s.life;
      const x = s.x + (s.vx || 0) * (now - s.t0) + Math.sin(a * 7 + s.t0) * 2 * a;
      const y = s.y + (s.vy || -0.012) * (now - s.t0);
      c.fillStyle = `rgba(215,215,215,${(1 - a) * (s.big ? 0.6 : 0.45)})`;
      const sz = (s.big ? 2 + Math.floor(a * 3) : 1 + Math.floor(a * 2.5)) * (s.s2 ? 2 : 1);
      c.fillRect(Math.round(x), Math.round(y), sz, sz);
    });

    if (v) drawTableStuff(c, v, now);
    else { Art.money(c, 240, 200, 400, 20); }

    // flying effects
    fx = fx.filter(f => now < f.t0 + f.dur + (f.type === 'flyer' ? 0 : 0));
    fx.forEach(f => {
      if (now < f.t0) return;
      const a = Math.min(1, (now - f.t0) / f.dur);
      if (f.type === 'fly') {
        if (f.sfx) { f.sfx = false; Sound.play('card'); }
        const to = cardTarget(f.pid);
        const x = f.from[0] + (to[0] - f.from[0]) * a, y = f.from[1] + (to[1] - f.from[1]) * a - Math.sin(a * Math.PI) * 10;
        Art.drawBack(c, Math.round(x - 5), Math.round(y - 7), 'tiny');
      } else if (f.type === 'money') {
        const x = f.from[0] + (f.to[0] - f.from[0]) * a, y = f.from[1] + (f.to[1] - f.from[1]) * a - Math.sin(a * Math.PI) * 8;
        for (let k = 0; k < f.amt; k++) Art.coinStack(c, Math.round(x - 4 + (k % 3) * 4), Math.round(y + Math.floor(k / 3) * 2), 1, k % 2 === 0);
      } else if (f.type === 'flyer') {
        drawFlyer(c, f, a, now);
      }
    });

    drawMyHand(c, v, now, dt);
    drawMyDrink(c, now);
    Art.drawLamps(c, now, Math.min(1, dayState().dark * 1.4));
    Art.vignette(c);
    if (now < flashUntil) { c.fillStyle = 'rgba(255,250,230,0.85)'; c.fillRect(0, 0, W, H); }
    c.restore();
    if (wob > 0) { // double vision
      sc.save(); sc.globalAlpha = 0.33 * wob; sc.drawImage(scene, Math.round(Math.sin(now / 300) * 6 * wob), Math.round(Math.cos(now / 410) * 2 * wob)); sc.restore();
    }
  }

  // things the background characters carry
  function drawProp(c, ch, x, yb, now) {
    const SW = { thin: 22, normal: 28, fat: 34, lady: 24 }[ch.build || 'normal'];
    const hx = Math.round(x + SW / 2), hy = yb;
    switch (ch.prop) {
      case 'bottle': Art.R(c, hx, hy - 7, 3, 7, '#5a3a1a'); Art.R(c, hx + 1, hy - 10, 1, 3, '#5a3a1a'); Art.R(c, hx, hy - 5, 3, 2, '#e8dfc8'); break;
      case 'book': Art.R(c, hx - 1, hy - 5, 5, 6, '#1a1410'); Art.R(c, hx + 3, hy - 5, 1, 6, '#e8dfc8'); Art.P(c, hx + 1, hy - 3, '#c8a040'); break;
      case 'rifle': for (let k = 0; k < 18; k++) Art.P(c, hx - 1 + Math.floor(k / 4), hy - 22 + k, '#3a3a40'); Art.R(c, hx + 2, hy - 6, 3, 4, '#6a3a1a'); break;
      case 'pickaxe': for (let k = 0; k < 14; k++) Art.P(c, hx + Math.floor(k / 5), hy - 14 + k, '#8a5a2a'); Art.R(c, hx - 4, hy - 16, 9, 2, '#8a8a90'); Art.P(c, hx - 5, hy - 15, '#8a8a90'); Art.P(c, hx + 5, hy - 15, '#8a8a90'); break;
      case 'cards': { const f = Math.floor(now / 400) % 2; for (let k = 0; k < 3; k++) Art.R(c, hx - 2 + k * 2, hy - 6 - (k === 1 ? 1 : 0) - f, 3, 4, k === 1 ? '#c4262e' : '#f4ead2'); break; }
      case 'lasso': c.strokeStyle = '#b08850'; c.lineWidth = 1; c.beginPath(); c.ellipse(hx + 2.5, hy - 2.5, 4, 3, 0, 0, Math.PI * 2); c.stroke(); Art.R(c, hx, hy - 1, 2, 4, '#b08850'); break;
    }
  }
  const BARKEEP = { skin: '#eab08a', hat: 'none', hatC: '#222222', hatC: '#222222', hair: '#222', face: 'handlebar', nose: 'big', coat: '#f2efe6', shirt: '#f2efe6', neck: 'bowtie', build: 'normal', vest: '#b8302e' };
  function serveWhisky(pid, now) {
    Sound.play('glass');
    if (S && pid === S.me) { myDrink = { t0: now }; myGlassLvl = 8; return; }
    drinkers[pid] = now + 1800;
    say(pid, T('glug'), 1600);
    setTimeout(() => { Sound.play('gulp'); }, 100);
    setTimeout(() => { say(pid, T('hic'), 1400); Sound.play('hic'); moodFor(pid, 1, 3000); }, 2000);
  }
  const glassCv = document.createElement('canvas'); glassCv.width = 14; glassCv.height = 17;
  const glassCx = glassCv.getContext('2d');
  function drawMyDrink(c, now) {
    if (!myDrink) return;
    const el = now - myDrink.t0;
    const UP = 500, DRINK = 1100, DOWN = 450;
    let a, lvl = 8;
    if (el < UP) a = el / UP;
    else if (el < UP + DRINK) { a = 1; lvl = Math.max(1, Math.round(8 - 7 * (el - UP) / DRINK)); if (!myDrink.gulp) { myDrink.gulp = true; Sound.play('gulp'); } }
    else if (el < UP + DRINK + DOWN) { a = 1 - (el - UP - DRINK) / DOWN; lvl = 1; if (!myDrink.hic) { myDrink.hic = true; wobbleT0 = now; wobbleUntil = now + 3200; setTimeout(() => { Sound.play('hic'); if (S && S.me) say(S.me, T('hic'), 1400); }, 500); } }
    else { myDrink = null; myGlassLvl = 1; return; }
    const e = a * a * (3 - 2 * a);
    glassCx.clearRect(0, 0, 14, 17); Art.myGlass(glassCx, 1, 1, lvl);
    const scl = 1 + e * 3.2;
    const x = 446 + (300 - 446) * e, y = 240 + (205 - 240) * e;
    c.save(); c.imageSmoothingEnabled = false;
    c.translate(Math.round(x + 6), Math.round(y + 7));
    c.rotate(el > UP && el < UP + DRINK ? -0.5 * Math.min(1, (el - UP) / 250) : -0.5 * e * (el >= UP + DRINK ? 1 : 0));
    c.drawImage(glassCv, -7 * scl, -8 * scl, 14 * scl, 17 * scl);
    // the hand holding the glass
    c.fillStyle = (me() ? ROSTER[me().char].skin : '#e8a77c');
    c.fillRect(Math.round(-8 * scl), Math.round(2 * scl), Math.round(5 * scl), Math.round(6 * scl));
    c.restore();
  }

  // how many cards a player holds right now (deal animation)
  function dealtCount(p, now) {
    if (!dealInfo || !p.n) return p.n || 0;
    const pos = dealInfo.order.indexOf(p.pid);
    if (pos < 0) return p.n;
    let k = 0;
    for (let r = 0; r < dealInfo.n; r++) if (now >= dealInfo.t0 + (r * dealInfo.order.length + pos) * 110 + 260) k++;
    return Math.min(p.n, k);
  }

  const spriteCache = {};
  function charSprite(ch) {
    if (spriteCache[ch]) return spriteCache[ch];
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 80;
    const c = cv.getContext('2d');
    Art.drawChar(c, ROSTER[ch], 32, 58, { t: 0, mood: -1, legs: true, noHat: false });
    const hat = document.createElement('canvas'); hat.width = 48; hat.height = 30;
    const h = hat.getContext('2d');
    Art.drawHat(h, ROSTER[ch], 16, 20, 16, 0);
    const body = document.createElement('canvas'); body.width = 64; body.height = 80;
    const b = body.getContext('2d');
    Art.drawChar(b, ROSTER[ch], 32, 58, { t: 0, mood: -1, legs: true, noHat: true });
    spriteCache[ch] = { body, hat };
    return spriteCache[ch];
  }
  function drawFlyer(c, f, a, now) {
    const sp = charSprite(f.char);
    const to = [DOOR_X, 70];
    const e = a;
    const x = f.from[0] + (to[0] - f.from[0]) * e;
    const y = f.from[1] + (to[1] - f.from[1]) * e - Math.sin(e * Math.PI) * 50;
    const sc2 = 2 - 1.5 * e;
    c.save(); c.translate(Math.round(x), Math.round(y)); c.rotate(e * 9); c.scale(sc2, sc2);
    c.drawImage(sp.body, -32, -48);
    c.restore();
    // the hat flies up and spins down
    const hx = f.from[0] + 20 * a, hy = f.from[1] - 40 - Math.sin(a * Math.PI) * 50 + a * 30;
    c.save(); c.translate(Math.round(hx), Math.round(hy)); c.rotate(a * 14);
    c.drawImage(sp.hat, -24, -20); c.restore();
  }

  function drawTableStuff(c, v, now) {
    const bb = v.s.bb;
    // community cards
    if (v.mode === 'holdem') {
      for (let i = 0; i < 5; i++) {
        const x = 179 + i * 25, y = 168;
        Art.R(c, x, y, 22, 30, 'rgba(0,40,10,0.25)');
        if (i < v.board.length) {
          const tt = boardTimes[i];
          if (tt && now < tt) continue;
          let dy = 0; if (tt && now < tt + 160) dy = -Math.round((1 - (now - tt) / 160) * 14);
          const glow = myBestHas(v, v.board[i]);
          Art.drawCard(c, v.board[i], x, y + dy, 'mid', { glow });
        }
      }
    }
    // pot
    if (v.pot > 0) Art.money(c, 240, v.mode === 'holdem' ? 210 : 196, v.pot, bb);
    // seats
    v.seats.forEach((p, i) => {
      if (!p) return;
      const vp = vpOf(i), S0 = SPOTS[vp];
      if (p.stack > 0) Art.money(c, S0.stack[0], S0.stack[1], p.stack, bb);
      if (p.bet > 0) Art.money(c, S0.bet[0], S0.bet[1], p.bet, bb);
      if (vp !== 0 && p.cards && v.phase === 'handover' && !p.folded) {
        const n = p.cards.length, step = n === 2 ? 15 : 10;
        const x0 = S0.cards[0] - ((n - 1) * step + 14) / 2;
        p.cards.forEach((cd, k) => Art.drawCard(c, cd, x0 + k * step, S0.cards[1] - 6, 'small', { glow: p.best && p.best.includes(cd) && isWinner(v, p.pid) }));
      }
    });
    if (v.dealer >= 0 && v.seats[v.dealer]) { const b = SPOTS[vpOf(v.dealer)].btn; Art.dealerButton(c, b[0], b[1]); }
    if (!myDrink) Art.myGlass(c, 446, 240, myGlassLvl);
  }
  function isWinner(v, pid) { return v.result && v.result.winners.some(w => w.pid === pid); }
  function myBestHas(v, card) {
    if (v.phase !== 'handover' || !v.result) return false;
    return v.seats.some(p => p && p.best && p.best.includes(card) && isWinner(v, p.pid));
  }

  // first-person hand
  function handGeom(n) {
    const step = n === 2 ? 30 : 22, x0 = n === 2 ? 30 : 16;
    return { step, x0, w: (n - 1) * step + 34 };
  }
  const HAND_LOW = 234, HAND_HIGH = 192;
  function handTop() { return HAND_LOW - handLift * (HAND_LOW - HAND_HIGH); }
  function drawMyHand(c, v, now, dt) {
    const m = v ? me() : null;
    const myChar = m ? ROSTER[m.char] : (S && S.view ? ROSTER[(meSpec() || {}).char || 0] : ROSTER[0]);
    if (!m || !m.cards || !m.cards.length) { handLift += (0 - handLift) * Math.min(1, dt / 120); return; }
    const n = m.cards.length;
    const G = handGeom(n);
    const shown = dealtCount(Object.assign({}, m, { n }), now);
    const myTurnDraw = v.phase === 'draw' && v.toAct === mySeat();
    const hoverHand = mouse.inside && mouse.x < G.x0 + G.w + 8 && mouse.y > handTop() - 6;
    const target = (handPinned || myTurnDraw) ? 1 : 0;
    handLift += (target - handLift) * Math.min(1, dt / 90);
    const top = Math.round(handTop());
    hoverCard = -1;
    if (hoverHand && handLift > 0.6) {
      for (let i = n - 1; i >= 0; i--) { const x = G.x0 + i * G.step; if (mouse.x >= x && mouse.x < x + (i === n - 1 ? 34 : G.step)) { hoverCard = i; break; } }
    }
    const skin = myChar.skin, sleeve = myChar.coat;
    Art.handBack(c, G.x0, top, G.w, sleeve, skin);
    for (let i = 0; i < shown; i++) {
      const x = G.x0 + i * G.step;
      let y = top + Math.round(Math.abs(i - (n - 1) / 2) * 2);
      if (hoverCard === i && myTurnDraw) y -= 4;
      if (selected.has(i)) y -= 12;
      const glow = v.phase === 'handover' && m.best && m.best.includes(m.cards[i]) && isWinner(v, m.pid);
      Art.drawCard(c, m.cards[i], x, y, 'big', { dim: m.folded, glow });
      if (selected.has(i)) { Art.R(c, x + 1, y + 1, 32, 3, '#c4262e'); }
    }
    Art.handFront(c, G.x0, top, G.w, skin);
  }

  // ---------------- overlay (crisp text) ----------------
  function drawOverlay(now) {
    const o = oc, k = overlay.width / W;
    o.clearRect(0, 0, overlay.width, overlay.height);
    const v = S && S.view && S.view.phase !== 'lobby' ? S.view : null;
    const shadowText = (txt, x, y, size, col, font, align) => {
      o.font = `${Math.round(size * k)}px ${font || 'Rye'}`;
      o.textAlign = align || 'center'; o.textBaseline = 'middle';
      o.lineWidth = Math.max(2, 2.2 * k); o.strokeStyle = 'rgba(20,8,2,0.95)'; o.lineJoin = 'round';
      o.strokeText(txt, x * k, y * k); o.fillStyle = col; o.fillText(txt, x * k, y * k);
    };

    // text on the wanted posters
    {
      const plist = posters.length ? posters : MENU_POSTERS;
      plist.forEach((ps, i) => {
        const sl = POSTER_SLOTS[i]; if (!sl || !ps || ps.vacant) return;
        const cx = (sl[0] + 10) * k;
        o.textAlign = 'center'; o.textBaseline = 'middle';
        o.fillStyle = '#6a1a10'; o.font = `${Math.round(3.3 * k)}px Rye`;
        o.fillText(T('wanted'), cx, (sl[1] + 2.8) * k);
        o.fillStyle = '#2e1a0c'; o.font = `${Math.round(3.4 * k)}px Rye`;
        let nm = ps.name; while (o.measureText(nm).width > 18 * k && nm.length > 3) nm = nm.slice(0, -1);
        o.fillText(nm, cx, (sl[1] + 24.2) * k);
        if (ps.captured) {
          // a red X painted with a brush, stroke by stroke
          const prog = ps.paintT0 ? Math.min(1, (performance.now() - ps.paintT0) / 1100) : 1;
          paintX(o, k, sl[0], sl[1], prog, ps.name);
        }
      });
    }

    if (!v) {
      if (!S) { // demo names in menu

      }
      drawBubbles(now, k, null);
      return;
    }
    const mySeatI = mySeat();
    // seats
    v.seats.forEach((p, i) => {
      if (!p) return;
      const vp = vpOf(i);
      const turn = v.toAct === i && (v.phase === 'bet' || v.phase === 'draw');
      if (vp === 0) {
        if (i !== mySeatI) shadowText(p.name + '  ' + money(p.stack), 240, 262, 6, '#ffe9b0');
        else {
          shadowText((p.troll ? '⚠ ' : '') + p.name, 196, 238, 6, p.troll ? '#ff7a5a' : (turn ? '#9dff9d' : '#ffe9b0'));
          shadowText(money(p.stack), 196, 245.5, 7, '#ffd34d', 'VT323');
          if (p.debt > 0) shadowText(`(${T('debt')} ${money(p.debt)})`, 196, 251.5, 5, '#ff8a7a', 'VT323');
        }
        if (p.bet > 0) shadowText(money(p.bet), SPOTS[0].bet[0] + 18, SPOTS[0].bet[1] - 2, 6, '#ffffff', 'VT323', 'left');
        if (turn) timerBar(o, k, 196, 230, 60, v);
        // my hand name
        if (i === mySeatI && p.cards && p.cards.length && !p.folded) {
          const cards = v.mode === 'holdem' ? p.cards.concat(v.board) : p.cards;
          const eq = myEquity(v, p);
          let label = cards.length >= 5 ? I18N[lang].cats[Poker.evalBest(cards).cat] : '';
          if (eq !== null) label += (label ? ' · ' : '') + T('winChance') + ' ' + Math.round(eq * 100) + '%';
          if (label) {
            const col = eq === null ? '#fff2c0' : (eq >= 0.5 ? '#9dff9d' : (eq >= 0.25 ? '#ffe070' : '#ff9a80'));
            shadowText(label, 76, handTop() - 7, 6, col, 'VT323');
          }
        }
        if (i === mySeatI && p.folded && p.cards && p.cards.length) shadowText(T('folded'), 70, 244, 6, '#d8c8a8', 'VT323');
        return;
      }
      const P = VP[vp], S0 = SPOTS[vp];
      const ny = (getCS(p.pid).hy || P.yb - 84) - 26;
      const col = p.folded && v.phase !== 'between' ? '#b8a890' : (turn ? '#9dff9d' : '#ffe9b0');
      shadowText((p.troll ? '⚠ ' : '') + p.name, P.x, ny, 6, p.troll ? '#ff7a5a' : col);
      shadowText(money(p.stack), P.x, ny + 6.5, 6.5, '#ffd34d', 'VT323');
      if (p.debt > 0) shadowText(`${T('debt')} ${money(p.debt)}`, P.x, ny + 11.5, 4.8, '#ff8a7a', 'VT323');
      if (turn) timerBar(o, k, P.x, ny - 6, 36, v);
      if (p.bet > 0) shadowText(money(p.bet), S0.bet[0], S0.bet[1] + 9, 5.5, '#ffffff', 'VT323');
      const tg = tags[p.pid];
      if (tg && now < tg.until) {
        const col2 = { fold: '#c8b8a0', check: '#bfe4ff', call: '#9dff9d', raise: '#ffb060', bet: '#ffb060', allin: '#ff6050' }[tg.a] || '#ffe9b0';
        shadowText(tg.text, P.x, ny + (p.debt > 0 ? 17 : 12.5), 5.5, col2, 'VT323');
      }
      if (v.phase === 'handover' && p.cards && !p.folded && p.cat !== undefined && p.cat !== null) shadowText(I18N[lang].cats[p.cat], S0.cards[0], S0.cards[1] + 18, 5, isWinner(v, p.pid) ? '#ffe060' : '#e8dcc0', 'VT323');
      if (p.broke) shadowText('💸', P.x, P.yb - 2, 7, '#fff', 'VT323');
    });
    // my action tag
    const mm = me(); if (mm) { const tg = tags[mm.pid]; if (tg && now < tg.until) shadowText(tg.text, 196, 224, 6, '#ffe9b0', 'VT323'); }
    // standing people
    v.specs.filter(p => p.pid !== S.me).forEach((p, i) => {
      const sp = STAND[i % STAND.length];
      shadowText(p.name, sp.x, sp.yb - 46, 5, '#e8dcc0');
      shadowText(p.reason === 'waiting' ? '⏳' : p.reason === 'idle' ? '💤' : (p.reason === 'broke' ? '💸' : '👀'), sp.x, sp.yb - 52, 5, '#fff', 'VT323');
    });
    // pot
    if (v.potTotal > 0) shadowText(T('pot') + ': ' + money(v.potTotal), 240, v.mode === 'holdem' ? 202 : 186, 6.5, '#ffe9b0', 'VT323');
    // my turn
    if (v.toAct === mySeatI && mySeatI >= 0 && (v.phase === 'bet' || v.phase === 'draw')) {
      const left = turnLeft(v);
      const sec = Math.ceil(left / 1000);
      const pulse = 1 + Math.sin(now / 120) * 0.05;
      shadowText(T('yourTurn') + '  ' + sec, 300, 218, 8 * pulse, sec <= 5 ? '#ff7060' : '#9dff9d');
      if (v.phase === 'draw' && selected.size) {
        const G = handGeom(5);
        selected.forEach(i => shadowText('✕', G.x0 + i * G.step + 17, handTop() - 20, 7, '#ff5040', 'VT323'));
      }
    }
    drawBubbles(now, k, v);
    if (bang) {
      const a = (now - bang.t0) / 1100;
      if (a > 1) bang = null;
      else {
        const s = 26 * (0.6 + Math.min(1, a * 4) * 0.6);
        o.save(); o.globalAlpha = a > 0.7 ? (1 - a) / 0.3 : 1;
        shadowText('BANG!', 240, 110, s, '#ffd030');
        o.restore();
      }
    }
  }
  // my chance to win (only I can see it, computed on my own computer)
  let eqKey = '', eqVal = null;
  function myEquity(v, p) {
    const opp = v.seats.filter(q => q && q.pid !== p.pid && !q.folded && q.n > 0).length;
    if (!opp || !p.cards || !p.cards.length) return null;
    const key = p.cards.join(',') + '|' + v.board.join(',') + '|' + opp + '|' + v.mode;
    if (key !== eqKey) {
      eqKey = key;
      eqVal = v.mode === 'holdem' ? Poker.equity('holdem', p.cards, v.board, opp, 900) : Poker.equity('draw', p.cards, [], opp, 900);
    }
    return eqVal;
  }
  function paintX(o, k, px, py, prog, seedStr) {
    let seed = 0; for (const ch of seedStr) seed = (seed * 31 + ch.charCodeAt(0)) % 9973;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed % 1000) / 1000; };
    const strokes = [[[px + 2, py + 3], [px + 18, py + 25]], [[px + 18, py + 4], [px + 2, py + 24]]];
    o.save(); o.lineCap = 'round';
    strokes.forEach((st, si) => {
      const p0 = Math.max(0, Math.min(1, prog * 2 - si));
      if (p0 <= 0) return;
      const [a, b] = st, steps = 26;
      for (let j = 0; j <= steps * p0; j++) {
        const t = j / steps;
        const x = a[0] + (b[0] - a[0]) * t + (rnd() - 0.5) * 0.8, y = a[1] + (b[1] - a[1]) * t + (rnd() - 0.5) * 0.8;
        const r = (1.5 + Math.sin(t * Math.PI) * 0.9 + rnd() * 0.5) * (t < 0.08 ? 1.4 : 1);
        o.fillStyle = `rgba(${150 + Math.floor(rnd() * 40)},${18 + Math.floor(rnd() * 16)},${16 + Math.floor(rnd() * 10)},0.88)`;
        o.beginPath(); o.arc(x * k, y * k, r * k * 0.55, 0, Math.PI * 2); o.fill();
      }
      // paint drips
      if (p0 >= 1) for (let d = 0; d < 2; d++) {
        const t = 0.25 + rnd() * 0.5, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
        const len = 2 + rnd() * 3;
        o.fillStyle = 'rgba(160,24,20,0.85)';
        o.fillRect((x - 0.3) * k, y * k, 0.6 * k, len * k); o.beginPath(); o.arc(x * k, (y + len) * k, 0.45 * k, 0, Math.PI * 2); o.fill();
      }
    });
    o.restore();
  }
  function timerBar(o, k, x, y, w, v) {
    const left = turnLeft(v), frac = Math.max(0, Math.min(1, left / (v.s.timer * 1000)));
    o.fillStyle = 'rgba(20,8,2,0.9)'; o.fillRect((x - w / 2 - 1) * k, (y - 1.5) * k, (w + 2) * k, 3 * k);
    o.fillStyle = frac > 0.5 ? '#6ad06a' : (frac > 0.25 ? '#e8c040' : '#e85040');
    o.fillRect((x - w / 2) * k, (y - 0.8) * k, w * frac * k, 1.6 * k);
  }
  function drawBubbles(now, k, v) {
    const o = oc;
    for (const pid in bubbles) {
      const b = bubbles[pid];
      if (now > b.until) { delete bubbles[pid]; continue; }
      let x, y;
      const s = seatOf(pid);
      if (pid === 'barkeep') { x = barman ? barmanX : 410; y = barman ? 60 : 44; }
      else if (s >= 0) {
        const vp = vpOf(s);
        if (vp === 0) { x = 200; y = 214; }
        else {
          const cs = getCS(pid), hy = cs.hy || VP[vp].yb - 84;
          if (b.act) { x = VP[vp].x + (vp <= 3 ? 40 : -40); y = hy + 8; } // action bubbles sit beside the head
          else { x = VP[vp].x; y = hy - 36; }
        }
      } else if (v) {
        const sp = specSpot(pid); if (!sp) { if (pid === S.me) { x = 200; y = 214; } else continue; } else { x = sp.x; y = sp.yb - 60; }
      } else continue;
      const fs = (b.act ? (b.big ? 9 : 7.5) : 6) * k;
      o.font = b.act ? `${Math.round(fs)}px Rye` : `${Math.round(fs)}px VT323`;
      const maxW = 92 * k;
      const words = b.text.split(' '); const lines = []; let line = '';
      for (const w of words) { const t = line ? line + ' ' + w : w; if (o.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
      if (line) lines.push(line);
      const lw = Math.max(...lines.map(l => o.measureText(l).width));
      const bw = lw + 8 * k, bh = lines.length * fs * 0.95 + 5 * k;
      let bx = x * k - bw / 2; bx = Math.max(3 * k, Math.min(overlay.width - bw - 3 * k, bx));
      let by = y * k - bh;
      // keep bubbles out from under the taunt panel / top edge
      const minTop = (x > 262 ? 34 : 4) * k;
      if (by < minTop) by = minTop;
      const pop = Math.min(1, (now - b.t0) / 120);
      o.save(); o.globalAlpha = Math.min(1, (b.until - now) / 300) ;
      o.translate(x * k, y * k); o.scale(pop, pop); o.translate(-x * k, -y * k);
      o.fillStyle = '#fbf3dc'; o.strokeStyle = b.act ? b.col : '#2a160a'; o.lineWidth = Math.max(1.5, k * (b.act ? 1.4 : 0.9));
      roundRect(o, bx, by, bw, bh, 3 * k); o.fill(); o.stroke();
      const tx = Math.max(bx + 5 * k, Math.min(bx + bw - 5 * k, x * k + (b.act && s >= 0 && vpOf(s) !== 0 ? (vpOf(s) <= 3 ? -bw / 2 + 6 * k : bw / 2 - 6 * k) : 0)));
      o.beginPath(); o.moveTo(tx - 3 * k, by + bh - 0.5); o.lineTo(tx + (b.act && s >= 0 && vpOf(s) !== 0 ? (vpOf(s) <= 3 ? -4 : 4) * k : 1 * k), by + bh + 5 * k); o.lineTo(tx + 3 * k, by + bh - 0.5); o.closePath(); o.fill();
      o.beginPath(); o.moveTo(tx - 3 * k, by + bh); o.lineTo(tx + (b.act && s >= 0 && vpOf(s) !== 0 ? (vpOf(s) <= 3 ? -4 : 4) * k : 1 * k), by + bh + 5 * k); o.lineTo(tx + 3 * k, by + bh); o.stroke();
      o.fillStyle = b.act ? b.col : '#2a160a'; o.textAlign = 'center'; o.textBaseline = 'top';
      lines.forEach((l, i) => o.fillText(l, bx + bw / 2, by + (b.act ? 3 : 2.5) * k + i * fs * 0.95));
      o.restore();
    }
  }
  function roundRect(o, x, y, w, h, r) { o.beginPath(); o.moveTo(x + r, y); o.arcTo(x + w, y, x + w, y + h, r); o.arcTo(x + w, y + h, x, y + h, r); o.arcTo(x, y + h, x, y, r); o.arcTo(x, y, x + w, y, r); o.closePath(); }

  // ============================================================
  //  INPUT
  // ============================================================
  function toScene(ev) {
    const r = frame.getBoundingClientRect();
    return { x: (ev.clientX - r.left) / r.width * W, y: (ev.clientY - r.top) / r.height * H };
  }
  const inGame = () => S && S.view && S.view.phase !== 'lobby' && $('#hud').offsetParent !== null && !$('#hud').classList.contains('hidden');
  scene.parentElement.addEventListener('mousemove', ev => { const p = toScene(ev); mouse.x = p.x; mouse.y = p.y; mouse.inside = true; });
  frame.addEventListener('mouseleave', () => { mouse.inside = false; });
  frame.addEventListener('wheel', ev => {
    if (!inGame()) return;
    if (ev.target.closest && ev.target.closest('#actions, #popup, .screen')) return;
    ev.preventDefault();
    cycleTaunt(ev.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  // click on the canvas (hud is pointer-events:none except controls)
  frame.addEventListener('pointerdown', ev => {
    if (!inGame()) return;
    if (ev.target !== scene && ev.target !== $('#hud')) return;
    const p = toScene(ev);
    mouse.x = p.x; mouse.y = p.y;
    if (ev.pointerType !== 'mouse') mouse.inside = false;
    hideCtx();
    const v = S.view, m = me();
    // my hand
    if (m && m.cards && m.cards.length) {
      const G = handGeom(m.cards.length);
      const top = handTop();
      if (p.x < G.x0 + G.w + 8 && p.y > top - 6) {
        if (v.phase === 'draw' && v.toAct === mySeat() && handLift > 0.6) {
          for (let i = m.cards.length - 1; i >= 0; i--) { const x = G.x0 + i * G.step; if (p.x >= x && p.x < x + (i === m.cards.length - 1 ? 34 : G.step)) { toggleSelect(i); return; } }
          return;
        }
        // click / tap on the hand: lift the cards, click again: put them back
        handPinned = !handPinned;
        Sound.play('card');
        return;
      }
    }
    // a character?
    const hit = hitPerson(p);
    if (hit) openCtx(hit, p);
  });
  function hitPerson(p) {
    const v = S.view;
    for (let vp = 1; vp <= 5; vp++) {
      const seat = (vp + baseSeat()) % 6, q = v.seats[seat];
      if (!q) continue;
      const P = VP[vp];
      if (Math.abs(p.x - P.x) < 30 && p.y > P.yb - 110 && p.y < P.yb + 6) return q;
    }
    const list = v.specs.filter(q => q.pid !== S.me);
    for (let i = 0; i < list.length; i++) { const sp = STAND[i % STAND.length]; if (Math.abs(p.x - sp.x) < 14 && p.y > sp.yb - 50 && p.y < sp.yb + 20) return list[i]; }
    return null;
  }
  function openCtx(q, p) {
    const v = S.view;
    if (q.pid === S.me || q.pid === v.hostPid || v.vote) return;
    const cm = $('#ctxmenu');
    cm.innerHTML = `<div class="nm">${escapeHtml(q.name)}</div><button class="wood red small" id="cmShoot">🔫 ${T('kickStart')}</button>`;
    cm.style.left = (p.x * U) + 'px'; cm.style.top = Math.min(p.y * U, (H - 40) * U) + 'px';
    cm.classList.remove('hidden');
    $('#cmShoot').addEventListener('click', () => { sendIntent({ t: 'kick', target: q.pid }); hideCtx(); });
  }
  function hideCtx() { $('#ctxmenu').classList.add('hidden'); }

  window.addEventListener('keydown', ev => {
    if (ev.target && (ev.target.tagName === 'INPUT' && ev.target.type !== 'range' || ev.target.tagName === 'SELECT')) {
      if (ev.key === 'Enter' && ev.target.id === 'joinCode') $('#btnConnect').click();
      return;
    }
    if (!inGame()) return;
    const k = ev.key.toLowerCase();
    if (k === 't') sayTaunt();
    else if (k === 'arrowup') cycleTaunt(-1);
    else if (k === 'arrowdown') cycleTaunt(1);
    else if (k === 'f') doAct('fold');
    else if (k === 'c') doAct('call');
    else if (k === 'r') doAct('raise');
    else if (k >= '1' && k <= '5') toggleSelect(+k - 1);
    else if (k === 'enter') { const v = S.view; if (v.phase === 'draw') doDraw(selected.size === 0); }
    else if (k === 'escape') { if ($('#scr-pause').classList.contains('hidden')) { syncAudioUI(); show('scr-pause'); document.body.classList.add('ingame'); } else hideScreens(); }
  });

  // ============================================================
  //  BOOT
  // ============================================================
  syncAudioUI();
  applyI18n();
  show('scr-main');
  const qs = new URLSearchParams(location.search);
  if (qs.get('join')) { show('scr-join'); $('#joinCode').value = qs.get('join').toUpperCase(); $('#joinName').value = nameInput.value; }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => { });
  requestAnimationFrame(frameLoop);

  // test hooks (used for screenshots / debugging)
  window.DMH = { get S() { return S; }, onEvent, say, setLang, startSession, show, hideScreens, selected, setHand: (v) => { handPinned = v; } };
})();
