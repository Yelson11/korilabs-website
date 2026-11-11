/* PINTO · Modo Temporada scorekeeper.
   Rules from the official rulebook ("Campeonato de Grandes Premios" + "Puntuación y reglas del campeonato"):
   - Seasons: 5, 10 or 15 GP (shown as Corta / Regular / Completa, owner's names); longer seasons include the shorter ones.
   - Points per GP by finishing order: 2 players 3/1 · 3–4 players 5/3/1/0 · 5–6 players 7/4/3/2/1/0.
   - Ties at the end (owner's rule): most 1st places, then most 2nd, 3rd…; then best result in the last GP.
   Options (owner's house rules):
   - Modo escudería: with 4 or 6 players everyone races on their own, but pairs (players 1+2, 3+4, 5+6) add up points.
   - Puntos dobles: GP 5, 10 and 15 are worth double (tiebreak position counts are not doubled).
   State lives in localStorage under a 4-character season code (same device only, no server). */
(function () {
  'use strict';

  var GPS = ['Australia', 'Estados Unidos', 'Arabia Saudita', 'Italia', 'Brasil', 'España', 'Países Bajos',
    'Singapur', 'Canadá', 'Bélgica', 'China', 'Japón', 'México', 'Inglaterra', 'Qatar'];
  var SEASONS = {
    sprint:   { name: 'Temporada Corta',    races: 5,  color: '#e63c3c' },
    clasica:  { name: 'Temporada Regular',  races: 10, color: '#22b3c4' },
    completa: { name: 'Temporada Completa', races: 15, color: '#9b51e0' }
  };
  /* Simplified national flags (public-domain designs), 30×20, drawn inline so they look the same on every
     device (emoji flags don't render on Windows). Keyed by the GPS names. */
  var FLAGS = {
    'Australia': '<rect width="30" height="20" fill="#00247d"/><path d="M0 0l15 10M15 0L0 10" stroke="#fff" stroke-width="2.2"/><path d="M0 0l15 10M15 0L0 10" stroke="#cf142b" stroke-width=".9"/><path d="M7.5 0v10M0 5h15" stroke="#fff" stroke-width="3"/><path d="M7.5 0v10M0 5h15" stroke="#cf142b" stroke-width="1.6"/><g fill="#fff"><circle cx="7.5" cy="15" r="1.6"/><circle cx="23" cy="4" r=".9"/><circle cx="20" cy="9" r=".9"/><circle cx="26" cy="8" r=".9"/><circle cx="23" cy="16" r="1"/></g>',
    'Estados Unidos': '<rect width="30" height="20" fill="#fff"/><g fill="#b22234"><rect width="30" height="1.54"/><rect y="3.08" width="30" height="1.54"/><rect y="6.15" width="30" height="1.54"/><rect y="9.23" width="30" height="1.54"/><rect y="12.3" width="30" height="1.54"/><rect y="15.4" width="30" height="1.54"/><rect y="18.46" width="30" height="1.54"/></g><rect width="13" height="10.77" fill="#3c3b6e"/><g fill="#fff"><circle cx="2.2" cy="2" r=".55"/><circle cx="5" cy="2" r=".55"/><circle cx="7.8" cy="2" r=".55"/><circle cx="10.6" cy="2" r=".55"/><circle cx="3.6" cy="4.2" r=".55"/><circle cx="6.4" cy="4.2" r=".55"/><circle cx="9.2" cy="4.2" r=".55"/><circle cx="2.2" cy="6.4" r=".55"/><circle cx="5" cy="6.4" r=".55"/><circle cx="7.8" cy="6.4" r=".55"/><circle cx="10.6" cy="6.4" r=".55"/><circle cx="3.6" cy="8.6" r=".55"/><circle cx="6.4" cy="8.6" r=".55"/><circle cx="9.2" cy="8.6" r=".55"/></g>',
    'Arabia Saudita': '<rect width="30" height="20" fill="#006c35"/><path d="M8 7.5c1.5-1.5 3 1 4.5-.5s3 1 4.5-.5 3 1 4.5-.5" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round"/><path d="M8.5 12.5h12" stroke="#fff" stroke-width=".9" stroke-linecap="round"/><path d="M20.5 12.5l1.6-.9v1.8z" fill="#fff"/>',
    'Italia': '<rect width="10" height="20" fill="#009246"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ce2b37"/>',
    'Brasil': '<rect width="30" height="20" fill="#009c3b"/><path d="M15 2.5L27 10 15 17.5 3 10z" fill="#ffdf00"/><circle cx="15" cy="10" r="4.3" fill="#002776"/><path d="M10.9 9.2c2.8-.9 5.7-.5 8.1.9" stroke="#fff" stroke-width=".7" fill="none"/>',
    'España': '<rect width="30" height="20" fill="#aa151b"/><rect y="5" width="30" height="10" fill="#f1bf00"/><rect x="7" y="7.5" width="3" height="5" rx=".6" fill="#aa151b"/>',
    'Países Bajos': '<rect width="30" height="6.67" fill="#ae1c28"/><rect y="6.67" width="30" height="6.67" fill="#fff"/><rect y="13.33" width="30" height="6.67" fill="#21468b"/>',
    'Singapur': '<rect width="30" height="10" fill="#ef3340"/><rect y="10" width="30" height="10" fill="#fff"/><circle cx="7" cy="5" r="3.2" fill="#fff"/><circle cx="8.3" cy="5" r="3" fill="#ef3340"/><g fill="#fff"><circle cx="10.6" cy="3" r=".55"/><circle cx="12.4" cy="4.2" r=".55"/><circle cx="11.8" cy="6.3" r=".55"/><circle cx="9.6" cy="6.3" r=".55"/><circle cx="9" cy="4.2" r=".55"/></g>',
    'Canadá': '<rect width="30" height="20" fill="#fff"/><rect width="7.5" height="20" fill="#d80621"/><rect x="22.5" width="7.5" height="20" fill="#d80621"/><path d="M15 4l1 2 1.4-.6-.5 3.3 1.8-1.7.4 1.1 1.8-.3-.6 1.9.8.4-3.2 2.5.4 1.2-2.6-.4v2.9h-.6v-2.9l-2.6.4.4-1.2-3.2-2.5.8-.4-.6-1.9 1.8.3.4-1.1 1.8 1.7-.5-3.3L14 6z" fill="#d80621"/>',
    'Bélgica': '<rect width="10" height="20" fill="#000"/><rect x="10" width="10" height="20" fill="#fdda24"/><rect x="20" width="10" height="20" fill="#ef3340"/>',
    'China': '<rect width="30" height="20" fill="#de2910"/><g fill="#ffde00"><path d="M5 2.2l.9 2.6h2.8L6.5 6.4l.8 2.6L5 7.4 2.7 9l.8-2.6-2.2-1.6h2.8z"/><circle cx="10" cy="2" r=".7"/><circle cx="12" cy="4" r=".7"/><circle cx="12" cy="7" r=".7"/><circle cx="10" cy="9" r=".7"/></g>',
    'Japón': '<rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="6" fill="#bc002d"/>',
    'México': '<rect width="10" height="20" fill="#006847"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ce1126"/><circle cx="15" cy="10" r="2.6" fill="#8c5a2b"/><path d="M12.6 11.6c1.4 1.4 3.4 1.4 4.8 0" stroke="#006847" stroke-width=".7" fill="none"/>',
    'Inglaterra': '<rect width="30" height="20" fill="#fff"/><path d="M15 0v20M0 10h30" stroke="#ce1124" stroke-width="4"/>',
    'Qatar': '<rect width="30" height="20" fill="#8a1538"/><path d="M0 0h9l2 1.11-2 1.11 2 1.11-2 1.11 2 1.11-2 1.11 2 1.11-2 1.11 2 1.11-2 1.11 2 1.11-2 1.11 2 1.11-2 1.11 2 1.11-2 1.11 2 1.11-2 1.11H0z" fill="#fff"/>'
  };
  function flag(name, cls) {
    var f = FLAGS[name];
    return f ? '<svg class="ps-flag' + (cls ? ' ' + cls : '') + '" viewBox="0 0 30 20" aria-hidden="true" focusable="false">' + f + '</svg>' : '';
  }
  var POINTS = { 2: [3, 1], 3: [5, 3, 1], 4: [5, 3, 1, 0], 5: [7, 4, 3, 2, 1], 6: [7, 4, 3, 2, 1, 0] };
  var PLAYER_COLORS = ['#e63c3c', '#f2c230', '#22b3c4', '#3dba6a', '#9b51e0', '#f08c28'];
  /* Fixed teams in Modo escudería: a nod to three well-known racing teams without any real name or brand */
  var TEAMS = ['Escudería Pura Sangre', 'Silver Team', 'Nitro Racing'];
  var TEAM_COLORS = ['#e63c3c', '#c9ccd3', '#3b6fe0'];
  var KEY = 'pinto-temporada:';
  var CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

  var app = document.getElementById('ps-app');
  var announcer = document.getElementById('ps-announce');
  var state = null;          // current season
  var order = [];            // finishing order being entered for the current GP (player indexes)
  var draft = { count: 4, names: ['', '', '', '', '', ''], season: 'clasica', teams: false, double: false };

  /* ---------- storage (may be unavailable: private mode, blocked cookies) ---------- */
  var canStore = (function () {
    try { localStorage.setItem(KEY + 'test', '1'); localStorage.removeItem(KEY + 'test'); return true; }
    catch (e) { return false; }
  })();
  function save() {
    if (!state) return;
    state.updated = Date.now();
    if (!canStore) return;
    try { localStorage.setItem(KEY + state.code, JSON.stringify(state)); } catch (e) { /* storage full */ }
  }
  function load(code) {
    if (!canStore || !code) return null;
    try {
      var s = JSON.parse(localStorage.getItem(KEY + code.toUpperCase()));
      return s && s.players && SEASONS[s.season] ? s : null;
    } catch (e) { return null; }
  }
  function remove(code) { try { localStorage.removeItem(KEY + code); } catch (e) { /* ignore */ } }
  function savedSeasons() {
    var list = [];
    if (!canStore) return list;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(KEY) === 0 && k !== KEY + 'test') {
          var s = load(k.slice(KEY.length));
          if (s) list.push(s);
        }
      }
    } catch (e) { /* ignore */ }
    return list.sort(function (a, b) { return b.updated - a.updated; });
  }
  function newCode() {
    var code;
    do {
      code = '';
      for (var i = 0; i < 4; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    } while (load(code));
    return code;
  }

  /* ---------- helpers ---------- */
  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function ord(n) { return n + '.º'; }
  function say(t) { announcer.textContent = ''; setTimeout(function () { announcer.textContent = t; }, 30); }
  function races(s) { return GPS.slice(0, SEASONS[s.season].races); }
  function isDouble(s, g) { return !!s.double && (g + 1) % 5 === 0; }
  function gpPoints(s, g) {
    var m = isDouble(s, g) ? 2 : 1;
    return POINTS[s.players.length].map(function (v) { return v * m; });
  }
  function hasTeams(s) { return !!s.teams && (s.players.length === 4 || s.players.length === 6); }
  function teamOf(i) { return Math.floor(i / 2); }
  function teamName(s, t) { return (s.teamNames && s.teamNames[t]) || TEAMS[t]; }
  function setHash(code) {
    try { history.replaceState(null, '', code ? '#' + code : location.pathname + location.search); }
    catch (e) { location.hash = code || ''; }
  }
  function dot(i) { return '<i class="ps-dot" style="--pc:' + PLAYER_COLORS[i] + '"></i>'; }
  function teamDot(t) { return '<i class="ps-dot ps-dot--team" style="--pc:' + TEAM_COLORS[t] + '"></i>'; }
  /* Points per finishing position as a row of tiles (setup) or a compact strip (race screen) */
  function pointsStrip(p, compact) {
    return '<ol class="ps-pts' + (compact ? ' ps-pts--compact' : '') + '" style="--n:' + p.length + '">' + p.map(function (v, i) {
      return '<li><b>' + v + '</b><span>' + ord(i + 1) + '</span></li>';
    }).join('') + '</ol>';
  }
  function seasonTag(s) {
    return SEASONS[s.season].name + (hasTeams(s) ? ' · escuderías' : '') + (s.double ? ' · ×2' : '');
  }

  /* Standings with the tiebreakers. Entities are players, or teams (byTeam) in Modo escudería.
     Returns sorted rows, each with a shared `rank`. */
  function standings(s, byTeam) {
    var n = s.players.length, last = s.results[s.results.length - 1];
    var ents = byTeam && hasTeams(s)
      ? s.players.slice(0, n / 2).map(function (_, t) { return { i: t, name: teamName(s, t), members: [t * 2, t * 2 + 1], team: true }; })
      : s.players.map(function (name, i) { return { i: i, name: name, members: [i] }; });
    var rows = ents.map(function (e) {
      var counts = []; for (var k = 0; k < n; k++) counts.push(0);
      var total = 0, wins = 0, split = e.members.map(function () { return 0; });
      s.results.forEach(function (res, g) {
        var gp = gpPoints(s, g);
        e.members.forEach(function (m, mi) {
          var pos = res.indexOf(m);
          counts[pos]++; total += gp[pos]; split[mi] += gp[pos]; if (pos === 0) wins++;
        });
      });
      var lastPos = last ? Math.min.apply(null, e.members.map(function (m) { return last.indexOf(m); })) : 0;
      return { i: e.i, name: e.name, team: !!e.team, members: e.members, split: split,
        points: total, counts: counts, wins: wins, lastPos: lastPos };
    });
    function cmp(a, b) {
      if (b.points !== a.points) return { d: b.points - a.points, by: null };
      for (var k = 0; k < n; k++) if (b.counts[k] !== a.counts[k]) return { d: b.counts[k] - a.counts[k], by: k };
      if (a.lastPos !== b.lastPos) return { d: a.lastPos - b.lastPos, by: 'last' };
      return { d: 0, by: null };
    }
    rows.sort(function (a, b) { return cmp(a, b).d; });
    rows.forEach(function (r, idx) {
      if (idx === 0) { r.rank = 1; return; }
      var prev = rows[idx - 1], c = cmp(prev, r);
      r.rank = c.d === 0 ? prev.rank : idx + 1;
      if (prev.points === r.points && c.d !== 0) {
        r.tieBy = c.by; if (prev.tieBy == null) prev.tieBy = c.by;
      }
    });
    return rows;
  }
  function tieText(by) {
    if (by === 'last') return 'desempate: mejor resultado en la última carrera';
    if (by != null) return 'desempate: más ' + ['primeros', 'segundos', 'terceros', 'cuartos', 'quintos', 'sextos'][by] + ' lugares';
    return '';
  }

  /* ---------- screens ---------- */
  function render(reveal) {
    if (!state) return renderHome();
    if (state.results.length >= races(state).length) return renderFinal(reveal);
    return renderRace();
  }

  function renderHome() {
    setHash('');
    var saved = savedSeasons();
    var list = saved.map(function (s) {
      var done = s.results.length >= races(s).length;
      var leader = standings(s, true)[0];
      return '<li class="ps-saved__item">' +
        '<button type="button" class="ps-saved__open" data-open="' + s.code + '">' +
          '<span class="ps-code">' + s.code + '</span>' +
          '<span class="ps-saved__info"><b>' + seasonTag(s) + '</b>' +
          '<span>' + s.players.map(esc).join(', ') + '</span>' +
          '<span class="ps-saved__meta">' + (done ? '🏆 Terminada · ganó ' + esc(leader.name)
            : 'Carrera ' + (s.results.length + 1) + ' de ' + races(s).length + ' · ' + flag(GPS[s.results.length]) + GPS[s.results.length]) + '</span></span>' +
          '<span class="ps-saved__go" aria-hidden="true">→</span>' +
        '</button>' +
        '<button type="button" class="ps-icon-btn" data-del="' + s.code + '" aria-label="Borrar temporada ' + s.code + '">✕</button>' +
      '</li>';
    }).join('');

    app.innerHTML =
      '<section class="ps-hero">' +
        '<img class="ps-hero__icon" src="../../img/icono-trofeo.svg" width="512" height="512" alt="">' +
        '<p class="p-eyebrow">PINTO</p>' +
        '<h1 class="p-h2 p-h1">Modo Temporada</h1>' +
        '<p class="ps-lead">Juega varias partidas de PINTO y acumula puntos en cada carrera. Aquí llevamos el marcador: al final de la temporada, el jugador con más puntos es el campeón.</p>' +
        '<div class="ps-actions"><button type="button" class="p-button" data-act="new">Nueva temporada <span aria-hidden="true">→</span></button></div>' +
      '</section>' +
      '<section class="ps-card ps-resume" aria-labelledby="ps-resume-t">' +
        '<h2 class="ps-h3" id="ps-resume-t">Retomar una temporada</h2>' +
        (canStore
          ? '<form class="ps-code-form" data-form="code"><label class="visually-hidden" for="ps-code-in">Código de temporada</label>' +
            '<input id="ps-code-in" class="ps-input ps-input--code" maxlength="4" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Código, ej. K7Q2">' +
            '<button class="p-button p-button--cream p-button--small" type="submit">Retomar</button></form>' +
            '<p class="ps-hint" id="ps-code-msg">El código se guarda en este dispositivo. Si se recarga la página, la temporada sigue donde iba.</p>'
          : '<p class="ps-hint">Tu navegador no permite guardar datos, así que la temporada se pierde si recargas la página.</p>') +
        (saved.length ? '<h3 class="ps-h4">Guardadas en este dispositivo</h3><ul class="ps-saved">' + list + '</ul>' : '') +
      '</section>';
  }

  function renderSetup() {
    var count = draft.count, p = POINTS[count];
    var teamsOk = count === 4 || count === 6, teams = draft.teams && teamsOk;
    var counts = [2, 3, 4, 5, 6].map(function (n) {
      return '<button type="button" class="ps-chip" data-count="' + n + '" aria-pressed="' + (n === count) + '">' + n + '</button>';
    }).join('');
    function nameInput(i) {
      return '<label class="ps-name">' + dot(i) + '<span class="visually-hidden">Nombre del jugador ' + (i + 1) + '</span>' +
        '<input class="ps-input" data-name="' + i + '" maxlength="14" autocomplete="off" required aria-describedby="ps-names-err" placeholder="Nombre del jugador ' + (i + 1) + '" value="' + esc(draft.names[i]) + '"></label>';
    }
    var names = '';
    if (teams) {
      for (var t = 0; t < count / 2; t++) {
        names += '<div class="ps-team" style="--tc:' + TEAM_COLORS[t] + '">' +
          '<p class="ps-team__name">' + teamDot(t) + TEAMS[t] + '</p>' +
          nameInput(t * 2) + nameInput(t * 2 + 1) + '</div>';
      }
    } else {
      for (var i = 0; i < count; i++) names += nameInput(i);
    }
    var seasons = Object.keys(SEASONS).map(function (k) {
      var s = SEASONS[k];
      return '<button type="button" class="ps-season" data-season="' + k + '" aria-pressed="' + (draft.season === k) + '" style="--sc:' + s.color + '">' +
        '<span class="ps-season__name">' + s.name.replace('Temporada ', '') + '</span>' +
        '<span class="ps-season__n">' + s.races + ' carreras</span></button>';
    }).join('');
    function toggle(key, label, help, disabled) {
      return '<label class="ps-toggle' + (disabled ? ' is-off' : '') + '"><input type="checkbox" data-opt="' + key + '"' +
        (draft[key] && !disabled ? ' checked' : '') + (disabled ? ' disabled' : '') + '>' +
        '<span class="ps-toggle__ui" aria-hidden="true"></span><span class="ps-toggle__txt"><b>' + label + '</b><span>' + help + '</span></span></label>';
    }
    var teamToggle =
      toggle('teams', 'Modo escudería', teamsOk
        ? 'Cada uno juega sus cartas individualmente, pero los puntos se suman en equipo. Gana la escudería con más puntos.'
        : 'Disponible con 4 o 6 jugadores: se arman parejas que suman sus puntos.', !teamsOk);
    var options =
      toggle('double', 'Puntos dobles', 'Las carreras 5, 10 y 15 reparten el doble de puntos.', false);

    app.innerHTML =
      '<section class="ps-setup">' +
        '<button type="button" class="ps-back" data-act="home">← Volver</button>' +
        '<h1 class="p-h2 p-h1">Nueva temporada</h1>' +
        '<div class="ps-card"><h2 class="ps-h3"><span class="ps-step">1</span>¿Cuántos pilotos?</h2>' +
          '<div class="ps-chips" role="group" aria-label="Cantidad de jugadores">' + counts + '</div>' +
          '<div class="ps-toggles ps-toggles--inline">' + teamToggle + '</div>' +
          '<div class="ps-names' + (teams ? ' ps-names--teams' : '') + '">' + names + '</div>' +
          '<p class="ps-error" id="ps-names-err" role="alert"></p>' +
          '<div class="ps-points"><p class="ps-points__t">Puntos por carrera con ' + count + ' jugadores</p>' + pointsStrip(p) + '</div>' +
        '</div>' +
        '<div class="ps-card"><h2 class="ps-h3"><span class="ps-step">2</span>Elige la temporada</h2>' +
          '<div class="ps-seasons" role="group" aria-label="Temporada">' + seasons + '</div>' +
          '<p class="ps-hint">Cada temporada más larga incluye todas las carreras de la anterior, en el mismo orden.</p>' +
        '</div>' +
        '<div class="ps-card"><h2 class="ps-h3"><span class="ps-step">3</span>Reglas extra <small class="ps-opt">opcional</small></h2>' +
          '<div class="ps-toggles">' + options + '</div>' +
        '</div>' +
        '<div class="ps-actions"><button type="button" class="p-button" data-act="start">¡Arrancar temporada! <span aria-hidden="true">→</span></button></div>' +
      '</section>';
  }

  function progressBar(s) {
    return '<ol class="ps-track" aria-label="Carreras">' + races(s).map(function (gp, i) {
      var cls = (i < s.results.length ? 'is-done' : (i === s.results.length ? 'is-now' : '')) + (isDouble(s, i) ? ' is-x2' : '');
      var winner = i < s.results.length ? s.players[s.results[i][0]] : '';
      return '<li class="' + cls + '" title="Carrera ' + (i + 1) + ': ' + gp + (isDouble(s, i) ? ' (×2)' : '') + (winner ? ' · ganó ' + esc(winner) : '') + '">' +
        '<span class="visually-hidden">Carrera ' + (i + 1) + ' ' + gp + (winner ? ', ganó ' + esc(winner) : '') + '</span></li>';
    }).join('') + '</ol>';
  }

  function standingsTable(s, rows, final) {
    return '<ol class="ps-table">' + rows.map(function (r) {
      var sub = r.team ? '<small>' + r.members.map(function (m, mi) { return esc(s.players[m]) + ' ' + r.split[mi]; }).join(' · ') + '</small>' : '';
      var tie = final && r.tieBy != null ? '<small>' + tieText(r.tieBy) + '</small>' : '';
      return '<li class="ps-row' + (r.rank === 1 && s.results.length ? ' is-lead' : '') + '">' +
        '<span class="ps-row__rank">' + r.rank + '</span>' + (r.team ? teamDot(r.i) : dot(r.i)) +
        '<span class="ps-row__name">' + esc(r.name) + sub + tie + '</span>' +
        '<span class="ps-row__wins" title="Carreras ganadas">' + (r.wins ? '🏁 ' + r.wins : '') + '</span>' +
        '<span class="ps-row__pts"><b>' + r.points + '</b> pts</span></li>';
    }).join('') + '</ol>';
  }

  function standingsBlock(s, final) {
    if (!hasTeams(s)) return '<h2 class="ps-h3">' + (final ? 'Clasificación final' : 'Clasificación') + '</h2>' + standingsTable(s, standings(s), final);
    return '<h2 class="ps-h3">Escuderías</h2>' + standingsTable(s, standings(s, true), final) +
      '<h3 class="ps-h4">Pilotos</h3>' + standingsTable(s, standings(s), false);
  }

  function historyList(s) {
    if (!s.results.length) return '<p class="ps-hint">Aquí aparecerá quién gana cada carrera.</p>';
    var items = s.results.map(function (res, g) {
      var p = gpPoints(s, g);
      var detail = res.map(function (pi, pos) {
        return '<li>' + ord(pos + 1) + ' ' + dot(pi) + esc(s.players[pi]) +
          (hasTeams(s) ? ' <em>' + esc(teamName(s, teamOf(pi))) + '</em>' : '') + ' <span>+' + p[pos] + '</span></li>';
      }).join('');
      return '<li><details><summary><span class="ps-history__n">' + (g + 1) + '</span>' +
        '<span class="ps-history__gp">' + flag(GPS[g]) + GPS[g] + (isDouble(s, g) ? ' <b class="ps-x2">×2</b>' : '') + '</span>' +
        '<span class="ps-history__win">🏁 ' + dot(res[0]) + esc(s.players[res[0]]) + '</span></summary>' +
        '<ol class="ps-history__detail">' + detail + '</ol></details></li>';
    }).reverse().join('');
    return '<ol class="ps-history">' + items + '</ol>' +
      '<button type="button" class="ps-link-btn" data-act="undo">↶ Corregir la última carrera</button>';
  }

  function topBar(s, done) {
    return '<div class="ps-bar">' +
      '<button type="button" class="ps-back" data-act="home">← Temporadas</button>' +
      '<span class="ps-bar__season" style="--sc:' + SEASONS[s.season].color + '">' + seasonTag(s) + (done ? ' · terminada' : '') + '</span>' +
      '<span class="ps-bar__code">Código <b class="ps-code">' + s.code + '</b></span>' +
    '</div>';
  }

  function renderRace() {
    var s = state, n = s.players.length, g = s.results.length, p = gpPoints(s, g), total = races(s).length;
    setHash(s.code);
    var next = order.length;
    var prompt = next === 0 ? '¿Quién cruzó la meta primero?' : (next >= n ? '¡Listo! Revisa el orden y guarda.' : 'Toca a quien llegó en ' + ord(next + 1) + ' lugar');
    var btns = s.players.map(function (name, i) {
      var pos = order.indexOf(i);
      return '<button type="button" class="ps-racer" data-racer="' + i + '" aria-pressed="' + (pos > -1) + '" style="--pc:' + PLAYER_COLORS[i] + '">' +
        '<span class="ps-racer__pos">' + (pos > -1 ? ord(pos + 1) : '') + '</span>' +
        '<span class="ps-racer__txt"><span class="ps-racer__name">' + esc(name) +
          (hasTeams(s) ? '<small>' + esc(teamName(s, teamOf(i))) + '</small>' : '') + '</span>' +
        (pos > -1 ? '<span class="ps-racer__pts">+' + p[pos] + ' pts</span>' : '') + '</span></button>';
    }).join('');

    app.innerHTML =
      '<section class="ps-race">' +
        topBar(s, false) +
        progressBar(s) +
        '<div class="ps-gp">' +
          '<p class="ps-gp__n">Carrera ' + (g + 1) + ' de ' + total + '</p>' +
          '<h1 class="ps-gp__name">' + flag(GPS[g], 'ps-flag--big') + '<span>' + GPS[g] + '</span></h1>' +
          (isDouble(s, g) ? '<p class="ps-gp__x2"><b>×2</b> Puntos dobles en esta carrera</p>' : '') +
          '<div class="ps-gp__pts">' + pointsStrip(p, true) + '</div>' +
        '</div>' +
        '<div class="ps-card ps-entry">' +
          '<p class="ps-entry__prompt">' + prompt + '</p>' +
          '<div class="ps-racers">' + btns + '</div>' +
          '<div class="ps-entry__foot">' +
            '<button type="button" class="ps-link-btn" data-act="clear"' + (order.length ? '' : ' disabled') + '>Borrar orden</button>' +
            '<button type="button" class="p-button" data-act="save"' + (order.length === n ? '' : ' disabled') + '>Guardar resultado</button>' +
          '</div>' +
        '</div>' +
        '<div class="ps-cols">' +
          '<div class="ps-card">' + standingsBlock(s, false) + '</div>' +
          '<div class="ps-card"><h2 class="ps-h3">Carreras</h2>' + historyList(s) + '</div>' +
        '</div>' +
      '</section>';
  }

  function renderFinal(reveal) {
    var s = state, teams = hasTeams(s), rows = standings(s, true);
    reveal = reveal && !reducedMotion();
    setHash(s.code);
    var podium = [1, 0, 2].map(function (k) {
      var r = rows[k]; if (!r) return '';
      return '<li class="ps-podium__step ps-podium__step--' + (k + 1) + '" style="--pc:' + (teams ? TEAM_COLORS[r.i] : PLAYER_COLORS[r.i]) + '">' +
        '<span class="ps-podium__name">' + esc(r.name) + '</span>' +
        (teams ? '<span class="ps-podium__who">' + r.members.map(function (m) { return esc(s.players[m]); }).join(' y ') + '</span>' : '') +
        '<span class="ps-podium__pts">' + r.points + ' pts</span>' +
        '<span class="ps-podium__block"><b>' + r.rank + '</b></span></li>';
    }).join('');
    var champs = rows.filter(function (r) { return r.rank === 1; });
    var names = champs.map(function (r) { return esc(r.name); }).join(' y ');
    var title = champs.length > 1 ? '¡' + names + ' comparten el título!' : '¡' + names + ' gana la temporada!';

    app.innerHTML =
      '<section class="ps-final' + (reveal ? ' is-revealing' : '') + '">' +
        topBar(s, true) +
        '<div class="ps-final__head"><p class="p-eyebrow">🏆 Fin de la temporada</p>' +
          '<p class="ps-final__suspense" aria-hidden="true">Y el campeón de la temporada es…</p>' +
          '<h1 class="p-h2 p-h1">' + title + '</h1></div>' +
        '<ol class="ps-podium' + (rows.length < 3 ? ' ps-podium--duo' : '') + '">' + podium + '</ol>' +
        '<div class="ps-cols">' +
          '<div class="ps-card">' + standingsBlock(s, true) + '</div>' +
          '<div class="ps-card"><h2 class="ps-h3">Carreras</h2>' + historyList(s) + '</div>' +
        '</div>' +
        '<div class="ps-actions ps-actions--center">' +
          '<button type="button" class="p-button p-button--cream" data-act="replay">↻ Ver el podio otra vez</button>' +
          '<button type="button" class="p-button" data-act="rematch">Otra temporada con los mismos pilotos</button>' +
          '<button type="button" class="p-button p-button--cream" data-act="new">Nueva temporada</button>' +
        '</div>' +
      '</section>';
    var winnerText = champs.map(function (r) { return r.name; }).join(' y ') + ' gana la temporada.';
    if (reveal) revealPodium(winnerText); else say(winnerText);
  }

  /* ---------- animations (skipped with prefers-reduced-motion; every overlay can be skipped with a tap or Esc) ---------- */
  function reducedMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }
  var fxTimers = [];
  function later(fn, ms) { fxTimers.push(setTimeout(fn, ms)); }
  function clearFx() {
    fxTimers.forEach(clearTimeout); fxTimers = [];
    var old = document.querySelector('.ps-fx'); if (old) old.remove();
    document.removeEventListener('keydown', fxKey);
  }
  function fxKey(e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skipFx(); } }
  var fxDone = null;
  function skipFx() { var cb = fxDone; fxDone = null; clearFx(); if (cb) cb(); }

  /* Full-screen overlay that plays a short sequence of frames and then calls done() */
  function overlay(html, cls, duration, done) {
    clearFx();
    if (reducedMotion()) { if (done) done(); return; }
    var el = document.createElement('div');
    el.className = 'ps-fx ' + (cls || '');
    el.setAttribute('role', 'status');
    el.innerHTML = '<div class="ps-fx__inner">' + html + '</div><button type="button" class="ps-fx__skip">Saltar ›</button>';
    document.body.appendChild(el);
    fxDone = function () { if (done) done(); };
    el.addEventListener('click', skipFx);
    document.addEventListener('keydown', fxKey);
    later(function () { el.classList.add('is-out'); }, duration - 350);
    later(skipFx, duration);
    return el;
  }

  /* Season start: five red lights come on one by one, then go out — "¡Comienza la temporada!" */
  function playStart(s, done) {
    var lights = '<div class="ps-lights" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>';
    var el = overlay(
      '<p class="ps-fx__eyebrow">' + seasonTag(s) + '</p>' + lights +
      '<p class="ps-fx__go">¡Comienza la temporada!</p>' +
      '<p class="ps-fx__next">' + flag(GPS[0], 'ps-flag--fx') + 'Carrera 1 · ' + GPS[0] + '</p>',
      'ps-fx--start', 4300, done);
    if (!el) return;
    var dots = el.querySelectorAll('.ps-lights i');
    for (var i = 0; i < dots.length; i++) (function (d, k) { later(function () { d.classList.add('is-on'); }, 350 + k * 450); })(dots[i], i);
    later(function () { el.classList.add('is-go'); }, 350 + 5 * 450 + 450);
  }

  /* Between races: who won the race that just ended, then which race comes next */
  function playRace(s, g, done) {
    var res = s.results[g], winner = res[0];
    var teamLine = hasTeams(s) ? '<p class="ps-fx__team">' + esc(teamName(s, teamOf(winner))) + '</p>' : '';
    var el = overlay(
      '<div class="ps-fx__frame ps-fx__frame--win">' +
        '<p class="ps-fx__eyebrow">' + flag(GPS[g], 'ps-flag--fx') + 'Carrera ' + (g + 1) + ' · ' + GPS[g] + '</p>' +
        '<p class="ps-fx__checker" aria-hidden="true"></p>' +
        '<p class="ps-fx__winner" style="--pc:' + PLAYER_COLORS[winner] + '">' + esc(s.players[winner]) + '</p>' +
        teamLine +
        '<p class="ps-fx__sub">¡gana la carrera! <b>+' + gpPoints(s, g)[0] + ' pts</b></p>' +
      '</div>' +
      '<div class="ps-fx__frame ps-fx__frame--next">' +
        '<p class="ps-fx__eyebrow">Próxima carrera · ' + (g + 2) + ' de ' + races(s).length + '</p>' +
        flag(GPS[g + 1], 'ps-flag--hero') +
        '<p class="ps-fx__country">' + GPS[g + 1] + '</p>' +
        (isDouble(s, g + 1) ? '<p class="ps-gp__x2"><b>×2</b> Puntos dobles</p>' : '') +
      '</div>',
      'ps-fx--race', 4200, done);
    if (el) later(function () { el.classList.add('is-next'); }, 2100);
  }

  /* Winner of the final race (no "next race" frame); the podium reveal follows */
  function playRace2(s, g, done) {
    var winner = s.results[g][0];
    overlay(
      '<div class="ps-fx__frame ps-fx__frame--win">' +
        '<p class="ps-fx__eyebrow">' + flag(GPS[g], 'ps-flag--fx') + 'Última carrera · ' + GPS[g] + '</p>' +
        '<p class="ps-fx__checker" aria-hidden="true"></p>' +
        '<p class="ps-fx__winner" style="--pc:' + PLAYER_COLORS[winner] + '">' + esc(s.players[winner]) + '</p>' +
        (hasTeams(s) ? '<p class="ps-fx__team">' + esc(teamName(s, teamOf(winner))) + '</p>' : '') +
        '<p class="ps-fx__sub">¡gana la carrera! <b>+' + gpPoints(s, g)[0] + ' pts</b></p>' +
      '</div>',
      'ps-fx--race', 2400, done);
  }

  /* Podium suspense: 3rd, then 2nd, a pause, then the champion with confetti */
  function revealPodium(winnerText) {
    var sec = app.querySelector('.ps-final'); if (!sec) return;
    var step = function (n) { return sec.querySelector('.ps-podium__step--' + n); };
    var skip = document.createElement('button');
    skip.type = 'button'; skip.className = 'ps-final__skip'; skip.textContent = 'Ver resultado ›';
    sec.querySelector('.ps-final__head').appendChild(skip);
    function finish() {
      fxTimers.forEach(clearTimeout); fxTimers = [];
      ['3', '2', '1'].forEach(function (n) { var st = step(n); if (st) st.classList.add('is-in'); });
      sec.classList.add('is-champion'); sec.classList.remove('is-revealing', 'is-suspense');
      if (skip.parentNode) skip.remove();
      say(winnerText);
    }
    skip.addEventListener('click', finish);
    var t = 600;
    if (step(3)) { later(function () { step(3).classList.add('is-in'); }, t); t += 1500; }
    later(function () { if (step(2)) step(2).classList.add('is-in'); }, t); t += 1500;
    later(function () { sec.classList.add('is-suspense'); }, t); t += 2200;
    later(function () { step(1).classList.add('is-in'); confetti(); finish(); }, t);
  }

  function confetti() {
    if (reducedMotion()) return;
    var box = document.createElement('div');
    box.className = 'ps-confetti'; box.setAttribute('aria-hidden', 'true');
    var colors = ['#f2c230', '#e63c3c', '#22b3c4', '#3dba6a', '#9b51e0', '#f08c28', '#f5f0e8'];
    for (var i = 0; i < 70; i++) {
      var c = document.createElement('i');
      c.style.left = Math.random() * 100 + '%';
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = (Math.random() * 0.8) + 's';
      c.style.animationDuration = (2.4 + Math.random() * 1.6) + 's';
      c.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
      c.style.setProperty('--x', (Math.random() * 160 - 80) + 'px');
      box.appendChild(c);
    }
    document.body.appendChild(box);
    setTimeout(function () { box.remove(); }, 5000);
  }

  /* Every player needs a name, and no two names can be the same (ignoring case, accents and spaces) */
  function validNames(quiet) {
    var seen = {}, firstBad = null, empty = 0, dup = 0;
    var key = function (v) { return v.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' '); };
    for (var i = 0; i < draft.count; i++) {
      var input = app.querySelector('[data-name="' + i + '"]'), v = draft.names[i] || '', k = key(v), bad = false;
      if (!k) { empty++; bad = true; }
      else if (seen[k] != null) {
        dup++; bad = true;
        var other = app.querySelector('[data-name="' + seen[k] + '"]');
        if (other) other.setAttribute('aria-invalid', 'true');
      } else seen[k] = i;
      if (input) input.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad && firstBad == null) firstBad = input;
    }
    var msg = app.querySelector('#ps-names-err');
    if (!empty && !dup) { if (msg) msg.textContent = ''; return true; }
    var parts = [];
    if (empty) parts.push(empty === 1 ? 'Falta el nombre de un jugador.' : 'Faltan los nombres de ' + empty + ' jugadores.');
    if (dup) parts.push('Hay nombres repetidos: cada jugador necesita un nombre distinto.');
    if (msg) msg.textContent = parts.join(' ');
    if (firstBad && !quiet) { firstBad.focus(); firstBad.scrollIntoView({ block: 'center' }); }
    return false;
  }

  /* ---------- actions ---------- */
  function startSeason(players, season, opts) {
    opts = opts || {};
    state = { v: 1, code: newCode(), created: Date.now(), updated: Date.now(), season: season, players: players, results: [],
      teams: !!opts.teams && (players.length === 4 || players.length === 6), teamNames: opts.teamNames || [], double: !!opts.double };
    order = [];
    save(); render(); window.scrollTo(0, 0);
    say('Temporada creada. Código ' + state.code.split('').join(' '));
    playStart(state, function () { var first = app.querySelector('.ps-racer'); if (first) first.focus({ preventScroll: true }); });
  }
  function open(code) {
    var s = load(code);
    if (!s) return false;
    state = s; order = []; render(); window.scrollTo(0, 0);
    return true;
  }

  app.addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t || t.disabled) return;
    var act = t.getAttribute('data-act');
    if (act === 'new') { state = null; renderSetup(); window.scrollTo(0, 0); return; }
    if (act === 'home') { clearFx(); state = null; order = []; renderHome(); window.scrollTo(0, 0); return; }
    if (t.hasAttribute('data-open')) { open(t.getAttribute('data-open')); return; }
    if (t.hasAttribute('data-del')) {
      var c = t.getAttribute('data-del');
      if (t.getAttribute('data-sure')) { remove(c); renderHome(); }
      else { t.setAttribute('data-sure', '1'); t.textContent = '¿Borrar?'; t.classList.add('is-sure'); }
      return;
    }
    if (t.hasAttribute('data-count')) { draft.count = +t.getAttribute('data-count'); renderSetup(); return; }
    if (t.hasAttribute('data-season')) {
      draft.season = t.getAttribute('data-season');
      app.querySelectorAll('[data-season]').forEach(function (b) { b.setAttribute('aria-pressed', b === t); });
      return;
    }
    if (act === 'start') {
      var players = [], teamNames = [];
      if (!validNames()) return;
      for (var i = 0; i < draft.count; i++) players.push(draft.names[i].trim());
      for (var k = 0; k < draft.count / 2; k++) teamNames.push(TEAMS[k]);
      startSeason(players, draft.season, { teams: draft.teams, teamNames: teamNames, double: draft.double });
      return;
    }
    if (act === 'replay') { render(true); window.scrollTo(0, 0); return; }
    if (act === 'rematch') {
      startSeason(state.players.slice(), state.season, { teams: state.teams, teamNames: (state.teamNames || []).slice(), double: state.double });
      return;
    }
    if (t.hasAttribute('data-racer')) {
      var idx = +t.getAttribute('data-racer'), at = order.indexOf(idx), n = state.players.length;
      if (at > -1) order.splice(at, 1);
      else {
        order.push(idx);
        if (order.length === n - 1) { // the last one left is the last to cross the line
          for (var j = 0; j < n; j++) if (order.indexOf(j) < 0) { order.push(j); break; }
        }
      }
      renderRace();
      var again = app.querySelector('[data-racer="' + idx + '"]'); if (again) again.focus();
      return;
    }
    if (act === 'clear') { order = []; renderRace(); return; }
    if (act === 'save') {
      var g = state.results.length, gp = GPS[g], winner = state.players[order[0]];
      state.results.push(order.slice()); order = []; save();
      say(winner + ' gana la carrera de ' + gp + '.');
      if (state.results.length >= races(state).length) {
        // last race: winner of the race, checkered flag, then the podium reveal
        var s2 = state;
        playRace2(s2, g, function () {
          render(true); window.scrollTo(0, 0);
        });
      } else {
        render(); window.scrollTo(0, 0);
        playRace(state, g, function () { var first = app.querySelector('.ps-racer'); if (first) first.focus({ preventScroll: true }); });
      }
      return;
    }
    if (act === 'undo') {
      if (!state.results.length) return;
      if (!t.getAttribute('data-sure')) {
        t.setAttribute('data-sure', '1');
        t.textContent = '¿Seguro? Toca de nuevo para corregir la carrera de ' + GPS[state.results.length - 1];
        return;
      }
      order = state.results.pop(); save(); renderRace(); window.scrollTo(0, 0);
      say('Puedes corregir el orden de la carrera de ' + GPS[state.results.length] + '.');
    }
  });

  app.addEventListener('input', function (e) {
    var t = e.target;
    if (t.hasAttribute('data-name')) {
      draft.names[+t.getAttribute('data-name')] = t.value;
      // once an error was shown, re-check while typing (without moving focus)
      if (app.querySelector('#ps-names-err').textContent) validNames(true);
    }
    if (t.id === 'ps-code-in') t.value = t.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  });

  app.addEventListener('change', function (e) {
    var t = e.target;
    if (!t.hasAttribute('data-opt')) return;
    draft[t.getAttribute('data-opt')] = t.checked;
    if (t.getAttribute('data-opt') === 'teams') {
      renderSetup();
      var back = app.querySelector('[data-opt="teams"]'); if (back) back.focus();
    }
  });

  app.addEventListener('submit', function (e) {
    e.preventDefault();
    var input = document.getElementById('ps-code-in'), msg = document.getElementById('ps-code-msg');
    if (!open(input.value)) {
      msg.textContent = 'No encontramos la temporada ' + (input.value || '') + ' en este dispositivo. Revisa el código.';
      msg.classList.add('is-error'); input.focus();
    }
  });

  /* Open the season in the URL (#K7Q2) after a reload, otherwise the home screen */
  var fromHash = (location.hash || '').replace('#', '');
  if (!(fromHash && open(fromHash))) renderHome();
})();
