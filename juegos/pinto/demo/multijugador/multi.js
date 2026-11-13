/* PINTO online (2 to 6 players): one creates a room, the others join with its
   code. The room creator's browser is the referee: it runs pinto-engine.js and
   sends each player only what they're allowed to see (their own hand, how many
   cards the others hold, the tables and the pile). Connection: PeerJS (WebRTC,
   free public broker, no backend of our own). Add ?transporte=local to test with
   several tabs of the same browser (BroadcastChannel).
   After someone plays, their turn stays open for 5 s; the next player may
   interrupt it with a valid play (leaflet, "Desarrollo del turno"). */
(function () {
  'use strict';
  var E = window.PintoEngine;
  var root = document.getElementById('mp');
  var board = document.getElementById('board');
  if (!E || !root || !board) return;

  var BASE = board.getAttribute('data-cards') || '../../img/cartas/';
  var VER = '?v=5'; // card images version (keep in sync with the HTML pages)
  var CHAIN_MS = 5000;
  var FLY_MS = 750;
  var DOUBLE_TAP_MS = 380;
  var MAX_PLAYERS = 6;
  var ID_PREFIX = 'korilabs-pinto-';
  var CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  var params = new URLSearchParams(location.search);
  var LOCAL = params.get('transporte') === 'local';

  var INFO = {
    reb: 'Sobre un Ritmo Bajo, otro Rebufo o con vía libre. Puedes acompañarlo con Ritmos Altos de uno o dos valores consecutivos (por ejemplo Rebufo + 6 + 7), jugarlo solo o con otros Rebufos. Si va acompañado, manda el valor más alto.',
    roja: 'Sobre cualquier carta o con vía libre. Reinicia el ritmo sin descartar: la pila se queda en la mesa. Tu turno termina y el siguiente tiene vía libre.',
    ama: 'Sobre un Ritmo Bajo, otra Bandera Amarilla o con vía libre. El siguiente solo puede responder con un Ritmo Bajo, otra Amarilla, una Bandera Roja o una Bandera a Cuadros.',
    azul: 'Sobre una carta de Ritmo, otra Bandera Azul o con vía libre. El siguiente jugador en carrera pierde su turno y quien sigue responde a la carta que quedó debajo de la Azul.',
    cuad: 'Sobre cualquier carta o con vía libre. Toda la pila se retira de la partida, tu turno termina y el siguiente tiene vía libre. Solo una por turno.',
    vr: 'Sobre cualquier carta excepto una Bandera Amarilla, o con vía libre. Marca el ritmo más alto: solo se responde con otra Vuelta Rápida, una Bandera Roja o una Bandera a Cuadros.'
  };

  /* ---------- Lobby elements ---------- */
  var lobby = document.getElementById('mp-lobby');
  var nameInput = document.getElementById('mp-name');
  var codeInput = document.getElementById('mp-code');
  var statusEl = document.getElementById('mp-status');
  var roomBox = document.getElementById('mp-room');
  var waitBox = document.getElementById('mp-wait');
  var game = document.getElementById('mp-game');
  var logList = document.getElementById('log');

  try { nameInput.value = localStorage.getItem('pd-mp-name') || ''; } catch (e) { /* storage blocked */ }
  if (params.get('sala')) codeInput.value = params.get('sala').toUpperCase();

  /* ---------- Shared state ---------- */
  var role = null;            // 'host' or 'guest'
  var myName = '';
  var link = null;            // guest: connection to the host. host: transport accepting guests
  var view = null;            // what this screen shows (built by the host)
  var selected = [], message = '', messageError = false, infoCard = null;
  var lastTap = { id: null, time: 0 }, drag = null, suppressClick = false;
  var origins = {}, hiddenTips = {}, arriving = {};

  // Host only: everyone in the room, in seat order (index = player id in the engine)
  // { name, key (connection id; null for the host), connected }
  var roster = [];
  var s = null, chainTimer = null, chainDeadline = 0, sentMoves = [], caption = '';
  var pending = {};           // guests connected but not introduced yet: key -> send()

  function setStatus(text, isError) {
    statusEl.textContent = text || '';
    statusEl.classList.toggle('is-error', !!isError);
  }
  function load(key, fb) { try { var v = localStorage.getItem(key); return v === null ? fb : v; } catch (e) { return fb; } }
  function save(key, v) { try { localStorage.setItem(key, v); } catch (e) { /* storage blocked */ } }
  function tipHidden(k) { return hiddenTips[k] || load('pd-tip2-' + k, '') === '1'; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- Transport ----------
     Host side: handlers.join(key, send) / data(key, msg) / leave(key)
     Guest side: handlers.open() / data(msg) / close()                     */

  function connectionError(type) {
    if (type === 'peer-unavailable') return 'No encontramos esa sala. Revisa el código o pídele a quien la creó que la abra de nuevo.';
    if (type === 'unavailable-id') return 'Ese código ya está en uso. Crea otra sala.';
    if (type === 'network' || type === 'server-error' || type === 'socket-error' || type === 'socket-closed')
      return 'No pudimos conectar con el servidor de salas. Revisa tu conexión a internet e intenta de nuevo.';
    if (type === 'library-missing') return 'No se pudo cargar el sistema de salas. Revisa tu conexión y recarga la página.';
    if (type === 'browser-incompatible') return 'Este navegador no permite partidas en línea. Prueba con Chrome, Safari o Firefox actualizados.';
    return 'Algo falló con la conexión (' + type + '). Intenta de nuevo.';
  }

  function localHost(code, h) {
    var ch = new BroadcastChannel('pinto-' + code);
    ch.onmessage = function (e) {
      var m = e.data;
      if (!m || m.to !== 'host') return;
      if (m.sys === 'knock') { ch.postMessage({ to: m.from, sys: 'welcome' }); h.join(m.from, function (d) { ch.postMessage({ to: m.from, data: d }); }); return; }
      if (m.sys === 'bye') { h.leave(m.from); return; }
      if (m.data) h.data(m.from, m.data);
    };
    window.addEventListener('pagehide', function () { ch.postMessage({ to: 'all', sys: 'bye' }); });
    h.ready();
  }
  function localGuest(code, h) {
    var ch = new BroadcastChannel('pinto-' + code);
    var me = 'g' + Math.random().toString(36).slice(2, 8);
    ch.onmessage = function (e) {
      var m = e.data;
      if (!m || (m.to !== me && m.to !== 'all')) return;
      if (m.sys === 'welcome') { h.open(); return; }
      if (m.sys === 'bye') { h.close(); return; }
      if (m.data) h.data(m.data);
    };
    ch.postMessage({ to: 'host', from: me, sys: 'knock' });
    window.addEventListener('pagehide', function () { ch.postMessage({ to: 'host', from: me, sys: 'bye' }); });
    return { send: function (d) { ch.postMessage({ to: 'host', from: me, data: d }); } };
  }

  function peerHost(code, h) {
    if (!window.Peer) { h.error('library-missing'); return; }
    var peer = new window.Peer(ID_PREFIX + code.toLowerCase());
    var n = 0;
    peer.on('error', function (err) { h.error(err && err.type ? err.type : 'unknown'); });
    peer.on('open', h.ready);
    peer.on('connection', function (c) {
      var key = 'c' + (++n);
      c.on('open', function () { h.join(key, function (d) { if (c.open) c.send(d); }); });
      c.on('data', function (d) { h.data(key, d); });
      c.on('close', function () { h.leave(key); });
      c.on('error', function () { h.leave(key); });
    });
  }
  function peerGuest(code, h) {
    if (!window.Peer) { h.error('library-missing'); return null; }
    var t = { conn: null, send: function (d) { if (t.conn && t.conn.open) t.conn.send(d); } };
    var peer = new window.Peer();
    peer.on('error', function (err) { h.error(err && err.type ? err.type : 'unknown'); });
    peer.on('open', function () {
      var c = peer.connect(ID_PREFIX + code.toLowerCase(), { reliable: true });
      t.conn = c;
      c.on('open', h.open);
      c.on('data', h.data);
      c.on('close', h.close);
      c.on('error', h.close);
    });
    return t;
  }

  /* ---------- Lobby actions ---------- */

  function needName() {
    myName = nameInput.value.trim().slice(0, 16);
    if (!myName) { setStatus('Escribe tu nombre para empezar.', true); nameInput.focus(); return false; }
    save('pd-mp-name', myName);
    return true;
  }
  function lockLobby() { lobby.querySelectorAll('.mp-options button, .mp-options input, #mp-name').forEach(function (el) { el.disabled = true; }); }
  function unlockLobby() { lobby.querySelectorAll('button, input').forEach(function (el) { el.disabled = false; }); }

  document.getElementById('mp-create').addEventListener('click', function () {
    if (!needName()) return;
    role = 'host';
    roster = [{ name: myName, key: null, connected: true }];
    var code = '';
    for (var i = 0; i < 4; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    lockLobby();
    setStatus('Creando la sala…');
    var h = {
      ready: function () { onRoomReady(code); },
      join: guestJoined, data: guestData, leave: guestLeft,
      error: function (type) { setStatus(connectionError(type), true); unlockLobby(); }
    };
    if (LOCAL) localHost(code, h); else peerHost(code, h);
  });

  document.getElementById('mp-join').addEventListener('click', function () {
    if (!needName()) return;
    var code = codeInput.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length !== 4) { setStatus('El código tiene 4 letras o números, por ejemplo K7QM.', true); codeInput.focus(); return; }
    role = 'guest';
    lockLobby();
    setStatus('Conectando con la sala ' + code + '…');
    var h = {
      open: function () { link.send({ t: 'hello', name: myName }); },
      data: hostData,
      close: function () { lostHost(); },
      error: function (type) { setStatus(connectionError(type), true); unlockLobby(); }
    };
    link = LOCAL ? localGuest(code, h) : peerGuest(code, h);
    setTimeout(function () {
      if (role === 'guest' && !view && waitBox.hidden) setStatus('Está tardando más de lo normal. Algunas redes (de trabajo o del colegio) bloquean las partidas en línea; prueba con otra red o con datos móviles.', true);
    }, 15000);
  });

  document.getElementById('mp-start').addEventListener('click', function () {
    if (role === 'host' && connectedCount() >= 2) startGame();
  });

  function onRoomReady(code) {
    var url = location.origin + location.pathname + '?sala=' + code + (LOCAL ? '&transporte=local' : '');
    roomBox.hidden = false;
    roomBox.querySelector('.mp-room__code').textContent = code;
    var linkEl = roomBox.querySelector('.mp-room__link');
    linkEl.textContent = url;
    roomBox.querySelector('[data-act="copy"]').onclick = function (e) {
      var btn = e.currentTarget;
      var done = function () { btn.textContent = 'Enlace copiado'; };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { selectText(linkEl); });
      else selectText(linkEl);
    };
    setStatus('');
    renderWaiting();
  }
  function selectText(el) { var r = document.createRange(); r.selectNodeContents(el); var sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); }

  // Who's in the room before the race starts (host and guests see the same list)
  function renderWaiting(names) {
    names = names || roster.map(function (r) { return r.name; });
    waitBox.hidden = false;
    var list = names.map(function (n, i) { return '<li>' + esc(n) + (i === 0 ? ' <span>crea la sala</span>' : '') + '</li>'; }).join('');
    var empty = '';
    for (var k = names.length; k < MAX_PLAYERS; k++) empty += '<li class="is-empty">Lugar libre</li>';
    waitBox.querySelector('.mp-wait__list').innerHTML = list + empty;
    var startBtn = document.getElementById('mp-start');
    var hint = waitBox.querySelector('.mp-wait__hint');
    if (role === 'host') {
      startBtn.hidden = false;
      startBtn.disabled = names.length < 2;
      hint.textContent = names.length < 2 ? 'Pásales el código. Cuando entre al menos una persona puedes empezar.' : 'Pueden entrar hasta ' + MAX_PLAYERS + ' jugadores. Empieza cuando estén todos.';
    } else {
      startBtn.hidden = true;
      hint.textContent = 'Esperando a que ' + (names[0] || 'quien creó la sala') + ' empiece la carrera…';
    }
  }

  function showGame() { if (game.hidden) { lobby.hidden = true; game.hidden = false; setStatus(''); } }

  /* ---------- Host: room and referee ---------- */

  function connectedCount() { return roster.filter(function (r) { return r.connected; }).length; }
  function slotByKey(key) { for (var i = 0; i < roster.length; i++) if (roster[i].key === key) return i; return -1; }

  function guestJoined(key, send) { pending[key] = send; }

  function guestData(key, m) {
    if (!m || !m.t) return;
    if (m.t === 'hello') {
      var send = pending[key];
      if (!send) return;
      var name = String(m.name || 'Invitado').slice(0, 16);
      var pid = -1;
      if (s) {
        // Rejoining a race in progress: take back the empty seat with the same name (or any empty seat)
        roster.forEach(function (r, i) { if (pid < 0 && !r.connected && r.name === name) pid = i; });
        roster.forEach(function (r, i) { if (pid < 0 && !r.connected && i > 0) pid = i; });
        if (pid < 0) { send({ t: 'full', msg: 'La carrera ya empezó y no hay lugares libres.' }); return; }
        roster[pid].key = key; roster[pid].connected = true; roster[pid].send = send;
        sentMoves[pid] = s.moves.length;
        broadcast();
        return;
      }
      if (roster.length >= MAX_PLAYERS) { send({ t: 'full', msg: 'La sala está llena (máximo ' + MAX_PLAYERS + ' jugadores).' }); return; }
      roster.push({ name: uniqueName(name), key: key, connected: true, send: send });
      lobbyBroadcast();
    } else if (m.t === 'act') {
      var p = slotByKey(key);
      if (p > 0) act(p, m.a, m);
    } else if (m.t === 'rematch') {
      if (s && s.over) startGame();
    }
  }

  function uniqueName(name) {
    var taken = roster.map(function (r) { return r.name; }), n = name, k = 2;
    while (taken.indexOf(n) >= 0) n = name + ' ' + (k++);
    return n;
  }

  function guestLeft(key) {
    var p = slotByKey(key);
    if (p < 0) return;
    if (!s) { roster.splice(p, 1); lobbyBroadcast(); return; }
    roster[p].connected = false;
    roster[p].send = null;
    broadcast(); // every view carries a notice while someone is away
  }

  function lobbyBroadcast() {
    var names = roster.map(function (r) { return r.name; });
    renderWaiting(names);
    roster.forEach(function (r) { if (r.send) r.send({ t: 'lobby', names: names }); });
  }

  function startGame() {
    clearTimeout(chainTimer);
    // Players who left before the start lose their seat
    roster = roster.filter(function (r) { return r.connected; });
    var n = roster.length, ids = [];
    for (var i = 0; i < n; i++) ids.push(i);
    s = E.newGame({ players: n, names: roster.map(function (r) { return r.name; }), openTurns: ids, secondPerson: false });
    sentMoves = ids.map(function () { return 0; });
    caption = '<strong>' + esc(s.players[s.current].name) + '</strong> tiene el Ritmo ' + s.opening + ' y arranca.';
    message = '';
    showGame();
    broadcast();
  }

  var PAST = { juega: 'jugó', recoge: 'recogió', revela: 'reveló', toma: 'tomó', pierde: 'perdió', cruza: 'cruzó', se: 'se', no: 'no' };
  function pastTense(entry) {
    var name = s.players[entry.pid].name;
    var rest = entry.text.indexOf(name + ' ') === 0 ? entry.text.slice(name.length + 1) : entry.text;
    var verb = rest.split(' ')[0];
    return PAST[verb] ? PAST[verb] + rest.slice(verb.length) : rest;
  }

  function act(pid, a, m) {
    if (!s || s.over) return;
    var before = s.log.length, r;
    if (s.current !== pid) {
      // Interrupting the open turn of the player before you
      if (a !== 'play' || !s.chain || E.nextPlayer(s) !== pid) { sendError(pid, 'Espera tu turno.'); return; }
      r = E.interrupt(s, pid, (m.ids || []).map(Number));
      if (r.error) { sendError(pid, r.error); return; }
      if (r.canChain && s.current === pid) startChain(); else clearTimeout(chainTimer);
    } else if (a === 'end') {
      if (!s.chain) return;
      clearTimeout(chainTimer);
      E.endChain(s);
    } else if (a === 'play') {
      r = E.play(s, (m.ids || []).map(Number));
      if (r.error) { sendError(pid, r.error); return; }
      if (r.canChain && s.current === pid) startChain(); else clearTimeout(chainTimer);
    } else if (a === 'pickup') {
      if (s.chain || E.legalMoves(s).length) { sendError(pid, 'Tienes una jugada válida: no puedes recoger la pila.'); return; }
      clearTimeout(chainTimer);
      E.pickUp(s);
    } else if (a === 'reveal') {
      r = E.revealToHand(s, Number(m.idx));
      if (r.error) { sendError(pid, r.error); return; }
      if (r.broke) clearTimeout(chainTimer); else if (s.chain) startChain();
    } else return;
    var entries = s.log.slice(before);
    if (entries.length) {
      var who = s.players[entries[0].pid];
      caption = '<strong>' + esc(who.name) + '</strong> ' + esc(entries.filter(function (l) { return l.pid === who.id; }).map(pastTense).join('. '));
      // A Blue flag also says who lost the turn
      entries.forEach(function (l) { if (l.pid !== who.id) caption += '<br>' + esc(l.text); });
    }
    broadcast();
  }

  function startChain() {
    clearTimeout(chainTimer);
    chainDeadline = Date.now() + CHAIN_MS;
    chainTimer = setTimeout(function () {
      if (s && s.chain) { E.endChain(s); broadcast(); }
    }, CHAIN_MS);
  }

  function sendError(pid, msg) {
    if (pid === 0) { say(msg, true); renderSafe(); }
    else if (roster[pid] && roster[pid].send) roster[pid].send({ t: 'error', msg: msg });
  }

  // Seats around the table, seen from player `pid`: 1 = next player (on your left), then clockwise.
  // The side of the table for each seat comes from E.seatSides(n).
  function seatOf(pid, other) {
    var n = s.players.length;
    return (other - pid + n) % n;
  }

  // What player `pid` is allowed to see
  function viewFor(pid) {
    var p = s.players[pid], mine = s.current === pid && !s.over;
    var canCut = !mine && E.canInterrupt(s, pid);
    var moves = s.moves.slice(sentMoves[pid]).map(function (mv) {
      var seat = seatOf(pid, mv.pid);
      if (mv.type === 'reveal') return { type: 'reveal', seat: seat, card: seat === 0 ? mv.card : null };
      if (mv.type === 'pickup') return { type: 'pickup', seat: seat, n: mv.n };
      return { type: 'play', seat: seat, cards: mv.cards, discarded: mv.discarded };
    });
    sentMoves[pid] = s.moves.length;
    var others = s.players.filter(function (o) { return o.id !== pid; }).map(function (o) {
      return {
        seat: seatOf(pid, o.id), name: o.name, hand: o.hand.length, visible: o.visible, hidden: o.hidden.length,
        place: o.place, turn: s.current === o.id && !s.over, away: !roster[o.id].connected
      };
    });
    return {
      n: s.players.length,
      me: { name: p.name, hand: p.hand, visible: p.visible, hidden: p.hidden.length, place: p.place },
      others: others,
      pile: s.pile.slice(-4),
      turn: s.over ? null : (mine ? 'me' : s.players[s.current].name),
      opening: s.opening,
      chain: mine ? s.chain : null,
      interrupt: canCut ? s.players[s.current].name : null,
      chainLeft: mine && s.chain ? Math.max(0, chainDeadline - Date.now()) : 0,
      playable: mine ? Object.keys(E.playableIds(s)).map(Number) : canCut ? [].concat.apply([], E.movesFor(s, pid)).map(function (c) { return c.id; }) : [],
      noMoves: mine && !s.chain && p.hand.length > 0 && E.legalMoves(s).length === 0,
      hiddenStage: mine && !p.hand.length && !p.visible.length && p.hidden.length > 0,
      log: s.log.slice(-8).map(function (l) { return { text: l.text, mine: l.pid === pid }; }),
      caption: caption,
      notice: roster.filter(function (r) { return !r.connected; }).map(function (r) { return r.name + ' se desconectó; puede volver a entrar con el mismo código.'; }).join(' '),
      over: s.over,
      results: s.over ? s.finished.map(function (id) { return { name: s.players[id].name, place: s.players[id].place, me: id === pid }; }) : null,
      moves: moves
    };
  }

  function broadcast() {
    applyView(viewFor(0));
    roster.forEach(function (r, pid) { if (pid > 0 && r.connected && r.send) r.send({ t: 'view', v: viewFor(pid) }); });
  }

  /* ---------- Guest: messages from the host ---------- */

  function hostData(m) {
    if (!m || !m.t) return;
    if (m.t === 'lobby') { setStatus(''); renderWaiting(m.names); }
    else if (m.t === 'view') { showGame(); applyView(m.v); }
    else if (m.t === 'error') { say(m.msg, true); renderSafe(); }
    else if (m.t === 'full') { setStatus(m.msg, true); unlockLobby(); }
  }
  function lostHost() {
    var msg = 'Se perdió la conexión con la sala. Recarga la página y vuelve a entrar con el mismo código y tu nombre.';
    setStatus(msg, true);
    say(msg, true);
    renderSafe();
  }

  function sendAction(a, extra) {
    var m = extra || {};
    m.t = 'act'; m.a = a;
    if (role === 'host') act(0, a, m);
    else link.send(m);
  }

  /* ---------- Rendering ---------- */

  var $ = function (sel) { return board.querySelector(sel); };
  var seats = [0, 1, 2, 3, 4, 5].map(function (i) { return $('[data-seat="' + i + '"]'); });
  var ORIENT_BY_SIDE = { left: 90, right: -90, top: 180, tl: 180, tr: 180 };
  function sideOf(seat) { return seat === 0 || !view ? '' : E.seatSides(view.n)[seat - 1]; }
  var resultBox = $('.pd-result');

  function src(card) { return BASE + (card ? E.cardFile(card) : 'reverso') + '.webp' + VER; }
  function img(card, cls, extra) {
    return '<img class="pd-card ' + (cls || '') + '" src="' + src(card) + '" alt="' + (card ? E.cardName(card) : 'Carta boca abajo') + '" width="660" height="922" draggable="false"' + (extra || '') + '>';
  }
  function plural(n, a, b) { return n + ' ' + (n === 1 ? a : b); }
  function label(name, sub) { return '<p class="pd-label"><strong>' + esc(name) + '</strong>' + (sub ? '<span>' + sub + '</span>' : '') + '</p>'; }

  function slots(visible, hiddenCount, cls, revealable) {
    var n = Math.max(visible.length, hiddenCount), html = '';
    for (var k = 0; k < n; k++) {
      var inner = (k < hiddenCount ? img(null) : '') + (visible[k] ? img(visible[k], 'pd-card--up') : '');
      html += revealable && k < hiddenCount
        ? '<button type="button" class="pd-slot pd-hidden-btn" data-hidden="' + k + '" aria-label="Revelar carta oculta ' + (k + 1) + '">' + inner + '</button>'
        : '<div class="pd-slot">' + inner + '</div>';
    }
    return '<div class="' + cls + '">' + html + '</div>';
  }

  function fan(n) {
    var k = Math.min(n, 12), html = '', spread = k > 1 ? Math.min(80, 8 * k) : 0;
    for (var j = 0; j < k; j++) {
      var a = k > 1 ? -spread / 2 + j * spread / (k - 1) : 0;
      html += img(null, 'pd-fan__card', ' style="transform:rotate(' + a.toFixed(1) + 'deg)"');
    }
    return '<div class="pd-fan">' + html + '</div>';
  }

  function renderSafe() { if (view) render(); }

  function render() {
    var v = view, me = v.me, mine = v.turn === 'me', cutting = !!v.interrupt;
    var playable = {};
    v.playable.forEach(function (id) { playable[id] = true; });

    board.classList.toggle('pd-board--duo', v.n === 2);
    board.classList.toggle('pd-board--many', v.n >= 5);
    // Other players around the table
    [1, 2, 3, 4, 5].forEach(function (seat) {
      var o = v.others.filter(function (x) { return x.seat === seat; })[0], el = seats[seat];
      el.hidden = !o;
      el.className = 'pd-seat' + (o ? ' pd-seat--' + sideOf(seat) : '');
      if (!o) { el.innerHTML = ''; return; }
      el.classList.toggle('is-turn', o.turn);
      el.classList.toggle('is-out', !!o.place);
      el.classList.toggle('is-away', o.away);
      var sub = o.away ? 'desconectado' : o.place ? o.place + '.º lugar' : 'x' + plural(o.hand, 'carta', 'cartas');
      el.innerHTML = label(o.name, sub) + '<div class="pd-matbox pd-matbox--' + sideOf(seat) + '"><div class="pd-mat">' +
        slots(o.visible, o.hidden, 'pd-table', false) + fan(o.hand) + '</div></div>';
    });

    // Pile
    var html = '';
    v.pile.forEach(function (c, k) {
      var off = k - (v.pile.length - 1), r = ((c.id * 37) % 15) - 7;
      html += img(c, arriving[c.id] ? 'is-arriving' : '', ' data-id="' + c.id + '" style="transform:translateX(' + off * 16 + 'px) rotate(' + r + 'deg)"');
    });
    if (!v.pile.length) html = '<div class="pd-pile__empty">Vía libre</div>';
    $('.pd-center').innerHTML = '<div class="pd-pile" aria-label="Pila central">' + html + '</div>' +
      '<p class="pd-pile__note" aria-live="polite">' + (v.caption || '&nbsp;') + '</p>';

    // You (bottom)
    var hand = me.hand.map(function (c) {
      var on = selected.indexOf(c.id) >= 0;
      return '<button type="button" class="pd-hand__card' + ((mine || cutting) && !playable[c.id] ? ' is-dim' : '') + '" data-card="' + c.id + '" aria-pressed="' + on + '" aria-label="' + E.cardName(c) + (on ? ', elegida' : '') + '">' +
        img(c, arriving[c.id] ? 'is-arriving' : '') + '</button>';
    }).join('');
    var actions = '';
    if (mine) {
      if (v.chain) {
        actions = '<p class="pd-status">¿Tienes otra carta para jugar?</p><div class="pd-timer" aria-hidden="true"><i style="animation-duration:' + CHAIN_MS + 'ms;animation-delay:-' + (CHAIN_MS - v.chainLeft) + 'ms"></i></div>' +
          '<button type="button" class="p-button p-button--cream p-button--small" data-act="end-turn">Terminar mi turno</button>';
      } else if (v.hiddenStage) {
        actions = '<p class="pd-status">Toca una de tus cartas ocultas para revelarla.</p>';
      } else if (v.noMoves) {
        actions = '<p class="pd-status">No tienes jugada.</p><button type="button" class="p-button" data-act="pickup">Recoger la pila y reajustar la estrategia</button>';
      } else if (v.opening) {
        actions = '<p class="pd-status">Arrancas tú: juega tu Ritmo ' + v.opening + '. Tócalo dos veces o arrástralo a la pila.</p>';
      } else {
        actions = '<p class="pd-status pd-status--hint">Toca para elegir · doble toque o arrastra a la pila para jugar</p>';
      }
    } else if (cutting) {
      actions = '<p class="pd-status">Puedes interrumpir a ' + esc(v.interrupt) + ': juega una carta válida.</p>';
    } else if (!v.over && v.turn) {
      actions = '<p class="pd-status pd-status--hint">Turno de ' + esc(v.turn) + '…</p>';
    }
    if (v.notice) actions = '<p class="pd-status pd-status--error">' + esc(v.notice) + '</p>' + actions;
    if (message) actions = '<p class="pd-status' + (messageError ? ' pd-status--error' : '') + '">' + esc(message) + '</p>' + actions;
    var tip = infoCard ? '<div class="pd-tip" role="status">' + img(infoCard, 'pd-tip__card') + '<div class="pd-tip__body"><p class="pd-tip__eyebrow">Carta especial</p><p class="pd-tip__title">' + E.cardName(infoCard) + '</p><p class="pd-tip__text">' + INFO[infoCard.k] + '</p><div class="pd-tip__actions"><button type="button" class="pd-tip__btn" data-act="tip-ok">Entendido</button><label class="pd-tip__check" for="pd-tip-never"><input type="checkbox" id="pd-tip-never"> No volver a mostrar</label></div></div></div>' : '';
    seats[0].classList.toggle('is-turn', mine);
    seats[0].innerHTML = label(me.name + ' (tú)', me.place ? me.place + '.º lugar' : '') +
      slots(me.visible, me.hidden, 'pd-table pd-table--me', v.hiddenStage) + tip +
      '<div class="pd-hand' + (mine || cutting ? ' is-active' : '') + (me.hand.length > 10 ? ' is-crowded' : '') + '" role="group" aria-label="Tu mano">' + hand + '</div>' +
      '<div class="pd-actions" aria-live="polite">' + actions + '</div>';

    // Log and result
    logList.innerHTML = v.log.slice().reverse().map(function (l) { return '<li' + (l.mine ? ' class="is-me"' : '') + '>' + esc(l.text) + '</li>'; }).join('') || '<li>La carrera está por empezar.</li>';
    board.classList.toggle('has-result', !!v.over);
    if (v.over) {
      var meRes = v.results.filter(function (x) { return x.me; })[0];
      var winner = v.results.filter(function (x) { return x.place === 1; })[0];
      var last = v.results.length;
      resultBox.innerHTML = '<h2>' + (meRes.place === 1 ? '¡Ganaste la carrera!' : meRes.place === last ? 'Te quedaste en la pista' : 'Llegaste en ' + meRes.place + '.º lugar') + '</h2>' +
        (meRes.place !== 1 ? '<p>Ganó ' + esc(winner.name) + '.</p>' : '') + '<ol>' +
        v.results.map(function (x) { return '<li' + (x.me ? ' class="is-me"' : '') + '><span>' + x.place + '.º ' + esc(x.name) + '</span><span>' + (x.place === last ? 'Se quedó con cartas' : 'Cruzó la meta') + '</span></li>'; }).join('') +
        '</ol><p>¿Otra vuelta? Cualquiera puede pedir la revancha.</p><div class="pd-result__actions"><button type="button" class="p-button" data-act="rematch">Otra partida</button></div>';
      resultBox.hidden = false;
    } else resultBox.hidden = true;
  }

  /* ---------- Card flights (same feel as the solo demo) ---------- */

  function center(rect) { return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; }
  function spotOf(el, rot) { return { c: center(el.getBoundingClientRect()), w: el.offsetWidth, rot: rot || 0 }; }
  function cardWidth(seat) {
    var probe = document.createElement('div');
    probe.className = seat === 0 ? 'pd-probe pd-probe--hand' : 'pd-probe';
    board.appendChild(probe);
    var w = probe.offsetWidth; probe.remove();
    return w || 40;
  }
  function seatSpot(seat) {
    var el = seat === 0 ? seats[0].querySelector('.pd-hand') || seats[0] : seats[seat].querySelector('.pd-matbox') || seats[seat];
    return { c: center(el.getBoundingClientRect()), w: cardWidth(seat), rot: seat === 0 ? 0 : ORIENT_BY_SIDE[sideOf(seat)] };
  }
  function pileSpot() {
    var pile = $('.pd-pile'), sample = pile.querySelector('.pd-card, .pd-pile__empty');
    return { c: center(pile.getBoundingClientRect()), w: sample ? sample.offsetWidth : 90, rot: 0 };
  }
  function canAnimate() { return !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) && !!Element.prototype.animate; }

  function fly(card, from, to, opts) {
    var b = board.getBoundingClientRect(), el = document.createElement('img');
    el.className = 'pd-card pd-ghost'; el.src = src(card); el.alt = '';
    var w = to.w, h = w * 922 / 660;
    el.style.width = w + 'px';
    el.style.left = (to.c.x - b.left - w / 2) + 'px';
    el.style.top = (to.c.y - b.top - h / 2) + 'px';
    var start = 'translate(' + (from.c.x - to.c.x) + 'px,' + (from.c.y - to.c.y) + 'px) rotate(' + from.rot + 'deg) scale(' + (from.w / w) + ')';
    var end = 'translate(0px,0px) rotate(' + to.rot + 'deg) scale(1)';
    el.style.transform = start; el.style.opacity = '0';
    board.appendChild(el);
    var frames = opts.fadeOut
      ? [{ transform: start, opacity: 1, offset: 0 }, { transform: end, opacity: 1, offset: 0.82 }, { transform: end, opacity: 0, offset: 1 }]
      : [{ transform: start, opacity: 1 }, { transform: end, opacity: 1 }];
    el.animate(frames, { duration: opts.duration || FLY_MS, delay: opts.delay || 0, easing: 'cubic-bezier(.25,.7,.3,1)', fill: 'forwards' })
      .onfinish = function () { el.remove(); if (opts.done) opts.done(); };
  }

  function applyView(v) {
    var moves = v.moves || [];
    view = v;
    selected = v.turn === 'me' ? selected.filter(function (id) { return v.me.hand.some(function (c) { return c.id === id; }); }) : [];
    arriving = {};
    var animate = canAnimate();
    if (animate) moves.forEach(function (m) {
      if (m.type === 'play' && !m.discarded) m.cards.forEach(function (c) { arriving[c.id] = true; });
      if (m.type === 'reveal' && m.card) arriving[m.card.id] = true;
    });
    render();
    if (!animate) { origins = {}; return; }
    var t = 0;
    moves.forEach(function (m) {
      if (m.type === 'play') {
        m.cards.slice(-4).forEach(function (c, j) {
          var target = m.discarded ? null : $('.pd-pile [data-id="' + c.id + '"]');
          var to = target ? { c: center(target.getBoundingClientRect()), w: target.offsetWidth, rot: ((c.id * 37) % 15) - 7 } : pileSpot();
          fly(c, origins[c.id] || seatSpot(m.seat), to, { delay: t + j * 110, fadeOut: !target, done: function () { if (target) target.classList.remove('is-arriving'); } });
        });
        t += FLY_MS;
      } else if (m.type === 'reveal' && m.card) {
        var dest = seats[0].querySelector('[data-card="' + m.card.id + '"] .pd-card');
        if (dest) { fly(m.card, origins.hidden || seatSpot(0), spotOf(dest), { duration: 600, delay: t, done: function () { dest.classList.remove('is-arriving'); } }); t += 600; }
      } else if (m.type === 'pickup') {
        var n = Math.min(m.n, 5), to = seatSpot(m.seat), from = pileSpot();
        for (var j = 0; j < n; j++) fly(null, from, to, { delay: t + j * 90, fadeOut: true });
        t += FLY_MS;
      }
    });
    origins = {};
  }

  /* ---------- Input: tap, double tap, drag (same as the solo demo) ---------- */

  function say(text, isError) { message = text || ''; messageError = !!isError; }
  // You can use your hand on your turn, or to interrupt the player before you
  function myTurn() { return view && (view.turn === 'me' || !!view.interrupt); }
  function findInHand(id) { return view.me.hand.find(function (c) { return c.id === id; }); }
  function compatibleWith(sel, card) {
    var cards = sel.map(findInHand).filter(Boolean);
    return cards.every(function (c) { return E.sameKind(c, card); }) || cards.concat([card]).some(function (c) { return c.k === 'reb'; });
  }
  function rememberOrigins(ids) {
    ids.forEach(function (id) {
      if (origins[id]) return;
      var el = seats[0].querySelector('[data-card="' + id + '"] .pd-card');
      if (el) origins[id] = spotOf(el);
    });
  }
  function playIds(ids) {
    if (!myTurn() || !ids.length) return;
    rememberOrigins(ids);
    var played = ids.map(findInHand);
    infoCard = played.filter(function (c) { return c && c.k !== 'r' && INFO[c.k] && !tipHidden(c.k); }).pop() || null;
    say('');
    sendAction('play', { ids: ids.slice() });
    selected = [];
  }
  function toggleCard(id) {
    var card = findInHand(id);
    if (!card) return;
    var i = selected.indexOf(id);
    if (i >= 0) { selected.splice(i, 1); say(''); render(); return; }
    if (!compatibleWith(selected, card)) selected = [];
    selected.push(id);
    if (card.k !== 'r' && INFO[card.k] && !tipHidden(card.k)) infoCard = card;
    say('');
    render();
  }
  function onHandTap(id) {
    var now = Date.now();
    if (lastTap.id === id && now - lastTap.time < DOUBLE_TAP_MS) {
      lastTap = { id: null, time: 0 };
      var card = findInHand(id);
      if (!card) return;
      if (selected.indexOf(id) < 0) selected = compatibleWith(selected, card) ? selected.concat([id]) : [id];
      playIds(selected);
      return;
    }
    lastTap = { id: id, time: now };
    toggleCard(id);
  }
  function pileHit(x, y) {
    var pile = $('.pd-pile');
    if (!pile) return false;
    var r = pile.getBoundingClientRect(), pad = 40;
    return x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad;
  }

  board.addEventListener('pointerdown', function (e) {
    var btn = e.target.closest('.pd-hand__card');
    if (!btn || !myTurn() || e.button > 0) return;
    drag = { id: +btn.getAttribute('data-card'), x: e.clientX, y: e.clientY, started: false, pid: e.pointerId };
  });
  window.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.pid) return;
    if (!drag.started) {
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 10) return;
      var card = findInHand(drag.id);
      if (!card) { drag = null; return; }
      if (selected.indexOf(drag.id) < 0) selected = compatibleWith(selected, card) ? selected.concat([drag.id]) : [drag.id];
      drag.ids = selected.slice();
      drag.started = true;
      var ghost = document.createElement('div');
      ghost.className = 'pd-drag';
      ghost.style.setProperty('--drag-w', cardWidth(0) + 'px');
      drag.ids.forEach(function (id, k) {
        var im = document.createElement('img');
        im.className = 'pd-card'; im.src = src(findInHand(id)); im.alt = ''; im.setAttribute('data-id', id);
        im.style.transform = 'rotate(' + ((k - (drag.ids.length - 1) / 2) * 6) + 'deg)';
        ghost.appendChild(im);
        var orig = seats[0].querySelector('[data-card="' + id + '"]');
        if (orig) orig.classList.add('is-dragging');
      });
      board.appendChild(ghost);
      drag.ghost = ghost;
    }
    drag.ghost.style.left = e.clientX + 'px';
    drag.ghost.style.top = e.clientY + 'px';
    var pile = $('.pd-pile');
    if (pile) pile.classList.toggle('is-drop', pileHit(e.clientX, e.clientY));
    e.preventDefault();
  }, { passive: false });
  function endDrag(e, cancelled) {
    if (!drag || (e && e.pointerId !== drag.pid)) return;
    var d = drag; drag = null;
    if (!d.started) return;
    suppressClick = true;
    setTimeout(function () { suppressClick = false; }, 0);
    var pile = $('.pd-pile');
    if (pile) pile.classList.remove('is-drop');
    var hit = !cancelled && e && pileHit(e.clientX, e.clientY);
    if (hit) { origins = {}; d.ghost.querySelectorAll('img').forEach(function (im) { origins[+im.getAttribute('data-id')] = spotOf(im); }); }
    d.ghost.remove();
    seats[0].querySelectorAll('.is-dragging').forEach(function (b) { b.classList.remove('is-dragging'); });
    if (hit) playIds(d.ids); else render();
  }
  window.addEventListener('pointerup', function (e) { endDrag(e, false); });
  window.addEventListener('pointercancel', function (e) { endDrag(e, true); });

  board.addEventListener('click', function (e) {
    var t = e.target.closest('button');
    if (!t || !view) return;
    if (t.hasAttribute('data-card')) { if (!suppressClick && myTurn()) onHandTap(+t.getAttribute('data-card')); return; }
    if (t.hasAttribute('data-hidden')) {
      var im = t.querySelector('.pd-card');
      origins = {}; if (im) origins.hidden = spotOf(im);
      say('');
      sendAction('reveal', { idx: +t.getAttribute('data-hidden') });
      return;
    }
    switch (t.getAttribute('data-act')) {
      case 'pickup': selected = []; say(''); sendAction('pickup'); break;
      case 'end-turn': sendAction('end'); break;
      case 'rematch':
        if (role === 'host') { if (connectedCount() >= 2) startGame(); else { say('Nadie más está conectado para la revancha.', true); render(); } }
        else link.send({ t: 'rematch' });
        break;
      case 'tip-ok':
        var never = document.getElementById('pd-tip-never');
        if (never && never.checked && infoCard) { hiddenTips[infoCard.k] = true; save('pd-tip2-' + infoCard.k, '1'); }
        infoCard = null; render(); break;
    }
  });
})();
