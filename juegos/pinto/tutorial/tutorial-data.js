/* PINTO interactive tutorial: content, in three sections that follow the rules
   (Desarrollo de la Partida, Reglas de Carrera, Cartas Especiales), each split
   into subsections.
   Short, hands-on steps on a mini table. Every rule shown must come from the
   official rules (reglamento v1.3); avoid situations the rules don't settle
   (see the PR description). Card codes: r1–r8 (Ritmo), cuad, roja, ama, azul,
   vr (Vuelta Rápida), reb (Rebufo).

   Step fields:
     text   one short instruction (HTML allowed)
     pile   cards in the central pile (last = top); hand / vis: your cards; hid: number of hidden cards
     task   'watch' (plays itself: script of { say, turn, focus, no, play, from, bot, card, pickup, flip, wait })
            | 'next' (just continue) | 'play' (tap a card) | 'combo' (select several, then "Jugar")
            | 'pickup' (pick up the pile) | 'flip' (take a hidden card)
     valid  for 'play': card codes that are accepted; combo: the exact set to select
     reveal for 'flip': the card that comes out
     hint   shown when the player taps something that isn't accepted
     then   what happens after the move: [{ bot: n, card }, { skip: n }, { clear: 'out' | 'away' }]
     ok     short line shown when the step is done
     focus  zone to highlight: 'hand' | 'vis' | 'hid' | 'pile' */
(function (root) {
  'use strict';

  var SECTIONS = [
    {
      id: 'desarrollo', title: 'Desarrollo de la Partida',
      subs: [
        { id: 'ritmo', title: 'Mantener el ritmo', steps: [
          { task: 'watch', text: 'Cada jugador juega una carta <strong>igual o mayor</strong> que la de arriba.',
            pile: ['r3'], hand: ['r5', 'r2', 'r6'], vis: ['r4', 'r7', 'r8'], hid: 3,
            script: [
              { turn: 1, say: 'El Jugador 1 juega un 4 sobre el 3.' }, { bot: 1, card: 'r4' },
              { turn: 2, say: 'El Jugador 2 juega otro 4: una carta igual también vale.' }, { bot: 2, card: 'r4' },
              { turn: 3, say: 'El Jugador 3 sube a 6.' }, { bot: 3, card: 'r6' },
              { turn: 'you', say: 'Tu turno: el 5 y el 2 son menores que el 6.', no: ['r5', 'r2'] },
              { say: 'El 6 sí se puede jugar.' }, { play: 'r6' }
            ],
            ok: 'Siempre igual o mayor que la carta de arriba.' }
        ] },
        { id: 'ceder', title: 'Ceder el paso', steps: [
          { task: 'watch', text: 'Arriba hay un 7.',
            pile: ['r2', 'r5', 'r7'], hand: ['r3', 'r4', 'r2'], vis: ['r1', 'r6', 'r8'], hid: 3,
            script: [
              { turn: 'you', say: 'Es tu turno y ninguna de tus cartas es 7 o más.', no: 'hand' },
              { say: 'Cedes el paso y <strong>recoges toda la pila</strong>.' }, { pickup: true },
              { turn: 1, say: 'Las cartas pasan a tu mano y el turno sigue con el siguiente jugador.' }
            ],
            ok: 'Si no puedes jugar ninguna carta, recoges toda la pila central.' }
        ] },
        { id: 'via-libre', title: 'Vía libre', steps: [
          { task: 'watch', text: 'La pila está vacía: tienes <strong>vía libre</strong>.',
            pile: [], hand: ['r2', 'r6', 'r6'], vis: ['r3', 'r5', 'r7'], hid: 3,
            script: [
              { turn: 'you', say: 'No hay ninguna carta que superar: puedes empezar con cualquier carta o combinación válida.' },
              { say: 'Por ejemplo, los dos 6 juntos.' }, { play: ['r6', 'r6'] },
              { turn: 1, say: 'El siguiente jugador tendrá que jugar un 6 o más.' }
            ],
            ok: 'Con vía libre empiezas con lo que quieras.' }
        ] },
        { id: 'fases', title: 'Fases de la carrera', steps: [
          { task: 'watch', text: 'Te deshaces de tus cartas en tres fases.',
            pile: ['r3'], hand: ['r4'], vis: ['r5', 'r6', 'r6'], hid: 3, focus: 'hand',
            script: [
              { turn: 'you', focus: 'hand', say: '<strong>Fase 1:</strong> juegas las cartas de tu mano.' }, { play: 'r4' },
              { focus: 'vis', say: '<strong>Fase 2:</strong> sin cartas en la mano, sigues con tus cartas visibles en el mismo turno.' }, { play: 'r5', from: 'vis' },
              { play: ['r6', 'r6'], from: 'vis' },
              { focus: 'hid', say: '<strong>Fase 3:</strong> tomas tus cartas ocultas, una a la vez.' }, { flip: 'r7' },
              { focus: '', say: 'La carta pasa a tu mano. Como se puede jugar, la juegas.' }, { play: 'r7' }
            ],
            ok: 'Mano, visibles y ocultas: siempre en ese orden.' }
        ] }
      ]
    },
    {
      id: 'reglas', title: 'Reglas de Carrera',
      subs: [
        { id: 'turno', title: 'Desarrollo del turno', steps: [
          { text: 'En tu turno puedes jugar varias cartas, <strong>una tras otra</strong>. Juega el 4.', pile: ['r3'], hand: ['r4', 'r6', 'r2'], vis: ['r1', 'r5', 'r8'], hid: 3, task: 'play', valid: ['r4'], hint: 'Empieza con el 4.', ok: 'Tu turno sigue.' },
          { text: 'Sigue jugando: ahora el <strong>6</strong>.', pile: ['r3', 'r4'], hand: ['r6', 'r2'], vis: ['r1', 'r5', 'r8'], hid: 3, task: 'play', valid: ['r6'], hint: 'El 2 es menor que el 4.', ok: 'La Bandera Roja, la Bandera a Cuadros y el Carril Lleno terminan tu turno.' }
        ] },
        { id: 'encadenar', title: 'Encadenar cartas', steps: [
        { text: 'Las cartas iguales pueden jugarse <strong>juntas</strong>. Toca los dos 4 y luego <em>Jugar</em>.', pile: ['r2'], hand: ['r4', 'r1', 'r4'], vis: ['r3', 'r6', 'r8'], hid: 3, task: 'combo', valid: ['r4', 'r4'], hint: 'Selecciona solo los dos 4.', ok: 'Te deshiciste de dos cartas de una vez.' }
        ] },
        { id: 'carril', title: 'Carril Lleno', steps: [
        { text: 'Hay tres 5 seguidos. <strong>Juega el cuarto.</strong>', pile: ['r3', 'r5', 'r5', 'r5'], hand: ['r5', 'r8', 'r2'], vis: ['r4', 'r6', 'r7'], hid: 3, task: 'play', valid: ['r5'], hint: 'Para completar el Carril Lleno necesitas otro 5.', then: [{ clear: 'out' }], ok: '¡Carril Lleno! La pila sale de la partida, tu turno termina y el siguiente tiene vía libre.' }
        ] }
      ]
    },
    {
      id: 'especiales', title: 'Cartas Especiales',
      subs: [
        {
          id: 'cuad', card: 'cuad', title: 'Bandera a Cuadros', on: 'Sobre cualquier carta',
      steps: [{ text: 'Juega la <strong>Bandera a Cuadros</strong>.', pile: ['r3', 'r6', 'r8'], hand: ['cuad', 'r2', 'r4'], task: 'play', valid: ['cuad'], hint: 'Esa no llega a 8.', then: [{ clear: 'out' }], ok: 'Toda la pila sale de la partida y tu turno termina. El siguiente tiene vía libre.' }]
    },
        {
          id: 'roja', card: 'roja', title: 'Bandera Roja', on: 'Sobre cualquier carta',
      steps: [{ text: 'Juega la <strong>Bandera Roja</strong>.', pile: ['r4', 'r7'], hand: ['roja', 'r2', 'r3'], task: 'play', valid: ['roja'], hint: 'Esa no llega a 7.', then: [{ bot: 1, card: 'r2' }], ok: 'Reinicia el ritmo: la pila se queda y el siguiente tiene vía libre.' }]
    },
        {
          id: 'ama', card: 'ama', title: 'Bandera Amarilla', on: 'Sobre un Ritmo Bajo (1 a 4)',
      steps: [{ text: 'Juega la <strong>Bandera Amarilla</strong> sobre el 3.', pile: ['r3'], hand: ['ama', 'r1', 'r2'], task: 'play', valid: ['ama'], hint: 'Esa es menor que el 3.', then: [{ bot: 1, card: 'r2' }], ok: 'El siguiente tuvo que responder con un Ritmo Bajo (o una Bandera Roja, a Cuadros u otra Amarilla).' }]
    },
        {
          id: 'azul', card: 'azul', title: 'Bandera Azul', on: 'Sobre una carta de Ritmo',
      steps: [{ text: 'Juega la <strong>Bandera Azul</strong>.', pile: ['r5'], hand: ['azul', 'r2', 'r3'], task: 'play', valid: ['azul'], hint: 'Esa es menor que el 5.', then: [{ skip: 1 }, { bot: 2, card: 'r6' }], ok: 'El Jugador 1 pierde su turno. El Jugador 2 responde al 5 que quedó debajo.' }]
    },
        {
          id: 'vr', card: 'vr', title: 'Vuelta Rápida', on: 'Sobre cualquier carta, menos una Bandera Amarilla',
      steps: [{ text: 'Juega la <strong>Vuelta Rápida</strong> sobre el 8.', pile: ['r6', 'r8'], hand: ['vr', 'r4', 'r7'], task: 'play', valid: ['vr'], hint: 'Esa es menor que el 8.', ok: 'Es el ritmo más alto. Solo se responde con otra Vuelta Rápida, una Bandera Roja o una a Cuadros.' }]
    },
        {
          id: 'reb', card: 'reb', title: 'Rebufo', on: 'Sobre un Ritmo Bajo (1 a 4)',
      steps: [{ text: 'El Rebufo puede ir con Ritmos Altos consecutivos. Toca <strong>Rebufo, 6 y 7</strong> y luego <em>Jugar</em>.', pile: ['r3'], hand: ['reb', 'r6', 'r2', 'r7'], task: 'combo', valid: ['reb', 'r6', 'r7'], hint: 'Selecciona el Rebufo, el 6 y el 7.', ok: 'Arriba queda el 7 y se sigue con la regla normal.' }]
    }
      ]
    }
  ];

  root.PintoTutorial = { sections: SECTIONS };
})(this);
