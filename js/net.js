// ============================================================
//  DEAD MAN'S HAND — online play with PeerJS (host = the dealer's
//  computer, everybody else connects to it with a saloon code)
// ============================================================
'use strict';

const Net = (() => {
  const PREFIX = 'deadmanshand-saloon-';
  const ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function makeCode() { let s = ''; for (let i = 0; i < 5; i++) s += ALPH[Math.floor(Math.random() * ALPH.length)]; return s; }
  function available() { return typeof Peer !== 'undefined'; }

  // ---------- host ----------
  function host(handlers) {
    const conns = {};
    let peer = null, code = null, tries = 0;
    function open() {
      code = makeCode();
      peer = new Peer(PREFIX + code, { debug: 0 });
      peer.on('open', () => handlers.onReady(code));
      peer.on('error', (e) => {
        if (e.type === 'unavailable-id' && tries++ < 5) { peer.destroy(); open(); return; }
        handlers.onError && handlers.onError(e);
      });
      peer.on('connection', (conn) => {
        conn.on('open', () => { });
        conn.on('data', (m) => {
          if (!m || typeof m !== 'object') return;
          if (m.t === 'hello') {
            const r = handlers.onHello(conn.peer, String(m.name || '').slice(0, 14));
            if (!r.ok) { try { conn.send({ t: 'reject', reason: r.reason }); } catch (e) { } setTimeout(() => conn.close(), 800); return; }
            conns[conn.peer] = conn;
            try { conn.send({ t: 'welcome', pid: conn.peer }); } catch (e) { }
            handlers.onJoined && handlers.onJoined(conn.peer);
            return;
          }
          if (conns[conn.peer]) handlers.onMsg(conn.peer, m);
        });
        conn.on('close', () => { if (conns[conn.peer]) { delete conns[conn.peer]; handlers.onLeave(conn.peer); } });
        conn.on('error', () => { });
      });
    }
    open();
    return {
      get code() { return code; },
      send(pid, m) { const c = conns[pid]; if (c && c.open) { try { c.send(m); } catch (e) { } } },
      broadcast(m) { for (const pid in conns) this.send(pid, m); },
      pids() { return Object.keys(conns); },
      kick(pid) { this.send(pid, { t: 'kicked' }); setTimeout(() => { const c = conns[pid]; delete conns[pid]; if (c) c.close(); }, 1500); },
      close() { for (const pid in conns) { try { conns[pid].close(); } catch (e) { } } if (peer) peer.destroy(); }
    };
  }

  // ---------- client ----------
  function join(code, name, handlers) {
    code = String(code || '').trim().toUpperCase();
    const peer = new Peer({ debug: 0 });
    let conn = null, closedByUs = false, welcomed = false;
    const timer = setTimeout(() => { if (!welcomed) { handlers.onError && handlers.onError('timeout'); try { peer.destroy(); } catch (e) { } } }, 15000);
    peer.on('open', () => {
      conn = peer.connect(PREFIX + code, { reliable: true });
      conn.on('open', () => conn.send({ t: 'hello', name }));
      conn.on('data', (m) => {
        if (m && m.t === 'welcome') { welcomed = true; clearTimeout(timer); }
        handlers.onMsg(m);
      });
      conn.on('close', () => { if (!closedByUs) handlers.onClose && handlers.onClose(); });
      conn.on('error', () => { });
    });
    peer.on('error', (e) => { clearTimeout(timer); if (!welcomed) handlers.onError && handlers.onError(e.type || 'error'); });
    return {
      send(m) { if (conn && conn.open) { try { conn.send(m); } catch (e) { } } },
      close() { closedByUs = true; try { conn && conn.close(); } catch (e) { } try { peer.destroy(); } catch (e) { } }
    };
  }

  return { host, join, available, makeCode };
})();
