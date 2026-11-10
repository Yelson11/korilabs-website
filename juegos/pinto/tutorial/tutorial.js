/* PINTO interactive tutorial: short hands-on lessons on a mini table.
   Lessons live in tutorial-data.js (window.PintoTutorial). Each step shows one
   instruction; the player taps cards, the move animates and a short line explains
   what happened. Routing by hash: #ritmo, #especiales-azul, … */
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
  var L = T.lessons, S = T.specials;

  var lesson = 0, step = 0, special = 0, sc = null, busy = false, solved = false, picked = [];
  var seenSpecials = {};

  function file(c) { return /^r\d$/.test(c) ? 'ritmo-' + c.slice(1) : FILES[c]; }
  function name(c) { return /^r\d$/.test(c) ? 'Ritmo ' + c.slice(1) : NAMES[c]; }
  function img(c) { return '<img src="' + BASE + file(c) + '.webp' + VER + '" alt="' + name(c) + '" width="660" height="922" draggable="false">'; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, reduced ? Math.min(ms, 150) : ms); }); }
  function $(sel) { return app.querySelector(sel); }

  function current() {
    var les = L[lesson];
    if (les.specials) return S[special].steps[0];
    return les.steps[step];
  }

  /* ---------- Routing ---------- */
  function fromHash() {
    var h = decodeURIComponent(location.hash.slice(1));
    lesson = 0; step = 0;
    L.forEach(function (l, i) {
      if (h === l.id) lesson = i;
      if (l.specials && h.indexOf(l.id + '-') === 0) {
        lesson = i;
        S.forEach(function (s, k) { if (h === l.id + '-' + s.id) special = k; });
      }
    });
    if (h === 'especiales') special = 0;
    render(true);
  }
  function go(i, k) {
    var id = L[i].id + (L[i].specials ? '-' + S[k || 0].id : '');
    if (location.hash.slice(1) === id) { lesson = i; special = k || 0; step = 0; render(true); }
    else location.hash = id;
  }

  /* ---------- Rendering ---------- */
  function render(focusTitle) {
    var les = L[lesson];
    var st = current();
    sc = { pile: (st.pile || []).slice(), hand: (st.hand || []).slice(), vis: (st.vis || []).slice(), hid: st.hid || 0 };
    solved = st.task === 'next'; picked = []; busy = false;
    var total = les.specials ? S.length : les.steps.length;
    var pos = les.specials ? special : step;

    var html = '<nav class="pt-steps" aria-label="Lecciones">' + L.map(function (l, i) {
      return '<button type="button" class="pt-steps__dot' + (i === lesson ? ' is-on' : '') + (i < lesson ? ' is-past' : '') + '" data-go="' + i + '" aria-label="Lección ' + (i + 1) + ': ' + l.title + '"' + (i === lesson ? ' aria-current="step"' : '') + '><span>' + (i + 1) + '</span></button>';
    }).join('') + '</nav>';

    html += '<div class="pt-stage"><div class="pt-stage__head"><p class="pt-kicker">Lección ' + (lesson + 1) + ' de ' + L.length +
      (total > 1 ? ' · ' + (les.specials ? 'Carta ' : 'Paso ') + (pos + 1) + ' de ' + total : '') + '</p>' +
      '<h1 class="pt-title" tabindex="-1">' + les.title + '</h1></div>';

    if (les.specials) {
      html += '<div class="pt-tabs" role="tablist" aria-label="Cartas especiales">' + S.map(function (s, k) {
        return '<button type="button" role="tab" class="pt-tab' + (k === special ? ' is-on' : '') + (seenSpecials[s.id] ? ' is-seen' : '') + '" data-special="' + k + '" aria-selected="' + (k === special) + '">' + img(s.card) + '<span>' + s.title + '</span></button>';
      }).join('') + '</div><p class="pt-on"><strong>' + S[special].title + ':</strong> ' + S[special].on + '</p>';
    }

    html += '<p class="pt-say" aria-live="polite">' + st.text + '</p>';
    if (!les.final) html += '<div class="pt-table" data-focus="' + (st.focus || '') + '"></div>';
    else html += finalCard();

    html += '<div class="pt-foot"><p class="pt-fb" aria-live="polite"></p><div class="pt-foot__btns">' +
      (st.task === 'combo' ? '<button type="button" class="p-button pt-act" data-act="combo" disabled>Jugar</button>' : '') +
      (st.task === 'pickup' ? '<button type="button" class="p-button pt-act pt-pulse" data-act="pickup">Recoger la pila</button>' : '') +
      (les.final ? '' : '<button type="button" class="p-button p-button--cream pt-next" data-act="next"' + (solved ? '' : ' hidden') + '>' + nextLabel() + '</button>') +
      '</div></div>';
    if (lesson > 0 || pos > 0) html += '<button type="button" class="pt-back" data-act="back">← Anterior</button>';
    html += '</div>';

    app.innerHTML = html;
    if (!les.final) drawTable();
    var top = app.getBoundingClientRect().top;
    if (top < 0) window.scrollTo({ top: window.scrollY + top - 12, behavior: reduced ? 'auto' : 'smooth' });
    if (focusTitle) { var t = $('.pt-title'); if (t && document.activeElement !== document.body) t.focus({ preventScroll: true }); }
  }

  function nextLabel() {
    var les = L[lesson];
    if (les.specials && special < S.length - 1) return 'Siguiente carta';
    if (!les.specials && step < les.steps.length - 1) return 'Siguiente';
    return 'Siguiente lección';
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
      : '<div class="pt-free">Vía libre</div>') + '</div>' +
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
    if (L[lesson].specials) seenSpecials[S[special].id] = true;
    feedback(st.ok ? '<span class="pt-fb__ok">✓</span> ' + st.ok : '', 'ok');
    var n = $('.pt-next'); if (n) { n.hidden = false; n.focus({ preventScroll: true }); }
    app.querySelectorAll('.pt-act').forEach(function (b) { b.hidden = true; });
    if (L[lesson].specials) { var tab = $('.pt-tab.is-on'); if (tab) tab.classList.add('is-seen'); }
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

  function next() {
    var les = L[lesson];
    if (les.specials && special < S.length - 1) return go(lesson, special + 1);
    if (!les.specials && step < les.steps.length - 1) { step++; render(); return; }
    if (lesson < L.length - 1) go(lesson + 1, 0);
  }
  function back() {
    var les = L[lesson];
    if (les.specials && special > 0) return go(lesson, special - 1);
    if (!les.specials && step > 0) { step--; render(); return; }
    if (lesson > 0) {
      var prev = L[lesson - 1];
      if (prev.specials) return go(lesson - 1, S.length - 1);
      location.hash = prev.id;
    }
  }

  app.addEventListener('click', function (e) {
    var t = e.target.closest('button, a'); if (!t || !app.contains(t)) return;
    if (t.hasAttribute('data-go')) return go(+t.getAttribute('data-go'), 0);
    if (t.hasAttribute('data-special')) return go(lesson, +t.getAttribute('data-special'));
    if (t.classList.contains('pt-c')) return onCard(t);
    var act = t.getAttribute('data-act');
    if (act === 'next') next();
    else if (act === 'back') back();
    else if (act === 'combo') onCombo();
    else if (act === 'pickup') onPickup();
  });
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
