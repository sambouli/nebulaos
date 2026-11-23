/* ============================================================
   Part 90: Boot sequence + global wiring.
   ============================================================ */
(function boot() {
  var msgs = [
    'mounting /dev/imagination',
    'loading window compositor',
    'starting dock daemon',
    'warming up 5 apps…',
    'inserting coins into 5 games…',
    'polishing pixels',
    'ready.'
  ];
  var fill = $('#boot-fill'), msg = $('#boot-msg'), i = 0;
  function step() {
    if (i < msgs.length) {
      msg.textContent = '[' + (i + 1) + '/' + msgs.length + '] ' + msgs[i];
      fill.style.width = Math.round(((i + 1) / msgs.length) * 100) + '%';
      i++;
      setTimeout(step, 160 + Math.random() * 130);
    } else {
      startOS();
    }
  }
  setTimeout(step, 220);
})();

function startOS() {
  /* apply persisted look */
  D.documentElement.setAttribute('data-theme', OS.settings.theme === 'light' ? 'light' : 'dark');
  applyWallpaper(OS.settings.wallpaper);

  renderDesktop();
  buildDock();
  tickClock();
  setInterval(tickClock, 1000);

  /* clock click opens calendar */
  $('#clock').addEventListener('click', launchCalendar);
  /* start button */
  $('#start-btn').addEventListener('click', function (ev) { ev.stopPropagation(); toggleStartMenu(); });
  $('#start-menu').addEventListener('pointerdown', function (ev) { ev.stopPropagation(); });
  $('#start-search').addEventListener('input', function () { buildStartMenu(this.value); });
  $('#start-search').addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') {
      var first = $('.start-tile', $('#start-grid'));
      if (first) first.click();
    } else if (ev.key === 'Escape') closeStartMenu();
  });

  /* desktop interactions */
  var desk = $('#desktop');
  desk.addEventListener('contextmenu', function (ev) {
    if (ev.target.closest('.desk-icon')) return; /* icon handles its own menu */
    ev.preventDefault();
    closeStartMenu(); dismissMenus();
    desktopContextMenu(ev.clientX, ev.clientY);
  });
  desk.addEventListener('pointerdown', function (ev) {
    if (!ev.target.closest('.desk-icon')) $$('.desk-icon.selected').forEach(function (s) { s.classList.remove('selected'); });
    closeStartMenu(); dismissMenus();
  });
  W.addEventListener('pointerdown', function (ev) {
    if (!ev.target.closest('.ctx-menu')) dismissMenus();
    if (!ev.target.closest('#start-menu') && !ev.target.closest('#start-btn')) closeStartMenu();
  }, true);
  W.addEventListener('blur', dismissMenus);
  D.addEventListener('contextmenu', function (ev) {
    /* block native menu everywhere except text inputs */
    if (!ev.target.closest('input,textarea')) ev.preventDefault();
  });

  /* global shortcuts */
  D.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') { closeStartMenu(); dismissMenus(); }
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
      ev.preventDefault(); openStartMenu();
    }
  });

  /* fade out boot screen */
  var b = $('#boot');
  b.classList.add('gone');
  setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 700);

  /* welcome toast */
  setTimeout(function () { toast('Welcome to NebulaOS — right-click the desktop to explore'); }, 700);
}
