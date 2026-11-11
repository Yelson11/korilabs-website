/* PINTO header menu: on narrow screens the nav collapses behind a hamburger button.
   Without JS the button stays hidden and the nav simply wraps, so every link still works. */
(function () {
  var header = document.querySelector('.p-header');
  if (!header) return;
  var btn = header.querySelector('.p-menu-btn');
  var nav = header.querySelector('.p-nav');
  if (!btn || !nav) return;

  header.classList.add('p-header--js');
  btn.hidden = false;

  function setOpen(open) {
    header.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.querySelector('.visually-hidden').textContent = open ? 'Cerrar menú' : 'Abrir menú';
  }

  btn.addEventListener('click', function () {
    setOpen(!header.classList.contains('is-open'));
  });

  // Close after choosing a link (needed for same-page anchors like #cartas), on Esc and on outside taps.
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && header.classList.contains('is-open')) {
      setOpen(false);
      btn.focus();
    }
  });
  document.addEventListener('click', function (e) {
    if (header.classList.contains('is-open') && !header.contains(e.target)) setOpen(false);
  });
})();
