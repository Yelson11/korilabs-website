/* PINTO rules engine for the web demo (4 players: you + 3 bots).
   Pure logic, no DOM: the page (demo.js) and the Node simulator both use it.
   Source of truth: reglamento.pdf v1.3 plus the owner's notes on special cards. */
(function (root) {
  'use strict';

  var NAMES = {
    r: 'Ritmo', vr: 'Vuelta Rápida', reb: 'Rebufo', roja: 'Bandera Roja',
    ama: 'Bandera Amarilla', azul: 'Bandera Azul', cuad: 'Bandera a Cuadros'
  };
  var FILES = {
    vr: 'vuelta-rapida', reb: 'rebufo', roja: 'bandera-roja',
    ama: 'bandera-amarilla', azul: 'bandera-azul', cuad: 'bandera-a-cuadros'
  };
  // You + the three musketeers (bots 1–3)
  var DEFAULT_NAMES = ['Tú', 'Athos', 'Porthos', 'Aramis'];
  // Sort order inside a hand: rhythms 1–8 first, then specials
  var ORDER = { r: 0, reb: 10, ama: 11, roja: 12, azul: 13, vr: 14, cuad: 15 };

  function cardName(c) { return c.k === 'r' ? 'Ritmo ' + c.v : NAMES[c.k]; }
  function cardFile(c) { return c.k === 'r' ? 'ritmo-' + c.v : FILES[c.k]; }
  function sameKind(a, b) { return a.k === b.k && a.v === b.v; }
  function sortCards(cards) {
    return cards.sort(function (a, b) {
      return (ORDER[a.k] + (a.v || 0)) - (ORDER[b.k] + (b.v || 0)) || a.id - b.id;
    });
  }

  // Deck by player count (table in the rules): Azul / Cuadros copies vary
  function makeDeck(n) {
    var azul = n === 2 ? 0 : n <= 4 ? 1 : 2;
    var cuad = n === 2 ? 2 : n <= 4 ? 3 : 4;
    var deck = [], id = 0, v, i;
    for (v = 1; v <= 8; v++) for (i = 0; i < 4; i++) deck.push({ id: id++, k: 'r', v: v });
    [['vr', 4], ['reb', 4], ['roja', 4], ['ama', 4], ['azul', azul], ['cuad', cuad]].forEach(function (p) {
      for (i = 0; i < p[1]; i++) deck.push({ id: id++, k: p[0] });
    });
    return deck;
  }

  function shuffle(a, rng) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------- Pile state ---------- */

  // What the next play has to beat. Blue flags are transparent ("lo que valga
  // contra el ritmo de abajo"); a Red flag or an empty pile means vía libre.
  function effectiveTop(pile) {
    for (var i = pile.length - 1; i >= 0; i--) {
      var c = pile[i];
      if (c.k === 'azul') continue;
      if (c.k === 'roja') return null;
      return c;
    }
    return null;
  }

  function canPlayKind(c, pile) {
    var top = pile.length ? pile[pile.length - 1] : null;
    var eff = effectiveTop(pile);
    if (c.k === 'roja' || c.k === 'cuad') return true;
    if (c.k === 'azul') {
      if (top && top.k === 'azul') return false;
      return !eff || eff.k === 'r';
    }
    if (!eff) return true; // vía libre
    switch (eff.k) {
      case 'r':
        if (c.k === 'r') return c.v >= eff.v;
        if (c.k === 'ama' || c.k === 'reb') return eff.v <= 4;
        return c.k === 'vr';
      case 'ama': return (c.k === 'r' && c.v <= 4) || c.k === 'ama';
      case 'reb': return c.k === 'reb' || c.k === 'vr' || (c.k === 'r' && c.v >= 5);
      case 'vr': return c.k === 'vr';
    }
    return false;
  }

  // Validate a set of cards played together. Returns the ordered cards to put on
  // the pile, or an error message in Spanish for the UI.
  function checkPlay(cards, pile, opening) {
    if (!cards.length) return { error: 'Elige una o más cartas.' };
    if (opening) {
      var okOpen = cards.every(function (c) { return c.k === 'r' && c.v === opening; });
      return okOpen ? { cards: cards.slice() } : { error: 'Para arrancar la carrera hay que jugar el Ritmo ' + opening + '.' };
    }
    if (cards.every(function (c) { return sameKind(c, cards[0]); })) {
      if (cards[0].k === 'cuad' && cards.length > 1) return { error: 'La Bandera a Cuadros se juega de una en una: la primera ya descarta la pila.' };
      if (!canPlayKind(cards[0], pile)) return { error: reasonFor(cards[0], pile) };
      return { cards: cards.slice() };
    }
    // Rebufo: one or more Rebufos plus up to two consecutive high rhythm values
    var rebs = cards.filter(function (c) { return c.k === 'reb'; });
    var rest = cards.filter(function (c) { return c.k !== 'reb'; });
    if (!rebs.length) return { error: 'Solo puedes jugar juntas cartas del mismo valor (o un Rebufo con ritmos altos).' };
    if (!rest.every(function (c) { return c.k === 'r' && c.v >= 5; })) return { error: 'Con el Rebufo solo puedes sumar ritmos de 5 o más.' };
    var vals = rest.map(function (c) { return c.v; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();
    if (vals.length > 2 || (vals.length === 2 && vals[1] - vals[0] !== 1)) return { error: 'El Rebufo permite como máximo dos valores consecutivos (por ejemplo 6 y 7).' };
    if (!canPlayKind(rebs[0], pile)) return { error: reasonFor(rebs[0], pile) };
    return { cards: rebs.concat(rest.sort(function (a, b) { return a.v - b.v; })) };
  }

  function reasonFor(c, pile) {
    var eff = effectiveTop(pile);
    if (c.k === 'azul' && pile.length && pile[pile.length - 1].k === 'azul') return 'No se juega una Bandera Azul sobre otra.';
    if (!eff) return 'Esa carta no se puede jugar ahora.';
    if (eff.k === 'ama') return 'Después de una Bandera Amarilla solo valen ritmos del 1 al 4, otra Amarilla, Roja o a Cuadros.';
    if (eff.k === 'vr') return 'Sobre la Vuelta Rápida solo valen otra Vuelta Rápida, Roja o a Cuadros.';
    if (eff.k === 'reb') return 'Sobre un Rebufo solo valen otro Rebufo, ritmos de 5 o más, Vuelta Rápida, Roja o a Cuadros.';
    if (c.k === 'r') return 'Necesitas un ritmo de ' + eff.v + ' o más.';
    if (c.k === 'ama' || c.k === 'reb') return 'Esa carta solo entra sobre ritmos bajos (1 a 4).';
    if (c.k === 'azul') return 'La Bandera Azul no entra sobre Amarilla, Rebufo ni Vuelta Rápida.';
    return 'Esa carta no se puede jugar ahora.';
  }

  // Describe the current constraint for the table banner
  function pileHint(pile, opening) {
    if (opening) return 'Arranca quien tenga el Ritmo ' + opening;
    var eff = effectiveTop(pile);
    if (!eff) return 'Vía libre: cualquier carta';
    if (eff.k === 'r') return eff.v <= 4 ? 'Juega ' + eff.v + ' o más, o una especial' : 'Juega ' + eff.v + ' o más, Vuelta Rápida, Roja, Azul o a Cuadros';
    if (eff.k === 'ama') return 'Bandera Amarilla: ritmos del 1 al 4';
    if (eff.k === 'reb') return 'Rebufo: ritmo de 5 o más o especial alta';
    if (eff.k === 'vr') return 'Vuelta Rápida: solo Vuelta Rápida, Roja o a Cuadros';
    return '';
  }

  /* ---------- Game state ---------- */

  function newGame(opts) {
    opts = opts || {};
    var rng = opts.rng || Math.random;
    var n = 4;
    var names = opts.names || DEFAULT_NAMES;
    var deck = shuffle(makeDeck(n), rng);
    var players = names.slice(0, n).map(function (name, i) {
      return { id: i, name: name, hand: [], visible: [], hidden: [], place: 0 };
    });
    var tableCount = n === 2 ? 5 : 3;
    players.forEach(function (p) { p.hidden = deck.splice(0, tableCount); });
    players.forEach(function (p) { p.visible = deck.splice(0, tableCount); });
    var i = 0;
    while (deck.length) players[i++ % n].hand.push(deck.shift());
    players.forEach(function (p) { sortCards(p.hand); });

    var s = {
      players: players, pile: [], discarded: 0, current: 0, opening: null,
      skipNext: false, chain: null, finished: [], over: false, log: [], rng: rng
    };
    // Lowest rhythm in hand starts. In a real game it's a race; the human gets
    // priority when tied so the opening never feels unfair on screen.
    for (var v = 1; v <= 8; v++) {
      var holders = players.filter(function (p) { return p.hand.some(function (c) { return c.k === 'r' && c.v === v; }); });
      if (holders.length) {
        var starter = holders[0].id === 0 ? holders[0] : holders[Math.floor(rng() * holders.length)];
        s.current = starter.id;
        s.opening = v;
        break;
      }
    }
    return s;
  }

  function stageOf(p) {
    if (p.place) return 'Meta';
    if (p.visible.length) return 'Mano';
    if (p.hand.length) return 'Visibles';
    return 'Ocultas';
  }

  function log(s, text, pid) { s.log.push({ text: text, pid: pid }); }

  function alive(s) { return s.players.filter(function (p) { return !p.place; }); }

  // Moves the visible cards into the hand once the hand is empty (rules: stage 2)
  function refillFromVisible(p) {
    if (!p.hand.length && p.visible.length) {
      p.hand = sortCards(p.visible);
      p.visible = [];
      return true;
    }
    return false;
  }

  function checkFinish(s, p) {
    if (!p.place && !p.hand.length && !p.visible.length && !p.hidden.length) {
      s.finished.push(p.id);
      p.place = s.finished.length;
      log(s, p.name + (p.id === 0 ? ' cruzas' : ' cruza') + ' la meta en ' + p.place + '.º lugar', p.id);
      var left = alive(s);
      if (left.length === 1) {
        s.finished.push(left[0].id);
        left[0].place = s.finished.length;
        s.over = true;
        log(s, left[0].name + (left[0].id === 0 ? ' te quedas' : ' se queda') + ' con cartas: último lugar', left[0].id);
      }
      return true;
    }
    return false;
  }

  function discardPile(s) {
    s.discarded += s.pile.length;
    s.pile = [];
  }

  function carrilLleno(pile) {
    if (pile.length < 4) return false;
    var last = pile.slice(-4);
    return last.every(function (c) { return sameKind(c, last[0]); });
  }

  /* Play cards from the current player's hand.
     Returns { ok, error, endsTurn, canChain } */
  function play(s, ids) {
    var p = s.players[s.current];
    var cards = ids.map(function (id) { return p.hand.find(function (c) { return c.id === id; }); });
    if (cards.some(function (c) { return !c; })) return { error: 'Esas cartas no están en tu mano.' };
    if (s.chain && !cards.every(function (c) { return sameKind(c, s.chain); })) {
      return { error: 'Para seguir en este turno tienes que mantener el mismo valor (' + cardName(s.chain) + ').' };
    }
    var res = checkPlay(cards, s.pile, s.opening);
    if (res.error) return res;
    p.hand = p.hand.filter(function (c) { return ids.indexOf(c.id) < 0; });
    return putOnPile(s, p, res.cards);
  }

  function putOnPile(s, p, cards) {
    var wasOpening = !!s.opening;
    s.opening = null;
    // Check Carril Lleno after every card: 4 Rebufos in a combo also count.
    // If it happens mid-play, the rest of that play is discarded with the pile.
    var full = false;
    cards.forEach(function (c) {
      s.pile.push(c);
      if (!full && carrilLleno(s.pile)) full = true;
    });
    var label = describe(cards);
    var endsTurn = true, special = '';
    var last = cards[cards.length - 1];

    if (last.k === 'cuad') {
      discardPile(s); special = ' · bandera a cuadros: se descarta la pila';
    } else if (full) {
      discardPile(s); special = ' · ¡Carril Lleno! Se descarta la pila';
    } else if (last.k === 'azul') {
      s.skipNext = true; special = ' · salta al siguiente';
    } else if (last.k === 'roja') {
      special = ' · vía libre para el siguiente';
    }
    log(s, p.name + (p.id === 0 ? ' juegas ' : ' juega ') + label + special, p.id);

    var tookVisible = refillFromVisible(p);
    if (tookVisible) log(s, p.name + (p.id === 0 ? ' tomas' : ' toma') + ' sus cartas visibles', p.id);
    var finished = checkFinish(s, p);

    // Chaining: after emptying the hand you may keep going with the visible
    // cards, as long as the value stays the same and nothing closed the turn.
    var canChain = false;
    var mixed = cards.some(function (c) { return !sameKind(c, cards[0]); });
    if (!finished && tookVisible && !special && !mixed && !wasOpening &&
        p.hand.some(function (c) { return sameKind(c, last); })) {
      canChain = true;
      endsTurn = false;
      s.chain = last;
    } else {
      s.chain = null;
    }
    if (endsTurn) advance(s);
    return { ok: true, endsTurn: endsTurn, canChain: canChain };
  }

  function describe(cards) {
    var groups = [];
    cards.forEach(function (c) {
      var g = groups.find(function (x) { return sameKind(x.c, c); });
      if (g) g.n++; else groups.push({ c: c, n: 1 });
    });
    return groups.map(function (g) { return (g.n > 1 ? g.n + '× ' : '') + cardName(g.c); }).join(' + ');
  }

  function endChain(s) {
    if (!s.chain) return;
    s.chain = null;
    advance(s);
  }

  // No valid play: take the whole pile into the hand, turn over
  function pickUp(s) {
    var p = s.players[s.current];
    var n = s.pile.length;
    p.hand = sortCards(p.hand.concat(s.pile));
    s.pile = [];
    s.chain = null;
    log(s, p.name + (p.id === 0 ? ' recoges' : ' recoge') + ' la pila (' + n + (n === 1 ? ' carta)' : ' cartas)'), p.id);
    advance(s);
    return { ok: true, endsTurn: true };
  }

  // Stage 3: reveal one hidden card. Playable → it goes on the pile;
  // otherwise it joins the hand together with the whole pile.
  function revealHidden(s, index) {
    var p = s.players[s.current];
    if (p.hand.length || p.visible.length || !p.hidden[index]) return { error: 'Todavía no te toca jugar las cartas ocultas.' };
    var c = p.hidden.splice(index, 1)[0];
    var res = checkPlay([c], s.pile, null);
    if (res.error) {
      var n = s.pile.length;
      p.hand = sortCards(s.pile.concat([c]));
      s.pile = [];
      log(s, p.name + (p.id === 0 ? ' revelas ' : ' revela ') + cardName(c) + ' y no entra: ' + (p.id === 0 ? 'recoges' : 'recoge') + ' la pila (' + (n + 1) + ' cartas)', p.id);
      advance(s);
      return { ok: true, endsTurn: true, revealed: c, failed: true };
    }
    log(s, p.name + (p.id === 0 ? ' revelas ' : ' revela ') + cardName(c), p.id);
    var r = putOnPile(s, p, [c]);
    r.revealed = c;
    return r;
  }

  function advance(s) {
    if (s.over) return;
    var i = nextAliveIndex(s, s.current);
    if (s.skipNext) {
      var skipped = s.players[i];
      log(s, skipped.name + (skipped.id === 0 ? ' pierdes' : ' pierde') + ' el turno por la Bandera Azul', skipped.id);
      i = nextAliveIndex(s, i);
    }
    s.skipNext = false;
    s.current = i;
  }

  function nextAliveIndex(s, from) {
    var n = s.players.length;
    for (var k = 1; k <= n; k++) {
      var j = (from + k) % n;
      if (!s.players[j].place) return j;
    }
    return from;
  }

  /* ---------- Move generation (bots and hints) ---------- */

  function groupsOf(hand) {
    var groups = [];
    hand.forEach(function (c) {
      var g = groups.find(function (x) { return sameKind(x[0], c); });
      if (g) g.push(c); else groups.push([c]);
    });
    return groups;
  }

  function legalMoves(s) {
    var p = s.players[s.current];
    if (!p.hand.length) return [];
    var moves = [];
    groupsOf(p.hand).forEach(function (g) {
      if (s.chain && !sameKind(g[0], s.chain)) return;
      var cards = g[0].k === 'cuad' ? [g[0]] : g;
      if (!checkPlay(cards, s.pile, s.opening).error) moves.push(cards);
    });
    // Rebufo combos (best pair of consecutive high values)
    var rebs = p.hand.filter(function (c) { return c.k === 'reb'; });
    if (!s.opening && !s.chain && rebs.length && canPlayKind(rebs[0], s.pile)) {
      for (var v = 5; v <= 8; v++) {
        var a = p.hand.filter(function (c) { return c.k === 'r' && c.v === v; });
        var b = p.hand.filter(function (c) { return c.k === 'r' && c.v === v + 1; });
        if (a.length) moves.push(rebs.concat(a));
        if (a.length && b.length) moves.push(rebs.concat(a, b));
      }
    }
    return moves;
  }

  function playableIds(s) {
    var ids = {};
    legalMoves(s).forEach(function (m) { m.forEach(function (c) { ids[c.id] = true; }); });
    return ids;
  }

  // Simple bot: dump low rhythms first, keep strong specials for when it's stuck
  // or the pile is worth burning.
  function botChoose(s) {
    var moves = legalMoves(s);
    if (!moves.length) return null;
    // A little unpredictability: it feels more human and breaks the endless
    // pile ping-pong that two identical greedy bots can fall into.
    if (s.rng() < 0.12) return moves[Math.floor(s.rng() * moves.length)];
    var p = s.players[s.current];
    var pileSize = s.pile.length;
    var nextP = nextAlive(s);
    var nextCards = nextP ? nextP.hand.length + nextP.visible.length + nextP.hidden.length : 99;
    var best = null, bestScore = -1e9;
    moves.forEach(function (m) {
      var top = m[m.length - 1], score;
      var mixed = m.some(function (c) { return !sameKind(c, m[0]); });
      if (mixed) score = 55 + m.length * 6;
      else if (top.k === 'r') score = 100 - top.v * 6 + m.length * 4;
      else if (top.k === 'cuad') score = pileSize >= 6 ? 70 : 8;
      else if (top.k === 'ama') score = 40 + (nextCards <= 3 ? 25 : 0);
      else if (top.k === 'azul') score = 35 + (nextCards <= 3 ? 30 : 0);
      else if (top.k === 'reb') score = 30;
      else if (top.k === 'roja') score = 25;
      else if (top.k === 'vr') score = 20 + (nextCards <= 3 ? 20 : 0);
      else score = 10;
      // Going out matters most: prefer moves that empty the hand
      if (m.length === p.hand.length) score += 15;
      score += s.rng() * 6;
      if (score > bestScore) { bestScore = score; best = m; }
    });
    return best;
  }

  function nextAlive(s) {
    var n = s.players.length;
    for (var k = 1; k < n; k++) {
      var p = s.players[(s.current + k) % n];
      if (!p.place) return p;
    }
    return null;
  }

  // One full bot action (used by the page and the simulator)
  function botStep(s) {
    var p = s.players[s.current];
    if (!p.hand.length && !p.visible.length && p.hidden.length) {
      return revealHidden(s, Math.floor(s.rng() * p.hidden.length));
    }
    var m = botChoose(s);
    if (!m) return pickUp(s);
    return play(s, m.map(function (c) { return c.id; }));
  }

  var api = {
    newGame: newGame, play: play, pickUp: pickUp, revealHidden: revealHidden, endChain: endChain,
    legalMoves: legalMoves, playableIds: playableIds, checkPlay: checkPlay, botStep: botStep,
    pileHint: pileHint, effectiveTop: effectiveTop, cardName: cardName, cardFile: cardFile,
    stageOf: stageOf, sameKind: sameKind, defaultNames: DEFAULT_NAMES, deckSize: function (n) { return makeDeck(n || 4).length; }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PintoEngine = api;
})(this);
