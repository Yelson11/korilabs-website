/* PINTO tutorial: a rules finder. Content lives in tutorial-data.js (window.PintoTutorial.groups:
   four groups in the leaflet's order, each with rules written as questions).

   Views
     Phones (< 60rem): no hash = list (search + group chips + questions); #<rule> = one rule with its
       animation, a bottom bar (Anterior · Reglas · Siguiente) and a bottom sheet with every rule.
     Desktop: sidebar (search + all questions) + the open rule. No hash = first rule.
   Routing by hash: #<rule id> (e.g. #ritmo, #azul — instrucciones/ links to these) or #<group id>
   (also the old section ids #desarrollo / #reglas), or #que-jugar (quick reference table: what can be
   played on each top card; shortcut at the top of every list). Each rule's animation loops like a GIF
   and can be paused. */
(function () {
  'use strict';
  var T = window.PintoTutorial;
  var app = document.getElementById('pt');
  if (!T || !app) return;

  var BASE = app.getAttribute('data-cards') || '../img/cartas/';
  var VER = '?v=5';
  var FILES = { cuad: 'bandera-a-cuadros', roja: 'bandera-roja', ama: 'bandera-amarilla', azul: 'bandera-azul', vr: 'vuelta-rapida', reb: 'rebufo', back: 'reverso' };
  var NAMES = { cuad: 'Bandera a Cuadros', roja: 'Bandera Roja', ama: 'Bandera Amarilla', azul: 'Bandera Azul', vr: 'Vuelta Rápida', reb: 'Rebufo', back: 'Carta oculta' };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desk = window.matchMedia('(min-width: 60rem)');

  var GROUPS = T.groups, RULES = [];
  GROUPS.forEach(function (g, gi) {
    g.rules.forEach(function (r, k) { r.g = gi; r.k = k; r.i = RULES.length; RULES.push(r); });
  });
  // Quick reference table: not part of any group, reachable at #que-jugar, from every list and from search
  var REF = T.reference || null, ALL = RULES.slice();
  if (REF) { REF.isRef = true; REF.i = RULES.length; ALL.push(REF); }
  var TABLE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 10h18M9 10v10"/></svg>';

  var cur = 0, view = 'detail', query = '', lastRule = -1, paused = false;
  var sc = null, turn = null, skipped = null, runId = 0;   // table state, highlighted turn, skipped player, running loop id

  function file(c) { return /^r\d$/.test(c) ? 'ritmo-' + c.slice(1) : FILES[c]; }
  function name(c) { return /^r\d$/.test(c) ? 'Ritmo ' + c.slice(1) : NAMES[c]; }
  function img(c) { return '<img src="' + BASE + file(c) + '.webp' + VER + '" alt="' + name(c) + '" width="660" height="922" draggable="false">'; }
  function thumb(c) { return '<img src="' + BASE + file(c) + '.webp' + VER + '" alt="" width="660" height="922" loading="lazy">'; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function $(sel) { return app.querySelector(sel); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function miniOf(r) { return r.card || r.mini || 'back'; }

  /* ---------- Search ---------- */
  var STOP = ' de la el los las que y a en un una unas unos mi me se con por lo es al del le o si tu yo hay como cuando para pasa puedo hago hace ';
  function norm(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function words(s) { return norm(s.replace(/<[^>]+>/g, ' ')).split(/[^a-z0-9]+/).filter(Boolean); }
  function tokens(q) {
    var all = words(q).map(function (t) { return t.length > 3 && /s$/.test(t) ? t.slice(0, -1) : t; });
    var useful = all.filter(function (t) { return STOP.indexOf(' ' + t + ' ') < 0; });
    return useful.length ? useful : all;
  }
  ALL.forEach(function (r) {
    r.head = words(r.q + ' ' + r.title);
    r.body = words([r.keys, r.text, r.on && 'sobre ' + r.on, r.then && 'luego ' + r.then, r.note, r.lead].concat(r.rows ? r.rows.map(function (x) { return x.top + ' ' + x.can; }) : []).filter(Boolean).join(' '));
  });
  function has(list, t) { for (var i = 0; i < list.length; i++) if (list[i].indexOf(t) === 0) return true; return false; }
  function search(q) {
    var tk = tokens(q), full = [], part = [];
    if (!tk.length) return null;
    ALL.forEach(function (r) {
      var score = 0, hits = 0;
      tk.forEach(function (t) {
        if (has(r.head, t)) { score += 3; hits++; } else if (has(r.body, t)) { score += 1; hits++; }
      });
      if (hits === tk.length) full.push({ r: r, s: score });
      else if (hits) part.push({ r: r, s: score });
    });
    function by(a, b) { return b.s - a.s || (b.r.isRef ? 1 : 0) - (a.r.isRef ? 1 : 0) || a.r.i - b.r.i; }   // ties: the quick table first
    return { tk: tk, full: full.sort(by).map(function (x) { return x.r; }), part: part.sort(by).slice(0, 4).map(function (x) { return x.r; }) };
  }
  function mark(text, tk) {
    if (!tk || !tk.length) return esc(text);
    return text.split(/([A-Za-zÀ-ÿ0-9]+)/).map(function (seg, n) {
      if (n % 2 === 0) return esc(seg);
      var w = norm(seg);
      return tk.some(function (t) { return w.indexOf(t) === 0; }) ? '<mark>' + esc(seg) + '</mark>' : esc(seg);
    }).join('');
  }

  /* ---------- Routing ---------- */
  function fromHash() {
    var h = decodeURIComponent(location.hash.slice(1)), gi = -1, ri = -1;
    ALL.forEach(function (r) { if (r.id === h) ri = r.i; });
    GROUPS.forEach(function (g, k) { if (g.id === h || (g.alias || []).indexOf(h) > -1) gi = k; });
    var sheet = $('.pt-sheet'); if (sheet && sheet.open) sheet.close();
    if (ri > -1) { cur = ri; view = 'detail'; }
    else if (desk.matches) { cur = gi > -1 ? GROUPS[gi].rules[0].i : 0; view = 'detail'; }
    else { view = 'list'; }
    render(!!h, gi);
  }

  /* ---------- Lists (page, desktop sidebar, bottom sheet) ---------- */
  function searchBox(ctx) {
    return '<label class="pt-search"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>' +
      '<span class="visually-hidden">Buscar una duda</span>' +
      '<input type="search" class="pt-search__input" data-ctx="' + ctx + '" value="' + esc(query) + '" placeholder="¿Qué duda tienes?" autocomplete="off" enterkeyhint="search"></label>';
  }
  function row(r, ctx, tk) {
    var on = view === 'detail' && r.i === cur;
    return '<a class="pt-q' + (on ? ' is-on' : '') + '" href="#' + r.id + '" data-rule="' + r.i + '"' + (on ? ' aria-current="page"' : '') + '>' +
      (r.isRef ? '<span class="pt-q__icon">' + TABLE_ICON + '</span>' : '<span class="pt-q__mini">' + thumb(miniOf(r)) + '</span>') +
      '<span class="pt-q__t"><span class="pt-q__q">' + mark(r.title, tk) + '</span></span>' +
      '<span class="pt-q__go" aria-hidden="true">›</span></a>';
  }
  function groupHead(g, k, ctx) {
    return '<h2 class="pt-g__head"' + (ctx === 'page' ? ' id="g-' + g.id + '"' : '') + '><span class="pt-g__n" style="background:' + g.color + '">' + (k + 1) + '</span>' + g.title + '</h2>';
  }
  function listBody(ctx) {
    var res = search(query);
    if (res) {
      var html = '<p class="pt-count" role="status">' + (res.full.length === 1 ? '1 resultado' : res.full.length + ' resultados') + '</p>';
      if (res.full.length) html += '<div class="pt-rows">' + res.full.map(function (r) { return row(r, ctx, res.tk); }).join('') + '</div>';
      else {
        html += '<p class="pt-empty">No encontramos esa duda. Prueba con otras palabras, como “recoger”, “azul” o “iguales”.</p>';
        if (res.part.length) html += '<p class="pt-count">Quizás te sirva</p><div class="pt-rows">' + res.part.map(function (r) { return row(r, ctx, res.tk); }).join('') + '</div>';
      }
      return html + '<p class="pt-more"><button type="button" class="pt-link" data-clear>Ver todas las reglas</button> · ' +
        '<a class="pt-link" href="../reglamento.pdf" target="_blank" rel="noopener noreferrer">Reglamento completo<span class="visually-hidden"> (se abre en una pestaña nueva)</span></a></p>';
    }
    return quickHTML(ctx) + GROUPS.map(function (g, k) {
      var inner = g.special && ctx === 'page'
        ? '<div class="pt-cards">' + g.rules.map(function (r) {
            return '<a class="pt-card" href="#' + r.id + '" data-rule="' + r.i + '">' + thumb(r.card) + '<span>' + r.title + '</span></a>';
          }).join('') + '</div>'
        : '<div class="pt-rows">' + g.rules.map(function (r) { return row(r, ctx); }).join('') + '</div>';
      return '<section class="pt-g" data-g="' + k + '">' + groupHead(g, k, ctx) + inner + '</section>';
    }).join('');
  }
  function quickHTML(ctx) {
    if (!REF) return '';
    var on = view === 'detail' && cur === REF.i;
    return '<a class="pt-quick' + (on ? ' is-on' : '') + '" href="#' + REF.id + '" data-rule="' + REF.i + '"' + (on ? ' aria-current="page"' : '') + '>' +
      '<span class="pt-quick__icon">' + TABLE_ICON + '</span><span class="pt-quick__t"><span class="pt-quick__k">Acceso rápido</span>' +
      '<span class="pt-quick__q">' + esc(REF.title) + '</span>' + (ctx === 'side' ? '' : '<span class="pt-quick__s">Tabla según la carta de arriba de la pila</span>') + '</span>' +
      '<span class="pt-q__go" aria-hidden="true">›</span></a>';
  }
  function listHTML(ctx) {
    var chips = ctx === 'page' ? '<nav class="pt-chips" aria-label="Grupos de reglas">' + GROUPS.map(function (g, k) {
      return '<button type="button" class="pt-chip' + (k === 0 ? ' is-on' : '') + '" data-group="' + k + '"><span class="pt-chip__dot" style="background:' + g.color + '"></span>' + g.title + '</button>';
    }).join('') + '</nav>' : '';
    return '<div class="pt-list pt-list--' + ctx + (query ? ' is-searching' : '') + '" data-ctx="' + ctx + '">' +
      '<div class="pt-find">' + searchBox(ctx) + chips + '</div>' +
      '<div class="pt-list__body">' + listBody(ctx) + '</div></div>';
  }
  function refreshLists(except) {
    app.querySelectorAll('.pt-list').forEach(function (l) {
      var ctx = l.getAttribute('data-ctx');
      l.classList.toggle('is-searching', !!query);
      var inp = l.querySelector('.pt-search__input');
      if (inp !== except) inp.value = query;
      l.querySelector('.pt-list__body').innerHTML = listBody(ctx);
    });
  }

  /* ---------- Rule (detail) ---------- */
  function refHTML() {
    var first = RULES[0];
    return '<article class="pt-rule pt-rule--ref">' +
      '<a class="pt-back" href="#todas"><span aria-hidden="true">‹</span> Todas las reglas</a>' +
      '<p class="pt-crumb"><span class="pt-crumb__dot" style="background:var(--cream)"></span>Acceso rápido</p>' +
      '<p class="pt-ask">' + esc(REF.q) + '</p>' +
      '<h2 class="pt-title" tabindex="-1">' + REF.title + '</h2>' +
      '<p class="pt-say">' + REF.lead + '</p>' +
      '<div class="pt-ref" role="table" aria-label="' + REF.title + '">' +
      '<div class="pt-ref__head" role="row"><span role="columnheader">Arriba de la pila</span><span role="columnheader">Puedes jugar</span></div>' +
      REF.rows.map(function (x) {
        var rule = RULES.filter(function (o) { return o.id === x.rel; })[0];
        return '<div class="pt-ref__row" role="row"><div class="pt-ref__top" role="rowheader">' +
          (x.card ? '<span class="pt-ref__card">' + thumb(x.card) + '</span>' : '<span class="pt-ref__card pt-ref__card--empty" aria-hidden="true"></span>') +
          '<span><b>' + x.top + '</b>' + (x.sub ? '<small>' + x.sub + '</small>' : '') + '</span></div>' +
          '<div class="pt-ref__can" role="cell"><p>' + x.can + '</p>' +
          (rule ? '<a class="pt-ref__link" href="#' + rule.id + '">Ver regla: ' + rule.title + ' <span aria-hidden="true">›</span></a>' : '') + '</div></div>';
      }).join('') + '</div>' +
      (REF.note ? '<p class="pt-note">' + REF.note + '</p>' : '') +
      '<nav class="pt-pn" aria-label="Siguiente"><span></span><a class="pt-pn__btn pt-pn__btn--next" href="#' + first.id + '"><span class="pt-pn__dir">Empezar las reglas <span aria-hidden="true">›</span></span><b>' + first.title + '</b></a></nav>' +
      '</article>';
  }
  function detailHTML() {
    if (REF && cur === REF.i) return refHTML();
    var r = RULES[cur], g = GROUPS[r.g], prev = RULES[cur - 1], next = RULES[cur + 1];
    var html = '<article class="pt-rule">' +
      '<a class="pt-back" href="#' + g.id + '"><span aria-hidden="true">‹</span> Todas las reglas</a>' +
      '<p class="pt-crumb"><span class="pt-crumb__dot" style="background:' + g.color + '"></span>' + g.title + ' · ' + (r.k + 1) + ' de ' + g.rules.length + '</p>' +
      '<div class="pt-stagebox"><div class="pt-table" aria-hidden="true"></div>' +
      '<button type="button" class="pt-pause" aria-pressed="' + paused + '"><span aria-hidden="true">' + (paused ? '▶' : '❚❚') + '</span><span class="visually-hidden">Pausar animación</span></button></div>' +
      '<p class="pt-ask">' + esc(r.q) + '</p>' +
      '<h2 class="pt-title" tabindex="-1">' + r.title + '</h2>' +
      (r.on ? '<p class="pt-on"><strong>Sobre:</strong> ' + r.on + '</p>' : '') +
      (r.text ? '<div class="pt-say">' + r.text + '</div>' : '') +
      (r.then ? '<p class="pt-then"><strong>Luego:</strong> ' + r.then + '</p>' : '') +
      (r.note ? '<p class="pt-note">' + r.note + '</p>' : '') +
      (r.rel && r.rel.length ? '<div class="pt-rel"><p class="pt-rel__label">Relacionado</p><div class="pt-rel__list">' + r.rel.map(function (id) {
        var o = RULES.filter(function (x) { return x.id === id; })[0];
        return o ? '<a class="pt-rel__chip" href="#' + o.id + '">' + o.title + '</a>' : '';
      }).join('') + '</div></div>' : '') +
      '<nav class="pt-pn" aria-label="Reglas anterior y siguiente">' +
      (prev ? '<a class="pt-pn__btn" href="#' + prev.id + '"><span class="pt-pn__dir"><span aria-hidden="true">‹</span> Anterior</span><b>' + prev.title + '</b></a>' : '<span></span>') +
      (next ? '<a class="pt-pn__btn pt-pn__btn--next" href="#' + next.id + '"><span class="pt-pn__dir">Siguiente <span aria-hidden="true">›</span></span><b>' + next.title + '</b></a>'
            : '<a class="pt-pn__btn pt-pn__btn--next" href="../instrucciones/"><span class="pt-pn__dir">Terminaste <span aria-hidden="true">›</span></span><b>Ver instrucciones</b></a>') +
      '</nav></article>';
    return html;
  }
  function barHTML() {
    var isRef = REF && cur === REF.i;
    var prev = isRef ? null : RULES[cur - 1], next = isRef ? RULES[0] : RULES[cur + 1];
    return '<nav class="pt-bar" aria-label="Navegación del tutorial">' +
      (prev ? '<a class="pt-bar__pn" href="#' + prev.id + '"><span><span aria-hidden="true">‹</span> Anterior</span><b>' + prev.title + '</b></a>' : '<span class="pt-bar__pn"></span>') +
      '<button type="button" class="pt-bar__idx" data-sheet aria-haspopup="dialog"><span class="pt-bar__icon" aria-hidden="true"></span>Reglas</button>' +
      (next ? '<a class="pt-bar__pn pt-bar__pn--next" href="#' + next.id + '"><span>Siguiente <span aria-hidden="true">›</span></span><b>' + next.title + '</b></a>'
            : '<a class="pt-bar__pn pt-bar__pn--next" href="../instrucciones/"><span>Terminaste <span aria-hidden="true">›</span></span><b>Instrucciones</b></a>') +
      '</nav>' +
      '<dialog class="pt-sheet" aria-label="Todas las reglas"><div class="pt-sheet__top"><span class="pt-sheet__grab" aria-hidden="true"></span>' +
      '<button type="button" class="pt-sheet__close" data-close>Cerrar</button></div>' + listHTML('sheet') + '</dialog>';
  }

  /* ---------- Render ---------- */
  function render(fromNav, gi) {
    runId++;
    var isDesk = desk.matches, detail = view === 'detail';
    document.body.classList.toggle('pt-is-detail', detail && !isDesk);
    document.body.classList.toggle('pt-is-list', !detail);
    if (isDesk) app.innerHTML = '<div class="pt-layout"><aside class="pt-side" aria-label="Todas las reglas">' + listHTML('side') + '</aside><div class="pt-main">' + detailHTML() + '</div></div>';
    else if (detail) app.innerHTML = detailHTML() + barHTML();
    else app.innerHTML = listHTML('page');

    if (detail) {
      lastRule = cur;
      if (!(REF && cur === REF.i)) loop(RULES[cur], runId);
      if (fromNav) {
        var top = app.getBoundingClientRect().top;
        if (top < 0 || !isDesk) window.scrollTo({ top: Math.max(0, window.scrollY + top - 12), behavior: 'auto' });
        var t = $('.pt-title'); if (t) t.focus({ preventScroll: true });
      }
      var on = $('.pt-side .pt-q.is-on, .pt-side .pt-quick.is-on');
      if (on) { var side = $('.pt-side'), sr = side.getBoundingClientRect(), or = on.getBoundingClientRect(); if (or.top < sr.top || or.bottom > sr.bottom) side.scrollTop += or.top - sr.top - sr.height / 3; }
    } else {
      var target = lastRule > -1 ? $('.pt-list--page [data-rule="' + lastRule + '"]') : null;
      if (target) { target.scrollIntoView({ block: 'center' }); target.focus({ preventScroll: true }); }
      else if (gi > -1) { var h = document.getElementById('g-' + GROUPS[gi].id); if (h) h.scrollIntoView({ block: 'start' }); }
      syncChips();
    }
  }

  /* Group chips follow the scroll on the phone list */
  function syncChips() {
    var chips = app.querySelectorAll('.pt-chip'); if (!chips.length) return;
    var find = $('.pt-find'), line = (find ? find.getBoundingClientRect().bottom : 0) + 24, on = 0;
    app.querySelectorAll('.pt-list--page .pt-g').forEach(function (s) { if (s.getBoundingClientRect().top <= line) on = +s.getAttribute('data-g'); });
    chips.forEach(function (c, k) {
      var was = c.classList.contains('is-on');
      c.classList.toggle('is-on', k === on);
      if (k === on && !was) { var bar = c.parentNode; bar.scrollTo({ left: c.offsetLeft - 16, behavior: reduced ? 'auto' : 'smooth' }); }
    });
  }
  window.addEventListener('scroll', function () { if (view === 'list') syncChips(); }, { passive: true });

  function drawTable(pg) {
    var tbl = $('.pt-table'); if (!tbl) return;
    var opps = '<div class="pt-opps">' + [1, 2, 3].map(function (n) {
      return '<div class="pt-opp' + (turn === n ? ' is-turn' : '') + (skipped === n ? ' is-skipped' : '') + '" data-p="' + n + '"><div class="pt-opp__fan">' + img('back') + img('back') + img('back') + '</div>' +
        '<span class="pt-opp__name">Jugador ' + n + '</span>' + (skipped === n ? '<span class="pt-opp__tag">Pierde el turno</span>' : '') + '</div>';
    }).join('') + '</div>';

    var shown = sc.pile.slice(-5);
    var pile = '<div class="pt-pilewrap"><div class="pt-pile">' + (shown.length
      ? shown.map(function (c, i) { return '<div class="pt-pc" style="--i:' + i + '">' + img(c) + '</div>'; }).join('')
      : '<div class="pt-free">Sin cartas</div>') + '</div>' +
      '<span class="pt-pile__label">' + (shown.length ? 'Arriba: <strong>' + name(shown[shown.length - 1]) + '</strong>' : 'Pila vacía') + '</span></div>';

    var slots = Math.max(sc.vis.length, sc.hid), mesa = '';
    for (var i = 0; i < slots; i++) {
      var v = sc.vis[i];
      mesa += '<div class="pt-slot">' +
        (i < sc.hid ? '<span class="pt-c pt-c--hid" data-z="hid" data-i="' + i + '">' + img('back') + '</span>' : '<span class="pt-c pt-c--ghost"></span>') +
        (v ? '<span class="pt-c pt-c--vis" data-z="vis" data-i="' + i + '">' + img(v) + '</span>' : '') + '</div>';
    }
    // Your hand is held as a fan: each card turns a little around a point below the hand
    var n = sc.hand.length, mid = (n - 1) / 2, step = n > 1 ? Math.min(9, 36 / (n - 1)) : 0;
    var hand = sc.hand.map(function (c, k) {
      return '<span class="pt-c" data-z="hand" data-i="' + k + '" style="--r:' + ((k - mid) * step).toFixed(1) + 'deg;--y:' + (Math.pow(k - mid, 2) * 1.6).toFixed(1) + 'px">' + img(c) + '</span>';
    }).join('');

    tbl.innerHTML = opps + pile +
      '<div class="pt-you' + (turn === 'you' ? ' is-turn' : '') + '">' +
      (pg.vis || pg.hid ? '<div class="pt-zone pt-zone--mesa"><span class="pt-zone__label">Tu mesa</span><div class="pt-mesa">' + (mesa || '<span class="pt-none">Sin cartas</span>') + '</div></div>' : '') +
      '<div class="pt-zone pt-zone--hand"><span class="pt-zone__label">Tu mano</span><div class="pt-hand">' + (hand || '<span class="pt-none">Sin cartas</span>') + '</div></div>' +
      '</div>';
  }

  /* ---------- Animation ---------- */
  /* Card geometry: centre + unrotated width, so a card lands exactly where it will be drawn */
  var RATIO = 922 / 660;
  function spot(el) { var r = el.getBoundingClientRect(); return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: el.offsetWidth || r.width }; }
  function cardW() { var c = $('.pt-table .pt-c'); return c ? c.offsetWidth : 48; }
  function pileSlot(extra) {            // where the next card of the pile goes (the pile shows the last 5, .9rem apart)
    var pile = $('.pt-pile'), r = pile.getBoundingClientRect(), ref = $('.pt-pile .pt-pc') || $('.pt-free');
    var pw = ref.offsetWidth, gap = parseFloat(getComputedStyle(document.documentElement).fontSize) * .9;
    var j = Math.min(Math.min(sc.pile.length, 5) - (sc.pile.length >= 5 ? 1 : 0) + (extra || 0), 4);
    return { cx: r.left + j * gap + pw / 2, cy: r.top + pw * RATIO / 2, w: pw };
  }
  function handSlot() { var h = $('.pt-hand').getBoundingClientRect(); return { cx: h.left + h.width / 2, cy: h.top + h.height / 2, w: cardW() }; }
  function fly(fromEl, to, code, opts) {
    opts = opts || {};
    if (!fromEl || !to || reduced) return Promise.resolve();
    var a = spot(fromEl), w = a.w, h = w * RATIO;
    var g = document.createElement('div');
    g.className = 'pt-fly';
    g.innerHTML = img(code);
    g.style.cssText = 'left:' + (a.cx - w / 2) + 'px;top:' + (a.cy - h / 2) + 'px;width:' + w + 'px;';
    document.body.appendChild(g);
    return new Promise(function (res) {
      requestAnimationFrame(function () {
        g.style.transform = 'translate(' + (to.cx - a.cx) + 'px,' + (to.cy - a.cy) + 'px) scale(' + (to.w / w) + ') rotate(' + (opts.rot || 0) + 'deg)';
        setTimeout(function () { g.remove(); res(); }, 520);
      });
    });
  }

  /* Plays the rule's script, then fades and starts again until the page changes.
     Pausing holds the loop between steps. */
  function Stop() {}
  async function loop(pg, id) {
    function alive() { if (id !== runId) throw new Stop(); }
    async function hold(ms) {
      var t = 0;
      while (t < ms || paused) { await wait(50); alive(); if (!paused) t += 50; }
    }
    function findCard(code, from, used) {
      var arr = from === 'hand' ? sc.hand : sc.vis;
      for (var i = 0; i < arr.length; i++) if (arr[i] === code && used.indexOf(i) < 0) { used.push(i); return $('.pt-c[data-z="' + from + '"][data-i="' + i + '"]'); }
      return null;
    }
    try {
      for (;;) {
        sc = { pile: (pg.pile || []).slice(), hand: (pg.hand || []).slice(), vis: (pg.vis || []).slice(), hid: pg.hid || 0 };
        turn = null; skipped = null;
        drawTable(pg);
        $('.pt-table').setAttribute('data-focus', pg.focus || '');
        await hold(1000);
        for (var k = 0; k < pg.script.length; k++) {
          var a = pg.script[k];
          if ('focus' in a) $('.pt-table').setAttribute('data-focus', a.focus);
          if (a.turn) { turn = a.turn; drawTable(pg); }
          if (a.no) {
            app.querySelectorAll('.pt-zone--hand .pt-c').forEach(function (el) {
              var c = sc.hand[+el.getAttribute('data-i')];
              if (a.no === 'hand' || a.no.indexOf(c) > -1) { el.classList.add('is-no'); if (!reduced) el.classList.add('is-shake'); }
            });
          }
          if (a.play) {
            var codes = [].concat(a.play), from = a.from || (sc.hand.length ? 'hand' : 'vis'), used = [];
            var els = codes.map(function (c) { return findCard(c, from, used); });
            await Promise.all(els.map(function (el, n) { var to = pileSlot(n); return wait(n * 120).then(function () { return fly(el, to, codes[n]); }); }));
            alive();
            used.forEach(function (i) { if (from === 'hand') sc.hand[i] = null; else sc.vis[i] = null; });
            sc.hand = sc.hand.filter(Boolean);
            sc.pile = sc.pile.concat(codes);
            drawTable(pg);
          }
          if (a.bot) {
            var opp = $('.pt-opp[data-p="' + a.bot + '"]');
            await fly(opp.querySelector('img:last-child'), pileSlot(), a.card);
            alive();
            sc.pile.push(a.card); drawTable(pg);
          }
          if (a.skip) { skipped = a.skip; drawTable(pg); }
          if (a.tryEach) {             // lift each card of your hand as if to play it, and mark it as not valid
            var tries = app.querySelectorAll('.pt-zone--hand .pt-c');
            for (var t = 0; t < tries.length; t++) {
              tries[t].classList.add('is-lift'); await hold(450);
              tries[t].classList.add('is-no'); await hold(400);
              tries[t].classList.remove('is-lift'); await hold(150);
            }
          }
          if (a.pickup) {
            var cards = app.querySelectorAll('.pt-pile .pt-pc'), pc = sc.pile.slice(-cards.length), hs = handSlot();
            await Promise.all(Array.prototype.map.call(cards, function (el, n) { return wait(n * 120).then(function () { return fly(el, hs, pc[n]); }); }));
            alive();
            sc.hand = sc.hand.concat(sc.pile); sc.pile = []; drawTable(pg);
          }
          if (a.take) {
            var vis = app.querySelectorAll('.pt-c--vis'), codesV = sc.vis.filter(Boolean), hv = handSlot();
            await Promise.all(Array.prototype.map.call(vis, function (el, n) { return wait(n * 110).then(function () { return fly(el, hv, codesV[n]); }); }));
            alive();
            sc.hand = sc.hand.concat(codesV); sc.vis = []; drawTable(pg);
          }
          if (a.flip) {
            var hid = app.querySelectorAll('.pt-c--hid'), el = hid[hid.length - 1];
            el.classList.add('is-flipping');
            await wait(350); alive();
            await fly(el, handSlot(), a.flip);
            alive();
            sc.hid -= 1; sc.hand.push(a.flip); drawTable(pg);
          }
          if (a.clear) {
            $('.pt-pile').classList.add('is-leaving');
            await wait(700); alive();
            sc.pile = []; drawTable(pg);
          }
          await hold(a.wait || 1100);
        }
        await hold(1800);
        var tbl = $('.pt-table'); tbl.classList.add('is-resetting');
        await wait(400); alive();
        tbl.classList.remove('is-resetting');
      }
    } catch (e) { if (!(e instanceof Stop)) throw e; }
  }

  /* ---------- Events ---------- */
  app.addEventListener('input', function (e) {
    if (!e.target.classList.contains('pt-search__input')) return;
    query = e.target.value;
    refreshLists(e.target);
    if (view === 'list' && query) window.scrollTo({ top: Math.max(0, window.scrollY + $('.pt-list--page').getBoundingClientRect().top - 12) });
  });
  app.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.classList.contains('pt-search__input')) {
      var first = e.target.closest('.pt-list').querySelector('.pt-list__body .pt-q');
      if (first) { e.preventDefault(); location.hash = first.getAttribute('href').slice(1); }
    }
  });
  app.addEventListener('click', function (e) {
    var t = e.target;
    var sheet = $('.pt-sheet');
    if (t === sheet) { sheet.close(); return; }          // tap on the backdrop
    var b = t.closest('button, a'); if (!b || !app.contains(b)) return;
    if (b.hasAttribute('data-sheet')) {
      sheet.showModal();
      var on = sheet.querySelector('.pt-q.is-on, .pt-quick.is-on'); if (on) on.scrollIntoView({ block: 'center' });
      return;
    }
    if (b.hasAttribute('data-close')) { sheet.close(); return; }
    if (b.hasAttribute('data-clear')) {
      query = ''; refreshLists(null);
      var inp = b.closest('.pt-list').querySelector('.pt-search__input'); if (inp) inp.focus();
      return;
    }
    if (b.hasAttribute('data-group')) {
      var g = document.getElementById('g-' + GROUPS[+b.getAttribute('data-group')].id);
      if (g) g.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    if (b.classList.contains('pt-pause')) {
      paused = !paused;
      b.setAttribute('aria-pressed', String(paused));
      b.querySelector('[aria-hidden]').textContent = paused ? '▶' : '❚❚';
      return;
    }
    // A link to the rule already open (e.g. from the sheet): just close the sheet
    if (b.tagName === 'A' && b.getAttribute('href') === '#' + ALL[cur].id && view === 'detail') {
      e.preventDefault(); if (sheet && sheet.open) sheet.close();
    }
  });
  window.addEventListener('hashchange', fromHash);
  desk.addEventListener('change', function () { fromHash(); });
  fromHash();
})();
