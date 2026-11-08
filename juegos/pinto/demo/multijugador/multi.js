/* PINTO online (2 players): one creates a room, the other joins with its code.
   The room creator's browser is the referee: it runs pinto-engine.js and sends
   each player only what they're allowed to see (their own hand, the rival's
   card count, the table and the pile). Connection: PeerJS (WebRTC, free public
   broker, no backend of our own). Add ?transporte=local to test with two tabs
   of the same browser (BroadcastChannel). */
(function () {
  'use strict';
  var E = window.PintoEngine;
  var root = document.getElementById('mp');
  var board = document.getElementById('board');
  if (!E || !root || !board) return;

  var BASE = board.getAttribute('data-cards') || '../../img/cartas/';
  var VER = '?v=4';
  var CHAIN_MS = 5000;
  var FLY_MS = 750;
  var DOUBLE_TAP_MS = 380;
  var ID_PREFIX = 'korilabs-pinto-';
  var CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  var params = new URLSearchParams(location.search);
  var LOCAL = params.get('transporte') === 'local';

  var INFO = {
    reb: 'Se juega sobre un ritmo del 1 al 4, con vía libre, sobre una Bandera Roja u otro Rebufo. Te deja sumar hasta dos valores seguidos de 5 o más, por ejemplo Rebufo + 6 + 7. Puedes jugarlo solo y seguir con los ritmos en tus 5 segundos.',
    roja: 'Cierra la pista sin descartar la pila: el siguiente jugador tiene vía libre. Se puede jugar sobre cualquier carta.',
    ama: 'Obliga al siguiente jugador a jugar ritmos bajos, del 1 al 4. No se puede jugar sobre ritmos altos, Vuelta Rápida ni Rebufo.',
    cuad: 'Descarta toda la pila y termina tu turno. El siguiente jugador tiene vía libre. Se juega de una en una y entra sobre cualquier carta.',
    vr: 'Es el ritmo más alto del juego. Se puede jugar sobre cualquier carta, excepto sobre la Bandera Amarilla.'
  };

  /* ---------- Lobby elements ---------- */
  var lobby = document.getElementById('mp-lobby');
  var nameInput = document.getElementById('mp-name');
  var codeInput = document.getElementById('mp-code');
  var statusEl = document.getElementById('mp-status');
  var roomBox = document.getElementById('mp-room');
  var game = document.getElementById('mp-game');
  var logList = document.getElementById('log');

  try { nameInput.value = localStorage.getItem('pd-mp-name') || ''; } catch (e) { /* storage blocked */ }
  if (params.get('sala')) codeInput.value = params.get('sala').toUpperCase();

  /* ---------- Shared state ---------- */
  var role = null;           // 'host' or 'guest'
  var myName = '', rivalName = '';
  var link = null;           // transport to the other player
  var view = null;           // what this screen shows (built by the host)
  var selected = [], message = '', messageError = false, infoCard = null;
  var lastTap = { id: null, time: 0 }, drag = null, suppressClick = false;
  var origins = {};
  var hiddenTips = {};

  // Host only
  var s = null, chainTimer = null, chainDeadline = 0, sentMoves = [0, 0], caption = '', guestConnected = false;

  function setStatus(text, isError) {
    statusEl.textContent = text || '';
    statusEl.classList.toggle('is-error', !!isError);
  }
  function load(key, fb) { try { var v = localStorage.getItem(key); return v === null ? fb : v; } catch (e) { return fb; } }
  function save(key, v) { try { localStorage.setItem(key, v); } catch (e) { /* storage blocked */ } }
  function tipHidden(k) { return hiddenTips[k] || load('pd-tip2-' + k, '') === '1'; }

  /* ---------- Transport: PeerJS, or BroadcastChannel for local tests ---------- */

  function connectionError(type) {
    if (type === 'peer-unavailable') return 'No encontramos esa sala. Revisa el código o pídele a tu amigo que la cree de nuevo.';
    if (type === 'unavailable-id') return 'Ese código ya está en uso. Crea otra sala.';
    if (type === 'network' || type === 'server-error' || type === 'socket-error' || type === 'socket-closed')
      return 'No pudimos conectar con el servidor de salas. Revisa tu conexión a internet e intenta de nuevo.';
    if (type === 'library-missing') return 'No se pudo cargar el sistema de salas. Revisa tu conexión y recarga la página.';
    if (type === 'browser-incompatible') return 'Este navegador no permite partidas en línea. Prueba con Chrome, Safari o Firefox actualizados.';
    return 'Algo falló con la conexión (' + type + '). Intenta de nuevo.';
  }

  function localTransport(code, asHost, handlers) {
    var ch = new BroadcastChannel('pinto-' + code);
    var me = asHost ? 'host' : 'guest', other = asHost ? 'guest' : 'host';
    ch.onmessage = function (e) {
      var m = e.data;
      if (!m || m.to !== me) return;
      if (m.sys === 'knock' && asHost) { ch.postMessage({ to: other, sys: 'welcome' }); handlers.open(); return; }
      if (m.sys === 'welcome' && !asHost) { handlers.open(); return; }
      if (m.sys === 'bye') { handlers.close(); return; }
      if (m.data) handlers.data(m.data);
    };
    if (asHost) handlers.ready();
    else ch.postMessage({ to: other, sys: 'knock' });
    window.addEventListener('pagehide', function () { ch.postMessage({ to: other, sys: 'bye' }); });
    return { send: function (d) { ch.postMessage({ to: other, data: d }); } };
  }

  function peerTransport(code, asHost, handlers) {
    if (!window.Peer) { handlers.error('library-missing'); return null; }
    var t = { conn: null, send: function (d) { if (t.conn && t.conn.open) t.conn.send(d); } };
    function wire(c) {
      t.conn = c;
      c.on('open', handlers.open);
      c.on('data', handlers.data);
      c.on('close', handlers.close);
      c.on('error', function () { handlers.close(); });
    }
    var peer = asHost ? new window.Peer(ID_PREFIX + code.toLowerCase()) : new window.Peer();
    peer.on('error', function (err) { handlers.error(err && err.type ? err.type : 'unknown'); });
    peer.on('open', function () {
      if (asHost) handlers.ready();
      else wire(peer.connect(ID_PREFIX + code.toLowerCase(), { reliable: true }));
    });
    if (asHost) peer.on('connection', function (c) { wire(c); });
    t.peer = peer;
    return t;
  }

  function openLink(code, asHost) {
    var handlers = {
      ready: function () { onRoomReady(code); },
      open: onLinkOpen,
      data: onData,
      close: onLinkClosed,
      error: function (type) { setStatus(connectionError(type), true); enableLobby(true); }
    };
    return LOCAL ? localTransport(code, asHost, handlers) : peerTransport(code, asHost, handlers);
  }

  /* ---------- Lobby actions ---------- */

  function needName() {
    myName = nameInput.value.trim().slice(0, 16);
    if (!myName) { setStatus('Escribe tu nombre para empezar.', true); nameInput.focus(); return false; }
    save('pd-mp-name', myName);
    return true;
  }
  function enableLobby(on) { lobby.querySelectorAll('button, input').forEach(function (el) { el.disabled = !on; }); }

  document.getElementById('mp-create').addEventListener('click', function () {
    if (!needName()) return;
    role = 'host';
    var code = '';
    for (var i = 0; i < 4; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    enableLobby(false);
    setStatus('Creando la sala…');
    link = openLink(code, true);
  });

  document.getElementById('mp-join').addEventListener('click', function () {
    if (!needName()) return;
    var code = codeInput.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length !== 4) { setStatus('El código tiene 4 letras o números, por ejemplo K7QM.', true); codeInput.focus(); return; }
    role = 'guest';
    enableLobby(false);
    setStatus('Conectando con la sala ' + code + '…');
    link = openLink(code, false);
    setTimeout(function () {
      if (!view && role === 'guest') setStatus('Está tardando más de lo normal. Algunas redes (de trabajo o del colegio) bloquean las partidas en línea; prueba con otra red o con datos móviles.', true);
    }, 15000);
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
    setStatus('Sala lista. Esperando a que tu amigo entre…');
  }
  function selectText(el) { var r = document.createRange(); r.selectNodeContents(el); var sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); }

  function onLinkOpen() {
    if (role === 'guest') link.send({ t: 'hello', name: myName });
  }

  function onLinkClosed() {
    // Shown on the board too, since the lobby (and its status line) is hidden during a game
    var msg = role === 'host'
      ? (rivalName || 'Tu amigo') + ' se desconectó. Puede volver a entrar con el mismo código.'
      : 'Se perdió la conexión con la sala. Recarga la página y vuelve a entrar con el mismo código.';
    if (role === 'host') guestConnected = false;
    setStatus(msg, true);
    say(msg, true);
    renderSafe();
  }

  function onData(m) {
    if (!m || !m.t) return;
    if (role === 'host') {
      if (m.t === 'hello') {
        rivalName = String(m.name || 'Invitado').slice(0, 16);
        guestConnected = true;
        setStatus('');
        say('');
        if (!s) startGame(); else { sentMoves[1] = s.moves.length; broadcast(); }
      } else if (m.t === 'act') act(1, m.a, m);
      else if (m.t === 'rematch') startGame();
    } else {
      if (m.t === 'view') { showGame(); applyView(m.v); }
      else if (m.t === 'error') { say(m.msg, true); renderSafe(); }
    }
  }

  function showGame() {
    if (game.hidden) { lobby.hidden = true; game.hidden = false; setStatus(''); }
  }

  /* ---------- Host: referee ---------- */

  function startGame() {
    clearTimeout(chainTimer);
    s = E.newGame({ players: 2, names: [myName, rivalName], openTurns: [0, 1], secondPerson: false });
    sentMoves = [0, 0];
    caption = s.players[s.current].name + ' tiene el Ritmo ' + s.opening + ' y arranca.';
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
    if (s.current !== pid) { sendError(pid, 'Espera tu turno.'); return; }
    var before = s.log.length, r;
    if (a === 'play') {
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
    } else if (a === 'endchain') {
      clearTimeout(chainTimer);
      E.endChain(s);
    } else return;
    var entries = s.log.slice(before);
    if (entries.length) {
      var who = s.players[entries[0].pid];
      caption = '<strong>' + who.name + '</strong> ' + entries.filter(function (l) { return l.pid === who.id; }).map(pastTense).join('. ');
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
    else link.send({ t: 'error', msg: msg });
  }

  // What player `pid` is allowed to see
  function viewFor(pid) {
    var p = s.players[pid], o = s.players[1 - pid], mine = s.current === pid && !s.over;
    var moves = s.moves.slice(sentMoves[pid]).map(function (mv) {
      var who = mv.pid === pid ? 'me' : 'opp';
      if (mv.type === 'reveal') return { type: 'reveal', who: who, card: who === 'me' ? mv.card : null, idx: mv.hiddenIndex };
      if (mv.type === 'pickup') return { type: 'pickup', who: who, n: mv.n, revealed: mv.revealed || null };
      return { type: 'play', who: who, cards: mv.cards, discarded: mv.discarded };
    });
    sentMoves[pid] = s.moves.length;
    return {
      me: { name: p.name, hand: p.hand, visible: p.visible, hidden: p.hidden.length, place: p.place },
      opp: { name: o.name, hand: o.hand.length, visible: o.visible, hidden: o.hidden.length, place: o.place },
      pile: s.pile.slice(-4),
      turn: s.over ? null : (mine ? 'me' : 'opp'),
      opening: s.opening,
      chain: mine ? s.chain : null,
      chainLeft: mine && s.chain ? Math.max(0, chainDeadline - Date.now()) : 0,
      playable: mine ? Object.keys(E.playableIds(s)).map(Number) : [],
      noMoves: mine && !s.chain && p.hand.length > 0 && E.legalMoves(s).length === 0,
      hiddenStage: mine && !p.hand.length && !p.visible.length && p.hidden.length > 0,
      log: s.log.slice(-8).map(function (l) { return { text: l.text, mine: l.pid === pid }; }),
      caption: caption,
      over: s.over,
      results: s.over ? s.finished.map(function (id) { return { name: s.players[id].name, place: s.players[id].place, me: id === pid }; }) : null,
      moves: moves
    };
  }

  function broadcast() {
    applyView(viewFor(0));
    if (guestConnected) link.send({ t: 'view', v: viewFor(1) });
  }

  /* ---------- Both: send an action ---------- */

  function sendAction(a, extra) {
    var m = extra || {};
    m.t = 'act'; m.a = a;
    if (role === 'host') act(0, a, m);
    else link.send(m);
  }

  /* ---------- Rendering ---------- */

  var $ = function (sel) { return board.querySelector(sel); };
  var seatMe = $('[data-seat="0"]'), seatOpp = $('[data-seat="1"]');
  var resultBox = $('.pd-result');

  function src(card) { return BASE + (card ? E.cardFile(card) : 'reverso') + '.webp' + VER; }
  function img(card, cls, extra) {
    return '<img class="pd-card ' + (cls || '') + '" src="' + src(card) + '" alt="' + (card ? E.cardName(card) : 'Carta boca abajo') + '" width="660" height="922" draggable="false"' + (extra || '') + '>';
  }
  function plural(n, a, b) { return n + ' ' + (n === 1 ? a : b); }
  function label(name, sub) { return '<p class="pd-label"><strong>' + name + '</strong>' + (sub ? '<span>' + sub + '</span>' : '') + '</p>'; }

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

  var arriving = {};

  function renderSafe() { if (view) render(); }

  function render() {
    var v = view, me = v.me, mine = v.turn === 'me';
    var playable = {};
    v.playable.forEach(function (id) { playable[id] = true; });

    // Rival (top)
    seatOpp.classList.toggle('is-turn', v.turn === 'opp');
    seatOpp.innerHTML = label(v.opp.name, v.opp.place ? v.opp.place + '.º lugar' : 'x' + plural(v.opp.hand, 'carta', 'cartas')) +
      '<div class="pd-matbox pd-matbox--top"><div class="pd-mat">' + slots(v.opp.visible, v.opp.hidden, 'pd-table', false) + fan(v.opp.hand) + '</div></div>';

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
      return '<button type="button" class="pd-hand__card' + (mine && !playable[c.id] ? ' is-dim' : '') + '" data-card="' + c.id + '" aria-pressed="' + on + '" aria-label="' + E.cardName(c) + (on ? ', elegida' : '') + '">' +
        img(c, arriving[c.id] ? 'is-arriving' : '') + '</button>';
    }).join('');
    var actions = '';
    if (mine) {
      if (v.chain) {
        actions = '<p class="pd-status">¿Tienes otra carta para jugar?</p><div class="pd-timer" aria-hidden="true"><i style="animation-duration:' + CHAIN_MS + 'ms;animation-delay:-' + (CHAIN_MS - v.chainLeft) + 'ms"></i></div>';
      } else if (v.hiddenStage) {
        actions = '<p class="pd-status">Toca una de tus cartas ocultas para revelarla.</p>';
      } else if (v.noMoves) {
        actions = '<p class="pd-status">No tienes jugada.</p><button type="button" class="p-button" data-act="pickup">Recoger la pila y reajustar la estrategia</button>';
      } else if (v.opening) {
        actions = '<p class="pd-status">Arrancas tú: juega tu Ritmo ' + v.opening + '. Tócalo dos veces o arrástralo a la pila.</p>';
      } else {
        actions = '<p class="pd-status pd-status--hint">Toca para elegir · doble toque o arrastra a la pila para jugar</p>';
      }
    } else if (!v.over) {
      actions = '<p class="pd-status pd-status--hint">Turno de ' + v.opp.name + '…</p>';
    }
    if (message) actions = '<p class="pd-status' + (messageError ? ' pd-status--error' : '') + '">' + message + '</p>' + actions;
    var tip = infoCard ? '<div class="pd-tip" role="status">' + img(infoCard, 'pd-tip__card') + '<div class="pd-tip__body"><p class="pd-tip__eyebrow">Carta especial</p><p class="pd-tip__title">' + E.cardName(infoCard) + '</p><p class="pd-tip__text">' + INFO[infoCard.k] + '</p><div class="pd-tip__actions"><button type="button" class="pd-tip__btn" data-act="tip-ok">Entendido</button><label class="pd-tip__check" for="pd-tip-never"><input type="checkbox" id="pd-tip-never"> No volver a mostrar</label></div></div></div>' : '';
    seatMe.classList.toggle('is-turn', mine);
    seatMe.innerHTML = label(me.name + ' (tú)', me.place ? me.place + '.º lugar' : '') +
      slots(me.visible, me.hidden, 'pd-table pd-table--me', v.hiddenStage) + tip +
      '<div class="pd-hand' + (mine ? ' is-active' : '') + (me.hand.length > 10 ? ' is-crowded' : '') + '" role="group" aria-label="Tu mano">' + hand + '</div>' +
      '<div class="pd-actions" aria-live="polite">' + actions + '</div>';

    // Log and result
    logList.innerHTML = v.log.slice().reverse().map(function (l) { return '<li' + (l.mine ? ' class="is-me"' : '') + '>' + l.text + '</li>'; }).join('') || '<li>La carrera está por empezar.</li>';
    board.classList.toggle('has-result', !!v.over);
    if (v.over) {
      var meRes = v.results.filter(function (x) { return x.me; })[0];
      resultBox.innerHTML = '<h2>' + (meRes.place === 1 ? '¡Ganaste la carrera!' : 'Ganó ' + v.opp.name) + '</h2><ol>' +
        v.results.map(function (x) { return '<li' + (x.me ? ' class="is-me"' : '') + '><span>' + x.place + '.º ' + x.name + '</span><span>' + (x.place === 1 ? 'Cruzó la meta' : 'Se quedó con cartas') + '</span></li>'; }).join('') +
        '</ol><p>¿Otra vuelta? Cualquiera de los dos puede pedir la revancha.</p><div class="pd-result__actions"><button type="button" class="p-button" data-act="rematch">Otra partida</button></div>';
      resultBox.hidden = false;
    } else resultBox.hidden = true;
  }

  /* ---------- Card flights (same feel as the solo demo) ---------- */

  function center(rect) { return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; }
  function spotOf(el, rot) { return { c: center(el.getBoundingClientRect()), w: el.offsetWidth, rot: rot || 0 }; }
  function cardWidth(who) {
    var probe = document.createElement('div');
    probe.className = who === 'me' ? 'pd-probe pd-probe--hand' : 'pd-probe';
    board.appendChild(probe);
    var w = probe.offsetWidth; probe.remove();
    return w || 40;
  }
  function seatSpot(who) {
    var el = who === 'me' ? seatMe.querySelector('.pd-hand') || seatMe : seatOpp.querySelector('.pd-matbox') || seatOpp;
    return { c: center(el.getBoundingClientRect()), w: cardWidth(who), rot: who === 'me' ? 0 : 180 };
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
    // keep only selected cards that are still in your hand
    selected = selected.filter(function (id) { return v.me.hand.some(function (c) { return c.id === id; }); });
    if (v.turn !== 'me') { selected = []; }
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
          fly(c, origins[c.id] || seatSpot(m.who), to, { delay: t + j * 110, fadeOut: !target, done: function () { if (target) target.classList.remove('is-arriving'); } });
        });
        t += FLY_MS;
      } else if (m.type === 'reveal' && m.card) {
        var dest = seatMe.querySelector('[data-card="' + m.card.id + '"] .pd-card');
        if (dest) { fly(m.card, origins.hidden || seatSpot('me'), spotOf(dest), { duration: 600, delay: t, done: function () { dest.classList.remove('is-arriving'); } }); t += 600; }
      } else if (m.type === 'pickup') {
        var n = Math.min(m.n, 5), to = seatSpot(m.who), from = pileSpot();
        for (var j = 0; j < n; j++) fly(null, from, to, { delay: t + j * 90, fadeOut: true });
        t += FLY_MS;
      }
    });
    origins = {};
  }

  /* ---------- Input: tap, double tap, drag (same as the solo demo) ---------- */

  function say(text, isError) { message = text || ''; messageError = !!isError; }
  function myTurn() { return view && view.turn === 'me'; }
  function findInHand(id) { return view.me.hand.find(function (c) { return c.id === id; }); }
  function compatibleWith(sel, card) {
    var cards = sel.map(findInHand).filter(Boolean);
    return cards.every(function (c) { return E.sameKind(c, card); }) || cards.concat([card]).some(function (c) { return c.k === 'reb'; });
  }
  function rememberOrigins(ids) {
    ids.forEach(function (id) {
      if (origins[id]) return;
      var el = seatMe.querySelector('[data-card="' + id + '"] .pd-card');
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
      ghost.style.setProperty('--drag-w', cardWidth('me') + 'px');
      drag.ids.forEach(function (id, k) {
        var im = document.createElement('img');
        im.className = 'pd-card'; im.src = src(findInHand(id)); im.alt = ''; im.setAttribute('data-id', id);
        im.style.transform = 'rotate(' + ((k - (drag.ids.length - 1) / 2) * 6) + 'deg)';
        ghost.appendChild(im);
        var orig = seatMe.querySelector('[data-card="' + id + '"]');
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
    seatMe.querySelectorAll('.is-dragging').forEach(function (b) { b.classList.remove('is-dragging'); });
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
      case 'rematch': if (role === 'host') startGame(); else link.send({ t: 'rematch' }); break;
      case 'tip-ok':
        var never = document.getElementById('pd-tip-never');
        if (never && never.checked && infoCard) { hiddenTips[infoCard.k] = true; save('pd-tip2-' + infoCard.k, '1'); }
        infoCard = null; render(); break;
    }
  });
})();
