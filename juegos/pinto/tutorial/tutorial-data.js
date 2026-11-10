/* PINTO tutorial: content, in three sections that follow the rules
   (Desarrollo de la Partida, Reglas de Carrera, Cartas Especiales), each split into
   subsections. Every rule shown must come from the official rules (reglamento v1.3);
   avoid situations the rules don't settle (see the PR description).
   Card codes: r1–r8 (Ritmo), cuad, roja, ama, azul, vr (Vuelta Rápida), reb (Rebufo).

   Subsection fields:
     text    fixed explanation shown above the animation (HTML allowed)
     on      special cards only: where it can be played
     pile    starting central pile (last = top); hand / vis: your cards; hid: hidden cards
     focus   zone highlighted at the start: 'hand' | 'vis' | 'hid'
     script  animation, looped like a GIF. Each action may have:
             turn ('you' | 1–3)   focus   no ('hand' | [codes] crossed out in your hand)
             play (code or [codes]) + from ('hand' | 'vis')   bot (1–3) + card
             skip (1–3)   pickup   flip (code revealed from a hidden card)   clear (pile leaves the game)
             wait (ms after the action, default 1100) */
(function (root) {
  'use strict';

  var SECTIONS = [
    {
      id: 'desarrollo', title: 'Desarrollo de la Partida',
      subs: [
        {
          id: 'ritmo', title: 'Mantener el ritmo',
          text: 'Cada jugador debe jugar una carta de <strong>igual o mayor</strong> valor que la carta de arriba de la pila. Una carta menor no se puede jugar.',
          pile: ['r3'], hand: ['r5', 'r2', 'r6'], vis: ['r4', 'r7', 'r8'], hid: 3,
          script: [
            { turn: 1, wait: 500 }, { bot: 1, card: 'r4' },
            { turn: 2, wait: 500 }, { bot: 2, card: 'r4' },
            { turn: 3, wait: 500 }, { bot: 3, card: 'r6' },
            { turn: 'you', wait: 700 }, { no: ['r5', 'r2'], wait: 1500 },
            { play: 'r6' }
          ]
        },
        {
          id: 'ceder', title: 'Ceder el paso',
          text: 'Si no tienes ninguna carta que puedas jugar, <strong>cedes el paso</strong>: recoges toda la pila central y el turno sigue con el siguiente jugador.',
          pile: ['r2', 'r5', 'r7'], hand: ['r3', 'r4', 'r2'], vis: ['r1', 'r6', 'r8'], hid: 3,
          script: [
            { turn: 'you', wait: 700 }, { no: 'hand', wait: 1600 },
            { pickup: true },
            { turn: 1 }
          ]
        },
        {
          id: 'via-libre', title: 'Vía libre',
          text: 'Cuando la pila está vacía tienes <strong>vía libre</strong>: puedes empezar con cualquier carta o combinación válida.',
          pile: [], hand: ['r2', 'r6', 'r6'], vis: ['r3', 'r5', 'r7'], hid: 3,
          script: [
            { turn: 'you', wait: 1200 },
            { play: ['r6', 'r6'] },
            { turn: 1 }
          ]
        },
        {
          id: 'fases', title: 'Fases de la carrera',
          text: 'Te deshaces de tus cartas en tres fases: primero tu <strong>mano</strong>, luego tus cartas <strong>visibles</strong> y al final tus <strong>ocultas</strong>, una a la vez. Si terminas una fase y puedes seguir jugando, avanzas en el mismo turno.',
          pile: ['r3'], hand: ['r4'], vis: ['r5', 'r6', 'r6'], hid: 3, focus: 'hand',
          script: [
            { turn: 'you', focus: 'hand' }, { play: 'r4' },
            { focus: 'vis' }, { play: 'r5', from: 'vis' }, { play: ['r6', 'r6'], from: 'vis' },
            { focus: 'hid' }, { flip: 'r7' },
            { focus: 'hand', wait: 700 }, { play: 'r7' }
          ]
        }
      ]
    },
    {
      id: 'reglas', title: 'Reglas de Carrera',
      subs: [
        {
          id: 'turno', title: 'Desarrollo del turno',
          text: 'En tu turno puedes jugar <strong>varias cartas</strong>, juntas o una tras otra. La Bandera Roja, la Bandera a Cuadros y el Carril Lleno terminan tu turno.',
          pile: ['r3'], hand: ['r4', 'r6', 'r2'],
          script: [
            { turn: 'you', wait: 800 }, { play: 'r4' }, { play: 'r6' },
            { turn: 1 }
          ]
        },
        {
          id: 'encadenar', title: 'Encadenar cartas',
          text: 'Puedes jugar juntas <strong>varias cartas iguales</strong>. Las Cartas Especiales encadenadas aplican su efecto una sola vez. La Bandera a Cuadros no se encadena.',
          pile: ['r2'], hand: ['r4', 'r1', 'r4'],
          script: [
            { turn: 'you', wait: 800 }, { play: ['r4', 'r4'] },
            { turn: 1 }
          ]
        },
        {
          id: 'carril', title: 'Carril Lleno',
          text: 'Cuando hay <strong>cuatro cartas iguales seguidas</strong> en la pila central se produce un Carril Lleno, sin importar si las jugaron uno o varios jugadores. La pila se retira de la partida, el turno de quien lo completó termina y el siguiente jugador obtiene vía libre. Una Bandera Azul corta la secuencia.',
          pile: ['r3'], hand: ['r5', 'r8', 'r2'],
          script: [
            { turn: 1, wait: 400 }, { bot: 1, card: 'r5' },
            { turn: 2, wait: 400 }, { bot: 2, card: 'r5' },
            { turn: 3, wait: 400 }, { bot: 3, card: 'r5' },
            { turn: 'you', wait: 600 }, { play: 'r5', wait: 700 },
            { clear: true },
            { turn: 1 }
          ]
        }
      ]
    },
    {
      id: 'especiales', title: 'Cartas Especiales',
      subs: [
        {
          id: 'cuad', card: 'cuad', title: 'Bandera a Cuadros', on: 'sobre cualquier carta o con vía libre.',
          text: 'Cierra la etapa: todas las cartas de la pila central se retiran de la partida, incluida la Bandera a Cuadros. Tu turno termina y el siguiente jugador obtiene vía libre.',
          pile: ['r3', 'r6', 'r8'], hand: ['cuad', 'r2', 'r4'],
          script: [
            { turn: 'you', wait: 800 }, { play: 'cuad', wait: 800 },
            { clear: true },
            { turn: 1 }
          ]
        },
        {
          id: 'roja', card: 'roja', title: 'Bandera Roja', on: 'sobre cualquier carta o con vía libre.',
          text: 'Reinicia el ritmo de la carrera <strong>sin descartar la pila</strong>: las cartas se quedan en la pila central. El siguiente jugador obtiene vía libre.',
          pile: ['r4', 'r7'], hand: ['roja', 'r2', 'r3'],
          script: [
            { turn: 'you', wait: 800 }, { play: 'roja' },
            { turn: 1, wait: 500 }, { bot: 1, card: 'r2' }
          ]
        },
        {
          id: 'ama', card: 'ama', title: 'Bandera Amarilla', on: 'sobre un Ritmo Bajo (1, 2, 3 o 4), otra Bandera Amarilla o con vía libre.',
          text: 'El siguiente jugador debe responder con un <strong>Ritmo Bajo</strong>, una Bandera Roja, una Bandera a Cuadros u otra Bandera Amarilla. Si no puede, cede el paso y recoge toda la pila.',
          pile: ['r3'], hand: ['ama', 'r6', 'r1'],
          script: [
            { turn: 'you', wait: 800 }, { play: 'ama' },
            { turn: 1, wait: 500 }, { bot: 1, card: 'r2' }
          ]
        },
        {
          id: 'azul', card: 'azul', title: 'Bandera Azul', on: 'sobre una carta de Ritmo, otra Bandera Azul o con vía libre.',
          text: 'El siguiente jugador activo <strong>pierde su turno</strong>. Quien sigue juega como si la Bandera Azul no estuviera y responde a la carta que quedó debajo de ella.',
          pile: ['r5'], hand: ['azul', 'r2', 'r3'],
          script: [
            { turn: 'you', wait: 800 }, { play: 'azul' },
            { skip: 1, wait: 1400 },
            { turn: 2, wait: 500 }, { bot: 2, card: 'r6' }
          ]
        },
        {
          id: 'vr', card: 'vr', title: 'Vuelta Rápida', on: 'sobre cualquier carta, menos una Bandera Amarilla, o con vía libre.',
          text: 'Establece el <strong>ritmo más alto</strong> de la carrera: nadie puede superarlo. El siguiente solo puede responder con otra Vuelta Rápida, una Bandera Roja o una Bandera a Cuadros.',
          pile: ['r6', 'r8'], hand: ['vr', 'r4', 'r7'],
          script: [
            { turn: 'you', wait: 800 }, { play: 'vr' },
            { turn: 1, wait: 500 }, { bot: 1, card: 'roja' }
          ]
        },
        {
          id: 'reb', card: 'reb', title: 'Rebufo', on: 'sobre un Ritmo Bajo, otro Rebufo o con vía libre.',
          text: 'Puedes acompañarlo con <strong>Ritmos Altos</strong> (5, 6, 7 u 8) de hasta dos valores consecutivos, o jugarlo solo. Con Ritmos Altos, el valor más alto queda arriba y se sigue la regla general.',
          pile: ['r3'], hand: ['reb', 'r6', 'r2', 'r7'],
          script: [
            { turn: 'you', wait: 800 }, { play: ['reb', 'r6', 'r7'] },
            { turn: 1 }
          ]
        }
      ]
    }
  ];

  root.PintoTutorial = { sections: SECTIONS };
})(this);
