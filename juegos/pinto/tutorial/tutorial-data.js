/* PINTO interactive tutorial: lessons.
   Short, hands-on steps on a mini table. Every rule shown must come from the
   official rules (reglamento v1.3); avoid situations the rules don't settle
   (see the PR description). Card codes: r1–r8 (Ritmo), cuad, roja, ama, azul,
   vr (Vuelta Rápida), reb (Rebufo).

   Step fields:
     text   one short instruction (HTML allowed)
     pile   cards in the central pile (last = top); hand / vis: your cards; hid: number of hidden cards
     task   'next' (just continue) | 'play' (tap a card) | 'combo' (select several, then "Jugar")
            | 'pickup' (pick up the pile) | 'flip' (take a hidden card)
     valid  for 'play': card codes that are accepted; combo: the exact set to select
     reveal for 'flip': the card that comes out
     hint   shown when the player taps something that isn't accepted
     then   what happens after the move: [{ bot: n, card }, { skip: n }, { clear: 'out' | 'away' }]
     ok     short line shown when the step is done
     focus  zone to highlight: 'hand' | 'vis' | 'hid' | 'pile' */
(function (root) {
  'use strict';

  var LESSONS = [
    {
      id: 'meta', title: 'Tu meta',
      steps: [
        { text: 'Gana quien se quede <strong>sin cartas</strong> primero.', hand: ['r2', 'r5', 'r7'], vis: ['r3', 'r6', 'r8'], hid: 3, task: 'next' },
        { text: 'Primero juegas las de tu <strong>mano</strong>…', hand: ['r2', 'r5', 'r7'], vis: ['r3', 'r6', 'r8'], hid: 3, focus: 'hand', task: 'next' },
        { text: '…después tus cartas <strong>visibles</strong>…', hand: [], vis: ['r3', 'r6', 'r8'], hid: 3, focus: 'vis', task: 'next' },
        { text: '…y al final las <strong>ocultas</strong>.', hand: [], vis: [], hid: 3, focus: 'hid', task: 'next' }
      ]
    },
    {
      id: 'empezar', title: '¿Quién empieza?',
      steps: [
        { text: 'Empieza quien juegue un <strong>Ritmo 1</strong>. ¡Juégalo!', pile: [], hand: ['r4', 'r1', 'r6', 'r7'], vis: ['r3', 'r5', 'r8'], hid: 3, task: 'play', valid: ['r1'], hint: 'Busca el 1.', ok: 'Si nadie tiene un 1, empieza quien tenga un 2, y así.' }
      ]
    },
    {
      id: 'ritmo', title: 'Mantén el ritmo',
      steps: [
        { text: 'Juega una carta <strong>igual o mayor</strong> que la de arriba.', pile: ['r3'], hand: ['r2', 'r5', 'r1', 'r3'], vis: ['r4', 'r6', 'r8'], hid: 3, task: 'play', valid: ['r3', 'r5'], hint: 'Esa es menor que el 3.', then: [{ bot: 1, card: 'r6' }], ok: 'El Jugador 1 subió a 6.' },
        { text: 'Ahora hay un 6. ¿Cuál puedes jugar?', pile: ['r3', 'r5', 'r6'], hand: ['r2', 'r1', 'r7'], vis: ['r4', 'r6', 'r8'], hid: 3, task: 'play', valid: ['r7'], hint: 'Necesitas un 6 o más.', ok: '¡Eso es! Siempre igual o mayor.' }
      ]
    },
    {
      id: 'iguales', title: 'Cartas iguales',
      steps: [
        { text: 'Las cartas iguales pueden jugarse <strong>juntas</strong>. Toca los dos 4 y luego <em>Jugar</em>.', pile: ['r2'], hand: ['r4', 'r1', 'r4'], vis: ['r3', 'r6', 'r8'], hid: 3, task: 'combo', valid: ['r4', 'r4'], hint: 'Selecciona solo los dos 4.', ok: 'Te deshiciste de dos cartas de una vez.' }
      ]
    },
    {
      id: 'recoger', title: 'Si no puedes jugar',
      steps: [
        { text: 'Ninguna de tus cartas llega a 7. <strong>Recoge la pila.</strong>', pile: ['r2', 'r5', 'r7'], hand: ['r3', 'r4', 'r2'], vis: ['r1', 'r6', 'r8'], hid: 3, task: 'pickup', hint: 'Esa carta es menor que 7.', ok: 'Toda la pila pasa a tu mano y el turno sigue con el siguiente jugador.' }
      ]
    },
    {
      id: 'carril', title: 'Carril Lleno',
      steps: [
        { text: 'Hay tres 5 seguidos. <strong>Juega el cuarto.</strong>', pile: ['r3', 'r5', 'r5', 'r5'], hand: ['r5', 'r8', 'r2'], vis: ['r4', 'r6', 'r7'], hid: 3, task: 'play', valid: ['r5'], hint: 'Para completar el Carril Lleno necesitas otro 5.', then: [{ clear: 'out' }], ok: '¡Carril Lleno! La pila sale de la partida, tu turno termina y el siguiente tiene vía libre.' }
      ]
    },
    {
      id: 'mesa', title: 'Tus cartas de la mesa',
      steps: [
        { text: 'Sin cartas en la mano, juegas tus <strong>visibles</strong>.', pile: ['r3'], hand: [], vis: ['r4', 'r1', 'r6'], hid: 3, focus: 'vis', task: 'play', valid: ['r4', 'r6'], hint: 'Esa es menor que el 3.', ok: 'Igual que con la mano: igual o mayor.' },
        { text: 'Solo te quedan las ocultas. <strong>Toma una.</strong>', pile: ['r3', 'r4'], hand: [], vis: [], hid: 3, focus: 'hid', task: 'flip', reveal: 'r6', ok: 'Salió un 6 y pasa a tu mano.' },
        { text: 'Puedes jugarla, porque 6 es mayor que 4.', pile: ['r3', 'r4'], hand: ['r6'], vis: [], hid: 2, task: 'play', valid: ['r6'], ok: 'Así sigues hasta quedarte sin cartas.' }
      ]
    },
    {
      id: 'especiales', title: 'Cartas especiales', specials: true,
      steps: []
    },
    {
      id: 'meta-final', title: 'Fin de la carrera', final: true,
      steps: [
        { text: 'El primero sin cartas <strong>cruza la meta</strong>. Los demás siguen hasta que solo quede uno.', pile: [], hand: [], vis: [], hid: 0, task: 'next' }
      ]
    }
  ];

  // One mini demo per special card (shown as tabs inside "Cartas especiales")
  var SPECIALS = [
    {
      id: 'roja', card: 'roja', title: 'Bandera Roja', on: 'Sobre cualquier carta',
      steps: [{ text: 'Juega la <strong>Bandera Roja</strong>.', pile: ['r4', 'r7'], hand: ['roja', 'r2', 'r3'], task: 'play', valid: ['roja'], hint: 'Esa no llega a 7.', then: [{ bot: 1, card: 'r2' }], ok: 'Reinicia el ritmo: la pila se queda y el siguiente tiene vía libre.' }]
    },
    {
      id: 'cuad', card: 'cuad', title: 'Bandera a Cuadros', on: 'Sobre cualquier carta',
      steps: [{ text: 'Juega la <strong>Bandera a Cuadros</strong>.', pile: ['r3', 'r6', 'r8'], hand: ['cuad', 'r2', 'r4'], task: 'play', valid: ['cuad'], hint: 'Esa no llega a 8.', then: [{ clear: 'out' }], ok: 'Toda la pila sale de la partida y tu turno termina. El siguiente tiene vía libre.' }]
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
  ];

  root.PintoTutorial = { lessons: LESSONS, specials: SPECIALS };
})(this);
