/* PINTO web demo: renders the table and drives the turns.
   Rules live in pinto-engine.js (window.PintoEngine). */
(function () {
  'use strict';
  var E = window.PintoEngine;
  var board = document.getElementById('board');
  if (!E || !board) return;

  var BASE = board.getAttribute('data-cards') || '../img/cartas/';
  var VER = '?v=4';
  // How long each bot "thinks" before moving. Slow by default so new players can follow along.
  var SPEEDS = { lenta: 2600, normal: 1500, rapida: 800 };
  var FAST_DELAY = 200; // only after the player finished and chose to skip ahead
  var speed = load('pd-speed', 'lenta');
  var stepMode = load('pd-step', '') === '1';
  if (!SPEEDS[speed]) speed = 'lenta';

  // What each player did last (shown in a bubble next to each bot) and who played on the pile
  var lastAction = {}, freshPid = null, pileNote = '';

  var s, fastForward = false, selected = [], message = '', messageError = false, timer = null, lastPileTop = null, botSteps = 0;

  var $ = function (sel) { return board.querySelector(sel); };
  var seats = [$('[data-seat="0"]'), $('[data-seat="1"]'), $('[data-seat="2"]'), $('[data-seat="3"]')];
  var logList = document.getElementById('log');
  var resultBox = $('.pd-result');

  function img(card, cls, extra) {
    var src = card ? BASE + E.cardFile(card) + '.webp' + VER : BASE + 'reverso.webp' + VER;
    var alt = card ? E.cardName(card) : 'Carta boca abajo';
    return '<img class="pd-card ' + (cls || '') + '" src="' + src + '" alt="' + alt + '" width="660" height="922" draggable="false"' + (extra || '') + '>';
  }

  function load(key, fallback) {
    try { var v = localStorage.getItem(key); return v === null ? fallback : v; } catch (e) { return fallback; }
  }
  function save(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* storage blocked: keep in memory */ } }

  // "Athos juega 2× Ritmo 5 · vía libre…" → "Jugó 2× Ritmo 5 · vía libre…"
  var PAST = {
    juega: 'Jugó', recoge: 'Recogió', revela: 'Reveló', toma: 'Tomó', pierde: 'Perdió', cruza: 'Cruzó', se: 'Se',
    juegas: 'Jugaste', recoges: 'Recogiste', revelas: 'Revelaste', tomas: 'Tomaste', pierdes: 'Perdiste', cruzas: 'Cruzaste', te: 'Te'
  };
  function pastTense(entry) {
    var name = s.players[entry.pid].name;
    var rest = entry.text.indexOf(name + ' ') === 0 ? entry.text.slice(name.length + 1) : entry.text;
    var verb = rest.split(' ')[0];
    return PAST[verb] ? PAST[verb] + rest.slice(verb.length) : rest;
  }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  /* ---------- Rendering ---------- */

  function render() {
    s.players.forEach(function (p, i) { i === 0 ? renderMe(p) : renderBot(p, i); });
    renderPile();
    renderLog();
    board.classList.toggle('has-result', s.over);
    if (s.over) renderResult(); else resultBox.hidden = true;
    seats.forEach(function (el, i) { el.classList.toggle('is-turn', !s.over && s.current === i); });
  }

  function tag(p, i) {
    if (p.place) return '<span class="pd-tag pd-tag--place">' + p.place + '.º</span>';
    if (!s.over && s.current === i) return '<span class="pd-tag pd-tag--turn">Turno</span>';
    return '<span class="pd-tag">' + E.stageOf(p) + '</span>';
  }

  function tableCards(p, mine, revealable) {
    var n = Math.max(p.hidden.length, p.visible.length), html = '';
    for (var k = 0; k < n; k++) {
      var hidden = p.hidden[k], up = p.visible[k];
      var inner = (hidden ? img(null) : '') + (up ? img(up, 'pd-card--up') : '');
      if (revealable && hidden) {
        html += '<button type="button" class="pd-slot pd-hidden-btn" data-hidden="' + k + '" aria-label="Revelar carta oculta ' + (k + 1) + '">' + inner + '</button>';
      } else {
        html += '<div class="pd-slot">' + inner + '</div>';
      }
    }
    return '<div class="pd-table' + (mine ? ' pd-table--me' : '') + '">' + html + '</div>';
  }

  function renderBot(p, i) {
    var el = seats[i];
    var backs = Math.min(3, p.hand.length), stack = '';
    for (var k = 0; k < backs; k++) stack += img(null);
    el.classList.toggle('is-out', !!p.place);
    el.innerHTML =
      '<p class="pd-name">' + p.name + ' ' + tag(p, i) + '</p>' +
      '<p class="pd-said' + (freshPid === i ? ' is-fresh' : '') + '"' + (lastAction[i] ? '' : ' hidden') + '>' + (lastAction[i] || '') + '</p>' +
      '<div class="pd-count"><span class="pd-stack" aria-hidden="true">' + stack + '</span><span>' +
        plural(p.hand.length, 'carta', 'cartas') + '<span class="pd-count__more"> en mano</span></span></div>' +
      tableCards(p, false, false);
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
    if (!p.hand.length) {
      hand = '<p class="pd-hand__empty">' + (p.place ? 'Cruzaste la meta.' : p.visible.length ? '' : 'Sin cartas en la mano.') + '</p>';
    }

    var actions = '';
    if (myTurn) {
      var moves = E.legalMoves(s);
      if (hiddenStage) {
        actions = '<p class="pd-status">Te toca una carta oculta: tócala para revelarla.</p>';
      } else if (s.chain) {
        actions = (selected.length ? '<button type="button" class="p-button" data-act="play">Seguir con ' + plural(selected.length, 'carta', 'cartas') + '</button>' : '') +
          '<button type="button" class="p-button p-button--cream" data-act="endchain">Terminar turno</button>';
      } else if (!moves.length) {
        actions = '<p class="pd-status">No tienes jugada válida.</p><button type="button" class="p-button" data-act="pickup">Recoger la pila</button>';
      } else if (selected.length) {
        actions = '<button type="button" class="p-button" data-act="play">Jugar ' + plural(selected.length, 'carta', 'cartas') + '</button>' +
          '<button type="button" class="p-button p-button--cream p-button--small" data-act="clear">Quitar selección</button>';
      } else {
        actions = '<p class="pd-status">' + (s.opening ? 'Arrancas tú: elige tu Ritmo ' + s.opening + '.' : 'Elige una o más cartas iguales para jugar.') + '</p>';
      }
    } else if (!s.over) {
      var who = s.players[s.current].name;
      actions = '<p class="pd-status">' + (p.place ? 'Ya cruzaste la meta. Los bots terminan la carrera…' : stepMode ? 'Le toca a ' + who + '.' : who + ' está pensando…') + '</p>' +
        (stepMode && !fastForward ? '<button type="button" class="p-button" data-act="next">Siguiente jugada</button>' : '') +
        (p.place && !fastForward ? '<button type="button" class="p-button p-button--cream p-button--small" data-act="skip">Ir al resultado</button>' : '');
    }
    if (message) actions = '<p class="pd-status' + (messageError ? ' pd-status--error' : '') + '">' + message + '</p>' + actions;

    el.classList.toggle('is-turn', myTurn);
    el.innerHTML =
      '<p class="pd-name">Tú ' + tag(p, 0) + '</p>' +
      '<div class="pd-me__table" aria-label="Tu mesa">' + tableCards(p, true, hiddenStage) + '</div>' +
      '<div class="pd-hand" role="group" aria-label="Tu mano">' + hand + '</div>' +
      '<div class="pd-actions" aria-live="polite">' + actions + '</div>';
  }

  function renderPile() {
    var el = $('.pd-center');
    var shown = s.pile.slice(-4), html = '';
    var top = s.pile[s.pile.length - 1];
    shown.forEach(function (c, k) {
      var off = k - (shown.length - 1);
      var r = ((c.id * 37) % 15) - 7;
      var isNew = k === shown.length - 1 && top && top !== lastPileTop;
      html += img(c, isNew ? 'is-new' : '', ' style="--r:' + r + 'deg;transform:translateX(' + off * 16 + 'px) rotate(' + r + 'deg)"');
    });
    lastPileTop = top || null;
    if (!shown.length) html = '<div class="pd-pile__empty">Vía libre</div>';
    el.innerHTML =
      '<div class="pd-pile" aria-label="Pila central">' + html + '</div>' +
      (pileNote ? '<p class="pd-pile__note">' + pileNote + '</p>' : '') +
      '<p class="pd-pile__meta">Pila: ' + plural(s.pile.length, 'carta', 'cartas') + ' · fuera de juego: ' + s.discarded + '</p>';
  }

  function renderLog() {
    var items = s.log.slice(-9).reverse().map(function (l) {
      return '<li' + (l.pid === 0 ? ' class="is-me"' : '') + '>' + l.text + '</li>';
    });
    logList.innerHTML = items.join('') || '<li>La carrera está por empezar.</li>';
  }

  function renderResult() {
    var me = s.players[0];
    var rows = s.finished.map(function (id) {
      var p = s.players[id];
      return '<li' + (id === 0 ? ' class="is-me"' : '') + '><span>' + p.place + '.º ' + (id === 0 ? 'Tú' : p.name) + '</span><span>' +
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

  /* ---------- Turn flow ---------- */

  function say(text, isError) { message = text || ''; messageError = !!isError; }

  function schedule() {
    clearTimeout(timer);
    if (s.over) { render(); return; }
    render();
    if (s.current !== 0) {
      var meDone = !!s.players[0].place;
      if (meDone && fastForward) timer = setTimeout(botTurn, FAST_DELAY);
      else if (!stepMode) timer = setTimeout(botTurn, SPEEDS[speed]);
    }
  }

  function botTurn() {
    if (s.over || s.current === 0) return;
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
    // Bots always keep chaining while they can
    while (r && r.canChain && s.current !== 0) {
      var p = s.players[s.current];
      var same = p.hand.filter(function (c) { return E.sameKind(c, s.chain); }).map(function (c) { return c.id; });
      r = same.length ? E.play(s, same) : (E.endChain(s), null);
    }
    remember(before);
    schedule();
  }

  // Turn the log lines produced by the last move into the bubbles and the pile caption
  function remember(before) {
    var entries = s.log.slice(before), byPid = {};
    entries.forEach(function (l) { (byPid[l.pid] = byPid[l.pid] || []).push(pastTense(l)); });
    Object.keys(byPid).forEach(function (pid) { lastAction[pid] = byPid[pid].join('. '); });
    freshPid = entries.length ? entries[0].pid : null;
    if (entries.length) {
      var who = s.players[entries[0].pid];
      pileNote = (who.id === 0 ? 'Tú: ' : who.name + ': ') + pastTense(entries[0]).replace(/^./, function (c) { return c.toLowerCase(); });
    }
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

  function playSelected() {
    var before = s.log.length;
    var r = E.play(s, selected.slice());
    if (r.error) { say(r.error, true); render(); return; }
    selected = [];
    remember(before);
    say(r.canChain ? 'Tomaste tus cartas visibles: puedes seguir con más cartas del mismo valor o terminar el turno.' : '');
    schedule();
  }

  function newGame() {
    clearTimeout(timer);
    s = E.newGame();
    selected = []; botSteps = 0; lastPileTop = null; fastForward = false;
    lastAction = {}; freshPid = null; pileNote = '';
    var starter = s.players[s.current];
    say(starter.id === 0 ? '' : starter.name + ' tiene el Ritmo ' + s.opening + ' y arranca la carrera.');
    schedule();
  }

  board.addEventListener('click', function (e) {
    var t = e.target.closest('button');
    if (!t || !s) return;
    if (t.hasAttribute('data-card')) {
      if (s.current === 0 && !s.over) toggleCard(+t.getAttribute('data-card'));
      return;
    }
    if (t.hasAttribute('data-hidden')) {
      var before = s.log.length;
      var r = E.revealHidden(s, +t.getAttribute('data-hidden'));
      if (r.error) { say(r.error, true); render(); return; }
      remember(before);
      say(r.failed ? 'Tu carta oculta (' + E.cardName(r.revealed) + ') no entraba: recogiste la pila.' : 'Revelaste ' + E.cardName(r.revealed) + '.');
      schedule();
      return;
    }
    switch (t.getAttribute('data-act')) {
      case 'play': playSelected(); break;
      case 'clear': selected = []; say(''); render(); break;
      case 'pickup': var b0 = s.log.length; E.pickUp(s); remember(b0); selected = []; say(''); schedule(); break;
      case 'next': botTurn(); break;
      case 'endchain': E.endChain(s); selected = []; say(''); schedule(); break;
      case 'new': newGame(); break;
      case 'skip': fastForward = true; schedule(); break;
    }
  });

  document.querySelectorAll('[data-act="restart"]').forEach(function (b) { b.addEventListener('click', newGame); });

  // Speed buttons and step-by-step switch (live in the intro, outside the board)
  var speedBtns = document.querySelectorAll('[data-speed]');
  function syncControls() {
    speedBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-speed') === speed)); });
    var step = document.getElementById('pd-step');
    if (step) step.checked = stepMode;
  }
  speedBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      speed = b.getAttribute('data-speed'); save('pd-speed', speed); syncControls();
      if (s && !stepMode) schedule();
    });
  });
  var stepBox = document.getElementById('pd-step');
  if (stepBox) stepBox.addEventListener('change', function () {
    stepMode = stepBox.checked; save('pd-step', stepMode ? '1' : ''); if (s) schedule();
  });
  syncControls();

  newGame();
})();
