/* PINTO interactive tutorial: content.
   Every rule, example and answer here must be justified by the official rules
   (reglamento). Section references ("ref") point to the rules section a player
   can read afterwards. Card codes: r1–r8 (Cartas de Ritmo), cuad, roja, ama,
   azul, vr (Vuelta Rápida), reb (Rebufo), back (face-down card).
   Avoid situations the rules don't settle clearly (see the PR description). */
(function (root) {
  'use strict';

  var M = [];

  /* ---------- 0. Bienvenida ---------- */
  M.push({
    id: 'bienvenida', num: '0', title: 'Bienvenida', ref: 'Objetivo',
    objective: 'En este módulo aprenderás de qué trata PINTO, cuál es tu objetivo y cómo usar este tutorial.',
    body: [
      'PINTO es un juego de cartas inspirado en las carreras de automovilismo. Cada jugador compite por <strong>cruzar la meta</strong> antes que los demás.',
      'Tu objetivo es deshacerte de todas tus cartas, tanto las de tu mano como las que tienes sobre la mesa. El primer jugador en quedarse sin cartas cruza la meta y obtiene la primera posición.',
      'Los demás jugadores <strong>deben continuar compitiendo</strong> para definir sus posiciones. La partida sigue hasta que solo quede un jugador con cartas, que ocupará la última posición.',
      '<strong>Cómo usar este tutorial:</strong> puedes recorrerlo completo, en orden, o elegir un tema en el menú para aprender o repasar solo esa regla. Tu avance se guarda en este navegador. El botón «Cartas Especiales» te muestra en cualquier momento un resumen de las seis Cartas Especiales.'
    ],
    strip: ['r1', 'r4', 'r8', 'roja', 'vr', 'reb'],
    example: {
      title: 'Una carrera en tres pasos',
      steps: [
        { table: { hidden: 3, visible: ['r6', 'roja', 'r2'] }, hand: ['r3', 'r5', 'ama'], note: 'Empiezas con cartas en tu mano y cartas sobre la mesa: las visibles encima de las ocultas.' },
        { pile: ['r3', 'r5'], table: { hidden: 3, visible: ['r6', 'roja', 'r2'] }, hand: ['ama'], note: 'Durante la carrera juegas tus cartas en la pila central para deshacerte de ellas.' },
        { pile: ['r7', 'r8'], hand: [], note: 'Cuando ya no te queda ninguna carta, ni en la mano ni sobre la mesa, cruzas la meta.' }
      ]
    },
    practice: [
      { type: 'mcq', q: '¿Cuál es tu objetivo en PINTO?', options: ['Deshacerte de todas tus cartas, las de tu mano y las de la mesa.', 'Juntar la mayor cantidad de cartas posible.', 'Deshacerte solo de las cartas de tu mano.'], answer: 0, why: 'Tu objetivo es deshacerte de todas tus cartas, tanto las de tu mano como las que tienes sobre la mesa.', ref: 'Objetivo' },
      { type: 'mcq', q: 'Un jugador cruza la meta en primera posición. ¿Qué hacen los demás?', options: ['La partida termina en ese momento.', 'Deben continuar compitiendo para definir sus posiciones.', 'Se vuelven a repartir las cartas.'], answer: 1, why: 'Los demás jugadores deben continuar compitiendo para definir sus posiciones de llegada.', ref: 'Objetivo' },
      { type: 'mcq', q: '¿Hasta cuándo continúa la partida?', options: ['Hasta que un jugador cruza la meta.', 'Hasta que se acaba la pila central.', 'Hasta que solo queda un jugador con cartas.'], answer: 2, why: 'La partida continúa hasta que solo quede un jugador con cartas disponibles, que ocupará la última posición.', ref: 'Objetivo' }
    ],
    summary: ['Deshazte de todas tus cartas: las de tu mano y las de la mesa.', 'El primero en quedarse sin cartas cruza la meta en primera posición.', 'Los demás siguen compitiendo hasta que solo queda un jugador con cartas.']
  });

  /* ---------- 1. El mazo ---------- */
  M.push({
    id: 'mazo', num: '1', title: 'El mazo', ref: 'Contenido',
    objective: 'En este módulo aprenderás qué cartas trae PINTO y cuántas hay de cada tipo.',
    body: [
      'El mazo contiene <strong>54 cartas</strong>.',
      '<strong>32 Cartas de Ritmo:</strong> 8 cartas numeradas del 1 al 8, con 4 copias de cada número.',
      '<strong>22 Cartas Especiales:</strong> 4 Vueltas Rápidas, 4 Rebufos, 4 Banderas a Cuadros, 4 Banderas Rojas, 4 Banderas Amarillas y 2 Banderas Azules.',
      'La cantidad de Banderas Azules y de Banderas a Cuadros que se usan cambia según el número de jugadores. Lo verás en el módulo «Preparación».'
    ],
    deck: true,
    example: {
      title: 'Contemos el mazo',
      steps: [
        { hand: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8'], note: 'Hay 8 valores de Cartas de Ritmo, con 4 copias de cada uno: 8 × 4 = 32 Cartas de Ritmo.' },
        { hand: ['vr', 'reb', 'cuad', 'roja', 'ama', 'azul'], note: 'Cartas Especiales: 4 + 4 + 4 + 4 + 4 de las cinco primeras, más 2 Banderas Azules = 22.' },
        { hand: [], note: '32 Cartas de Ritmo + 22 Cartas Especiales = 54 cartas en total.' }
      ]
    },
    practice: [
      { type: 'mcq', q: '¿Cuántas cartas de Ritmo 5 trae el mazo?', scene: { hand: ['r5'] }, options: ['1', '4', '8'], answer: 1, why: 'Hay 8 cartas de Ritmo numeradas del 1 al 8, con 4 copias de cada número.', ref: 'Contenido › Cartas de Ritmo' },
      { type: 'mcq', q: '¿Cuántas Banderas Azules trae el mazo?', scene: { hand: ['azul'] }, options: ['2', '4', 'Ninguna'], answer: 0, why: 'Entre las 22 Cartas Especiales hay 2 Banderas Azules.', ref: 'Contenido › Cartas Especiales' },
      { type: 'mcq', q: '¿Cuántas cartas contiene el mazo en total?', options: ['50', '52', '54'], answer: 2, why: 'El mazo contiene 54 cartas: 32 Cartas de Ritmo y 22 Cartas Especiales.', ref: 'Contenido' }
    ],
    summary: ['54 cartas: 32 Cartas de Ritmo y 22 Cartas Especiales.', 'Cartas de Ritmo del 1 al 8, cuatro de cada número.', 'Hay 4 de cada Carta Especial, excepto la Bandera Azul, que tiene 2.']
  });

  /* ---------- 2. Preparación ---------- */
  M.push({
    id: 'preparacion', num: '2', title: 'Preparación', ref: 'Preparación',
    objective: 'En este módulo aprenderás a ajustar el mazo, elegir el sentido del juego y repartir las cartas.',
    body: [
      '<strong>1. Ajusta el mazo.</strong> PINTO admite de 2 a 6 jugadores. Antes de comenzar, prepara el mazo según la tabla. Retira las cartas que no se usarán y baraja las restantes.',
      '<table class="pt-table"><thead><tr><th>Jugadores</th><th>Banderas Azules</th><th>Banderas a Cuadros</th><th>Cartas en juego</th></tr></thead><tbody><tr><td>2</td><td>0</td><td>2</td><td>50</td></tr><tr><td>3-4</td><td>1</td><td>3</td><td>52</td></tr><tr><td>5-6</td><td>2</td><td>4</td><td>54</td></tr></tbody></table>',
      '<strong>2. Define el sentido del juego.</strong> Acuerden si los turnos avanzan en sentido horario o antihorario. Ese sentido se mantiene toda la partida.',
      '<strong>3. Reparte las cartas ocultas.</strong> Cada jugador recibe 3 cartas boca abajo, en una fila frente a él. En partidas de dos jugadores son 5. <strong>Nadie puede mirarlas, ni siquiera su propietario.</strong>',
      '<strong>4. Reparte las cartas visibles.</strong> Cada jugador recibe la misma cantidad de cartas boca arriba, y coloca cada una sobre una de sus cartas ocultas.',
      '<strong>5. Reparte la mano.</strong> Reparte todas las cartas restantes entre los jugadores. Si el reparto no es exacto, algunos tendrán una carta más. Nadie mira su mano hasta que el repartidor dé la señal.'
    ],
    example: {
      title: 'Preparación para 3 jugadores',
      steps: [
        { hand: ['azul', 'cuad', 'cuad', 'cuad'], note: 'Con 3 jugadores se usan 1 Bandera Azul y 3 Banderas a Cuadros. Se retiran las demás y quedan 52 cartas en juego.' },
        { table: { hidden: 3, visible: [] }, note: 'Cada jugador recibe 3 cartas ocultas, boca abajo y en fila.' },
        { table: { hidden: 3, visible: ['r2', 'vr', 'r6'] }, note: 'Encima de cada oculta va una carta visible, boca arriba.' },
        { table: { hidden: 3, visible: ['r2', 'vr', 'r6'] }, hand: ['back', 'back', 'back', 'back', 'back'], note: 'El resto se reparte como mano. Nadie la mira hasta la señal del repartidor.' }
      ]
    },
    practice: [
      { type: 'mcq', q: 'Van a jugar 4 personas. ¿Cuántas Banderas Azules y Banderas a Cuadros usan?', options: ['0 Banderas Azules y 2 Banderas a Cuadros.', '1 Bandera Azul y 3 Banderas a Cuadros.', '2 Banderas Azules y 4 Banderas a Cuadros.'], answer: 1, why: 'Con 3 o 4 jugadores se usan 1 Bandera Azul y 3 Banderas a Cuadros, y quedan 52 cartas en juego.', ref: 'Preparación › Ajusta el mazo' },
      { type: 'mcq', q: 'En una partida de dos jugadores, ¿cuántas cartas ocultas recibe cada jugador?', options: ['3', '4', '5'], answer: 2, why: 'Cada jugador recibe 3 cartas ocultas, pero en partidas de dos jugadores se colocan 5.', ref: 'Preparación › Reparte las cartas ocultas' },
      { type: 'order', q: 'Ordena los pasos de la preparación.', items: ['Ajusta el mazo.', 'Define el sentido del juego.', 'Reparte las cartas ocultas.', 'Reparte las cartas visibles.', 'Reparte la mano.'], why: 'El orden es: ajustar el mazo, definir el sentido, repartir las ocultas, las visibles y, al final, la mano.', ref: 'Preparación' },
      { type: 'yesno', q: '¿Puedes mirar tus propias cartas ocultas durante la preparación?', scene: { table: { hidden: 3, visible: [] } }, answer: false, why: 'Nadie puede mirar las cartas ocultas, ni siquiera su propietario. Permanecen boca abajo hasta que corresponda jugarlas.', ref: 'Preparación › Reparte las cartas ocultas' }
    ],
    summary: ['El número de Banderas Azules y a Cuadros depende de cuántos juegan.', 'Ocultas boca abajo, visibles encima: 3 y 3, o 5 y 5 con dos jugadores.', 'El resto es la mano, y se mira solo cuando el repartidor da la señal.']
  });

  /* ---------- 3. Inicio de la partida ---------- */
  M.push({
    id: 'inicio', num: '3', title: 'Inicio de la partida', ref: 'Inicio de la partida',
    objective: 'En este módulo aprenderás cuándo se miran las cartas y quién comienza la carrera.',
    body: [
      'Cuando el repartidor da la señal, todos miran su mano. En este momento <strong>únicamente</strong> se pueden jugar cartas de la mano: las cartas visibles y ocultas todavía no están disponibles.',
      '<strong>¿Quién comienza?</strong> La carrera comienza con el primer jugador que consiga jugar una carta de Ritmo 1. El primero en colocarla en el centro de la mesa inicia la carrera y completa su primer turno.',
      'Si nadie tiene un Ritmo 1, todos confirman que nadie lo tiene y repiten el proceso con un Ritmo 2, y así sucesivamente.',
      'Después, los turnos siguen el sentido acordado en la preparación.',
      '<strong>Importante:</strong> para decidir quién comienza solo cuentan las cartas de la mano. No se puede jugar una carta de mayor valor mientras no se haya confirmado que nadie tiene una de menor valor.'
    ],
    example: {
      title: 'Nadie tiene un Ritmo 1',
      steps: [
        { hand: ['r2', 'r5', 'roja'], note: 'Revisas tu mano: no tienes un Ritmo 1. Los demás tampoco.' },
        { hand: ['r2', 'r5', 'roja'], note: 'Todos confirman que nadie tiene un Ritmo 1. Ahora se busca un Ritmo 2.' },
        { pile: ['r2'], hand: ['r5', 'roja'], note: 'Tú tienes un Ritmo 2: lo colocas en el centro de la mesa e inicias la carrera.' }
      ]
    },
    practice: [
      { type: 'mcq', q: 'Todos confirmaron que nadie tiene un Ritmo 1 en la mano. ¿Qué carta se busca ahora?', options: ['Un Ritmo 2.', 'Cualquier carta.', 'Una Bandera Roja.'], answer: 0, why: 'Si nadie tiene un Ritmo 1, se repite el proceso con un Ritmo 2, y así sucesivamente.', ref: 'Inicio de la partida › ¿Quién comienza?' },
      { type: 'yesno', q: 'Tienes un Ritmo 1 entre tus cartas visibles, pero no en tu mano. ¿Cuenta para iniciar la carrera?', scene: { table: { hidden: 3, visible: ['r1', 'r6', 'roja'] }, hand: ['r4', 'r7'] }, answer: false, why: 'Para determinar quién comienza, únicamente se consideran las cartas de la mano.', ref: 'Inicio de la partida › Importante' },
      { type: 'yesno', q: 'Tienes un Ritmo 3 en la mano. Todavía no se confirmó que nadie tenga un Ritmo 1 o un Ritmo 2. ¿Puedes jugarlo para iniciar la carrera?', scene: { hand: ['r3', 'r6'] }, answer: false, why: 'No se pueden jugar cartas de mayor valor mientras no se haya confirmado que nadie tiene una carta de menor valor.', ref: 'Inicio de la partida › Importante' }
    ],
    summary: ['Al principio solo cuentan las cartas de la mano.', 'Comienza quien juegue primero un Ritmo 1; si nadie lo tiene, se busca el 2, y así.', 'Luego los turnos siguen el sentido acordado.']
  });

  /* ---------- 4. Cartas de Ritmo ---------- */
  M.push({
    id: 'ritmo', num: '4', title: 'Cartas de Ritmo', ref: 'Cartas de Ritmo',
    objective: 'En este módulo aprenderás los valores de Ritmo, la regla de igual o mayor valor y qué son los Ritmos Bajos y los Ritmos Altos.',
    body: [
      'Las Cartas de Ritmo representan la velocidad de los jugadores durante la carrera. Tienen valores del 1 al 8.',
      '<strong>Regla general:</strong> cuando la carta superior de la pila central es una carta de Ritmo, debes jugar otra carta de Ritmo de <strong>igual o mayor valor</strong>.',
      'Se dividen en dos categorías: <strong>Ritmos Bajos</strong>, del 1 al 4, y <strong>Ritmos Altos</strong>, del 5 al 8.',
      'Algunas Cartas Especiales funcionan de forma distinta con estas categorías. Lo verás en cada una.'
    ],
    groups: [{ label: 'Ritmos Bajos', cards: ['r1', 'r2', 'r3', 'r4'] }, { label: 'Ritmos Altos', cards: ['r5', 'r6', 'r7', 'r8'] }],
    example: {
      title: 'Igual o mayor valor',
      steps: [
        { pile: ['r3'], hand: ['r3', 'r6', 'r2'], note: 'La carta superior de la pila es un Ritmo 3.' },
        { pile: ['r3', 'r3'], hand: ['r6', 'r2'], note: 'Puedes jugar un Ritmo 3, porque es igual.' },
        { pile: ['r3', 'r3', 'r6'], hand: ['r2'], note: 'También valía un Ritmo 6, porque es mayor. Ahora la carta superior es un Ritmo 6.' },
        { pile: ['r3', 'r3', 'r6'], hand: ['r2'], note: 'Un Ritmo 2 no se puede jugar sobre el Ritmo 6: es menor.' }
      ]
    },
    practice: [
      { type: 'yesno', q: '¿Puedes jugar esta carta?', scene: { pile: ['r5'], card: 'r5' }, answer: true, why: 'Puedes jugar una carta de Ritmo de igual o mayor valor. Un 5 es igual a 5.', ref: 'Cartas de Ritmo' },
      { type: 'yesno', q: '¿Puedes jugar esta carta?', scene: { pile: ['r6'], card: 'r4' }, answer: false, why: 'Sobre una carta de Ritmo debes jugar otra de igual o mayor valor. Un 4 es menor que 6.', ref: 'Cartas de Ritmo' },
      { type: 'choose', q: 'La carta superior es un Ritmo 4. Elige todas las cartas que puedes jugar.', pile: ['r4'], hand: ['r2', 'r4', 'r7', 'r1'], valid: [1, 2], why: 'Valen las cartas de Ritmo de igual o mayor valor: el 4 y el 7. El 1 y el 2 son menores.', ref: 'Cartas de Ritmo' },
      { type: 'mcq', q: '¿Qué valores son Ritmos Altos?', options: ['Del 1 al 4.', 'Del 5 al 8.', 'Solo el 8.'], answer: 1, why: 'Los Ritmos Bajos son del 1 al 4 y los Ritmos Altos, del 5 al 8.', ref: 'Cartas de Ritmo' }
    ],
    summary: ['Sobre una carta de Ritmo juegas otra de igual o mayor valor.', 'Ritmos Bajos: del 1 al 4. Ritmos Altos: del 5 al 8.', 'Las Cartas Especiales tienen sus propias condiciones.']
  });

  /* ---------- 5. Desarrollo de la partida ---------- */
  M.push({
    id: 'desarrollo', num: '5', title: 'Desarrollo de la partida', ref: 'Desarrollo de la partida', prereq: ['ritmo'],
    objective: 'En este módulo aprenderás a mantener el ritmo, a ceder el paso y qué es la vía libre.',
    body: [
      'En cada turno debes <strong>mantener el ritmo</strong> jugando tus cartas o, si no puedes, recoger la pila y <strong>ceder el paso</strong>.',
      '<strong>Mantener el ritmo:</strong> juega una carta válida sobre la carta superior de la pila. Por regla general, una carta de Ritmo de valor igual o mayor. Las Cartas Especiales permiten hacer excepciones a esta regla.',
      '<strong>Ceder el paso:</strong> si no puedes jugar ninguna carta cuando te toca, recoges todas las cartas de la pila central y las añades a tu mano. Tu turno termina inmediatamente y el siguiente jugador tiene vía libre.',
      '<strong>Vía libre:</strong> cuando la pila central está vacía, o una carta concede vía libre, el siguiente jugador puede iniciar una nueva secuencia con <strong>cualquier</strong> carta o combinación válida.'
    ],
    example: {
      title: 'Ceder el paso',
      steps: [
        { pile: ['r4', 'r7'], hand: ['r2', 'r5'], note: 'La carta superior es un Ritmo 7. Tienes un Ritmo 2 y un Ritmo 5: no puedes jugar ninguno.' },
        { pile: [], hand: ['r2', 'r5', 'r4', 'r7'], note: 'Cedes el paso: recoges todas las cartas de la pila central y las añades a tu mano. Tu turno termina.' },
        { pile: ['r1'], hand: ['r2', 'r5', 'r4', 'r7'], note: 'El siguiente jugador tiene vía libre: puede empezar con cualquier carta, por ejemplo un Ritmo 1.' }
      ]
    },
    practice: [
      { type: 'mcq', q: 'La carta superior es un Ritmo 7. En tu mano solo tienes un Ritmo 2 y un Ritmo 5. ¿Qué haces?', scene: { pile: ['r7'], hand: ['r2', 'r5'] }, options: ['Juego el Ritmo 5.', 'Cedo el paso: recojo todas las cartas de la pila central.', 'Paso sin recoger nada.'], answer: 1, why: 'Si no puedes realizar una jugada válida, debes ceder el paso: recoger todas las cartas de la pila central y añadirlas a tu mano.', ref: 'Desarrollo de la partida › Ceder el paso' },
      { type: 'mcq', q: 'Acabas de ceder el paso. ¿Qué tiene el siguiente jugador?', options: ['Vía libre.', 'Debe superar el valor de la última carta.', 'Pierde su turno.'], answer: 0, why: 'Al ceder el paso tu turno termina inmediatamente y el siguiente jugador tiene vía libre.', ref: 'Desarrollo de la partida › Ceder el paso' },
      { type: 'yesno', q: 'La pila central está vacía. ¿Puedes jugar esta carta?', scene: { pile: [], card: 'r1' }, answer: true, why: 'Cuando la pila central está vacía hay vía libre: puedes iniciar una nueva secuencia con cualquier carta o combinación válida.', ref: 'Desarrollo de la partida › Vía Libre' }
    ],
    summary: ['Mantener el ritmo: juega una carta válida sobre la carta superior.', 'Si no puedes jugar ninguna, cedes el paso y recoges toda la pila central.', 'Con vía libre puedes empezar con cualquier carta o combinación válida.']
  });

  /* ---------- 6. Fases de la carrera ---------- */
  M.push({
    id: 'fases', num: '6', title: 'Fases de la carrera', ref: 'Desarrollo de la partida › Fases de la carrera', prereq: ['desarrollo'],
    objective: 'En este módulo aprenderás las tres fases de la carrera, su orden y cómo pasar de una a otra.',
    body: [
      'Para terminar la carrera debes deshacerte de todas tus cartas completando tres fases, en orden: primero las <strong>cartas en mano</strong>, después las <strong>cartas visibles</strong> y, por último, las <strong>cartas ocultas</strong>.',
      'Debes completar cada fase antes de pasar a la siguiente. Si terminas una fase durante tu turno y puedes seguir jugando según las reglas, avanzas inmediatamente a la siguiente, sin esperar tu próximo turno.',
      '<strong>Primera fase, cartas en mano:</strong> juega las cartas de tu mano hasta quedarte sin ninguna.',
      '<strong>Segunda fase, cartas visibles:</strong> toma tus cartas visibles. Pasan a formar parte de tu mano y te deshaces de ellas con las mismas reglas.',
      '<strong>Tercera fase, cartas ocultas:</strong> toma una única carta oculta a la vez y agrégala a tu mano. Si se puede jugar cumpliendo las reglas, puedes jugarla sin ningún problema. Al deshacerte de ella, puedes tomar otra carta oculta inmediatamente para intentar encadenar jugadas.',
      '<strong>Nota:</strong> la regla de ceder el paso aplica en cualquier fase. Siempre que recojas las cartas de la pila, deberás deshacerte de todas para poder continuar.'
    ],
    example: {
      title: 'De la mano a las ocultas',
      steps: [
        { pile: ['r3', 'r5'], table: { hidden: 3, visible: ['r6', 'r7', 'roja'] }, hand: [], note: 'Jugaste la última carta de tu mano. Terminaste la primera fase.' },
        { pile: ['r3', 'r5'], table: { hidden: 3, visible: [] }, hand: ['r6', 'r7', 'roja'], note: 'Tomas tus cartas visibles: ahora forman parte de tu mano.' },
        { pile: ['r6', 'r7', 'r8'], table: { hidden: 3, visible: [] }, hand: [], note: 'Cuando te deshaces de todas, empieza la tercera fase.' },
        { pile: ['r6', 'r7', 'r8'], table: { hidden: 2, visible: [] }, hand: ['r8'], note: 'Tomas una única carta oculta y la agregas a tu mano. Es un Ritmo 8: se puede jugar sobre el 8.' },
        { pile: ['r7', 'r8', 'r8'], table: { hidden: 2, visible: [] }, hand: [], note: 'La juegas. Al deshacerte de ella puedes tomar otra carta oculta para intentar encadenar.' }
      ]
    },
    practice: [
      { type: 'order', q: 'Ordena las fases de la carrera.', items: ['Cartas en mano.', 'Cartas visibles.', 'Cartas ocultas.'], why: 'Primero juegas las cartas de tu mano, después las cartas visibles y, por último, las cartas ocultas.', ref: 'Fases de la carrera' },
      { type: 'yesno', q: 'Todavía te quedan cartas en la mano. ¿Puedes jugar una de tus cartas visibles?', scene: { table: { hidden: 3, visible: ['r6', 'r7', 'roja'] }, hand: ['r2'] }, answer: false, why: 'Debes completar cada fase antes de avanzar a la siguiente. Las visibles se toman cuando terminaste todas las cartas de tu mano.', ref: 'Fases de la carrera' },
      { type: 'mcq', q: 'Estás en la tercera fase. ¿Cuántas cartas ocultas tomas a la vez?', scene: { table: { hidden: 3, visible: [] } }, options: ['Una única carta.', 'Dos cartas.', 'Todas las que quedan.'], answer: 0, why: 'En la fase de cartas ocultas tomas una única carta oculta a la vez y la agregas a tu mano.', ref: 'Fases de la carrera › Tercera fase: Cartas ocultas' },
      { type: 'mcq', q: 'Estás en la fase de cartas visibles y tienes que recoger la pila central. ¿Qué debes hacer para poder continuar?', options: ['Deshacerte de todas las cartas de tu mano, incluidas las de la pila.', 'Pasar directo a las cartas ocultas.', 'Devolver la pila al centro.'], answer: 0, why: 'La regla de ceder el paso aplica a cualquier fase: siempre que recojas la pila, deberás deshacerte de todas esas cartas para continuar.', ref: 'Fases de la carrera › Nota' }
    ],
    summary: ['Tres fases, en orden: mano, visibles y ocultas.', 'Las ocultas se toman de una en una y pasan a tu mano.', 'Si terminas una fase y puedes seguir jugando, avanzas en el mismo turno.']
  });

  /* ---------- 7. Tu turno ---------- */
  M.push({
    id: 'turno', num: '7', title: 'Tu turno', ref: 'Reglas de Carrera › Desarrollo del turno', prereq: ['desarrollo'],
    objective: 'En este módulo aprenderás cómo juegas tu turno, cuándo termina y cómo te pueden interrumpir.',
    body: [
      'Si tienes cartas válidas, tu turno comienza cuando colocas tu primera carta. Puedes colocar tantas cartas como permitan las reglas, juntas o una después de otra.',
      '<strong>Interrupción:</strong> una vez que jugaste al menos una carta, el siguiente jugador puede interrumpir tu turno colocando una carta o combinación válida sobre la carta superior de la pila. Cuando te interrumpe, tu turno termina inmediatamente y él pasa a jugar su turno.',
      'Si nadie te interrumpe y no ocurre ningún efecto que termine el turno, puedes seguir jugando o dar por terminado tu turno.',
      'Algunas cartas o efectos terminan el turno inmediatamente, como la Bandera Roja, la Bandera a Cuadros y el Carril Lleno.'
    ],
    example: {
      title: 'Te interrumpen',
      steps: [
        { pile: ['r2', 'r4'], hand: ['r4', 'r6'], note: 'Juegas un Ritmo 4. Todavía tienes otro Ritmo 4 que podrías jugar.' },
        { pile: ['r2', 'r4', 'r6'], hand: ['r4', 'r6'], note: 'Antes de que lo juegues, el siguiente jugador coloca un Ritmo 6, una carta válida sobre tu 4.' },
        { pile: ['r2', 'r4', 'r6'], hand: ['r4', 'r6'], note: 'Te interrumpió: tu turno termina inmediatamente y él juega su turno.' }
      ]
    },
    practice: [
      { type: 'mcq', q: 'Jugaste un Ritmo 4. Antes de que juegues otra carta, el siguiente jugador coloca un Ritmo 6 sobre la pila. ¿Qué pasa?', scene: { pile: ['r4', 'r6'] }, options: ['Tu turno termina y él pasa a jugar su turno.', 'Sigues jugando como si nada.', 'Él debe recoger la pila.'], answer: 0, why: 'Cuando un jugador te interrumpe con una carta válida, tu turno termina inmediatamente y él pasa a jugar su turno.', ref: 'Reglas de Carrera › Desarrollo del turno' },
      { type: 'mcq', q: 'Nadie te interrumpió y ninguna carta terminó tu turno. ¿Qué puedes hacer?', options: ['Seguir jugando o dar por terminado tu turno.', 'Solo dar por terminado tu turno.', 'Recoger la pila.'], answer: 0, why: 'Si nadie interrumpe y no ocurre ningún efecto que termine el turno, puedes continuar jugando o dar por terminado tu turno.', ref: 'Reglas de Carrera › Desarrollo del turno' },
      { type: 'mcq', q: 'Juegas una Bandera Roja. ¿Qué pasa con tu turno?', scene: { pile: ['r5', 'roja'] }, options: ['Termina inmediatamente.', 'Puedes seguir jugando Ritmos.', 'Vuelve a empezar.'], answer: 0, why: 'La Bandera Roja, la Bandera a Cuadros y el Carril Lleno terminan el turno inmediatamente.', ref: 'Reglas de Carrera › Desarrollo del turno' }
    ],
    summary: ['Puedes jugar varias cartas, juntas o una tras otra.', 'Cuando ya jugaste una carta, el siguiente puede interrumpirte con una jugada válida.', 'La Bandera Roja, la Bandera a Cuadros y el Carril Lleno terminan tu turno.']
  });

  /* ---------- 8. Encadenar cartas ---------- */
  M.push({
    id: 'encadenar', num: '8', title: 'Encadenar cartas', ref: 'Reglas de Carrera › Encadenar cartas', prereq: ['ritmo', 'fases'],
    objective: 'En este módulo aprenderás a jugar varias cartas iguales juntas, qué pasa al encadenar Cartas Especiales y cómo avanzar de fase en el mismo turno.',
    body: [
      'Puedes jugar dos o más cartas en una misma jugada si son <strong>iguales</strong>: del mismo valor de Ritmo o del mismo tipo de Carta Especial. Por ejemplo, varias cartas de Ritmo 3, varias Banderas Rojas o varias Vueltas Rápidas.',
      'Encadenar cartas no es obligatorio, pero te ayuda a deshacerte de varias cartas en un mismo turno.',
      'Cuando encadenas Cartas Especiales, su efecto se aplica <strong>una sola vez</strong>, como si jugaras una sola carta. Si juegas tres Banderas Rojas juntas, el siguiente jugador obtiene vía libre, igual que con una sola.',
      'No puedes combinar cartas de distinto valor o tipo, salvo con el Rebufo, que tiene sus propias reglas de combinación.',
      '<strong>Importante:</strong> la Bandera a Cuadros es la única excepción: no se puede encadenar.',
      '<strong>Avanzar entre fases:</strong> en un mismo turno puedes completar más de una fase, si terminaste por completo la anterior y puedes seguir jugando según las reglas de «Encadenar cartas» o las del Rebufo. Por ejemplo, si terminas tu mano con un Ritmo 4 y tienes un Ritmo 4 entre tus cartas visibles, puedes seguir jugando de inmediato desde esa fase. Y si al terminar tus visibles tomas tu primera carta oculta y es un valor permitido, puedes jugarla en ese momento.'
    ],
    ref2: 'Reglas de Carrera › Avanzar entre fases',
    example: {
      title: 'Tres cartas de una vez',
      steps: [
        { pile: ['r2'], hand: ['r3', 'r3', 'r3', 'r8'], note: 'La carta superior es un Ritmo 2. Tienes tres cartas de Ritmo 3.' },
        { pile: ['r2', 'r3', 'r3', 'r3'], hand: ['r8'], note: 'Las juegas juntas en una misma jugada: son del mismo valor.' },
        { pile: ['r2', 'r3', 'r3', 'r3'], table: { hidden: 3, visible: ['r3', 'r6', 'vr'] }, hand: ['r8'], note: 'Si esa hubiera sido tu última carta de la mano y tuvieras un Ritmo 3 entre tus visibles, podrías seguir jugándolo en el mismo turno.' }
      ]
    },
    practice: [
      { type: 'mcq', q: 'Tienes vía libre. ¿Qué cartas puedes jugar juntas en una misma jugada?', scene: { pile: [] }, options: ['Ritmo 3 + Ritmo 3.', 'Ritmo 3 + Ritmo 4.', 'Bandera Roja + Bandera Amarilla.'], answer: 0, why: 'Solo puedes jugar juntas cartas iguales: del mismo valor de Ritmo o del mismo tipo de Carta Especial.', ref: 'Reglas de Carrera › Encadenar cartas' },
      { type: 'mcq', q: 'Juegas tres Banderas Rojas juntas. ¿Cuántas veces se aplica su efecto?', scene: { pile: ['r6', 'roja', 'roja', 'roja'] }, options: ['Una sola vez.', 'Tres veces.', 'Ninguna.'], answer: 0, why: 'Cuando encadenas Cartas Especiales, su efecto se aplica una sola vez, como si hubieras jugado una única carta.', ref: 'Reglas de Carrera › Encadenar cartas' },
      { type: 'yesno', q: '¿Puedes encadenar dos Banderas a Cuadros en una misma jugada?', scene: { hand: ['cuad', 'cuad'] }, answer: false, why: 'La Bandera a Cuadros es la única excepción: no se puede encadenar.', ref: 'Reglas de Carrera › Encadenar cartas › Importante' },
      { type: 'mcq', q: 'Terminas tu mano jugando un Ritmo 4. Entre tus cartas visibles hay un Ritmo 4. ¿Qué puedes hacer?', scene: { pile: ['r4'], table: { hidden: 3, visible: ['r4', 'r2', 'ama'] }, hand: [] }, options: ['Seguir jugando ese Ritmo 4 de inmediato.', 'Esperar a tu siguiente turno.', 'Ceder el paso.'], answer: 0, why: 'Si terminaste por completo una fase y puedes seguir jugando según las reglas de «Encadenar cartas», puedes continuar desde la siguiente fase sin esperar tu siguiente turno.', ref: 'Reglas de Carrera › Avanzar entre fases' }
    ],
    summary: ['Puedes jugar juntas varias cartas iguales.', 'Las Cartas Especiales encadenadas aplican su efecto una sola vez.', 'La Bandera a Cuadros no se encadena.']
  });

  /* ---------- 9. Carril Lleno ---------- */
  M.push({
    id: 'carril', num: '9', title: 'Carril Lleno', ref: 'Reglas de Carrera › Carril Lleno', prereq: ['encadenar'],
    objective: 'En este módulo aprenderás cuándo se produce un Carril Lleno y qué pasa después.',
    body: [
      'Cuando se colocan <strong>cuatro cartas consecutivas iguales</strong> en la pila central, se produce un Carril Lleno. Deben estar seguidas, sin que otra carta interrumpa la secuencia. No importa si las jugaron uno o varios jugadores.',
      'El Carril Lleno se produce en el momento en que se coloca la cuarta carta. La pila central se retira definitivamente de la partida y el turno del jugador que lo completó termina.',
      'El siguiente jugador obtiene vía libre.',
      '<strong>Importante:</strong> la Bandera Azul interrumpe cualquier secuencia en curso. Las cartas que se colocan después de ella comienzan una nueva secuencia.'
    ],
    example: {
      title: 'Cuatro Ritmos 5 seguidos',
      steps: [
        { pile: ['r2', 'r5'], note: 'Un jugador coloca un Ritmo 5.' },
        { pile: ['r2', 'r5', 'r5', 'r5'], note: 'Los dos siguientes jugadores también colocan, cada uno, un Ritmo 5.' },
        { pile: ['r2', 'r5', 'r5', 'r5', 'r5'], hand: ['r8'], note: 'Tú colocas el cuarto Ritmo 5 seguido: ¡Carril Lleno!' },
        { pile: [], hand: ['r8'], note: 'La pila central se retira definitivamente, tu turno termina y el siguiente jugador obtiene vía libre.' }
      ]
    },
    practice: [
      { type: 'mcq', q: 'Tres jugadores colocaron, uno tras otro, un Ritmo 5 cada uno. Ahora tú colocas otro Ritmo 5. ¿Qué pasa?', scene: { pile: ['r5', 'r5', 'r5'], card: 'r5' }, options: ['Carril Lleno: la pila se retira, tu turno termina y el siguiente tiene vía libre.', 'Nada especial: el siguiente debe jugar un 5 o más.', 'Recoges la pila central.'], answer: 0, why: 'Cuatro cartas consecutivas iguales producen un Carril Lleno: la pila central se retira definitivamente, tu turno termina y el siguiente jugador obtiene vía libre.', ref: 'Reglas de Carrera › Carril Lleno' },
      { type: 'yesno', q: 'En la pila hay, en este orden: Ritmo 6, Ritmo 6, Bandera Azul y Ritmo 6. Tú colocas otro Ritmo 6. ¿Se produce un Carril Lleno?', scene: { pile: ['r6', 'r6', 'azul', 'r6'], card: 'r6' }, answer: false, why: 'La Bandera Azul interrumpe cualquier secuencia. Las cartas colocadas después de ella comienzan una nueva secuencia: solo hay dos Ritmos 6 seguidos.', ref: 'Reglas de Carrera › Carril Lleno › Importante' },
      { type: 'mcq', q: 'Cuatro cartas de Ritmo 7 quedaron seguidas en la pila, pero las jugaron jugadores distintos. ¿Cuenta como Carril Lleno?', options: ['Sí, no importa si fueron jugadas por uno o varios jugadores.', 'No, deben ser de un mismo jugador.', 'Solo si las jugaron en la misma ronda.'], answer: 0, why: 'Las cuatro cartas deben estar seguidas en la pila central, y no importa si fueron jugadas por uno o varios jugadores.', ref: 'Reglas de Carrera › Carril Lleno' }
    ],
    summary: ['Cuatro cartas iguales seguidas en la pila central son un Carril Lleno.', 'La pila se retira, el turno de quien lo completó termina y el siguiente tiene vía libre.', 'Una Bandera Azul corta la secuencia.']
  });

  /* ---------- 10. Cartas Especiales ---------- */
  var SPECIALS = [];

  SPECIALS.push({
    id: 'cuadros', num: '10.1', title: 'Bandera a Cuadros', card: 'cuad', ref: 'Cartas Especiales › Bandera a Cuadros', prereq: ['desarrollo'],
    objective: 'En este submódulo aprenderás cuándo jugar la Bandera a Cuadros y qué pasa con la pila central.',
    rules: {
      cuando: 'Puede jugarse sobre cualquier carta o cuando tienes vía libre.',
      efecto: 'Cierra la etapa. Todas las cartas de la pila central se retiran definitivamente de la partida, incluida la Bandera a Cuadros.',
      despues: 'El siguiente jugador obtiene vía libre.',
      importante: 'Solo puedes jugar una Bandera a Cuadros por turno. Al colocarla, tu turno termina inmediatamente.'
    },
    example: {
      title: 'Cerrar la etapa',
      steps: [
        { pile: ['r4', 'r7', 'vr'], hand: ['cuad', 'r2'], note: 'La carta superior es una Vuelta Rápida. Tienes una Bandera a Cuadros.' },
        { pile: ['r4', 'r7', 'vr', 'cuad'], hand: ['r2'], note: 'La juegas: se puede jugar sobre cualquier carta.' },
        { pile: [], hand: ['r2'], note: 'Todas las cartas de la pila se retiran de la partida, incluida la Bandera a Cuadros. Tu turno termina y el siguiente tiene vía libre.' }
      ]
    },
    practice: [
      { type: 'yesno', q: '¿Puedes jugar esta carta?', scene: { pile: ['vr'], card: 'cuad' }, answer: true, why: 'La Bandera a Cuadros puede jugarse sobre cualquier carta o cuando tienes vía libre.', ref: 'Cartas Especiales › Bandera a Cuadros' },
      { type: 'mcq', q: 'Juegas una Bandera a Cuadros. ¿Qué pasa con las cartas de la pila central?', options: ['Se retiran definitivamente de la partida, incluida la Bandera a Cuadros.', 'Se quedan en la pila.', 'Las recoges y pasan a tu mano.'], answer: 0, why: 'La Bandera a Cuadros cierra la etapa: todas las cartas de la pila central se retiran definitivamente, incluida ella.', ref: 'Cartas Especiales › Bandera a Cuadros' },
      { type: 'mcq', q: 'Después de tu Bandera a Cuadros, ¿qué obtiene el siguiente jugador?', options: ['Vía libre.', 'Debe jugar un Ritmo Alto.', 'Pierde su turno.'], answer: 0, why: 'Después de la Bandera a Cuadros, el siguiente jugador obtiene vía libre.', ref: 'Cartas Especiales › Bandera a Cuadros' }
    ],
    summary: ['Se juega sobre cualquier carta o con vía libre.', 'Retira de la partida toda la pila central, incluida ella misma.', 'Una por turno: al colocarla, tu turno termina.']
  });

  SPECIALS.push({
    id: 'roja', num: '10.2', title: 'Bandera Roja', card: 'roja', ref: 'Cartas Especiales › Bandera Roja', prereq: ['desarrollo'],
    objective: 'En este submódulo aprenderás a reiniciar el ritmo con la Bandera Roja.',
    rules: {
      cuando: 'Puede jugarse sobre cualquier carta o cuando tienes vía libre.',
      efecto: 'Permite reiniciar el ritmo de la carrera sin descartar la pila central. A diferencia de la Bandera a Cuadros, las cartas permanecen en la pila y no se retiran de la partida.',
      despues: 'El siguiente jugador obtiene vía libre.'
    },
    example: {
      title: 'Reiniciar el ritmo',
      steps: [
        { pile: ['r5', 'r8'], hand: ['roja', 'r3'], note: 'La carta superior es un Ritmo 8. Tienes una Bandera Roja.' },
        { pile: ['r5', 'r8', 'roja'], hand: ['r3'], note: 'La juegas: se puede jugar sobre cualquier carta. Las cartas de la pila se quedan donde están.' },
        { pile: ['r5', 'r8', 'roja', 'r2'], hand: ['r3'], note: 'El siguiente jugador tiene vía libre: puede jugar cualquier carta, por ejemplo un Ritmo 2.' }
      ]
    },
    practice: [
      { type: 'yesno', q: '¿Puedes jugar esta carta?', scene: { pile: ['r8'], card: 'roja' }, answer: true, why: 'La Bandera Roja puede jugarse sobre cualquier carta o cuando tienes vía libre.', ref: 'Cartas Especiales › Bandera Roja' },
      { type: 'mcq', q: 'Juegas una Bandera Roja. ¿Qué pasa con las cartas de la pila central?', options: ['Permanecen en la pila.', 'Se retiran de la partida.', 'Las recoge el siguiente jugador.'], answer: 0, why: 'A diferencia de la Bandera a Cuadros, con la Bandera Roja las cartas permanecen en la pila y no se retiran de la partida.', ref: 'Cartas Especiales › Bandera Roja' },
      { type: 'mcq', q: 'Después de tu Bandera Roja, ¿qué obtiene el siguiente jugador?', options: ['Vía libre.', 'Debe jugar otra Bandera Roja.', 'Debe jugar un Ritmo Bajo.'], answer: 0, why: 'Después de la Bandera Roja, el siguiente jugador obtiene vía libre.', ref: 'Cartas Especiales › Bandera Roja' }
    ],
    summary: ['Se juega sobre cualquier carta o con vía libre.', 'Reinicia el ritmo sin descartar la pila.', 'El siguiente jugador obtiene vía libre.']
  });

  SPECIALS.push({
    id: 'amarilla', num: '10.3', title: 'Bandera Amarilla', card: 'ama', ref: 'Cartas Especiales › Bandera Amarilla', prereq: ['ritmo'],
    objective: 'En este submódulo aprenderás cuándo jugar la Bandera Amarilla y cómo debe responder el siguiente jugador.',
    rules: {
      cuando: 'Puedes jugarla sobre un Ritmo Bajo (1, 2, 3 o 4), sobre otra Bandera Amarilla o cuando tienes vía libre. No puedes jugarla sobre Ritmos Altos, Rebufos ni Vueltas Rápidas.',
      efecto: 'Obliga al siguiente jugador a responder con una de estas opciones: un Ritmo Bajo (1, 2, 3 o 4), una Bandera Roja, una Bandera a Cuadros u otra Bandera Amarilla.',
      despues: 'Cuando el siguiente jugador responde con una de esas opciones, el efecto de la Bandera Amarilla termina y el juego sigue con normalidad: los siguientes jugadores vuelven a aplicar la regla general de Ritmo o el efecto de la carta que se haya jugado. Si no tiene ninguna respuesta válida, debe ceder el paso y recoger toda la pila central.'
    },
    example: {
      title: 'Obligar a bajar el ritmo',
      steps: [
        { pile: ['r1', 'r3'], hand: ['ama', 'r7'], note: 'La carta superior es un Ritmo 3, un Ritmo Bajo. Puedes jugar tu Bandera Amarilla.' },
        { pile: ['r1', 'r3', 'ama'], hand: ['r7'], note: 'La juegas. El siguiente jugador debe responder con un Ritmo Bajo, una Bandera Roja, una Bandera a Cuadros u otra Bandera Amarilla.' },
        { pile: ['r1', 'r3', 'ama', 'r2'], hand: ['r7'], note: 'Responde con un Ritmo 2. El efecto termina y el juego sigue con la regla general de Ritmo.' }
      ]
    },
    practice: [
      { type: 'yesno', q: '¿Puedes jugar esta carta?', scene: { pile: ['r3'], card: 'ama' }, answer: true, why: 'Puedes jugar la Bandera Amarilla sobre un Ritmo Bajo (1, 2, 3 o 4).', ref: 'Cartas Especiales › Bandera Amarilla' },
      { type: 'yesno', q: '¿Puedes jugar esta carta?', scene: { pile: ['r6'], card: 'ama' }, answer: false, why: 'No puedes jugar la Bandera Amarilla sobre Ritmos Altos, Rebufos ni Vueltas Rápidas.', ref: 'Cartas Especiales › Bandera Amarilla' },
      { type: 'choose', q: 'La carta superior es una Bandera Amarilla. Elige todas las cartas con las que puedes responder.', pile: ['ama'], hand: ['r2', 'r6', 'roja', 'vr', 'cuad', 'ama'], valid: [0, 2, 4, 5], why: 'Ante una Bandera Amarilla solo puedes responder con un Ritmo Bajo, una Bandera Roja, una Bandera a Cuadros u otra Bandera Amarilla. El Ritmo 6 y la Vuelta Rápida no valen.', ref: 'Cartas Especiales › Bandera Amarilla' },
      { type: 'mcq', q: 'El siguiente jugador respondió a tu Bandera Amarilla con un Ritmo 3. ¿Qué pasa con el efecto?', scene: { pile: ['ama', 'r3'] }, options: ['Termina, y el juego sigue con normalidad.', 'Sigue activo para todos los jugadores.', 'El siguiente debe jugar otra Bandera Amarilla.'], answer: 0, why: 'Cuando el siguiente jugador responde con una opción válida, el efecto de la Bandera Amarilla termina y el juego continúa con normalidad.', ref: 'Cartas Especiales › Bandera Amarilla' }
    ],
    summary: ['Se juega sobre un Ritmo Bajo, otra Bandera Amarilla o con vía libre.', 'El siguiente responde con un Ritmo Bajo, una Bandera Roja, una Bandera a Cuadros u otra Bandera Amarilla.', 'Si no puede, cede el paso y recoge la pila.']
  });

  SPECIALS.push({
    id: 'azul', num: '10.4', title: 'Bandera Azul', card: 'azul', ref: 'Cartas Especiales › Bandera Azul', prereq: ['desarrollo'],
    objective: 'En este submódulo aprenderás a saltar el turno de otro jugador con la Bandera Azul.',
    rules: {
      cuando: 'Puedes jugarla sobre una carta de Ritmo, sobre otra Bandera Azul o cuando tienes vía libre. No puedes jugarla sobre una Bandera Amarilla, un Rebufo ni una Vuelta Rápida.',
      efecto: 'Salta el turno del siguiente jugador activo en carrera. Si el jugador que debería ser saltado ya cruzó la meta, el efecto se aplica al siguiente que todavía esté en carrera. La pila central permanece intacta.',
      despues: 'El jugador saltado pierde su turno. El siguiente juega como si la Bandera Azul no estuviera en la pila y responde a la carta que quedó debajo de ella. Si la Bandera Azul se jugó con vía libre, ese jugador también obtiene vía libre.',
      importante: 'La Bandera Azul no se usa en partidas de dos jugadores.'
    },
    example: {
      title: 'Saltar un turno',
      steps: [
        { pile: ['r2', 'r4'], hand: ['azul'], note: 'Juegan Ana, Beto y Carla, en ese orden. Ana tiene una Bandera Azul y la carta superior es un Ritmo 4.' },
        { pile: ['r2', 'r4', 'azul'], hand: [], note: 'Ana juega la Bandera Azul sobre el Ritmo 4. Beto, el siguiente, pierde su turno.' },
        { pile: ['r2', 'r4', 'azul', 'r5'], hand: [], note: 'Carla juega como si la Bandera Azul no estuviera y responde al Ritmo 4: por ejemplo, con un Ritmo 5.' }
      ]
    },
    practice: [
      { type: 'yesno', q: '¿Puedes jugar esta carta?', scene: { pile: ['r7'], card: 'azul' }, answer: true, why: 'Puedes jugar la Bandera Azul sobre una carta de Ritmo, otra Bandera Azul o cuando tienes vía libre.', ref: 'Cartas Especiales › Bandera Azul' },
      { type: 'yesno', q: '¿Puedes jugar esta carta?', scene: { pile: ['ama'], card: 'azul' }, answer: false, why: 'No puedes jugar la Bandera Azul sobre una Bandera Amarilla, un Rebufo ni una Vuelta Rápida.', ref: 'Cartas Especiales › Bandera Azul' },
      { type: 'mcq', q: 'Juegan Ana, Beto y Carla, en ese orden. Ana juega una Bandera Azul sobre un Ritmo 4. ¿Qué pasa?', scene: { pile: ['r4', 'azul'] }, options: ['Beto pierde su turno y Carla responde al Ritmo 4.', 'Beto debe responder a la Bandera Azul.', 'Carla tiene que recoger la pila.'], answer: 0, why: 'El jugador saltado pierde su turno y el siguiente juega como si la Bandera Azul no estuviera, respondiendo a la carta que quedó debajo de ella.', ref: 'Cartas Especiales › Bandera Azul' },
      { type: 'mcq', q: '¿Se usa la Bandera Azul en una partida de dos jugadores?', options: ['No.', 'Sí, una.', 'Sí, las dos.'], answer: 0, why: 'La Bandera Azul no se utiliza en partidas de dos jugadores.', ref: 'Cartas Especiales › Bandera Azul › Importante' }
    ],
    summary: ['Se juega sobre una carta de Ritmo, otra Bandera Azul o con vía libre.', 'El siguiente jugador activo pierde su turno.', 'Quien sigue responde a la carta que quedó debajo de la Bandera Azul.']
  });

  SPECIALS.push({
    id: 'vuelta', num: '10.5', title: 'Vuelta Rápida', card: 'vr', ref: 'Cartas Especiales › Vuelta Rápida', prereq: ['ritmo'],
    objective: 'En este submódulo aprenderás a usar la Vuelta Rápida, el ritmo más alto de la carrera.',
    rules: {
      cuando: 'Puede jugarse con vía libre o sobre cualquier carta, excepto sobre una Bandera Amarilla.',
      efecto: 'Establece el ritmo más alto de la carrera, por lo que los demás jugadores no pueden superarlo.',
      despues: 'El siguiente jugador solo puede responder con otra Vuelta Rápida, una Bandera Roja o una Bandera a Cuadros.'
    },
    example: {
      title: 'El ritmo más alto',
      steps: [
        { pile: ['r6', 'r8'], hand: ['vr', 'r3'], note: 'La carta superior es un Ritmo 8. Tienes una Vuelta Rápida.' },
        { pile: ['r6', 'r8', 'vr'], hand: ['r3'], note: 'La juegas: establece el ritmo más alto de la carrera.' },
        { pile: ['r6', 'r8', 'vr', 'roja'], hand: ['r3'], note: 'El siguiente solo puede responder con otra Vuelta Rápida, una Bandera Roja o una Bandera a Cuadros. Aquí juega una Bandera Roja.' }
      ]
    },
    practice: [
      { type: 'yesno', q: '¿Puedes jugar esta carta?', scene: { pile: ['r8'], card: 'vr' }, answer: true, why: 'La Vuelta Rápida puede jugarse con vía libre o sobre cualquier carta, excepto sobre una Bandera Amarilla.', ref: 'Cartas Especiales › Vuelta Rápida' },
      { type: 'yesno', q: '¿Puedes jugar esta carta?', scene: { pile: ['ama'], card: 'vr' }, answer: false, why: 'La Vuelta Rápida no puede jugarse sobre una Bandera Amarilla.', ref: 'Cartas Especiales › Vuelta Rápida' },
      { type: 'choose', q: 'La carta superior es una Vuelta Rápida. Elige todas las cartas con las que puedes responder.', pile: ['vr'], hand: ['r8', 'vr', 'roja', 'cuad', 'reb'], valid: [1, 2, 3], why: 'Después de una Vuelta Rápida solo puedes responder con otra Vuelta Rápida, una Bandera Roja o una Bandera a Cuadros.', ref: 'Cartas Especiales › Vuelta Rápida' }
    ],
    summary: ['Se juega con vía libre o sobre cualquier carta, menos sobre una Bandera Amarilla.', 'Es el ritmo más alto: nadie puede superarlo.', 'Solo se responde con otra Vuelta Rápida, una Bandera Roja o una Bandera a Cuadros.']
  });

  SPECIALS.push({
    id: 'rebufo', num: '10.6', title: 'Rebufo', card: 'reb', ref: 'Cartas Especiales › Rebufo', prereq: ['ritmo', 'encadenar'],
    objective: 'En este submódulo aprenderás cuándo jugar el Rebufo y cómo combinarlo con Ritmos Altos.',
    rules: {
      cuando: 'Puedes jugarlo sobre Ritmos Bajos, sobre otro Rebufo o cuando tienes vía libre. No puedes jugarlo sobre Ritmos Altos, Vueltas Rápidas ni Banderas Amarillas.',
      efecto: 'Te permite aumentar el ritmo de la carrera acompañando el Rebufo con Ritmos Altos (5, 6, 7 u 8). Puedes combinar dos valores consecutivos de Ritmos Altos y, si tienes varias cartas del mismo valor, también puedes jugarlas. No es obligatorio acompañarlo: puedes jugarlo solo o combinar varios Rebufos. Ejemplos: Rebufo + 6 + 7; Rebufo + Rebufo + 5 + 5 + 5 + 6 + 6; Rebufo + Rebufo + Rebufo + 7 + 7 + 8 + 8 + 8; Rebufo + 5; Rebufo + Rebufo.',
      despues: 'Si el Rebufo se juega solo, queda como carta superior de la pila. El siguiente puede responder con Ritmos Altos, otro Rebufo, una Bandera Roja, una Bandera a Cuadros o una Vuelta Rápida, pero no con Ritmos Bajos ni con una Bandera Amarilla. Si se juega acompañado de Ritmos Altos, el valor más alto de la combinación queda arriba y se aplica la regla general de Ritmo.',
      importante: 'No puedes combinar valores que no sean consecutivos. Por ejemplo, Rebufo + 6 + 8 no es una combinación válida.'
    },
    example: {
      title: 'Subir el ritmo de golpe',
      steps: [
        { pile: ['r1', 'r3'], hand: ['reb', 'r6', 'r7', 'r2'], note: 'La carta superior es un Ritmo 3, un Ritmo Bajo. Tienes un Rebufo, un 6 y un 7.' },
        { pile: ['r1', 'r3', 'reb', 'r6', 'r7'], hand: ['r2'], note: 'Juegas Rebufo + 6 + 7: dos valores consecutivos de Ritmos Altos.' },
        { pile: ['r1', 'r3', 'reb', 'r6', 'r7'], hand: ['r2'], note: 'El 7 es el valor más alto y queda arriba. El siguiente aplica la regla general: debe jugar un 7 o más, o una Carta Especial que lo permita.' }
      ]
    },
    practice: [
      { type: 'yesno', q: '¿Puedes jugar esta carta?', scene: { pile: ['r3'], card: 'reb' }, answer: true, why: 'Puedes jugar el Rebufo sobre Ritmos Bajos, otro Rebufo o cuando tienes vía libre.', ref: 'Cartas Especiales › Rebufo' },
      { type: 'yesno', q: '¿Puedes jugar esta carta?', scene: { pile: ['r6'], card: 'reb' }, answer: false, why: 'No puedes jugar el Rebufo sobre Ritmos Altos, Vueltas Rápidas ni Banderas Amarillas.', ref: 'Cartas Especiales › Rebufo' },
      { type: 'mcq', q: 'Tienes vía libre. ¿Cuál de estas combinaciones es válida?', scene: { pile: [] }, options: ['Rebufo + 6 + 7.', 'Rebufo + 6 + 8.', 'Rebufo + 3 + 4.'], answer: 0, why: 'El Rebufo se combina con dos valores consecutivos de Ritmos Altos (5 al 8). Rebufo + 6 + 8 no son consecutivos, y 3 y 4 son Ritmos Bajos.', ref: 'Cartas Especiales › Rebufo' },
      { type: 'choose', q: 'Un jugador jugó un Rebufo solo y quedó como carta superior. Elige todas las cartas con las que puedes responder.', pile: ['reb'], hand: ['r3', 'r6', 'reb', 'ama', 'vr'], valid: [1, 2, 4], why: 'Sobre un Rebufo solo puedes responder con Ritmos Altos, otro Rebufo, una Bandera Roja, una Bandera a Cuadros o una Vuelta Rápida. No valen los Ritmos Bajos ni la Bandera Amarilla.', ref: 'Cartas Especiales › Rebufo' }
    ],
    summary: ['Se juega sobre Ritmos Bajos, otro Rebufo o con vía libre.', 'Se acompaña con hasta dos valores consecutivos de Ritmos Altos, o se juega solo.', 'Con Ritmos, el valor más alto queda arriba y manda la regla general.']
  });

  M.push({
    id: 'especiales', num: '10', title: 'Cartas Especiales', ref: 'Cartas Especiales', group: true,
    objective: 'En este módulo aprenderás las seis Cartas Especiales, una por una.',
    children: SPECIALS
  });

  /* ---------- 11. Fin de la partida ---------- */
  M.push({
    id: 'fin', num: '11', title: 'Fin de la partida', ref: 'Fin de la partida', prereq: ['fases'],
    objective: 'En este módulo aprenderás cuándo termina la carrera y cómo se definen las posiciones.',
    body: [
      'La carrera termina cuando <strong>solo queda un jugador con cartas</strong>. Los jugadores que se deshacen de todas sus cartas terminan la carrera y quedan fuera de la partida.',
      'Las posiciones finales se determinan por el orden en que los jugadores cruzaron la meta. El último jugador que conserva cartas ocupa la última posición.'
    ],
    example: {
      title: 'La bandera final',
      steps: [
        { note: 'Ana se queda sin cartas: cruza la meta en primera posición. Beto y Carla siguen compitiendo.' },
        { note: 'Carla se queda sin cartas: cruza la meta en segunda posición.' },
        { note: 'Solo Beto tiene cartas: la carrera termina y él ocupa la última posición.' }
      ]
    },
    practice: [
      { type: 'mcq', q: '¿Cuándo termina la carrera?', options: ['Cuando el primer jugador cruza la meta.', 'Cuando solo queda un jugador con cartas.', 'Cuando la pila central se queda vacía.'], answer: 1, why: 'La carrera termina cuando solo queda un jugador con cartas.', ref: 'Fin de la partida' },
      { type: 'mcq', q: 'Juegan Ana, Beto y Carla. Ana cruzó la meta primero y luego Carla. ¿En qué posición queda Beto?', options: ['Primera.', 'Segunda.', 'Última.'], answer: 2, why: 'Las posiciones se determinan por el orden en que se cruzó la meta, y el último jugador que conserve cartas ocupa la última posición.', ref: 'Fin de la partida' },
      { type: 'mcq', q: '¿Cómo se determinan las posiciones finales?', options: ['Por el orden en que los jugadores cruzaron la meta.', 'Por quién tiene menos cartas al final.', 'Por quién jugó más Cartas Especiales.'], answer: 0, why: 'Las posiciones finales se determinan según el orden en que los jugadores cruzaron la meta.', ref: 'Fin de la partida' }
    ],
    summary: ['La carrera termina cuando solo queda un jugador con cartas.', 'Las posiciones siguen el orden de llegada a la meta.', 'Quien se queda con cartas ocupa la última posición.']
  });

  /* ---------- 12. Prueba final ---------- */
  M.push({
    id: 'prueba', num: '12', title: 'Prueba final', ref: 'Todo el reglamento', quiz: true,
    objective: 'Repasa todo lo que aprendiste con preguntas mezcladas de todos los módulos.'
  });

  // Quick reference for the six Cartas Especiales
  var QUICK = SPECIALS.map(function (s) { return { id: s.id, title: s.title, card: s.card, cuando: s.rules.cuando, despues: s.rules.despues }; });

  root.PintoTutorial = { modules: M, specials: SPECIALS, quick: QUICK };
})(this);
