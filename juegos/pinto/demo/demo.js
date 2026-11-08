/* PINTO web demo: renders the table and drives the turns.
   Rules live in pinto-engine.js (window.PintoEngine).
   Seats: 0 = you (bottom), 1 = left, 2 = top, 3 = right. Each bot's cards are
   drawn on a "mat" rotated to face that player, like a real table.
   You play by double-tapping a card or dragging your selection onto the pile.
   After each play your turn stays open for 5 s so you can add another card of
   the same value; then the next player starts. */
(function () {
  'use strict';
  var E = window.PintoEngine;
  var board = document.getElementById('board');
  if (!E || !board) return;

  var BASE = board.getAttribute('data-cards') || '../img/cartas/';
  var VER = '?v=4';
  var BOT_DELAY = 2600;      // each bot "thinks" this long, so new players can follow
  var AFTER_CHAIN = 700;     // first bot after your 5 s window (you already waited)
  var CHAIN_MS = 5000;       // time you have to add another card of the same value
  var FAST_DELAY = 200;      // only after you finished and chose to skip ahead
  var FLY_MS = 750;          // a played card travelling from a seat to the pile
  var DOUBLE_TAP_MS = 380;
  var ORIENT = [0, 90, 180, -90];
  var SIDES = ['', 'left', 'top', 'right'];

  // What each special card does (shown once when you pick it)
  var INFO = {
    reb: 'Se juega sobre un ritmo del 1 al 4, con vía libre, sobre una Bandera Roja u otro Rebufo. Te deja sumar hasta dos valores seguidos de 5 o más, por ejemplo Rebufo + 6 + 7. Puedes jugarlo solo y seguir con los ritmos en tus 5 segundos.',
    roja: 'Cierra la pista sin descartar la pila: el siguiente jugador tiene vía libre. Se puede jugar sobre cualquier carta.',
    ama: 'Obliga al siguiente jugador a jugar ritmos bajos, del 1 al 4. No se puede jugar sobre ritmos altos, Vuelta Rápida ni Rebufo.',
    azul: 'Salta el turno del siguiente jugador. No se puede jugar sobre Bandera Amarilla, Rebufo ni Vuelta Rápida.',
    cuad: 'Descarta toda la pila y termina tu turno. El siguiente jugador tiene vía libre. Se juega de una en una y entra sobre cualquier carta.',
    vr: 'Es el ritmo más alto del juego. Se puede jugar sobre cualquier carta, excepto sobre la Bandera Amarilla.'
  };

  var s = null, dealing = false, fastForward = false, timer = null, chainTimer = null, chainStart = 0, botSteps = 0;
  var selected = [], message = '', messageError = false, infoCard = null;
  var movesSeen = 0, arriving = {}, origins = {}, pileNote = '';
  var lastTap = { id: null, time: 0 }, drag = null, suppressClick = false;

  var $ = function (sel) { return board.querySelector(sel); };
  var seats = [$('[data-seat="0"]'), $('[data-seat="1"]'), $('[data-seat="2"]'), $('[data-seat="3"]')];
  var logList = document.getElementById('log');
  var resultBox = $('.pd-result');

  function reduceMotion() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function canAnimate() { return !reduceMotion() && !!Element.prototype.animate; }

  function load(key, fallback) {
    try { var v = localStorage.getItem(key); return v === null ? fallback : v; } catch (e) { return fallback; }
  }
  function save(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* storage blocked: keep in memory */ } }
  // v2 key: choices saved before the checkbox only applied on "Entendido" are reset
  var TIP_KEY = 'pd-tip2-';
  var hiddenTips = {};
  function tipHidden(k) { return hiddenTips[k] || load(TIP_KEY + k, '') === '1'; }

  function src(card) { return BASE + (card ? E.cardFile(card) : 'reverso') + '.webp' + VER; }
  function img(card, cls, extra) {
    var alt = card ? E.cardName(card) : 'Carta boca abajo';
    return '<img class="pd-card ' + (cls || '') + '" src="' + src(card) + '" alt="' + alt + '" width="660" height="922" draggable="false"' + (extra || '') + '>';
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  // "Jugador 1 juega 2× Ritmo 5 · vía libre…" → "jugó 2× Ritmo 5 · vía libre…"
  var PAST = {
    juega: 'jugó', recoge: 'recogió', revela: 'reveló', toma: 'tomó', pierde: 'perdió', cruza: 'cruzó', se: 'se', no: 'no',
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

  function myTurn() { return s && !s.over && s.current === 0 && !s.players[0].place; }
  function hiddenStage() { var p = s.players[0]; return myTurn() && !p.hand.length && !p.visible.length && p.hidden.length > 0; }

  function renderMe(p) {
    var el = seats[0];
    var mine = myTurn();
    var playable = mine ? E.playableIds(s) : {};
    var revealing = hiddenStage();

    var hand = p.hand.map(function (c) {
      var on = selected.indexOf(c.id) >= 0;
      var dim = mine && !playable[c.id];
      return '<button type="button" class="pd-hand__card' + (dim ? ' is-dim' : '') + '" data-card="' + c.id + '" aria-pressed="' + on + '"' +
        ' aria-label="' + E.cardName(c) + (on ? ', elegida' : '') + '">' + img(c, arriving[c.id] ? 'is-arriving' : '') + '</button>';
    }).join('');

    var actions = '';
    if (mine) {
      var moves = E.legalMoves(s);
      if (s.chain) {
        var left = Math.max(0, CHAIN_MS - (Date.now() - chainStart));
        actions = '<p class="pd-status">¿Tienes otra carta para jugar?</p>' +
          '<div class="pd-timer" aria-hidden="true"><i style="animation-duration:' + CHAIN_MS + 'ms;animation-delay:-' + (CHAIN_MS - left) + 'ms"></i></div>';
      } else if (revealing) {
        actions = '<p class="pd-status">Toca una de tus cartas ocultas para revelarla.</p>';
      } else if (!moves.length) {
        actions = '<p class="pd-status">No tienes jugada.</p><button type="button" class="p-button" data-act="pickup">Recoger la pila y reajustar la estrategia</button>';
      } else if (s.opening) {
        actions = '<p class="pd-status">Arrancas tú: juega tu Ritmo 1. Tócalo dos veces o arrástralo a la pila.</p>';
      } else {
        actions = '<p class="pd-status pd-status--hint">Toca para elegir · doble toque o arrastra a la pila para jugar</p>';
      }
    } else if (!s.over && p.place && !fastForward) {
      actions = '<button type="button" class="p-button p-button--cream p-button--small" data-act="skip">Ir al resultado</button>';
    }
    if (message) actions = '<p class="pd-status' + (messageError ? ' pd-status--error' : '') + '">' + message + '</p>' + actions;

    var tip = '';
    if (infoCard) {
      tip = '<div class="pd-tip" role="status">' + img(infoCard, 'pd-tip__card') +
        '<div class="pd-tip__body">' +
          '<p class="pd-tip__eyebrow">Carta especial</p>' +
          '<p class="pd-tip__title">' + E.cardName(infoCard) + '</p>' +
          '<p class="pd-tip__text">' + INFO[infoCard.k] + '</p>' +
          '<div class="pd-tip__actions"><button type="button" class="pd-tip__btn" data-act="tip-ok">Entendido</button>' +
          '<label class="pd-tip__check" for="pd-tip-never"><input type="checkbox" id="pd-tip-never"> No volver a mostrar</label></div>' +
        '</div></div>';
    }

    el.innerHTML =
      label('Tú', p.place ? p.place + '.º lugar' : '') +
      slots(p, 'pd-table pd-table--me', revealing) +
      tip +
      '<div class="pd-hand' + (mine ? ' is-active' : '') + (p.hand.length > 10 ? ' is-crowded' : '') + '" role="group" aria-label="Tu mano">' + hand + '</div>' +
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

  function nextAliveIndex(from) {
    for (var k = 1; k <= s.players.length; k++) {
      var j = (from + k) % s.players.length;
      if (!s.players[j].place) return j;
    }
    return from;
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

  function seatSpot(pid) {
    var el = pid === 0 ? seats[0].querySelector('.pd-hand') || seats[0] : seats[pid].querySelector('.pd-matbox') || seats[pid];
    return { c: center(el.getBoundingClientRect()), w: cardWidthAt(pid), rot: ORIENT[pid] };
  }

  function pileSpot() {
    var pile = $('.pd-pile') || $('.pd-deck');
    var sample = pile && pile.querySelector('.pd-card, .pd-pile__empty');
    return { c: center(pile.getBoundingClientRect()), w: sample ? sample.offsetWidth : pile.offsetWidth, rot: 0 };
  }

  function spotOf(el, rot) { return { c: center(el.getBoundingClientRect()), w: el.offsetWidth, rot: rot || 0 }; }

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
      } else if (m.type === 'reveal') {
        // Your hidden card flips into your hand
        var dest = seats[0].querySelector('[data-card="' + m.card.id + '"] .pd-card');
        if (dest) {
          fly(m.card, origins.hidden || seatSpot(0), spotOf(dest), { duration: 600, delay: t, done: function () { dest.classList.remove('is-arriving'); } });
          t += 600;
        }
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
      pending.forEach(function (m) {
        if (m.type === 'play' && !m.discarded) m.cards.forEach(function (c) { arriving[c.id] = true; });
        if (m.type === 'reveal') arriving[m.card.id] = true;
      });
    }
    render();
    return animateMoves(pending);
  }

  function schedule(before, firstDelay) {
    clearTimeout(timer);
    var animTime = update(before);
    if (s.over || s.current === 0) return;
    var meDone = !!s.players[0].place;
    var wait = meDone && fastForward ? FAST_DELAY : Math.max(firstDelay || BOT_DELAY, animTime + 500);
    timer = setTimeout(botTurn, wait);
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

  // Your open turn: 5 s to add another card of the same value, then the next player goes
  function startChainWindow() {
    clearTimeout(chainTimer);
    chainStart = Date.now();
    chainTimer = setTimeout(endMyTurn, CHAIN_MS);
  }
  function endMyTurn() {
    clearTimeout(chainTimer);
    if (!s || !s.chain || s.current !== 0) return;
    selected = [];
    E.endChain(s);
    say('');
    schedule(undefined, AFTER_CHAIN);
  }

  function findInHand(id) { return s.players[0].hand.find(function (c) { return c.id === id; }); }

  function compatibleWith(sel, card) {
    var cards = sel.map(findInHand).filter(Boolean);
    return cards.every(function (c) { return E.sameKind(c, card); }) ||
      cards.concat([card]).some(function (c) { return c.k === 'reb'; });
  }

  function toggleCard(id) {
    var card = findInHand(id);
    if (!card) return;
    var i = selected.indexOf(id);
    if (i >= 0) { selected.splice(i, 1); say(''); render(); return; }
    // Picking a card of another kind starts a new selection, unless it builds a Rebufo combo
    if (!compatibleWith(selected, card)) selected = [];
    selected.push(id);
    if (card.k !== 'r' && !tipHidden(card.k)) infoCard = card;
    say('');
    render();
  }

  // Remember where your cards are, so they fly from your hand to the pile
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
    var before = s.log.length;
    var r = E.play(s, ids.slice());
    if (r.error) { origins = {}; say(r.error, true); render(); return; }
    selected = [];
    // Explain a special card the first times it's played, however it was played (tap, double tap or drag)
    infoCard = played.filter(function (c) { return c && c.k !== 'r' && !tipHidden(c.k); }).pop() || null;
    say('');
    if (r.canChain && s.current === 0) startChainWindow();
    else clearTimeout(chainTimer);
    schedule(before);
  }

  /* ---------- Input: tap, double tap and drag ---------- */

  function onHandTap(id) {
    var now = Date.now();
    if (lastTap.id === id && now - lastTap.time < DOUBLE_TAP_MS) {
      // Double tap: play the selection this card belongs to (or the card alone)
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
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.started) {
      if (Math.abs(dx) + Math.abs(dy) < 10) return;
      var card = findInHand(drag.id);
      if (!card) { drag = null; return; }
      if (selected.indexOf(drag.id) < 0) selected = compatibleWith(selected, card) ? selected.concat([drag.id]) : [drag.id];
      drag.ids = selected.slice();
      drag.started = true;
      // Floating copy of the selected cards that follows the pointer
      var ghost = document.createElement('div');
      ghost.className = 'pd-drag';
      // Same size as your hand cards (measured, so it can't fall back to the image's full size)
      var cw = cardWidthAt(0);
      ghost.style.setProperty('--drag-w', cw + 'px');
      drag.ids.forEach(function (id, k) {
        var c = findInHand(id);
        var im = document.createElement('img');
        im.className = 'pd-card';
        im.src = src(c);
        im.alt = '';
        im.setAttribute('data-id', id);
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
    var d = drag;
    drag = null;
    if (!d.started) return;
    suppressClick = true;
    setTimeout(function () { suppressClick = false; }, 0);
    var pile = $('.pd-pile');
    if (pile) pile.classList.remove('is-drop');
    var hit = !cancelled && e && pileHit(e.clientX, e.clientY);
    if (hit) {
      origins = {};
      d.ghost.querySelectorAll('img').forEach(function (im) { origins[+im.getAttribute('data-id')] = spotOf(im); });
    }
    d.ghost.remove();
    seats[0].querySelectorAll('.is-dragging').forEach(function (b) { b.classList.remove('is-dragging'); });
    if (hit) playIds(d.ids);
    else render();
  }
  window.addEventListener('pointerup', function (e) { endDrag(e, false); });
  window.addEventListener('pointercancel', function (e) { endDrag(e, true); });

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

  // Cards fly from the deck to each seat in the real dealing order (3 hidden each,
  // 3 visible each, then the rest), shrinking to the size they have at that seat.
  function dealAnimation(game, done) {
    var deckEl = $('.pd-deck');
    if (!deckEl || !canAnimate()) { setTimeout(done, 1200); return; }
    var from = { c: center(deckEl.getBoundingClientRect()), w: deckEl.offsetWidth, rot: 0 };
    var spots = [0, 1, 2, 3].map(seatSpot);
    var seq = [1, 2, 3, 0], order = [], r, i;
    for (r = 0; r < 6; r++) seq.forEach(function (pid) { order.push(pid); });
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
    clearTimeout(chainTimer);
    dealing = true;
    s = null;
    renderIdle();
    // Bring the whole table into view for the race
    board.scrollIntoView({ block: 'start', behavior: reduceMotion() ? 'auto' : 'smooth' });
    var game = E.newGame({ humanStarts: true, humanChains: true });
    dealAnimation(game, function () {
      dealing = false;
      s = game;
      selected = []; botSteps = 0; fastForward = false; movesSeen = 0; origins = {}; pileNote = ''; infoCard = null;
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
      if (suppressClick) return;
      if (myTurn()) onHandTap(+t.getAttribute('data-card'));
      return;
    }
    if (t.hasAttribute('data-hidden')) {
      var slotImg = t.querySelector('.pd-card');
      var spot = slotImg ? spotOf(slotImg) : null;
      var before = s.log.length;
      var r = E.revealToHand(s, +t.getAttribute('data-hidden'));
      if (r.error) { say(r.error, true); render(); return; }
      origins = {};
      if (spot) origins.hidden = spot;
      if (r.broke) { clearTimeout(chainTimer); say(''); schedule(before); return; }
      if (s.chain) startChainWindow();
      say('');
      schedule(before);
      return;
    }
    var b0;
    switch (t.getAttribute('data-act')) {
      case 'pickup': b0 = s.log.length; clearTimeout(chainTimer); E.pickUp(s); selected = []; say(''); schedule(b0); break;
      case 'skip': fastForward = true; schedule(); break;
      case 'tip-ok':
        // "No volver a mostrar" only counts when you close the tip with the box ticked
        var never = document.getElementById('pd-tip-never');
        if (never && never.checked && infoCard) { hiddenTips[infoCard.k] = true; save(TIP_KEY + infoCard.k, '1'); }
        infoCard = null; render(); break;
    }
  });


  document.querySelectorAll('[data-act="restart"]').forEach(function (b) { b.addEventListener('click', newGame); });

  // Bring back every special-card explanation hidden with "No volver a mostrar"
  var resetTips = document.querySelector('[data-act="reset-tips"]');
  if (resetTips) resetTips.addEventListener('click', function () {
    Object.keys(INFO).forEach(function (k) { hiddenTips[k] = false; save(TIP_KEY + k, ''); });
    resetTips.textContent = 'Listo: las explicaciones volverán a aparecer.';
  });

  renderIdle();
})();
