/* Caja 3D de PINTO: gira sola, se puede arrastrar (ratón o dedo) y sombrea cada cara
   según hacia dónde mira. Sin dependencias. Si el usuario prefiere menos movimiento,
   la caja queda quieta en ángulo de tres cuartos y solo gira al arrastrarla. */
(function () {
  var stage = document.getElementById('box-stage');
  var box = document.getElementById('box3d');
  if (!stage || !box) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var AUTO_SPEED = 360 / 14;      // grados por segundo
  var TILT = -13;                 // inclinación para ver un poco la tapa
  var angle = -24;
  var velocity = AUTO_SPEED;
  var dragging = false, lastX = 0, lastT = 0, visible = true, last = performance.now(), t = 0;

  // normales de cada cara (x derecha, y arriba, z hacia el espectador)
  var faces = [
    ['front', [0, 0, 1]], ['back', [0, 0, -1]], ['right', [1, 0, 0]],
    ['left', [-1, 0, 0]], ['top', [0, 1, 0]], ['bottom', [0, -1, 0]]
  ].map(function (f) {
    return { el: box.querySelector('.box3d__face--' + f[0]), n: f[1] };
  });
  var LIGHT = norm([-0.35, 0.35, 0.87]);

  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }

  function shade() {
    var ay = angle * Math.PI / 180, ax = -TILT * Math.PI / 180;
    var cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
    faces.forEach(function (f) {
      var x = f.n[0], y = f.n[1], z = f.n[2];
      // giro en Y (sentido CSS) y luego en X
      var x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
      var y2 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
      var lit = Math.max(0, x1 * LIGHT[0] + y2 * LIGHT[1] + z2 * LIGHT[2]);
      f.el.style.setProperty('--shade', (0.55 * (1 - lit)).toFixed(3));
      f.el.style.setProperty('--sheen', Math.pow(Math.max(0, z2), 3).toFixed(3));
    });
  }

  function render() {
    var bob = reduce.matches ? 0 : Math.sin(t * 1.6) * 6;
    box.style.setProperty('--ry', angle.toFixed(2) + 'deg');
    box.style.setProperty('--rx', TILT + 'deg');
    box.style.setProperty('--bob', bob.toFixed(2) + 'px');
    stage.style.setProperty('--shadow-scale', (1 - bob / 60).toFixed(3));
    shade();
  }

  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!dragging && visible && !document.hidden) {
      t += dt;
      var target = reduce.matches ? 0 : AUTO_SPEED;
      velocity += (target - velocity) * Math.min(1, dt * 1.8);   // la inercia vuelve al giro normal
      angle += velocity * dt;
      render();
    }
    requestAnimationFrame(frame);
  }

  stage.addEventListener('pointerdown', function (e) {
    dragging = true;
    lastX = e.clientX; lastT = e.timeStamp;
    stage.setPointerCapture(e.pointerId);
    stage.classList.add('is-dragging');
  });

  stage.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - lastX, dts = Math.max(1, e.timeStamp - lastT) / 1000;
    angle += dx * 0.5;
    velocity = Math.max(-900, Math.min(900, (dx * 0.5) / dts));
    lastX = e.clientX; lastT = e.timeStamp;
    render();
  });

  function release() {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('is-dragging');
  }
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }).observe(stage);
  }

  if (reduce.matches) velocity = 0;
  render();
  requestAnimationFrame(frame);
})();
