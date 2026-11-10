/* PINTO interactive tutorial: navigation, progress, examples and exercises.
   Content lives in tutorial-data.js (window.PintoTutorial). Pages are routed by
   hash (#ritmo, #amarilla, …); progress is kept in localStorage when allowed. */
(function () {
  'use strict';
  var T = window.PintoTutorial;
  var app = document.getElementById('pt');
  if (!T || !app) return;

  var BASE = app.getAttribute('data-cards') || '../img/cartas/';
  var VER = '?v=5';
  var QUIZ_SIZE = 12;
  var FILES = { cuad: 'bandera-a-cuadros', roja: 'bandera-roja', ama: 'bandera-amarilla', azul: 'bandera-azul', vr: 'vuelta-rapida', reb: 'rebufo', back: 'reverso' };
  var NAMES = { cuad: 'Bandera a Cuadros', roja: 'Bandera Roja', ama: 'Bandera Amarilla', azul: 'Bandera Azul', vr: 'Vuelta Rápida', reb: 'Rebufo', back: 'Carta boca abajo' };

  // Pages in teaching order (the "Cartas Especiales" group has an overview page, then its six cards)
  var PAGES = [], BY_ID = {};
  T.modules.forEach(function (m) {
    PAGES.push(m); BY_ID[m.id] = m;
    (m.children || []).forEach(function (c) { c.parent = m.id; PAGES.push(c); BY_ID[c.id] = c; });
  });
  var LEARN = PAGES.filter(function (p) { return p.practice; });

  var menuEl = document.getElementById('pt-menu');
  var mainEl = document.getElementById('pt-main');
  var cardsDialog = document.getElementById('pt-cards');
  var progressEl = document.getElementById('pt-progress');

  /* ---------- Progress (per browser) ---------- */
  var progress = { done: {}, started: {}, last: null };
  try { var saved = JSON.parse(localStorage.getItem('pt-progress') || 'null'); if (saved && saved.done) progress = saved; } catch (e) { /* storage blocked */ }
  function saveProgress() { try { localStorage.setItem('pt-progress', JSON.stringify(progress)); } catch (e) { /* keep in memory */ } }
  function statusOf(id) {
    var p = BY_ID[id];
    if (p && p.children) {
      var n = p.children.filter(function (c) { return progress.done[c.id]; }).length;
      return n === p.children.length ? 'done' : (n || p.children.some(function (c) { return progress.started[c.id]; }) ? 'started' : 'pending');
    }
    return progress.done[id] ? 'done' : progress.started[id] ? 'started' : 'pending';
  }

  /* ---------- Small helpers ---------- */
  function file(c) { return /^r\d$/.test(c) ? 'ritmo-' + c.slice(1) : FILES[c]; }
  function name(c) { return /^r\d$/.test(c) ? 'Ritmo ' + c.slice(1) : NAMES[c]; }
  function card(c, cls) { return '<img class="pt-card ' + (cls || '') + '" src="' + BASE + file(c) + '.webp' + VER + '" alt="' + name(c) + '" width="660" height="922" loading="lazy">'; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }
  function refLine(ref) { return '<p class="pt-ref">Ver: ' + esc(ref) + '</p>'; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // Mini table: pile, "your card", your table cards and your hand
  function scene(sc) {
    if (!sc) return '';
    var html = '';
    if (sc.pile) {
      var shown = sc.pile.slice(-4);
      html += '<div class="pt-spot"><span class="pt-spot__label">Pila central</span><div class="pt-pile">' +
        (shown.length ? shown.map(function (c, i) { return card(c, i === shown.length - 1 ? 'is-top' : ''); }).join('') : '<div class="pt-empty">Vía libre</div>') +
        '</div>' + (shown.length ? '<span class="pt-spot__sub">Carta superior: ' + name(shown[shown.length - 1]) + '</span>' : '') + '</div>';
    }
    if (sc.card) html += '<div class="pt-spot"><span class="pt-spot__label">Tu carta</span>' + card(sc.card, 'is-mine') + '</div>';
    if (sc.table) {
      var n = Math.max(sc.table.hidden, sc.table.visible.length), slots = '';
      for (var i = 0; i < n; i++) slots += '<div class="pt-slot">' + (i < sc.table.hidden ? card('back') : '') + (sc.table.visible[i] ? card(sc.table.visible[i], 'is-up') : '') + '</div>';
      html += '<div class="pt-spot"><span class="pt-spot__label">Tu mesa</span><div class="pt-tablecards">' + slots + '</div></div>';
    }
    if (sc.hand) html += '<div class="pt-spot pt-spot--hand"><span class="pt-spot__label">Tu mano</span><div class="pt-hand">' +
      (sc.hand.length ? sc.hand.map(function (c) { return card(c); }).join('') : '<span class="pt-none">Sin cartas</span>') + '</div></div>';
    return html ? '<div class="pt-scene">' + html + '</div>' : '';
  }

  /* ---------- Menu ---------- */
  function renderMenu(current) {
    var html = '<a class="pt-menu__home' + (!current ? ' is-current' : '') + '" href="#inicio">Inicio del tutorial</a><ol class="pt-menu__list">';
    T.modules.forEach(function (m) {
      html += '<li><a class="pt-menu__item is-' + statusOf(m.id) + (current === m.id ? ' is-current' : '') + '" href="#' + m.id + '"><span class="pt-menu__num">' + m.num + '</span><span>' + m.title + '</span><span class="pt-menu__state" aria-label="' + stateLabel(statusOf(m.id)) + '"></span></a>';
      if (m.children) {
        html += '<ol class="pt-menu__sub">' + m.children.map(function (c) {
          return '<li><a class="pt-menu__item is-' + statusOf(c.id) + (current === c.id ? ' is-current' : '') + '" href="#' + c.id + '">' + card(c.card, 'pt-menu__card') + '<span>' + c.title + '</span><span class="pt-menu__state" aria-label="' + stateLabel(statusOf(c.id)) + '"></span></a></li>';
        }).join('') + '</ol>';
      }
      html += '</li>';
    });
    menuEl.innerHTML = html + '</ol>';
    var done = LEARN.filter(function (p) { return progress.done[p.id]; }).length;
    progressEl.innerHTML = '<span><strong>' + done + '</strong> de ' + LEARN.length + ' temas completados</span><span class="pt-bar"><i style="width:' + Math.round(100 * done / LEARN.length) + '%"></i></span>';
  }
  function stateLabel(s) { return s === 'done' ? 'Completado' : s === 'started' ? 'En curso' : 'Pendiente'; }

  /* ---------- Home ---------- */
  function renderHome() {
    var last = progress.last && BY_ID[progress.last];
    var html = '<header class="pt-head"><p class="p-eyebrow">Tutorial interactivo</p><h1 class="p-h2 p-h1" tabindex="-1">Aprende a jugar <span class="p-red">PINTO</span></h1>' +
      '<p class="pt-lead">Recorre el reglamento paso a paso, con ejemplos y práctica. Puedes hacerlo completo o ir directo al tema que quieras repasar.</p>' +
      '<div class="pt-actions"><a class="p-button" href="#bienvenida" data-full="1">Empezar tutorial completo</a>' +
      (last ? '<a class="p-button p-button--cream" href="#' + last.id + '">Continuar: ' + esc(last.title) + '</a>' : '') + '</div></header>' +
      '<h2 class="pt-h2">Ir a una sección</h2><div class="pt-grid">';
    PAGES.forEach(function (p) {
      if (p.children) return;
      html += '<a class="pt-tile is-' + statusOf(p.id) + '" href="#' + p.id + '">' + (p.card ? card(p.card, 'pt-tile__card') : '<span class="pt-tile__num">' + p.num + '</span>') +
        '<span class="pt-tile__title">' + p.title + '</span><span class="pt-tile__state">' + stateLabel(statusOf(p.id)) + '</span></a>';
    });
    mainEl.innerHTML = html + '</div>';
  }

  /* ---------- Module page ---------- */
  var cameFromPrevious = false;

  function renderModule(p) {
    progress.started[p.id] = true;
    progress.last = p.id;
    saveProgress();
    var idx = PAGES.indexOf(p), next = PAGES[idx + 1];
    var html = '<header class="pt-head"><p class="p-eyebrow">' + (p.parent ? 'Cartas Especiales · ' : 'Módulo ') + p.num + '</p>' +
      '<h1 class="p-h2 p-h1" tabindex="-1">' + p.title + '</h1><p class="pt-lead">' + p.objective + '</p></header>';

    // Gentle reminder when a module builds on earlier ones (never blocking)
    var missing = (p.prereq || []).filter(function (id) { return !progress.done[id]; });
    if (missing.length && !cameFromPrevious) {
      html += '<p class="pt-notice">Este tema usa lo que se explica en ' + missing.map(function (id) { return '<a href="#' + id + '">' + BY_ID[id].title + '</a>'; }).join(' y ') + '. ¿Quieres repasarlo primero? Si ya lo conoces, sigue adelante.</p>';
    }

    if (p.children) {
      html += '<div class="pt-specials">' + p.children.map(function (c) {
        return '<a class="pt-special is-' + statusOf(c.id) + '" href="#' + c.id + '">' + card(c.card) + '<span class="pt-special__title">' + c.title + '</span><span class="pt-special__text">' + esc(c.rules.efecto.split('. ')[0]) + '.</span></a>';
      }).join('') + '</div>' + refLine(p.ref);
    } else if (p.quiz) {
      html += '<div id="pt-quiz"></div>';
    } else {
      html += explanation(p) + example(p) + practice(p) +
        '<section class="pt-block pt-summary" aria-labelledby="sum-' + p.id + '"><h2 class="pt-h2" id="sum-' + p.id + '">Resumen</h2><ul>' + p.summary.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul></section>';
    }

    html += '<nav class="pt-nav" aria-label="Navegación del tutorial">' +
      (next ? '<a class="p-button" href="#' + next.id + '" data-next="1">Siguiente: ' + next.title + '</a>' : '') +
      '<a class="p-button p-button--cream" href="#inicio">Volver al menú</a>' +
      (p.practice ? '<button type="button" class="pt-link" data-act="redo">Repetir práctica</button>' : '') + '</nav>';
    mainEl.innerHTML = html;
    cameFromPrevious = false;
    if (p.practice) bindPractice(p);
    if (p.example) bindExample(p);
    if (p.quiz) startQuiz();
  }

  function explanation(p) {
    var html = '<section class="pt-block" aria-label="Explicación">';
    if (p.rules) {
      html += '<div class="pt-rules">' + card(p.card, 'pt-rules__card') + '<dl>' +
        '<dt>Cuándo se puede jugar</dt><dd>' + p.rules.cuando + '</dd>' +
        '<dt>Efecto</dt><dd>' + p.rules.efecto + '</dd>' +
        '<dt>Qué sucede después</dt><dd>' + p.rules.despues + '</dd>' +
        (p.rules.importante ? '<dt>Importante</dt><dd>' + p.rules.importante + '</dd>' : '') + '</dl></div>';
    } else {
      html += p.body.map(function (b) { return b.charAt(0) === '<' && b.indexOf('<table') === 0 ? b : '<p>' + b + '</p>'; }).join('');
    }
    if (p.strip) html += '<div class="pt-strip">' + p.strip.map(function (c) { return card(c); }).join('') + '</div>';
    if (p.groups) html += '<div class="pt-groups">' + p.groups.map(function (g) { return '<div class="pt-group"><span class="pt-spot__label">' + g.label + '</span><div class="pt-strip">' + g.cards.map(function (c) { return card(c); }).join('') + '</div></div>'; }).join('') + '</div>';
    if (p.deck) {
      var rows = [['r1', '×4'], ['r2', '×4'], ['r3', '×4'], ['r4', '×4'], ['r5', '×4'], ['r6', '×4'], ['r7', '×4'], ['r8', '×4'], ['vr', '×4'], ['reb', '×4'], ['cuad', '×4'], ['roja', '×4'], ['ama', '×4'], ['azul', '×2']];
      html += '<div class="pt-deck">' + rows.map(function (r) { return '<figure>' + card(r[0]) + '<figcaption>' + r[1] + '</figcaption></figure>'; }).join('') + '</div>';
    }
    html += refLine(p.ref) + (p.ref2 ? refLine(p.ref2) : '');
    return html + '</section>';
  }

  function example(p) {
    if (!p.example) return '';
    return '<section class="pt-block pt-example" aria-labelledby="ex-' + p.id + '"><h2 class="pt-h2" id="ex-' + p.id + '">Ejemplo: ' + p.example.title + '</h2>' +
      '<div class="pt-example__stage" aria-live="polite"></div>' +
      '<div class="pt-example__controls"><button type="button" class="pt-btn" data-ex="prev">Anterior</button><span class="pt-example__count"></span><button type="button" class="pt-btn pt-btn--solid" data-ex="next">Siguiente paso</button></div></section>';
  }

  function bindExample(p) {
    var box = mainEl.querySelector('.pt-example'), stage = box.querySelector('.pt-example__stage'), count = box.querySelector('.pt-example__count');
    var prev = box.querySelector('[data-ex="prev"]'), nextBtn = box.querySelector('[data-ex="next"]'), i = 0, steps = p.example.steps;
    function show() {
      var st = steps[i];
      stage.innerHTML = scene({ pile: st.pile, table: st.table, hand: st.hand }) + '<p class="pt-example__note">' + st.note + '</p>';
      count.textContent = 'Paso ' + (i + 1) + ' de ' + steps.length;
      prev.disabled = i === 0;
      nextBtn.textContent = i === steps.length - 1 ? 'Ver desde el inicio' : 'Siguiente paso';
    }
    prev.addEventListener('click', function () { if (i > 0) { i--; show(); } });
    nextBtn.addEventListener('click', function () { i = i === steps.length - 1 ? 0 : i + 1; show(); });
    show();
  }

  /* ---------- Exercises ---------- */

  function practice(p) {
    return '<section class="pt-block" aria-labelledby="pr-' + p.id + '"><h2 class="pt-h2" id="pr-' + p.id + '">Práctica</h2><div class="pt-exercises">' +
      p.practice.map(function (ex, i) { return '<article class="pt-ex" data-i="' + i + '"></article>'; }).join('') + '</div>' +
      '<p class="pt-done" hidden>¡Completaste la práctica de este tema!</p></section>';
  }

  function bindPractice(p) {
    var solved = {};
    mainEl.querySelectorAll('.pt-ex').forEach(function (el) {
      var i = +el.getAttribute('data-i');
      mountExercise(el, p.practice[i], i + 1, p.practice.length, function (ok) {
        if (!ok) return;
        solved[i] = true;
        if (Object.keys(solved).length === p.practice.length) {
          progress.done[p.id] = true; saveProgress(); renderMenu(p.id);
          mainEl.querySelector('.pt-done').hidden = false;
        }
      }, false);
    });
  }

  // Renders one exercise. onResult(true|false). In quiz mode there's no retry.
  function mountExercise(el, ex, n, total, onResult, quizMode) {
    var picked = [], seq = [];
    var order = ex.type === 'order' ? shuffle(ex.items.map(function (t, i) { return i; })) : null;
    if (order) while (total > 0 && order.every(function (v, i) { return v === i; }) && order.length > 1) order = shuffle(order);

    function draw(feedback) {
      var head = '<p class="pt-ex__num">' + (quizMode ? 'Pregunta ' : 'Ejercicio ') + n + ' de ' + total + '</p>' +
        '<p class="pt-ex__q">' + esc(ex.q) + '</p>';
      var body = '';
      if (ex.type === 'yesno') {
        body = scene(ex.scene) + '<div class="pt-choices"><button type="button" class="pt-choice" data-v="yes">Sí</button><button type="button" class="pt-choice" data-v="no">No</button></div>';
      } else if (ex.type === 'mcq') {
        body = scene(ex.scene) + '<div class="pt-choices pt-choices--list">' + ex.options.map(function (o, i) { return '<button type="button" class="pt-choice" data-v="' + i + '">' + esc(o) + '</button>'; }).join('') + '</div>';
      } else if (ex.type === 'choose') {
        body = scene({ pile: ex.pile }) + '<p class="pt-spot__label">Tu mano · toca para elegir</p><div class="pt-pick">' +
          ex.hand.map(function (c, i) { return '<button type="button" class="pt-pickcard" data-k="' + i + '" aria-pressed="' + (picked.indexOf(i) >= 0) + '">' + card(c) + '</button>'; }).join('') +
          '</div><button type="button" class="pt-btn pt-btn--solid" data-v="check">Comprobar</button>';
      } else if (ex.type === 'order') {
        body = '<ol class="pt-seq">' + seq.map(function (i) { return '<li>' + esc(ex.items[i]) + '</li>'; }).join('') + '</ol>' +
          '<div class="pt-choices pt-choices--list">' + order.filter(function (i) { return seq.indexOf(i) < 0; }).map(function (i) { return '<button type="button" class="pt-choice" data-o="' + i + '">' + esc(ex.items[i]) + '</button>'; }).join('') + '</div>' +
          '<div class="pt-row"><button type="button" class="pt-btn" data-v="clear">Borrar</button>' + (seq.length === ex.items.length ? '<button type="button" class="pt-btn pt-btn--solid" data-v="check">Comprobar</button>' : '') + '</div>';
      }
      el.innerHTML = head + body + (feedback || '');
      el.classList.remove('is-ok', 'is-bad');
    }

    function answer(ok) {
      var fb = ok
        ? '<div class="pt-fb pt-fb--ok" role="status"><strong>¡Correcto!</strong> ' + esc(ex.why) + refLine(ex.ref) + '</div>'
        : '<div class="pt-fb pt-fb--bad" role="status"><strong>No es así.</strong> ' + esc(ex.why) + refLine(ex.ref) +
          (quizMode ? '' : '<button type="button" class="pt-btn" data-v="retry">Reintentar</button>') + '</div>';
      // Freeze the exercise and show feedback
      var frozen = el.innerHTML;
      el.innerHTML = frozen.replace(/<button type="button" class="pt-(choice|pickcard|btn[^"]*)"/g, '<button type="button" disabled class="pt-$1"') + fb;
      el.classList.add(ok ? 'is-ok' : 'is-bad');
      onResult(ok);
    }

    el.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b || b.disabled) return;
      var v = b.getAttribute('data-v');
      if (v === 'retry') { picked = []; seq = []; draw(); return; }
      if (ex.type === 'yesno' && (v === 'yes' || v === 'no')) { markChoice(b); answer((v === 'yes') === ex.answer); }
      else if (ex.type === 'mcq' && v !== null) { markChoice(b); answer(+v === ex.answer); }
      else if (ex.type === 'choose') {
        if (b.hasAttribute('data-k')) {
          var k = +b.getAttribute('data-k'), at = picked.indexOf(k);
          if (at >= 0) picked.splice(at, 1); else picked.push(k);
          b.setAttribute('aria-pressed', String(at < 0));
        } else if (v === 'check') {
          var a = picked.slice().sort().join(','), want = ex.valid.slice().sort().join(',');
          answer(a === want);
        }
      } else if (ex.type === 'order') {
        if (b.hasAttribute('data-o')) { seq.push(+b.getAttribute('data-o')); draw(); }
        else if (v === 'clear') { seq = []; draw(); }
        else if (v === 'check') answer(seq.every(function (val, i) { return val === i; }));
      }
    });
    draw();
  }
  function markChoice(b) { b.classList.add('is-picked'); }

  /* ---------- Final test ---------- */
  function startQuiz() {
    var box = document.getElementById('pt-quiz');
    // One question from each learning module first (shuffled), then fill up to QUIZ_SIZE
    var byModule = LEARN.filter(function (p) { return p.id !== 'bienvenida'; }).map(function (p) {
      return shuffle(p.practice.filter(function (ex) { return ex.type !== 'order'; }).map(function (ex) { return { ex: ex, page: p }; }));
    });
    var picks = [];
    shuffle(byModule).forEach(function (list) { if (list.length) picks.push(list.shift()); });
    var rest = shuffle([].concat.apply([], byModule));
    picks = picks.slice(0, QUIZ_SIZE);
    while (picks.length < QUIZ_SIZE && rest.length) picks.push(rest.shift());
    picks = shuffle(picks);

    var i = 0, score = 0, missed = {};
    function step() {
      if (i >= picks.length) return finish();
      box.innerHTML = '<article class="pt-ex"></article><div class="pt-row"><button type="button" class="pt-btn pt-btn--solid" data-q="next" hidden>' + (i === picks.length - 1 ? 'Ver resultado' : 'Siguiente pregunta') + '</button></div>';
      var item = picks[i];
      mountExercise(box.querySelector('.pt-ex'), item.ex, i + 1, picks.length, function (ok) {
        if (ok) score++; else missed[item.page.id] = true;
        box.querySelector('[data-q="next"]').hidden = false;
      }, true);
      box.querySelector('[data-q="next"]').onclick = function () { i++; step(); box.scrollIntoView({ block: 'start', behavior: 'smooth' }); };
    }
    function finish() {
      var ids = Object.keys(missed);
      if (score >= Math.ceil(picks.length * 0.8)) { progress.done.prueba = true; saveProgress(); renderMenu('prueba'); }
      box.innerHTML = '<div class="pt-result"><p class="pt-result__score">' + score + ' de ' + picks.length + '</p>' +
        '<p>' + (score === picks.length ? '¡Perfecto! Ya conoces el reglamento de PINTO.' : score >= Math.ceil(picks.length * 0.8) ? '¡Muy bien! Estás listo para la parrilla de salida.' : 'Vas por buen camino. Repasa estos temas y vuelve a intentarlo.') + '</p>' +
        (ids.length ? '<p class="pt-spot__label">Temas para repasar</p><ul class="pt-review">' + ids.map(function (id) { return '<li><a href="#' + id + '">' + BY_ID[id].title + '</a></li>'; }).join('') + '</ul>' : '') +
        '<button type="button" class="pt-btn pt-btn--solid" data-q="again">Hacer otra prueba</button></div>';
      box.querySelector('[data-q="again"]').onclick = startQuiz;
    }
    step();
  }

  /* ---------- Quick reference: the six Cartas Especiales ---------- */
  function renderCards() {
    cardsDialog.querySelector('.pt-cards__grid').innerHTML = T.quick.map(function (q) {
      return '<article class="pt-qcard">' + card(q.card) + '<div><h3>' + q.title + '</h3><p><strong>Cuándo:</strong> ' + q.cuando + '</p><p><strong>Después:</strong> ' + q.despues + '</p>' +
        '<a href="#' + q.id + '" data-close="1">Ver submódulo</a></div></article>';
    }).join('');
  }
  document.querySelectorAll('[data-open="cards"]').forEach(function (b) {
    b.addEventListener('click', function () { renderCards(); if (cardsDialog.showModal) cardsDialog.showModal(); else cardsDialog.setAttribute('open', ''); });
  });
  cardsDialog.addEventListener('click', function (e) {
    if (e.target === cardsDialog || e.target.closest('[data-close]')) { if (cardsDialog.close) cardsDialog.close(); else cardsDialog.removeAttribute('open'); }
  });

  /* ---------- Router ---------- */
  function route() {
    var id = location.hash.replace('#', '');
    var p = BY_ID[id];
    if (p) renderModule(p); else renderHome();
    renderMenu(p ? p.id : null);
    app.classList.remove('menu-open');
    var h = mainEl.querySelector('h1');
    if (h && document.activeElement !== document.body) h.focus({ preventScroll: true });
    window.scrollTo({ top: Math.max(0, app.offsetTop - 8) });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (a && (a.hasAttribute('data-next') || a.hasAttribute('data-full'))) cameFromPrevious = true;
    if (e.target.closest('[data-act="redo"]')) { var p = BY_ID[location.hash.replace('#', '')]; if (p) { renderModule(p); var pr = mainEl.querySelector('.pt-exercises'); if (pr) pr.scrollIntoView({ block: 'start' }); } }
    if (e.target.closest('[data-act="menu"]')) app.classList.toggle('menu-open');
  });
  window.addEventListener('hashchange', route);
  route();
})();
