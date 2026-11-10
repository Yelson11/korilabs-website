/* PINTO tutorial: each subsection is a fixed explanation plus a short animation on a
   mini table that loops like a GIF. Content lives in tutorial-data.js
   (window.PintoTutorial.sections: three sections, each with subsections).
   It works as a quick-reference guide: any subsection can be opened directly.
   Routing by hash: #<subsection id> (e.g. #ritmo, #azul) or #<section id>. */
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

  var SEC = T.sections, SUBS = [];
  SEC.forEach(function (sec, si) { sec.subs.forEach(function (u) { u.sec = si; SUBS.push(u); }); });

  var sub = 0, sc = null;
  var turn = null, skipped = null, runId = 0;   // highlighted turn, skipped player, id of the running loop

  function file(c) { return /^r\d$/.test(c) ? 'ritmo-' + c.slice(1) : FILES[c]; }
  function name(c) { return /^r\d$/.test(c) ? 'Ritmo ' + c.slice(1) : NAMES[c]; }
  function img(c) { return '<img src="' + BASE + file(c) + '.webp' + VER + '" alt="' + name(c) + '" width="660" height="922" draggable="false">'; }
  function thumb(c) { return '<img src="' + BASE + file(c) + '.webp' + VER + '" alt="" width="660" height="922">'; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function $(sel) { return app.querySelector(sel); }

  function page() { return SUBS[sub]; }
  function firstOf(si) { for (var i = 0; i < SUBS.length; i++) if (SUBS[i].sec === si) return i; return 0; }

  /* ---------- Routing ---------- */
  function fromHash() {
    var h = decodeURIComponent(location.hash.slice(1));
    sub = 0;
    SEC.forEach(function (sec, si) { if (h === sec.id) sub = firstOf(si); });
    SUBS.forEach(function (u, i) { if (h === u.id) sub = i; });
    render(!!h);
  }
  function go(i) {
    if (i < 0 || i >= SUBS.length) return;
    if (location.hash.slice(1) === SUBS[i].id) { sub = i; render(true); }
    else location.hash = SUBS[i].id;
  }

  /* ---------- Rendering ---------- */
  function render(focusTitle) {
    var pg = page(), si = pg.sec;
    runId++;

    // Desktop: full index (three sections with all their subsections)
    var html = '<div class="pt-layout"><nav class="pt-index" aria-label="Secciones del tutorial">' + SEC.map(function (sec, k) {
      return '<div class="pt-index__sec' + (k === si ? ' is-on' : '') + '">' +
        '<button type="button" class="pt-index__head" data-sec="' + k + '"><span class="pt-index__n">' + (k + 1) + '</span>' + sec.title + '</button><ul>' +
        SUBS.map(function (u, i) {
          if (u.sec !== k) return '';
          return '<li><button type="button" class="pt-index__sub' + (i === sub ? ' is-on' : '') + '" data-go="' + i + '"' + (i === sub ? ' aria-current="page"' : '') + '>' +
            (u.card ? thumb(u.card) : '') + '<span>' + u.title + '</span></button></li>';
        }).join('') + '</ul></div>';
    }).join('') + '</nav><div class="pt-main">';

    // Phones: section bar + subsection chips
    html += '<nav class="pt-secs" aria-label="Secciones del tutorial">' + SEC.map(function (sec, k) {
      return '<button type="button" class="pt-sec' + (k === si ? ' is-on' : '') + '" data-sec="' + k + '"' + (k === si ? ' aria-current="true"' : '') + '>' +
        '<span class="pt-sec__n">' + (k + 1) + '</span><span class="pt-sec__t">' + sec.title + '</span></button>';
    }).join('') + '</nav>';

    html += '<div class="pt-stage"><div class="pt-subs" role="list" aria-label="' + SEC[si].title + '">' + SUBS.map(function (u, i) {
      if (u.sec !== si) return '';
      return '<button type="button" role="listitem" class="pt-sub' + (u.card ? ' pt-sub--card' : '') + (i === sub ? ' is-on' : '') + '" data-go="' + i + '"' + (i === sub ? ' aria-current="page"' : '') + '>' +
        (u.card ? thumb(u.card) : '') + '<span>' + u.title + '</span></button>';
    }).join('') + '</div>';

    html += '<div class="pt-stage__head"><p class="pt-kicker">' + (si + 1) + '. ' + SEC[si].title + '</p>' +
      '<h2 class="pt-title" tabindex="-1">' + pg.title + '</h2>' +
      (pg.on ? '<p class="pt-on"><strong>Se juega:</strong> ' + pg.on + '</p>' : '') + '</div>';
    html += '<p class="pt-say">' + pg.text + '</p>';
    html += '<div class="pt-table" aria-hidden="true"></div>';

    var prev = SUBS[sub - 1], next = SUBS[sub + 1];
    html += '<div class="pt-pn">' +
      (prev ? '<button type="button" class="pt-pn__btn" data-go="' + (sub - 1) + '"><span aria-hidden="true">←</span> ' + prev.title + '</button>' : '<span></span>') +
      (next ? '<button type="button" class="pt-pn__btn pt-pn__btn--next" data-go="' + (sub + 1) + '">' + next.title + ' <span aria-hidden="true">→</span></button>' : '<a class="pt-pn__btn pt-pn__btn--next" href="../instrucciones/">Ver instrucciones <span aria-hidden="true">→</span></a>') +
      '</div></div></div></div>';

    app.innerHTML = html;
    loop(pg, runId);
    var row = $('.pt-subs'), on = $('.pt-sub.is-on');
    if (row && on && row.scrollWidth > row.clientWidth) row.scrollLeft = on.offsetLeft - row.offsetLeft - 16;
    if (focusTitle) {
      var top = $('.pt-main').getBoundingClientRect().top;
      if (top < 0) window.scrollTo({ top: window.scrollY + top - 12, behavior: reduced ? 'auto' : 'smooth' });
      var t = $('.pt-title'); if (t && document.activeElement !== document.body) t.focus({ preventScroll: true });
    }
  }

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
    var hand = sc.hand.map(function (c, k) { return '<span class="pt-c" data-z="hand" data-i="' + k + '">' + img(c) + '</span>'; }).join('');

    tbl.innerHTML = opps + pile +
      '<div class="pt-you' + (turn === 'you' ? ' is-turn' : '') + '">' +
      (pg.vis || pg.hid ? '<div class="pt-zone pt-zone--mesa"><span class="pt-zone__label">Tu mesa</span><div class="pt-mesa">' + (mesa || '<span class="pt-none">Sin cartas</span>') + '</div></div>' : '') +
      '<div class="pt-zone pt-zone--hand"><span class="pt-zone__label">Tu mano</span><div class="pt-hand' + (sc.hand.length > 4 ? ' is-tight' : '') + '">' + (hand || '<span class="pt-none">Sin cartas</span>') + '</div></div>' +
      '</div>';
  }

  /* ---------- Animation ---------- */
  function fly(fromEl, toEl, code, opts) {
    opts = opts || {};
    if (!fromEl || !toEl || reduced) return Promise.resolve();
    var a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    var g = document.createElement('div');
    g.className = 'pt-fly';
    g.innerHTML = img(code);
    var w = opts.width || a.width;
    g.style.cssText = 'left:' + a.left + 'px;top:' + a.top + 'px;width:' + w + 'px;';
    document.body.appendChild(g);
    var dx = b.left + b.width / 2 - (a.left + w / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    return new Promise(function (res) {
      requestAnimationFrame(function () {
        g.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + (b.width / w) + ') rotate(' + (opts.rot || 0) + 'deg)';
        setTimeout(function () { g.remove(); res(); }, 520);
      });
    });
  }
  function pileTarget() { return $('.pt-pile .pt-pc:last-child') || $('.pt-pile'); }

  /* Plays the subsection script, then fades and starts again until the page changes.
     Script actions: { turn, focus, no, play, from, bot, card, skip, pickup, take, flip, clear, wait } */
  function Stop() {}
  async function loop(pg, id) {
    function alive() { if (id !== runId) throw new Stop(); }
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
        await wait(1000); alive();
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
            var target = pileTarget();
            await Promise.all(els.map(function (el, n) { return wait(n * 120).then(function () { return fly(el, target, codes[n], { rot: n % 2 ? 4 : -4 }); }); }));
            alive();
            used.forEach(function (i) { if (from === 'hand') sc.hand[i] = null; else sc.vis[i] = null; });
            sc.hand = sc.hand.filter(Boolean);
            sc.pile = sc.pile.concat(codes);
            drawTable(pg);
          }
          if (a.bot) {
            var opp = $('.pt-opp[data-p="' + a.bot + '"]');
            await fly(opp.querySelector('img:last-child'), pileTarget(), a.card, { width: pileTarget().getBoundingClientRect().width });
            alive();
            sc.pile.push(a.card); drawTable(pg);
          }
          if (a.skip) { skipped = a.skip; drawTable(pg); }
          if (a.pickup) {
            var cards = app.querySelectorAll('.pt-pile .pt-pc'), pc = sc.pile.slice(-cards.length), hand = $('.pt-hand');
            await Promise.all(Array.prototype.map.call(cards, function (el, n) { return wait(n * 90).then(function () { return fly(el, hand, pc[n]); }); }));
            alive();
            sc.hand = sc.hand.concat(sc.pile); sc.pile = []; drawTable(pg);
          }
          if (a.take) {
            var vis = app.querySelectorAll('.pt-c--vis'), codesV = sc.vis.filter(Boolean), handEl = $('.pt-hand');
            await Promise.all(Array.prototype.map.call(vis, function (el, n) { return wait(n * 110).then(function () { return fly(el, handEl, codesV[n]); }); }));
            alive();
            sc.hand = sc.hand.concat(codesV); sc.vis = []; drawTable(pg);
          }
          if (a.flip) {
            var hid = app.querySelectorAll('.pt-c--hid'), el = hid[hid.length - 1];
            el.classList.add('is-flipping');
            await wait(350); alive();
            await fly(el, $('.pt-hand'), a.flip);
            alive();
            sc.hid -= 1; sc.hand.push(a.flip); drawTable(pg);
          }
          if (a.clear) {
            $('.pt-pile').classList.add('is-leaving');
            await wait(700); alive();
            sc.pile = []; drawTable(pg);
          }
          await wait(a.wait || 1100); alive();
        }
        await wait(1800); alive();
        var tbl = $('.pt-table'); tbl.classList.add('is-resetting');
        await wait(400); alive();
        tbl.classList.remove('is-resetting');
      }
    } catch (e) { if (!(e instanceof Stop)) throw e; }
  }

  app.addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t || !app.contains(t)) return;
    if (t.hasAttribute('data-go')) return go(+t.getAttribute('data-go'));
    if (t.hasAttribute('data-sec')) return go(firstOf(+t.getAttribute('data-sec')));
  });
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
