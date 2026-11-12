/* PINTO tutorial: content, in four groups that follow the order of the printed leaflet
   ("PINTO · Instrucciones"): En tu turno, Fases de la carrera, Combinaciones (Encadenar
   cartas + Carril Lleno; the leaflet has no group title for these) and Cartas especiales.
   Rule text comes from the leaflet; don't add rules that aren't in it.
   Card codes: r1–r8 (Ritmo), cuad, roja, ama, azul, vr (Vuelta Rápida), reb (Rebufo), back.

   Group fields: id (hash for the list view), title, color (CSS var), alias (old hashes)
   Rule fields:
     id      hash (#ritmo …). Keep existing ids: instrucciones/ links to them
     title   official rule name          q      the rule as a visitor's question
     keys    extra search words (no accents needed)
     mini    card shown next to the question in the lists (special cards use their own card)
     on      special cards only: "Sobre:"            then   special cards only: "Luego:"
     text    explanation (HTML allowed: <strong>, <ol>, <ul>)
     examples  optional: plays drawn as cards (ok, cards, bad = index of the wrong card, why, label for screen readers)
     note    optional highlighted remark (HTML allowed)
     rel     ids of related rules
     pile    starting central pile (last = top); hand / vis: your cards; hid: hidden cards
     focus   zone highlighted at the start: 'hand' | 'vis' | 'hid'
     script  animation, looped like a GIF. Each action may have:
             turn ('you' | 1–3)   focus   no ('hand' | [codes] crossed out in your hand)
             play (code or [codes]) + from ('hand' | 'vis')   bot (1–3) + card
             skip (1–3)   tryEach (lift each hand card, mark it not valid)   pickup   take (visible cards move to your hand)   flip (code revealed from a hidden card)   clear (pile leaves the game)
             wait (ms after the action, default 1100)
   A player may only play different values in one turn with the Rebufo: never script e.g. a 4 and then a 6. */
(function (root) {
  'use strict';

  var GROUPS = [
    {
      id: 'en-tu-turno', title: 'En tu turno', color: 'var(--g1)', alias: ['desarrollo'],
      rules: [
        {
          id: 'ritmo', title: 'Mantén el ritmo', q: '¿Qué carta puedo jugar?', mini: 'r5',
          keys: 'jugar valor igual mayor menor tope arriba pila regla general numero alto bajo cual tiro',
          text: 'Juega sobre el tope de la pila una carta de Ritmo de <strong>igual o mayor</strong> valor, o una Carta Especial que lo permita.',
          rel: ['via-libre', 'encadenar', 'ceder'],
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
          id: 'ceder', title: 'Cede el paso', q: 'No tengo jugada, ¿qué hago?', mini: 'back',
          keys: 'no puedo jugar no tengo carta jugada valida recoger recojo agarrar comer llevar pila pasar paso',
          text: 'Si al comenzar tu turno no tienes una jugada válida, <strong>recoge toda la pila central</strong> y súmala a tu mano. Tu turno termina y el siguiente jugador tiene vía libre.',
          note: 'Aplica en cualquier fase: si recoges la pila, debes deshacerte de todas las cartas de tu mano antes de avanzar de fase.',
          rel: ['fases', 'via-libre', 'ritmo'],
          pile: ['r2', 'r5', 'r7'], hand: ['r3', 'r4', 'r2'], vis: ['r1', 'r6', 'r8'], hid: 3,
          script: [
            { turn: 'you', wait: 700 }, { tryEach: true, wait: 700 },
            { pickup: true, wait: 1600 }
          ]
        },
        {
          id: 'via-libre', title: 'Vía libre', q: '¿Cuándo puedo empezar con cualquier carta?', mini: 'r2',
          keys: 'pila vacia empezar iniciar cualquier carta nueva secuencia libre',
          text: 'Con la pila vacía, o cuando una carta lo indica, el jugador puede empezar con <strong>cualquier carta</strong> o combinación válida.',
          rel: ['ceder', 'cuad', 'roja', 'carril'],
          pile: [], hand: ['r2', 'r6', 'r6'], vis: ['r3', 'r5', 'r7'], hid: 3,
          script: [
            { turn: 'you', wait: 1200 },
            { play: ['r6', 'r6'] },
            { turn: 1 }
          ]
        },
        {
          id: 'turno', title: 'Desarrollo del turno', q: '¿Me pueden interrumpir? ¿Cuándo termina mi turno?', mini: 'r7',
          keys: 'interrumpir interrupcion cortar terminar acabar turno cuantas cartas varias seguidas siguiente jugador empieza',
          text: '<p>Tu turno empieza al colocar tu primera carta. Puedes jugar <strong>tantas cartas</strong> como permitan las reglas, juntas o una tras otra.</p>' +
            '<p>Cuando ya jugaste al menos una, el siguiente jugador puede <strong>interrumpirte</strong> con una carta o combinación válida sobre el tope: tu turno termina y empieza el suyo. Si nadie te interrumpe, puedes seguir jugando o terminar tu turno.</p>',
          note: 'La Bandera Roja, la Bandera a Cuadros y el Carril Lleno terminan el turno de inmediato.',
          rel: ['encadenar', 'carril', 'roja', 'cuad'],
          pile: ['r1'], hand: ['r2', 'r2', 'r3', 'r6', 'vr'],
          script: [
            { turn: 'you', wait: 800 }, { play: 'r2' }, { play: 'r2' },
            { turn: 1, wait: 500 }, { bot: 1, card: 'r3' },
            { turn: 2, wait: 500 }, { bot: 2, card: 'r5' },
            { turn: 3, wait: 500 }, { bot: 3, card: 'r6' },
            { turn: 'you', wait: 600 }, { play: 'r6' }
          ]
        }
      ]
    },
    {
      id: 'fases-de-la-carrera', title: 'Fases de la carrera', color: 'var(--g2)',
      rules: [
        {
          id: 'fases', title: 'Fases de la carrera', q: 'Se me acabó la mano, ¿y ahora?', mini: 'back',
          keys: 'sin cartas mano visibles ocultas boca abajo boca arriba orden mesa se acabo termine tomar oculta',
          text: '<p>Te deshaces de tus cartas en tres fases, siempre en este orden:</p><ol>' +
            '<li><strong>Mano.</strong> Juega las cartas de tu mano.</li>' +
            '<li><strong>Visibles.</strong> Sin cartas en la mano, toma tus visibles: son tu nueva mano.</li>' +
            '<li><strong>Ocultas.</strong> Sin cartas otra vez, toma una carta oculta y súmala a tu mano: si es válida, juégala; si no, cedes el paso. Solo al deshacerte de ella puedes tomar la siguiente.</li></ol>',
          rel: ['avanzar', 'ceder'],
          pile: ['r3'], hand: ['r4'], vis: ['r5', 'r8', 'cuad'], hid: 3, focus: 'hand',
          script: [
            { turn: 'you', focus: 'hand' }, { play: 'r4' },
            { focus: 'vis' }, { take: true },
            { focus: 'hand', wait: 900 },
            { turn: 1, wait: 500 }, { bot: 1, card: 'r5' },
            { turn: 2, wait: 500 }, { bot: 2, card: 'r6' },
            { turn: 3, wait: 500 }, { bot: 3, card: 'r7' },
            { turn: 'you', wait: 600 }, { play: 'r8' }
          ]
        },
        {
          id: 'avanzar', title: 'Avanzar en el mismo turno', q: '¿Sigo jugando al cambiar de fase?', mini: 'r4',
          keys: 'cambiar fase seguir jugando mismo turno continuar sin esperar visibles terminar mano',
          text: 'Si terminas una fase y puedes seguir jugando (por Encadenar cartas o el Rebufo), <strong>continúas en la siguiente</strong> sin esperar.',
          note: 'Ej.: terminas tu mano con un Ritmo 4 y tienes otro 4 en tus visibles: juégalo de inmediato.',
          rel: ['fases', 'encadenar', 'reb'],
          pile: ['r3'], hand: ['r4'], vis: ['r4', 'r6', 'r7'], hid: 3, focus: 'hand',
          script: [
            { turn: 'you', focus: 'hand' }, { play: 'r4' },
            { focus: 'vis' }, { take: true },
            { focus: 'hand', wait: 600 }, { play: 'r4' },
            { turn: 1 }
          ]
        }
      ]
    },
    {
      id: 'combinaciones', title: 'Combinaciones', color: 'var(--g3)', alias: ['reglas'],
      rules: [
        {
          id: 'encadenar', title: 'Encadenar cartas', q: '¿Puedo jugar varias cartas a la vez?', mini: 'r6',
          keys: 'varias cartas vez iguales juntas pares trios dobles mismo valor combinar mezclar',
          text: '<p>Puedes jugar <strong>varias cartas iguales</strong> a la vez: del mismo valor de Ritmo o del mismo tipo de Carta Especial. No es obligatorio.</p><ul>' +
            '<li>Las Cartas Especiales encadenadas aplican su efecto una sola vez.</li>' +
            '<li>No puedes mezclar valores o tipos distintos, salvo con el Rebufo.</li>' +
            '<li>La Bandera a Cuadros no se puede encadenar.</li></ul>',
          rel: ['carril', 'reb', 'turno'],
          pile: ['r2'], hand: ['r4', 'r1', 'r4'],
          script: [
            { turn: 'you', wait: 800 }, { play: ['r4', 'r4'] },
            { turn: 1 }
          ]
        },
        {
          id: 'carril', title: 'Carril Lleno', q: '¿Qué pasa con 4 cartas iguales seguidas?', mini: 'r3',
          keys: '4 cuatro iguales seguidas descartar retirar quemar pila',
          text: 'Cuatro cartas iguales seguidas en la pila central, de uno o varios jugadores, forman un <strong>Carril Lleno</strong>: la pila se retira de la partida, el turno de quien colocó la cuarta termina y el siguiente jugador tiene vía libre.',
          note: 'La Bandera Azul corta la secuencia de un Carril Lleno.',
          rel: ['encadenar', 'azul', 'via-libre'],
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
      id: 'especiales', title: 'Cartas especiales', color: 'var(--g4)', special: true,
      rules: [
        {
          id: 'cuad', card: 'cuad', title: 'Bandera a Cuadros', q: '¿Qué hace la Bandera a Cuadros?',
          keys: 'cuadros cerrar etapa descartar retirar quemar pila terminar',
          on: 'cualquier carta o con vía libre.',
          text: '<strong>Cierra la etapa:</strong> toda la pila, incluida la Bandera a Cuadros, se retira de la partida. Tu turno termina y solo puedes jugar una por turno.',
          then: 'vía libre para el siguiente.',
          rel: ['roja', 'carril', 'via-libre'],
          pile: ['r3', 'r6', 'r8'], hand: ['cuad', 'r2', 'r4'],
          script: [
            { turn: 'you', wait: 800 }, { play: 'cuad', wait: 800 },
            { clear: true },
            { turn: 1 }
          ]
        },
        {
          id: 'roja', card: 'roja', title: 'Bandera Roja', q: '¿Qué hace la Bandera Roja?',
          keys: 'roja reiniciar ritmo bajar empezar cero',
          on: 'cualquier carta o con vía libre.',
          text: '<strong>Reinicia el ritmo sin descartar:</strong> la pila se queda en la mesa. Tu turno termina.',
          then: 'vía libre para el siguiente.',
          rel: ['cuad', 'via-libre'],
          pile: ['r4', 'r7'], hand: ['roja', 'r2', 'r3'],
          script: [
            { turn: 'you', wait: 800 }, { play: 'roja' },
            { turn: 1, wait: 500 }, { bot: 1, card: 'r2' }
          ]
        },
        {
          id: 'ama', card: 'ama', title: 'Bandera Amarilla', q: '¿Qué puedo responder a una Bandera Amarilla?',
          keys: 'amarilla ritmo bajo responder bajar 1 2 3 4',
          on: 'un Ritmo Bajo, otra Bandera Amarilla o con vía libre.',
          then: 'el siguiente solo puede responder con un <strong>Ritmo Bajo</strong>, otra Bandera Amarilla, una Bandera Roja o una Bandera a Cuadros. Si es otra Amarilla, el efecto pasa al siguiente jugador.',
          note: 'Ritmos Bajos: del 1 al 4.',
          rel: ['vr', 'reb', 'roja'],
          pile: ['r3'], hand: ['ama', 'r6', 'r1'],
          script: [
            { turn: 'you', wait: 800 }, { play: 'ama' },
            { turn: 1, wait: 500 }, { bot: 1, card: 'r2' }
          ]
        },
        {
          id: 'azul', card: 'azul', title: 'Bandera Azul', q: '¿Qué hace la Bandera Azul?',
          keys: 'azul saltar brincar pierde turno siguiente jugador meta',
          on: 'una carta de Ritmo, otra Bandera Azul o con vía libre.',
          text: 'El siguiente jugador en carrera <strong>pierde su turno</strong> (si ya cruzó la meta, lo pierde el próximo en carrera). La pila queda intacta y la Azul corta la secuencia de un Carril Lleno.',
          then: 'quien sigue responde a la carta que quedó debajo de la Azul; si se jugó con vía libre, tiene vía libre.',
          rel: ['carril', 'via-libre'],
          pile: ['r5'], hand: ['azul', 'r2', 'r3'],
          script: [
            { turn: 'you', wait: 800 }, { play: 'azul' },
            { skip: 1, wait: 1400 },
            { turn: 2, wait: 500 }, { bot: 2, card: 'r6' }
          ]
        },
        {
          id: 'vr', card: 'vr', title: 'Vuelta Rápida', q: '¿Qué hace la Vuelta Rápida?',
          keys: 'vuelta rapida ritmo mas alto nadie supera cronometro',
          on: 'cualquier carta excepto una Bandera Amarilla, o con vía libre.',
          text: '<strong>Marca el ritmo más alto:</strong> nadie puede superarlo.',
          then: 'solo se responde con otra Vuelta Rápida, una Bandera Roja o una Bandera a Cuadros.',
          rel: ['ama', 'roja', 'cuad'],
          pile: ['r6', 'r8'], hand: ['vr', 'r4', 'r7'],
          script: [
            { turn: 'you', wait: 800 }, { play: 'vr' },
            { turn: 1, wait: 500 }, { bot: 1, card: 'roja' }
          ]
        },
        {
          id: 'reb', card: 'reb', title: 'Rebufo', q: '¿Cómo se juega el Rebufo?',
          keys: 'rebufo ritmos altos 5 6 7 8 consecutivos combinacion acompanar acompañado',
          on: 'un Ritmo Bajo, otro Rebufo o con vía libre.',
          text: 'Puedes acompañarlo con <strong>Ritmos Altos</strong> de uno o dos valores consecutivos, con varias copias de cada valor. También puedes jugarlo solo o con otros Rebufos.',
          // Leaflet examples, drawn as cards on the table. bad = index of the card that breaks the rule
          examples: [
            { ok: true, cards: ['reb', 'r6', 'r7'], label: 'Rebufo, 6 y 7' },
            { ok: true, cards: ['reb', 'reb', 'r5', 'r5', 'r5', 'r6', 'r6'], label: 'Dos Rebufos, tres 5 y dos 6' },
            { ok: true, cards: ['reb', 'r5'], label: 'Rebufo y 5' },
            { ok: true, cards: ['reb', 'reb'], label: 'Solo Rebufos' },
            { ok: false, cards: ['reb', 'r6', 'r8'], bad: 2, why: 'No consecutivos', label: 'Rebufo, 6 y 8' },
            { ok: false, cards: ['reb', 'r5', 'r6', 'r7'], bad: 3, why: 'Tres valores', label: 'Rebufo, 5, 6 y 7' },
            { ok: false, cards: ['reb', 'r4'], bad: 1, why: 'Ritmo Bajo', label: 'Rebufo y 4' },
            { ok: false, cards: ['reb', 'vr'], bad: 1, why: 'Carta Especial', label: 'Rebufo y Vuelta Rápida' }
          ],
          then: 'si va solo, se responde con un Ritmo Alto, otro Rebufo, una Bandera Roja, una Bandera a Cuadros o una Vuelta Rápida. Si va acompañado, manda el valor más alto de la combinación.',
          note: 'Ritmos Altos: del 5 al 8.',
          rel: ['encadenar', 'avanzar', 'ama'],
          pile: ['r2'], hand: ['r3', 'reb', 'r6', 'r8', 'r6', 'r3', 'r7'],
          script: [
            { turn: 3, wait: 500 }, { bot: 3, card: 'r4' },
            { turn: 'you', wait: 700 },
            { play: 'reb', wait: 600 }, { play: 'r6', wait: 600 }, { play: 'r6', wait: 600 }, { play: 'r7', wait: 900 },
            { no: ['r8'], wait: 1800 }
          ]
        }
      ]
    }
  ];

  /* Quick reference ("¿Qué puedo jugar encima?"): what the next player can play on each top card.
     Shown as a shortcut at the top of every list, in search and at #que-jugar. Same content as the
     "Qué carta puedo jugar" table in instrucciones/#referencia — keep both in sync.
     Row fields: top (label), sub (optional), card (code, or null for an empty pile), can (HTML), rel (rule id) */
  var REFERENCE = {
    id: 'que-jugar', title: 'Qué carta puedo jugar', q: '¿Qué puedo jugar encima?',
    keys: 'que puedo jugar encima sobre tope arriba pila tabla responder carta siguiente jugador tirar poner referencia rapida',
    lead: 'Busca la carta que está arriba de la pila y mira qué puede jugar el siguiente jugador.',
    rows: [
      { top: 'Vía libre', sub: 'Pila vacía', card: null, can: 'Cualquier carta o combinación válida.', rel: 'via-libre' },
      { top: 'Ritmos Bajos', sub: 'Del 1 al 4', card: 'r2', can: 'Un Ritmo de igual o mayor valor, o <strong>cualquier</strong> Carta Especial.', rel: 'ritmo' },
      { top: 'Ritmos Altos', sub: 'Del 5 al 8', card: 'r7', can: 'Un Ritmo de igual o mayor valor, o cualquier Carta Especial <strong>salvo</strong> el Rebufo y la Bandera Amarilla.', rel: 'ritmo' },
      { top: 'Bandera Amarilla', card: 'ama', can: 'Un Ritmo Bajo, otra Bandera Amarilla, una Bandera Roja o una Bandera a Cuadros.', rel: 'ama' },
      { top: 'Bandera Azul', card: 'azul', can: 'Se responde a la carta que quedó <strong>debajo</strong> de la Azul. Si se jugó con vía libre, hay vía libre.', rel: 'azul' },
      { top: 'Vuelta Rápida', card: 'vr', can: 'Otra Vuelta Rápida, una Bandera Roja o una Bandera a Cuadros.', rel: 'vr' },
      { top: 'Rebufo', sub: 'Solo', card: 'reb', can: 'Un Ritmo Alto, otro Rebufo, una Bandera Roja, una Bandera a Cuadros o una Vuelta Rápida. Si va acompañado, manda el valor más alto de la combinación.', rel: 'reb' }
    ],
    note: 'Después de una Bandera Roja, una Bandera a Cuadros o un Carril Lleno, el siguiente jugador tiene vía libre.'
  };

  root.PintoTutorial = { groups: GROUPS, reference: REFERENCE };
})(this);
