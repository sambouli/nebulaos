/* ============================================================
   Part 04: App registry + desktop icons (drag, snap-to-grid, persist).
   ============================================================ */
var APPS = {};
function registerApp(a) { APPS[a.id] = a; }

registerApp({ id: 'files',    name: 'Files',      icon: 'files',    cat: 'System', launch: launchFiles });
registerApp({ id: 'notes',    name: 'Notes',      icon: 'notes',    cat: 'System', launch: launchNotes });
registerApp({ id: 'mail',     name: 'Mail',       icon: 'mail',     cat: 'System', launch: launchMail });
registerApp({ id: 'calendar', name: 'Calendar',   icon: 'calendar', cat: 'System', launch: launchCalendar });
registerApp({ id: 'terminal', name: 'Assistant',  icon: 'terminal', cat: 'System', launch: launchTerminal });
registerApp({ id: 'calc',     name: 'Quantum Calc', icon: 'calc',   cat: 'System', launch: launchCalc, special: true });
registerApp({ id: 'about',    name: 'About',      icon: 'about',    cat: 'System', launch: launchAbout });
registerApp({ id: 'gta',      name: 'Turbo City', icon: 'gta',      cat: 'Games', launch: launchGTA });
registerApp({ id: 'tetris',   name: 'Tetris',     icon: 'tetris',   cat: 'Games', launch: launchTetris });
registerApp({ id: 'snake',    name: 'Snake',      icon: 'snake',    cat: 'Games', launch: launchSnake });
registerApp({ id: 'flappy',   name: 'Flappy',     icon: 'flappy',   cat: 'Games', launch: launchFlappy });
registerApp({ id: 'mines',    name: 'Minesweeper', icon: 'mines',   cat: 'Games', launch: launchMines });
registerApp({ id: 'readme',   name: 'ReadMe.txt', icon: 'readme',   cat: 'Docs', file: '/Home/Desktop/ReadMe.txt', launch: function () { launchFilesWithPath('/Home/Desktop'); } });

var DESKTOP_ORDER = ['files', 'notes', 'mail', 'calendar', 'terminal', 'calc', 'gta', 'tetris', 'snake', 'flappy', 'mines', 'readme'];

function launchApp(id) {
  var app = APPS[id];
  if (!app) return;
  closeStartMenu();
  app.launch();
}

/* ---------- desktop icons ---------- */
var GRID = { cellW: 100, cellH: 96, padX: 14, padY: 14 };
function gridPos(col, row) { return { x: GRID.padX + col * GRID.cellW, y: GRID.padY + row * GRID.cellH }; }
function gridFromPos(x, y) { return { col: Math.max(0, Math.round((x - GRID.padX) / GRID.cellW)), row: Math.max(0, Math.round((y - GRID.padY) / GRID.cellH)) }; }

function renderDesktop() {
  var layer = $('#icon-layer');
  layer.innerHTML = '';
  var maxRows = Math.max(3, Math.floor((D.documentElement.clientHeight - 100) / GRID.cellH));
  DESKTOP_ORDER.forEach(function (id, idx) {
    var app = APPS[id];
    if (!app) return;
    var pos = OS.settings.iconPos[id];
    if (!pos) pos = gridPos(Math.floor(idx / maxRows), idx % maxRows);
    var ic = el('div', 'desk-icon');
    ic.setAttribute('data-app', id);
    ic.style.left = pos.x + 'px'; ic.style.top = pos.y + 'px';
    ic.innerHTML = '<span class="ic">' + iconSVG(app.icon) + '</span><span class="lbl">' + esc(app.name) + '</span>';
    layer.appendChild(ic);

    var down = null;
    ic.addEventListener('pointerdown', function (ev) {
      if (ev.button !== 0) return;
      $$('.desk-icon.selected').forEach(function (s) { s.classList.remove('selected'); });
      ic.classList.add('selected');
      down = { x: ev.clientX, y: ev.clientY, ox: parseFloat(ic.style.left), oy: parseFloat(ic.style.top), moved: false };
      ic.setPointerCapture(ev.pointerId);
    });
    ic.addEventListener('pointermove', function (ev) {
      if (!down) return;
      var dx = ev.clientX - down.x, dy = ev.clientY - down.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) down.moved = true;
      if (down.moved) {
        ic.classList.add('dragging');
        ic.style.left = clamp(down.ox + dx, 0, D.documentElement.clientWidth - 100) + 'px';
        ic.style.top = clamp(down.oy + dy, 0, D.documentElement.clientHeight - 64 - 92) + 'px';
      }
    });
    ic.addEventListener('pointerup', function (ev) {
      if (!down) return;
      var wasMoved = down.moved; down = null;
      try { ic.releasePointerCapture(ev.pointerId); } catch (e) {}
      ic.classList.remove('dragging');
      if (wasMoved) {
        var g = gridFromPos(parseFloat(ic.style.left), parseFloat(ic.style.top));
        var p = gridPos(g.col, g.row);
        /* avoid stacking on an occupied cell */
        var taken = {};
        $$('.desk-icon').forEach(function (o) {
          if (o !== ic) taken[Math.round(parseFloat(o.style.left) / GRID.cellW) + ',' + Math.round(parseFloat(o.style.top) / GRID.cellH)] = 1;
        });
        var guard = 0;
        while (taken[g.col + ',' + g.row] && guard++ < 60) g.row++;
        p = gridPos(g.col, g.row);
        ic.style.left = p.x + 'px'; ic.style.top = p.y + 'px';
        OS.settings.iconPos[id] = p; saveSettings();
      } else {
        launchApp(id);
      }
    });
    ic.addEventListener('contextmenu', function (ev) {
      ev.preventDefault(); ev.stopPropagation();
      showContextMenu(ev.clientX, ev.clientY, [
        { label: 'Open', icon: null, fn: function () { launchApp(id); } },
        { sep: true },
        { label: 'Reset icon position', fn: function () { delete OS.settings.iconPos[id]; saveSettings(); renderDesktop(); } }
      ]);
    });
  });
}

function resetIconPositions() { OS.settings.iconPos = {}; saveSettings(); renderDesktop(); }
