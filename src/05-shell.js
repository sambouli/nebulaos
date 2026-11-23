/* ============================================================
   Part 05: Dock, start menu, clock, context menus.
   ============================================================ */
var DOCK_APPS = ['files', 'notes', 'mail', 'calendar', 'terminal', 'calc', 'gta', 'tetris', 'snake', 'flappy', 'mines'];

function buildDock() {
  $('#start-btn').innerHTML = iconSVG('start');
  var host = $('#dock-apps');
  host.innerHTML = '';
  DOCK_APPS.forEach(function (id) {
    var app = APPS[id];
    var b = el('button', 'dock-item');
    b.setAttribute('data-app', id);
    b.setAttribute('data-tip', app.name);
    b.innerHTML = iconSVG(app.icon) + '<span class="dot"></span>';
    b.addEventListener('click', function () { dockClick(id); });
    b.addEventListener('contextmenu', function (ev) {
      ev.preventDefault();
      showContextMenu(ev.clientX, ev.clientY - 60, [
        { label: 'Open ' + app.name, fn: function () { launchApp(id); } },
        { label: 'Close all windows', fn: function () { OS.windows.filter(function (w) { return w.appId === id; }).forEach(closeWindow); } }
      ]);
    });
    host.appendChild(b);
  });
  updateDock();
}

function dockClick(id) {
  var wins = OS.windows.filter(function (w) { return w.appId === id; });
  if (!wins.length) { launchApp(id); return; }
  var visible = wins.filter(function (w) { return !w.minimized && OS.focused !== w; });
  if (visible.length) { minimizeWindow(wins.find(function (w) { return !w.minimized; }) || wins[0]); }
  else {
    var min = wins.filter(function (w) { return w.minimized; });
    if (min.length) unminimize(min[0]); else focusWindow(wins[wins.length - 1]);
  }
}

function updateDock() {
  $$('#dock-apps .dock-item').forEach(function (b) {
    var id = b.getAttribute('data-app');
    var wins = OS.windows.filter(function (w) { return w.appId === id; });
    b.classList.toggle('running', wins.length > 0);
    b.classList.toggle('focused', !!OS.focused && OS.focused.appId === id && !OS.focused.minimized);
  });
}

/* ---------- start menu ---------- */
function buildStartMenu(filter) {
  var grid = $('#start-grid');
  grid.innerHTML = '';
  var cats = ['System', 'Games', 'Docs'];
  var q = (filter || '').toLowerCase().trim();
  var anyShown = false;
  cats.forEach(function (cat) {
    var apps = Object.keys(APPS).map(function (k) { return APPS[k]; })
      .filter(function (a) { return a.cat === cat && (!q || a.name.toLowerCase().indexOf(q) >= 0); });
    if (!apps.length) return;
    anyShown = true;
    grid.appendChild(el('div', 'start-cat', esc(cat)));
    apps.forEach(function (a) {
      var t = el('button', 'start-tile');
      t.innerHTML = iconSVG(a.icon) + '<span>' + esc(a.name) + '</span>';
      t.addEventListener('click', function () { launchApp(a.id); });
      grid.appendChild(t);
    });
  });
  if (!anyShown) {
    grid.appendChild(el('div', 'start-cat', 'No results'));
    var hint = el('div');
    hint.style.cssText = 'grid-column:1/-1;padding:4px 12px 12px;font-size:12px;color:var(--text-dim)';
    hint.textContent = 'Nothing matches "' + filter + '". Try the Assistant for commands like /help or /time.';
    grid.appendChild(hint);
  }
}

function openStartMenu() {
  buildStartMenu('');
  $('#start-menu').classList.add('open');
  $('#start-btn').classList.add('active');
  var s = $('#start-search'); s.value = ''; setTimeout(function () { s.focus(); }, 60);
}
function closeStartMenu() {
  $('#start-menu').classList.remove('open');
  $('#start-btn').classList.remove('active');
}
function toggleStartMenu() {
  if ($('#start-menu').classList.contains('open')) closeStartMenu(); else openStartMenu();
}

/* ---------- clock ---------- */
var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function tickClock() {
  var n = new Date();
  $('#clock-time').textContent = pad2(n.getHours()) + ':' + pad2(n.getMinutes()) + ':' + pad2(n.getSeconds());
  $('#clock-date').textContent = DAYS[n.getDay()].slice(0, 3) + ', ' + MONTHS[n.getMonth()].slice(0, 3) + ' ' + n.getDate();
}

/* ---------- generic context menu ---------- */
function dismissMenus() {
  $$('.ctx-menu').forEach(function (m) { m.parentNode.removeChild(m); });
}
function showContextMenu(x, y, items) {
  dismissMenus();
  var m = el('div', 'ctx-menu');
  items.forEach(function (it) {
    if (it.sep) { m.appendChild(el('div', 'ctx-sep')); return; }
    if (it.labelOnly) { m.appendChild(el('div', 'ctx-label', esc(it.labelOnly))); return; }
    if (it.swatches) {
      var row = el('div', 'swatch-row');
      it.swatches.forEach(function (sw) {
        var s = el('div', 'swatch');
        s.style.background = sw.preview;
        s.title = sw.label;
        if (OS.settings.wallpaper === sw.key) s.classList.add('active');
        s.addEventListener('click', function () { applyWallpaper(sw.key); dismissMenus(); });
        row.appendChild(s);
      });
      m.appendChild(row);
      return;
    }
    var b = el('button', 'ctx-item');
    b.innerHTML = esc(it.label) + (it.sub ? '<span class="sub">' + esc(it.sub) + '</span>' : '');
    b.addEventListener('click', function () { dismissMenus(); it.fn(); });
    m.appendChild(b);
  });
  D.body.appendChild(m);
  var r = m.getBoundingClientRect();
  if (x + r.width > D.documentElement.clientWidth - 6) x = D.documentElement.clientWidth - r.width - 6;
  if (y + r.height > D.documentElement.clientHeight - 6) y = D.documentElement.clientHeight - r.height - 6;
  m.style.left = x + 'px'; m.style.top = y + 'px';
}

function desktopContextMenu(x, y) {
  var wpSw = Object.keys(WALLPAPERS).map(function (k) { return { key: k, label: WALLPAPERS[k].label, preview: WALLPAPERS[k].preview }; });
  showContextMenu(x, y, [
    { label: 'Refresh desktop', fn: function () { refreshDesktopFx(); } },
    { label: 'Reset icon layout', fn: resetIconPositions },
    { sep: true },
    { labelOnly: 'Wallpaper' },
    { swatches: wpSw },
    { sep: true },
    { label: OS.settings.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode', sub: 'Theme', fn: toggleTheme },
    { label: 'Open Assistant', sub: '/help', fn: function () { launchTerminalWith('/help'); } },
    { sep: true },
    { label: 'About NebulaOS', fn: launchAbout }
  ]);
}

function refreshDesktopFx() {
  var layer = $('#icon-layer');
  layer.style.transition = 'opacity .18s';
  layer.style.opacity = '0';
  setTimeout(function () {
    renderDesktop();
    layer.style.opacity = '1';
    toast('Desktop refreshed');
  }, 200);
}

/* lightweight toast */
function toast(msg) {
  var t = el('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;left:50%;bottom:84px;transform:translateX(-50%);background:var(--menu-bg);color:var(--text);border:1px solid var(--border-soft);padding:9px 18px;border-radius:12px;font-size:13px;z-index:96000;box-shadow:var(--shadow);backdrop-filter:blur(14px);transition:opacity .3s,transform .3s;opacity:0;pointer-events:none';
  D.body.appendChild(t);
  requestAnimationFrame(function () { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(-4px)'; });
  setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 350); }, 2200);
}
