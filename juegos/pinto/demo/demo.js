/* PINTO web demo: renders the table and drives the turns.
   Rules live in pinto-engine.js (window.PintoEngine).
   Two players: you (bottom) and one bot sitting across the table (top). The bot's
   cards are drawn on a "mat" turned to face it, like a real table. */
(function () {
  'use strict';
  var E = window.PintoEngine;
  var board = document.getElementById('board');
  if (!E || !board) return;

  var BASE = board.getAttribute('data-cards') || '../img/cartas/';
  var VER = '?v=4';
  // How long each bot "thinks" before moving. Slow by default so new players can follow along.
  var SPEEDS = { lenta: 2600, normal: 1600, rapida: 900 };
  var FAST_DELAY = 200;  // only after you finished and chose to skip ahead
  var FLY_MS = 750;      // a played card travelling from a seat to the pile
  var ORIENT = [0, 180];
  var SIDES = ['', 'top'];

  var speed = load('pd-speed', 'lenta');
  var stepMode = load('pd-step', '') === '1';
  if (!SPEEDS[speed]) speed = 'lenta';

  var s = null, dealing = false, fastForward = false, timer = null, botSteps = 0;
  var selected = [], message = '', messageError = false;
  var movesSeen = 0, arriving = {}, origins = {}, pileNote = '';

  var $ = function (sel) { return board.querySelector(sel); };
  var seats = [$('[data-seat="0"]'), $('[data-seat="1"]')];
  var logList = document.getElementById('log');
  var resultBox = $('.pd-result');

  function reduceMotion() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function canAnimate() { return !reduceMotion() && !!Element.prototype.animate; }

  function load(key, fallback) {
    try { var v = localStorage.getItem(key); return v === null ? fallback : v; } catch (e) { return fallback; }
  }
  function save(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* storage blocked: keep in memory */ } }

  function src(card) { return BASE + (card ? E.cardFile(card) : 'reverso') + '.webp' + VER; }
  function img(card, cls, extra) {
    var alt = card ? E.cardName(card) : 'Carta boca abajo';
    return '<img class="pd-card ' + (cls || '') + '" src="' + src(card) + '" alt="' + alt + '" width="660" height="922" draggable="false"' + (extra || '') + '>';
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  // "Jugador 1 juega 2× Ritmo 5 · vía libre…" → "jugó 2× Ritmo 5 · vía libre…"
  var PAST = {
    juega: 'jugó', recoge: 'recogió', revela: 'reveló', toma: 'tomó', pierde: 'perdió', cruza: 'cruzó', se: 'se',
    juegas: 'jugaste', recoges: 'recogiste', revelas: 'revelaste', tomas: 'tomaste', pierdes: 'perdiste', cruzas: 'cruzaste', te: 'te'
  };
  function pastTense(entry) {
    var name = s.players[entry.pid].name;
    var rest = entry.text.indexOf(name + ' ') === 0 ? entry.text.slice(name.length + 1) : entry.text;
    var verb = rest.split(' ')[0];
    return PAST[verb] ? PAST[verb] + rest.slice(verb.length) : rest;
  }

  /* ---------- Rendering ---------- */

  function render() {
    s.players.forEach(function (p, i) { i === 0 ? renderMe(p) : renderBot(p, i); });
    renderPile();
    renderLog();
    board.classList.toggle('has-result', s.over);
    if (s.over) renderResult(); else resultBox.hidden = true;
    seats.forEach(function (el, i) { el.classList.toggle('is-turn', !s.over && s.current === i && !s.players[i].place); });
  }

  function label(name, sub) {
    return '<p class="pd-label"><strong>' + name + '</strong>' + (sub ? '<span>' + sub + '</span>' : '') + '</p>';
  }

  // Bot hand as a fan of face-down cards
  function fan(n) {
    var k = Math.min(n, 10), html = '';
    var spread = k > 1 ? Math.min(70, 9 * k) : 0;
    for (var j = 0; j < k; j++) {
      var a = k > 1 ? -spread / 2 + j * spread / (k - 1) : 0;
      html += img(null, 'pd-fan__card', ' style="transform:rotate(' + a.toFixed(1) + 'deg)"');
    }
    return '<div class="pd-fan">' + html + '</div>';
  }

  function slots(p, cls, revealable) {
    var n = Math.max(p.hidden.length, p.visible.length), html = '';
    for (var k = 0; k < n; k++) {
      var hidden = p.hidden[k], up = p.visible[k];
      var inner = (hidden ? img(null) : '') + (up ? img(up, 'pd-card--up') : '');
      if (revealable && hidden) {
        html += '<button type="button" class="pd-slot pd-hidden-btn" data-hidden="' + k + '" aria-label="Revelar carta oculta ' + (k + 1) + '">' + inner + '</button>';
      } else {
        html += '<div class="pd-slot" data-slot="' + k + '">' + inner + '</div>';
      }
    }
    return '<div class="' + cls + '">' + html + '</div>';
  }

  function mat(p, i) {
    return '<div class="pd-matbox pd-matbox--' + SIDES[i] + '"><div class="pd-mat">' +
      (p ? slots(p, 'pd-table', false) + fan(p.hand.length) : '') + '</div></div>';
  }

  function renderBot(p, i) {
    var el = seats[i];
    el.classList.toggle('is-out', !!p.place);
    el.innerHTML = label(p.name, p.place ? p.place + '.º lugar' : 'x' + plural(p.hand.length, 'carta', 'cartas')) + mat(p, i);
  }

  function renderMe(p) {
    var el = seats[0];
    var myTurn = !s.over && s.current === 0 && !p.place;
    var playable = myTurn ? E.playableIds(s) : {};
    var hiddenStage = myTurn && !p.hand.length && !p.visible.length && p.hidden.length;

    var hand = p.hand.map(function (c) {
      var on = selected.indexOf(c.id) >= 0;
      var dim = myTurn && !playable[c.id];
      return '<button type="button" class="pd-hand__card' + (dim ? ' is-dim' : '') + '" data-card="' + c.id + '" aria-pressed="' + on + '">' + img(c) + '</button>';
    }).join('');

    var actions = '';
    if (myTurn) {
      var moves = E.legalMoves(s);
      if (hiddenStage) {
        actions = '<p class="pd-status">Toca una de tus cartas ocultas para revelarla.</p>';
      } else if (s.chain) {
        actions = (selected.length ? '<button type="button" class="p-button" data-act="play">Seguir con ' + plural(selected.length, 'carta', 'cartas') + '</button>' : '') +
          '<button type="button" class="p-button p-button--cream" data-act="endchain">Terminar turno</button>';
      } else if (!moves.length) {
        actions = '<p class="pd-status">No tienes jugada.</p><button type="button" class="p-button" data-act="pickup">Recoger la pila</button>';
      } else if (selected.length) {
        actions = '<button type="button" class="p-button" data-act="play">Jugar ' + plural(selected.length, 'carta', 'cartas') + '</button>' +
          '<button type="button" class="p-button p-button--cream p-button--small" data-act="clear">Quitar selección</button>';
      } else {
        actions = '<p class="pd-status">' + (s.opening ? 'Arrancas tú con el Ritmo ' + s.opening + '.' : 'Elige cartas para jugar.') + '</p>';
      }
    } else if (!s.over) {
      if (stepMode && !fastForward) actions = '<button type="button" class="p-button" data-act="next">Siguiente jugada</button>';
      if (p.place && !fastForward) actions += '<button type="button" class="p-button p-button--cream p-button--small" data-act="skip">Ir al resultado</button>';
    }
    if (message) actions = '<p class="pd-status' + (messageError ? ' pd-status--error' : '') + '">' + message + '</p>' + actions;

    el.innerHTML =
      label('Tú', p.place ? p.place + '.º lugar' : '') +
      slots(p, 'pd-table pd-table--me', hiddenStage) +
      '<div class="pd-hand" role="group" aria-label="Tu mano">' + hand + '</div>' +
      '<div class="pd-actions" aria-live="polite">' + actions + '</div>';
  }

  function renderPile() {
    var shown = s.pile.slice(-4), html = '';
    shown.forEach(function (c, k) {
      var off = k - (shown.length - 1);
      var r = ((c.id * 37) % 15) - 7;
      html += img(c, arriving[c.id] ? 'is-arriving' : '', ' data-id="' + c.id + '" style="transform:translateX(' + off * 16 + 'px) rotate(' + r + 'deg)"');
    });
    if (!shown.length) html = '<div class="pd-pile__empty">Vía libre</div>';
    $('.pd-center').innerHTML =
      '<div class="pd-pile" aria-label="Pila central">' + html + '</div>' +
      '<p class="pd-pile__note" aria-live="polite">' + (pileNote || '&nbsp;') + '</p>';
  }

  function renderLog() {
    var items = s.log.slice(-8).reverse().map(function (l) {
      return '<li' + (l.pid === 0 ? ' class="is-me"' : '') + '>' + l.text + '</li>';
    });
    logList.innerHTML = items.join('') || '<li>La carrera está por empezar.</li>';
  }

  function renderResult() {
    var me = s.players[0];
    var rows = s.finished.map(function (id) {
      var p = s.players[id];
      return '<li' + (id === 0 ? ' class="is-me"' : '') + '><span>' + p.place + '.º ' + p.name + '</span><span>' +
        (p.place === s.players.length ? 'Se quedó con cartas' : 'Cruzó la meta') + '</span></li>';
    }).join('');
    var title = me.place === 1 ? '¡Ganaste la carrera!' : me.place === s.players.length ? 'Te quedaste en la pista' : 'Llegaste en ' + me.place + '.º lugar';
    resultBox.innerHTML =
      '<h2>' + title + '</h2><ol>' + rows + '</ol>' +
      '<p>¿Qué te pareció? Cuéntanos en Instagram o suscríbete para enterarte cuando PINTO salga a la venta.</p>' +
      '<div class="pd-result__actions">' +
        '<button type="button" class="p-button" data-act="new">Otra carrera</button>' +
        '<a class="p-button p-button--cream" href="' + (board.getAttribute('data-subscribe') || '../../../#suscribete') + '">Suscribirme</a>' +
      '</div>';
    resultBox.hidden = false;
  }

  /* ---------- Card flights ---------- */

  function center(rect) { return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; }

  // Card width at a seat, measured from a hidden probe styled like that seat's cards
  function cardWidthAt(pid) {
    var probe = document.createElement('div');
    probe.className = pid === 0 ? 'pd-probe pd-probe--hand' : 'pd-probe';
    board.appendChild(probe);
    var w = probe.offsetWidth;
    probe.remove();
    return w || (pid === 0 ? 70 : 32);
  }

  // Where a seat's cards live on screen, and how big one card is there
  function seatSpot(pid) {
    var el = pid === 0 ? seats[0].querySelector('.pd-hand') || seats[0] : seats[pid].querySelector('.pd-matbox') || seats[pid];
    return { c: center(el.getBoundingClientRect()), w: cardWidthAt(pid), rot: ORIENT[pid] };
  }

  function pileSpot() {
    var pile = $('.pd-pile') || $('.pd-deck');
    var sample = pile && pile.querySelector('.pd-card, .pd-pile__empty');
    return { c: center(pile.getBoundingClientRect()), w: sample ? sample.offsetWidth : pile.offsetWidth, rot: 0 };
  }

  // Animate one card image from spot A to spot B (position, size and angle)
  function fly(card, from, to, opts) {
    var b = board.getBoundingClientRect();
    var el = document.createElement('img');
    el.className = 'pd-card pd-ghost';
    el.src = src(card);
    el.alt = '';
    var w = to.w, h = w * 922 / 660;
    el.style.width = w + 'px';
    el.style.left = (to.c.x - b.left - w / 2) + 'px';
    el.style.top = (to.c.y - b.top - h / 2) + 'px';
    var start = 'translate(' + (from.c.x - to.c.x) + 'px,' + (from.c.y - to.c.y) + 'px) rotate(' + from.rot + 'deg) scale(' + (from.w / w) + ')';
    var end = 'translate(0px,0px) rotate(' + to.rot + 'deg) scale(1)';
    el.style.transform = start;
    el.style.opacity = '0';
    board.appendChild(el);
    var frames = opts.fadeOut
      ? [{ transform: start, opacity: 1, offset: 0 }, { transform: end, opacity: 1, offset: 0.82 }, { transform: end, opacity: 0, offset: 1 }]
      : [{ transform: start, opacity: 1 }, { transform: end, opacity: 1 }];
    var anim = el.animate(frames, { duration: opts.duration || FLY_MS, delay: opts.delay || 0, easing: 'cubic-bezier(.25,.7,.3,1)', fill: 'forwards' });
    anim.onfinish = function () { el.remove(); if (opts.done) opts.done(); };
  }

  // Animate every move the engine recorded since the last render. Returns the total time.
  function animateMoves(list) {
    if (!list.length || !canAnimate() || fastForward) { origins = {}; return 0; }
    var t = 0;
    list.forEach(function (m) {
      if (m.type === 'play') {
        var shown = m.cards.slice(-4);
        shown.forEach(function (c, j) {
          var target = m.discarded ? null : $('.pd-pile [data-id="' + c.id + '"]');
          var from = origins[c.id] || seatSpot(m.pid);
          var to = target ? { c: center(target.getBoundingClientRect()), w: target.offsetWidth, rot: ((c.id * 37) % 15) - 7 } : pileSpot();
          fly(c, from, to, {
            delay: t + j * 110, fadeOut: !target,
            done: function () { if (target) target.classList.remove('is-arriving'); }
          });
        });
        t += FLY_MS + (shown.length - 1) * 110;
      } else {
        // Pickup: the pile travels to the player face down (up to 5 cards)
        var n = Math.min(m.n, 5), to = seatSpot(m.pid), from = pileSpot();
        if (m.revealed) { fly(m.revealed, origins.hidden || to, from, { duration: 550, delay: t, fadeOut: true }); t += 550; }
        for (var j = 0; j < n; j++) fly(null, from, to, { delay: t + j * 90, fadeOut: true });
        t += FLY_MS + (n - 1) * 90;
      }
    });
    origins = {};
    return t;
  }

  /* ---------- Turn flow ---------- */

  function say(text, isError) { message = text || ''; messageError = !!isError; }

  // Caption under the pile: what the last player did, in plain words
  function caption(before) {
    var entries = s.log.slice(before);
    if (!entries.length) return;
    var who = s.players[entries[0].pid];
    var text = entries.filter(function (l) { return l.pid === who.id; }).map(pastTense).join('. ');
    pileNote = '<strong>' + who.name + '</strong> ' + text;
  }

  function update(before) {
    if (typeof before === 'number') caption(before);
    var pending = s.moves.slice(movesSeen);
    movesSeen = s.moves.length;
    arriving = {};
    if (canAnimate() && !fastForward) {
      pending.forEach(function (m) { if (m.type === 'play' && !m.discarded) m.cards.forEach(function (c) { arriving[c.id] = true; }); });
    }
    render();
    return animateMoves(pending);
  }

  function schedule(before) {
    clearTimeout(timer);
    var animTime = update(before);
    if (s.over || s.current === 0) return;
    var meDone = !!s.players[0].place;
    if (meDone && fastForward) timer = setTimeout(botTurn, FAST_DELAY);
    else if (!stepMode) timer = setTimeout(botTurn, Math.max(SPEEDS[speed], animTime + 600));
  }

  function botTurn() {
    if (!s || s.over || s.current === 0) return;
    // Safety net: if only bots remain and they keep trading the pile, rank them by cards left
    if (s.players[0].place && ++botSteps > 600) {
      s.players.filter(function (p) { return !p.place; })
        .sort(function (a, b) { return (a.hand.length + a.visible.length + a.hidden.length) - (b.hand.length + b.visible.length + b.hidden.length); })
        .forEach(function (p) { s.finished.push(p.id); p.place = s.finished.length; });
      s.over = true;
      schedule();
      return;
    }
    var before = s.log.length;
    var r = E.botStep(s);
    while (r && r.canChain && s.current !== 0) {
      var p = s.players[s.current];
      var same = p.hand.filter(function (c) { return E.sameKind(c, s.chain); }).map(function (c) { return c.id; });
      r = same.length ? E.play(s, same) : (E.endChain(s), null);
    }
    schedule(before);
  }

  function toggleCard(id) {
    var p = s.players[0];
    var card = p.hand.find(function (c) { return c.id === id; });
    if (!card) return;
    var i = selected.indexOf(id);
    if (i >= 0) { selected.splice(i, 1); say(''); render(); return; }
    // Picking a card of another kind starts a new selection, unless it builds a Rebufo combo
    var sel = selected.map(function (sid) { return p.hand.find(function (c) { return c.id === sid; }); });
    var compatible = sel.every(function (c) { return E.sameKind(c, card); }) ||
      sel.concat([card]).some(function (c) { return c.k === 'reb'; });
    if (!compatible) selected = [];
    selected.push(id);
    say('');
    render();
  }

  // Remember where your selected cards are, so they fly from your hand to the pile
  function rememberOrigins(ids) {
    origins = {};
    ids.forEach(function (id) {
      var el = seats[0].querySelector('[data-card="' + id + '"] .pd-card');
      if (el) origins[id] = { c: center(el.getBoundingClientRect()), w: el.offsetWidth, rot: 0 };
    });
  }

  function playSelected() {
    rememberOrigins(selected);
    var before = s.log.length;
    var r = E.play(s, selected.slice());
    if (r.error) { origins = {}; say(r.error, true); render(); return; }
    selected = [];
    say(r.canChain ? 'Tomaste tus cartas visibles: puedes seguir con más del mismo valor o terminar el turno.' : '');
    schedule(before);
  }

  /* ---------- Before the race: face-down deck, then the deal ---------- */

  function renderIdle() {
    var names = E.defaultNames;
    board.classList.remove('has-result');
    resultBox.hidden = true;
    seats.forEach(function (el, i) {
      el.classList.remove('is-turn', 'is-out');
      if (i === 0) {
        el.innerHTML = label('Tú', '') + '<div class="pd-hand"></div><div class="pd-actions">' + (dealing ? '' :
          '<button type="button" class="p-button" data-act="new">Nueva carrera</button>') + '</div>';
      } else {
        el.innerHTML = label(names[i], '') + mat(null, i);
      }
    });
    var deck = '';
    for (var k = 0; k < 5; k++) deck += img(null);
    $('.pd-center').innerHTML =
      '<div class="pd-deck" aria-hidden="true">' + deck + '</div>' +
      (dealing ? '<p class="pd-deal-text" role="status">Repartiendo cartas<span class="pd-dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p>' : '');
    logList.innerHTML = '<li>' + (dealing ? 'Repartiendo cartas…' : 'Toca “Nueva carrera” para empezar.') + '</li>';
  }

  // Cards fly from the deck to each seat in the real dealing order (hidden cards,
  // then visible cards, then the rest), shrinking to the size they have at that seat.
  function dealAnimation(game, done) {
    var deckEl = $('.pd-deck');
    if (!deckEl || !canAnimate()) { setTimeout(done, 1200); return; }
    var from = { c: center(deckEl.getBoundingClientRect()), w: deckEl.offsetWidth, rot: 0 };
    var spots = seats.map(function (el, pid) { return seatSpot(pid); });
    var seq = [1, 0], order = [], r, i; // you deal, so the rival gets the first card
    var tableRounds = game.players[0].hidden.length * 2;
    for (r = 0; r < tableRounds; r++) seq.forEach(function (pid) { order.push(pid); });
    var inHands = game.players.reduce(function (a, p) { return a + p.hand.length; }, 0);
    for (i = 0; i < inHands; i++) order.push(seq[i % seq.length]);
    var STAGGER = 55;
    order.forEach(function (pid, k) {
      fly(null, from, spots[pid], { duration: 520, delay: k * STAGGER, fadeOut: true });
    });
    setTimeout(done, order.length * STAGGER + 600);
  }

  function newGame() {
    if (dealing) return;
    clearTimeout(timer);
    dealing = true;
    s = null;
    renderIdle();
    var game = E.newGame({ players: seats.length });
    dealAnimation(game, function () {
      dealing = false;
      s = game;
      selected = []; botSteps = 0; fastForward = false; movesSeen = 0; origins = {}; pileNote = '';
      var starter = s.players[s.current];
      if (starter.id !== 0) pileNote = '<strong>' + starter.name + '</strong> tiene el Ritmo ' + s.opening + ' y arranca.';
      say('');
      schedule();
    });
  }

  board.addEventListener('click', function (e) {
    var t = e.target.closest('button');
    if (!t) return;
    if (t.getAttribute('data-act') === 'new') { newGame(); return; }
    if (!s) return;
    if (t.hasAttribute('data-card')) {
      if (s.current === 0 && !s.over) toggleCard(+t.getAttribute('data-card'));
      return;
    }
    if (t.hasAttribute('data-hidden')) {
      var slotImg = t.querySelector('.pd-card');
      var spot = slotImg ? { c: center(slotImg.getBoundingClientRect()), w: slotImg.offsetWidth, rot: 0 } : null;
      var before = s.log.length;
      var r = E.revealHidden(s, +t.getAttribute('data-hidden'));
      if (r.error) { say(r.error, true); render(); return; }
      origins = {};
      if (spot) { origins[r.revealed.id] = spot; origins.hidden = spot; }
      say('');
      schedule(before);
      return;
    }
    var b0;
    switch (t.getAttribute('data-act')) {
      case 'play': playSelected(); break;
      case 'clear': selected = []; say(''); render(); break;
      case 'pickup': b0 = s.log.length; E.pickUp(s); selected = []; say(''); schedule(b0); break;
      case 'endchain': E.endChain(s); selected = []; say(''); schedule(); break;
      case 'next': botTurn(); break;
      case 'skip': fastForward = true; schedule(); break;
    }
  });

  document.querySelectorAll('[data-act="restart"]').forEach(function (b) { b.addEventListener('click', newGame); });

  // Speed buttons and step-by-step switch (in the intro, outside the board)
  var speedBtns = document.querySelectorAll('[data-speed]');
  function syncControls() {
    speedBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-speed') === speed)); });
    var step = document.getElementById('pd-step');
    if (step) step.checked = stepMode;
  }
  speedBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      speed = b.getAttribute('data-speed'); save('pd-speed', speed); syncControls();
      if (s && !stepMode && s.current !== 0 && !s.over) { clearTimeout(timer); timer = setTimeout(botTurn, SPEEDS[speed]); }
    });
  });
  var stepBox = document.getElementById('pd-step');
  if (stepBox) stepBox.addEventListener('change', function () {
    stepMode = stepBox.checked; save('pd-step', stepMode ? '1' : '');
    if (s && !s.over) { clearTimeout(timer); render(); if (!stepMode && s.current !== 0) timer = setTimeout(botTurn, SPEEDS[speed]); }
  });
  syncControls();

  renderIdle();
})();
