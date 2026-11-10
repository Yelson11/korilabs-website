/* PINTO interactive tutorial: short hands-on steps on a mini table.
   Content lives in tutorial-data.js (window.PintoTutorial.sections): three sections,
   each with subsections. Each step shows one instruction; the player taps cards,
   the move animates and a short line explains what happened. Routing by hash:
   #<subsection id> (e.g. #ritmo, #azul), #<section id> or #fin. */
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
  var FINAL = { id: 'fin', title: 'Fin de la carrera', final: true, steps: [
    { text: 'El primero sin cartas <strong>cruza la meta</strong>. Los demás siguen hasta que solo quede uno.', task: 'next' }
  ] };

  var sub = 0, step = 0, sc = null, busy = false, solved = false, picked = [];
  var turn = null, runId = 0;   // whose turn is highlighted; id of the running animation
  var seen = {};

  function file(c) { return /^r\d$/.test(c) ? 'ritmo-' + c.slice(1) : FILES[c]; }
  function name(c) { return /^r\d$/.test(c) ? 'Ritmo ' + c.slice(1) : NAMES[c]; }
  function img(c) { return '<img src="' + BASE + file(c) + '.webp' + VER + '" alt="' + name(c) + '" width="660" height="922" draggable="false">'; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, reduced ? Math.min(ms, 150) : ms); }); }
  function $(sel) { return app.querySelector(sel); }

  function page() { return sub >= SUBS.length ? FINAL : SUBS[sub]; }
  function current() { return page().steps[step]; }
  function firstOf(si) { for (var i = 0; i < SUBS.length; i++) if (SUBS[i].sec === si) return i; return 0; }

  /* ---------- Routing (#ritmo, #carril, #azul, #reglas, #fin…) ---------- */
  function fromHash() {
    var h = decodeURIComponent(location.hash.slice(1));
    sub = 0; step = 0;
    if (h === 'fin') sub = SUBS.length;
    SEC.forEach(function (sec, si) { if (h === sec.id) sub = firstOf(si); });
    SUBS.forEach(function (u, i) { if (h === u.id) sub = i; });
    render(true);
  }
  function go(i) {
    var id = i >= SUBS.length ? 'fin' : SUBS[i].id;
    if (location.hash.slice(1) === id) { sub = i; step = 0; render(true); }
    else location.hash = id;
  }

  /* ---------- Rendering ---------- */
  function render(focusTitle) {
    var pg = page(), st = current();
    sc = { pile: (st.pile || []).slice(), hand: (st.hand || []).slice(), vis: (st.vis || []).slice(), hid: st.hid || 0 };
    solved = st.task === 'next'; picked = []; busy = false; turn = null; runId++;
    var si = pg.final ? -1 : pg.sec;

    var html = '<nav class="pt-secs" aria-label="Secciones del tutorial">' + SEC.map(function (sec, k) {
      var all = sec.subs.every(function (u) { return seen[u.id]; });
      return '<button type="button" class="pt-sec' + (k === si ? ' is-on' : '') + (all ? ' is-done' : '') + '" data-sec="' + k + '"' + (k === si ? ' aria-current="true"' : '') + '>' +
        '<span class="pt-sec__n">' + (all ? '✓' : k + 1) + '</span><span class="pt-sec__t">' + sec.title + '</span></button>';
    }).join('') + '</nav>';

    html += '<div class="pt-stage">';
    if (!pg.final) {
      html += '<div class="pt-subs" role="list" aria-label="' + SEC[si].title + '">' + SUBS.map(function (u, i) {
        if (u.sec !== si) return '';
        return '<button type="button" role="listitem" class="pt-sub' + (u.card ? ' pt-sub--card' : '') + (i === sub ? ' is-on' : '') + (seen[u.id] ? ' is-seen' : '') + '" data-go="' + i + '"' + (i === sub ? ' aria-current="step"' : '') + '>' +
          (u.card ? img(u.card) : '') + '<span>' + u.title + '</span></button>';
      }).join('') + '</div>';
    }
    html += '<div class="pt-stage__head">' + (pg.steps.length > 1 ? '<p class="pt-kicker">Paso ' + (step + 1) + ' de ' + pg.steps.length + '</p>' : '') +
      '<h1 class="pt-title" tabindex="-1">' + pg.title + '</h1>' +
      (pg.on ? '<p class="pt-on"><strong>Se juega:</strong> ' + pg.on + '</p>' : '') + '</div>';

    html += '<p class="pt-say" aria-live="polite">' + st.text + '</p>';
    if (!pg.final) html += '<div class="pt-table" data-focus="' + (st.focus || '') + '"></div>';
    else html += finalCard();

    html += '<div class="pt-foot"><p class="pt-fb" aria-live="polite"></p><div class="pt-foot__btns">' +
      (st.task === 'combo' ? '<button type="button" class="p-button pt-act" data-act="combo" disabled>Jugar</button>' : '') +
      (st.task === 'pickup' ? '<button type="button" class="p-button pt-act pt-pulse" data-act="pickup">Recoger la pila</button>' : '') +
      (st.task === 'watch' ? '<button type="button" class="pt-replay" data-act="replay" hidden>↻ Ver otra vez</button>' : '') +
      (pg.final ? '' : '<button type="button" class="p-button p-button--cream pt-next" data-act="next"' + (solved || (st.task === 'watch' && seen[pg.id]) ? '' : ' hidden') + '>' + nextLabel() + '</button>') +
      '</div></div>';
    if (sub > 0 || step > 0) html += '<button type="button" class="pt-back" data-act="back">← Anterior</button>';
    html += '</div>';

    app.innerHTML = html;
    if (!pg.final) drawTable();
    if (st.task === 'watch') watch(st.script, runId);
    var row = $('.pt-subs'), on = $('.pt-sub.is-on');
    if (row && on && row.scrollWidth > row.clientWidth) row.scrollLeft = on.offsetLeft - row.offsetLeft - 16;
    var top = app.getBoundingClientRect().top;
    if (top < 0) window.scrollTo({ top: window.scrollY + top - 12, behavior: reduced ? 'auto' : 'smooth' });
    if (focusTitle) { var t = $('.pt-title'); if (t && document.activeElement !== document.body) t.focus({ preventScroll: true }); }
  }

  function nextLabel() {
    var pg = page();
    if (step < pg.steps.length - 1) return 'Siguiente';
    var nx = SUBS[sub + 1];
    if (!nx) return 'Terminar';
    if (nx.sec !== pg.sec) return 'Ir a ' + SEC[nx.sec].title;
    return 'Siguiente: ' + nx.title;
  }

  function finalCard() {
    return '<div class="pt-final">' +
      '<div class="pt-podium"><span class="pt-podium__p pt-podium__p--2">2</span><span class="pt-podium__p pt-podium__p--1">1</span><span class="pt-podium__p pt-podium__p--3">3</span></div>' +
      '<p class="pt-final__lead">¡Ya sabes jugar PINTO!</p>' +
      '<div class="pt-final__btns"><a class="p-button" href="../demo/">Jugar una partida</a>' +
      '<a class="p-button p-button--cream" href="../instrucciones/">Ver instrucciones</a>' +
      '<button type="button" class="pt-back pt-back--inline" data-go="0">Repetir tutorial</button></div></div>';
  }

  function playableZone() {
    var st = current();
    if (st.task === 'flip') return 'hid';
    if (st.task === 'play' || st.task === 'combo' || st.task === 'pickup') return sc.hand.length ? 'hand' : 'vis';
    return '';
  }

  function drawTable() {
    var tbl = $('.pt-table'); if (!tbl) return;
    var zone = solved || busy ? '' : playableZone();
    var opps = '<div class="pt-opps">' + [1, 2, 3].map(function (n) {
      return '<div class="pt-opp" data-p="' + n + '"><div class="pt-opp__fan">' + img('back') + img('back') + img('back') + '</div><span class="pt-opp__name">Jugador ' + n + '</span></div>';
    }).join('') + '</div>';

    var shown = sc.pile.slice(-5);
    var pile = '<div class="pt-pilewrap"><div class="pt-pile">' + (shown.length
      ? shown.map(function (c, i) { return '<div class="pt-pc" style="--i:' + i + '">' + img(c) + '</div>'; }).join('')
      : '<div class="pt-free">Sin cartas</div>') + '</div>' +
      '<span class="pt-pile__label">' + (shown.length ? 'Arriba: <strong>' + name(shown[shown.length - 1]) + '</strong>' : 'Pila vacía') + '</span></div>';

    var slots = Math.max(sc.vis.length, sc.hid);
    var mesa = '';
    for (var i = 0; i < slots; i++) {
      var v = sc.vis[i];
      mesa += '<div class="pt-slot">' +
        (i < sc.hid ? '<button type="button" class="pt-c pt-c--hid" data-z="hid" data-i="' + i + '"' + (zone === 'hid' && !v ? '' : ' disabled') + ' aria-label="Carta oculta">' + img('back') + '</button>' : '<span class="pt-c pt-c--ghost"></span>') +
        (v ? '<button type="button" class="pt-c pt-c--vis" data-z="vis" data-i="' + i + '"' + (zone === 'vis' ? '' : ' disabled') + '>' + img(v) + '</button>' : '') +
        '</div>';
    }
    var hand = sc.hand.map(function (c, k) {
      return '<button type="button" class="pt-c' + (picked.indexOf(k) > -1 ? ' is-picked' : '') + '" data-z="hand" data-i="' + k + '"' + (zone === 'hand' ? '' : ' disabled') + ' aria-pressed="' + (picked.indexOf(k) > -1) + '">' + img(c) + '</button>';
    }).join('');

    tbl.innerHTML = opps + pile +
      '<div class="pt-you">' +
      (current().vis || current().hid ? '<div class="pt-zone pt-zone--mesa' + (slots ? '' : ' is-empty') + '"><span class="pt-zone__label">Tu mesa</span><div class="pt-mesa">' + (mesa || '<span class="pt-none">Sin cartas</span>') + '</div></div>' : '') +
      '<div class="pt-zone pt-zone--hand"><span class="pt-zone__label">Tu mano</span><div class="pt-hand">' + (hand || '<span class="pt-none">Sin cartas</span>') + '</div></div>' +
      '</div>';
    tbl.classList.toggle('is-active', !!zone);
    if (turn === 'you') { var you = $('.pt-you'); if (you) you.classList.add('is-turn'); }
    else if (turn) { var op = $('.pt-opp[data-p="' + turn + '"]'); if (op) op.classList.add('is-turn'); }
  }

  /* ---------- Animation helpers ---------- */
  function fly(fromEl, toEl, code, opts) {
    opts = opts || {};
    if (!fromEl || !toEl) return Promise.resolve();
    var a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    var g = document.createElement('div');
    g.className = 'pt-fly';
    g.innerHTML = img(code);
    var w = opts.width || a.width;
    g.style.cssText = 'left:' + a.left + 'px;top:' + a.top + 'px;width:' + w + 'px;';
    document.body.appendChild(g);
    if (reduced) { g.remove(); return Promise.resolve(); }
    var dx = b.left + b.width / 2 - (a.left + w / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    var scale = b.width / w;
    return new Promise(function (res) {
      requestAnimationFrame(function () {
        g.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + scale + ') rotate(' + (opts.rot || 0) + 'deg)';
        setTimeout(function () { g.remove(); res(); }, 520);
      });
    });
  }
  function pileTarget() { return $('.pt-pile .pt-pc:last-child') || $('.pt-pile'); }
  function feedback(text, kind) {
    var fb = $('.pt-fb'); if (!fb) return;
    fb.className = 'pt-fb' + (kind ? ' is-' + kind : '');
    fb.innerHTML = text;
  }

  /* ---------- Moves ---------- */
  function sameSet(a, b) { return a.slice().sort().join() === b.slice().sort().join(); }

  async function playCards(els, codes) {
    busy = true;
    drawLocked();
    var target = pileTarget();
    await Promise.all(els.map(function (el, k) { return wait(k * 90).then(function () { return fly(el, target, codes[k], { rot: (k % 2 ? 4 : -4) }); }); }));
    // update state
    els.forEach(function (el) {
      var z = el.getAttribute('data-z'), i = +el.getAttribute('data-i');
      if (z === 'hand') sc.hand[i] = null; else if (z === 'vis') sc.vis[i] = null;
    });
    sc.hand = sc.hand.filter(Boolean);
    sc.pile = sc.pile.concat(codes);
    drawTable();
    await runThen(current().then || []);
    done();
  }
  function drawLocked() { app.querySelectorAll('.pt-c').forEach(function (b) { b.disabled = true; }); }

  async function runThen(list) {
    for (var k = 0; k < list.length; k++) {
      var a = list[k];
      await wait(500);
      if (a.bot) {
        var opp = $('.pt-opp[data-p="' + a.bot + '"]');
        opp.classList.add('is-turn');
        await wait(450);
        await fly(opp.querySelector('img:last-child'), pileTarget(), a.card, { width: pileTarget().getBoundingClientRect().width });
        sc.pile.push(a.card);
        drawTable();
        var o2 = $('.pt-opp[data-p="' + a.bot + '"]'); o2.classList.add('is-turn');
        await wait(600);
        o2.classList.remove('is-turn');
      } else if (a.skip) {
        var s = $('.pt-opp[data-p="' + a.skip + '"]');
        s.classList.add('is-skipped');
        s.insertAdjacentHTML('beforeend', '<span class="pt-opp__tag">Pierde el turno</span>');
        await wait(1100);
      } else if (a.clear) {
        var pile = $('.pt-pile');
        pile.classList.add('is-leaving');
        await wait(700);
        sc.pile = [];
        drawTable();
      }
    }
  }

  function done() {
    busy = false; solved = true;
    var st = current();
    var pg = page(), last = step === pg.steps.length - 1;
    if (last) seen[pg.id] = true;
    feedback(st.ok ? '<span class="pt-fb__ok">✓</span> ' + st.ok : '', 'ok');
    var n = $('.pt-next'); if (n) { n.hidden = false; n.focus({ preventScroll: true }); }
    app.querySelectorAll('.pt-act').forEach(function (b) { b.hidden = true; });
    if (last) { var chip = $('.pt-sub.is-on'); if (chip) chip.classList.add('is-seen'); }
    drawTable();
  }

  function wrong(el) {
    var st = current();
    feedback(st.hint || 'Esa no se puede jugar aquí.', 'bad');
    if (el && !reduced) { el.classList.remove('is-shake'); void el.offsetWidth; el.classList.add('is-shake'); }
  }

  function onCard(el) {
    if (busy || solved) return;
    var st = current();
    var z = el.getAttribute('data-z'), i = +el.getAttribute('data-i');
    var code = z === 'hand' ? sc.hand[i] : z === 'vis' ? sc.vis[i] : 'back';
    if (st.task === 'flip' && z === 'hid') return flip(el);
    if (st.task === 'play') {
      if (st.valid.indexOf(code) > -1) { feedback(''); return playCards([el], [code]); }
      return wrong(el);
    }
    if (st.task === 'combo') {
      var at = picked.indexOf(i);
      if (at > -1) picked.splice(at, 1); else picked.push(i);
      el.classList.toggle('is-picked', at === -1);
      el.setAttribute('aria-pressed', at === -1);
      var btn = $('[data-act="combo"]'); if (btn) btn.disabled = !picked.length;
      feedback('');
      return;
    }
    if (st.task === 'pickup') return wrong(el);
  }

  function onCombo() {
    var st = current();
    var codes = picked.map(function (k) { return sc.hand[k]; });
    if (!sameSet(codes, st.valid)) { feedback(st.hint, 'bad'); return; }
    feedback('');
    var els = picked.slice().sort(function (a, b) { return a - b; }).map(function (k) { return $('.pt-c[data-z="hand"][data-i="' + k + '"]'); });
    var ordered = els.map(function (el) { return sc.hand[+el.getAttribute('data-i')]; });
    // Rebufo goes first so the highest Ritmo ends on top
    var pairs = els.map(function (el, k) { return [el, ordered[k]]; }).sort(function (a, b) { return rank(a[1]) - rank(b[1]); });
    picked = [];
    playCards(pairs.map(function (p) { return p[0]; }), pairs.map(function (p) { return p[1]; }));
  }
  function rank(c) { return /^r\d$/.test(c) ? +c.slice(1) : 0; }

  async function onPickup() {
    if (busy || solved) return;
    busy = true; drawLocked();
    var hand = $('.pt-hand');
    var cards = app.querySelectorAll('.pt-pile .pt-pc');
    var codes = sc.pile.slice(-cards.length);
    await Promise.all(Array.prototype.map.call(cards, function (el, k) { return wait(k * 80).then(function () { return fly(el, hand, codes[k]); }); }));
    sc.hand = sc.hand.concat(sc.pile); sc.pile = [];
    drawTable();
    done();
  }

  async function flip(el) {
    busy = true; drawLocked();
    var st = current();
    el.classList.add('is-flipping');
    await wait(350);
    await fly(el, $('.pt-hand'), st.reveal);
    sc.hid -= 1; sc.hand.push(st.reveal);
    drawTable();
    done();
  }

  /* ---------- Watch mode: the step plays itself as a short animation ---------- */
  function Stop() {}
  async function watch(script, id) {
    function alive() { if (id !== runId) throw new Stop(); }
    function setTurn(t) { turn = t; app.querySelectorAll('.pt-opp, .pt-you').forEach(function (e) { e.classList.remove('is-turn'); }); drawTable(); }
    function findCard(code, from, used) {
      var arr = from === 'hand' ? sc.hand : sc.vis;
      for (var i = 0; i < arr.length; i++) if (arr[i] === code && used.indexOf(i) < 0) { used.push(i); return $('.pt-c[data-z="' + from + '"][data-i="' + i + '"]'); }
      return null;
    }
    try {
      await wait(900); alive();
      for (var k = 0; k < script.length; k++) {
        var a = script[k];
        if (a.say) { var say = $('.pt-say'); say.innerHTML = a.say; say.classList.remove('is-new'); void say.offsetWidth; say.classList.add('is-new'); }
        if ('focus' in a) { $('.pt-table').setAttribute('data-focus', a.focus); }
        if (a.turn) setTurn(a.turn);
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
          drawTable();
        }
        if (a.bot) {
          var opp = $('.pt-opp[data-p="' + a.bot + '"]');
          await fly(opp.querySelector('img:last-child'), pileTarget(), a.card, { width: pileTarget().getBoundingClientRect().width });
          alive();
          sc.pile.push(a.card); drawTable();
        }
        if (a.pickup) {
          var cards = app.querySelectorAll('.pt-pile .pt-pc'), pc = sc.pile.slice(-cards.length), hand = $('.pt-hand');
          await Promise.all(Array.prototype.map.call(cards, function (el, n) { return wait(n * 90).then(function () { return fly(el, hand, pc[n]); }); }));
          alive();
          sc.hand = sc.hand.concat(sc.pile); sc.pile = []; drawTable();
        }
        if (a.flip) {
          var hid = app.querySelectorAll('.pt-c--hid'), el = hid[hid.length - 1];
          el.classList.add('is-flipping');
          await wait(350); alive();
          await fly(el, $('.pt-hand'), a.flip);
          alive();
          sc.hid -= 1; sc.hand.push(a.flip); drawTable();
        }
        await wait(a.wait || 1500); alive();
      }
      setTurn(null);
      done();
      var r = $('.pt-replay'); if (r) r.hidden = false;
    } catch (e) { if (!(e instanceof Stop)) throw e; }
  }

  function next() {
    if (step < page().steps.length - 1) { step++; render(); return; }
    go(sub + 1);
  }
  function back() {
    if (step > 0) { step--; render(); return; }
    if (sub > 0) go(sub - 1);
  }

  app.addEventListener('click', function (e) {
    var t = e.target.closest('button, a'); if (!t || !app.contains(t)) return;
    if (t.hasAttribute('data-go')) return go(+t.getAttribute('data-go'));
    if (t.hasAttribute('data-sec')) return go(firstOf(+t.getAttribute('data-sec')));
    if (t.classList.contains('pt-c')) return onCard(t);
    var act = t.getAttribute('data-act');
    if (act === 'next') next();
    else if (act === 'back') back();
    else if (act === 'combo') onCombo();
    else if (act === 'pickup') onPickup();
    else if (act === 'replay') render();
  });
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
