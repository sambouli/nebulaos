/* ============================================================
   Part 06: File Browser — mock FS with navigation, mkdir, preview.
   ============================================================ */
function defaultFS() {
  return {
    '/': { type: 'dir', children: ['Home', 'System'] },
    '/Home': { type: 'dir', children: ['Desktop', 'Documents', 'Music', 'Pictures'] },
    '/Home/Desktop': { type: 'dir', children: ['ReadMe.txt', 'Welcome.txt'] },
    '/Home/Documents': { type: 'dir', children: ['todo.txt', 'recipes.txt', 'budget.txt', 'Projects'] },
    '/Home/Documents/Projects': { type: 'dir', children: ['ideas.txt', 'nebula.js'] },
    '/Home/Music': { type: 'dir', children: ['synthwave.mp3', 'lofi-beats.mp3'] },
    '/Home/Pictures': { type: 'dir', children: ['sunset.png', 'cat.png', 'diagram.svg'] },
    '/System': { type: 'dir', children: ['kernel.sys', 'drivers.sys', 'logs.txt'] },
    '/Home/Desktop/ReadMe.txt': { type: 'file', kind: 'readme', content:
      'NEBULA OS v1.0.0 — Read Me\n================================\n\nWelcome to NebulaOS, a complete desktop environment that lives inside one HTML file.\n\nSPECIAL FEATURE — QUANTUM CALCULATOR\nThe Quantum Calc is this build\'s signature app (dock icon looks like a calculator tile).\nIt is not an ordinary calculator: it keeps a scrollable HISTORY TAPE, a MEMORY register\n(MS / MR / M+ / MC), scientific functions (sin, cos, tan, ln, log, sqrt, x^2, x^y, pi, e,\nfactorial, percent) and FULL KEYBOARD support (digits, + - * / ^ % ( ), Enter = equals,\nBackspace, Esc clears). Click any history line to reuse that result. Open it from the\ndock, the Start menu, or by typing "calc" in the Assistant.\n\nAPPS\n- Files: browse folders, click files to preview, New Folder button creates folders.\n- Notes: autosaves to localStorage; Save also downloads a .txt copy.\n- Mail: inbox + reading pane + compose.\n- Calendar: month view, today highlighted, add/delete events per day (persisted).\n- Assistant: terminal. Try /help, /time, /weather, /apps, /theme dark, /open tetris.\n\nGAMES: Turbo City (driving), Tetris, Snake, Flappy, Minesweeper.\n\nDESKTOP: right-click the wallpaper for wallpaper themes, refresh and light/dark mode.' },
    '/Home/Desktop/Welcome.txt': { type: 'file', kind: 'txt', content: 'Hello and welcome to NebulaOS!\nTip: press the Start button (leftmost dock icon) to see every app and game.' },
    '/Home/Documents/todo.txt': { type: 'file', kind: 'txt', content: '[x] Install NebulaOS\n[ ] Beat Tetris level 5\n[ ] Win Minesweeper without flags\n[ ] Try the Quantum Calc memory keys' },
    '/Home/Documents/recipes.txt': { type: 'file', kind: 'txt', content: 'RAMEN, UPGRADED\n- boil noodles 3 min\n- soft-boil egg 6.5 min (ice bath!)\n- chili oil + sesame + scallion\n- never skip the egg' },
    '/Home/Documents/budget.txt': { type: 'file', kind: 'txt', content: 'Coffee ......... $4/mo\nDomain renewal ... $12/yr\nGPU fund ......... loading...\n\nRule: if it fits in the GPU fund, buy it.' },
    '/Home/Documents/Projects/ideas.txt': { type: 'file', kind: 'txt', content: '1. App that names your commits for you\n2. Spreadsheet that judges your formulas\n3. Screensaver of scrolling spreadsheets (retro)' },
    '/Home/Documents/Projects/nebula.js': { type: 'file', kind: 'code', content: '// nebula core sketch\nfunction boot() {\n  const os = new Nebula({ theme: "dark" });\n  os.mount(document.getElementById("universe"));\n  return os;\n}\nboot();' },
    '/Home/Music/synthwave.mp3': { type: 'file', kind: 'music', content: '[binary audio — 3:47, 128kbps]\n(Imagine neon arpeggios.)' },
    '/Home/Music/lofi-beats.mp3': { type: 'file', kind: 'music', content: '[binary audio — 2:12, 96kbps]\n(Perfect study loop.)' },
    '/Home/Pictures/sunset.png': { type: 'file', kind: 'img', content: '[image 1920x1080 PNG]\nOrange gradient over the harbor.' },
    '/Home/Pictures/cat.png': { type: 'file', kind: 'img', content: '[image 800x600 PNG]\nA cat sitting on a keyboard. Very serious.' },
    '/Home/Pictures/diagram.svg': { type: 'file', kind: 'img', content: '<svg viewBox="0 0 10 10"><rect width="10" height="10" fill="#8a5cff"/></svg>\n(The architecture diagram. It is a purple square. Trust it.)' },
    '/System/kernel.sys': { type: 'file', kind: 'code', content: 'NEBULA KERNEL 1.0.0\nwindow_manager: OK\ncompositor: OK\ndock_daemon: OK\nvibes: immaculate' },
    '/System/drivers.sys': { type: 'file', kind: 'code', content: 'display.driver ... loaded\nkeyboard.driver .. loaded\nfun.driver ....... loaded x5' },
    '/System/logs.txt': { type: 'file', kind: 'txt', content: 'boot: ok\nboot: user detected\nboot: making coffee (virtual)' }
  };
}

var FS = Store.get('fs', null) || defaultFS();
function saveFS() { Store.set('fs', FS); }

function fileKindIcon(path) {
  var f = FS[path];
  if (!f) return ICONS.file();
  if (f.type === 'dir') return ICONS.folder();
  var k = f.kind || 'txt';
  if (ICONS[k] && k !== 'txt') return ICONS[k]();
  return ICONS.file();
}
function fakeSize(path) {
  var f = FS[path];
  if (!f) return '';
  if (f.type === 'dir') return f.children.length + ' items';
  return Math.max(1, Math.round(f.content.length / 64)) + ' KB';
}

function launchFilesWithPath(startPath) {
  var existing = OS.windows.filter(function (w) { return w.appId === 'files'; })[0];
  if (existing) { focusWindow(existing); if (startPath && existing.fbNav) existing.fbNav(startPath); return existing; }
  var win = createWindow({ appId: 'files', title: 'Files', icon: 'files', width: 780, height: 520, onMount: function (body, W_) { mountFiles(body, W_, startPath || '/Home'); } });
  return win;
}
function launchFiles() { launchFilesWithPath(); }

function mountFiles(body, win, startPath) {
  var cwd = startPath;
  var selected = null;

  body.innerHTML =
    '<div style="display:flex;flex:1;overflow:hidden">' +
      '<div class="fb-side"></div>' +
      '<div class="fb-main">' +
        '<div class="app-toolbar">' +
          '<button class="btn fb-back">&larr;</button>' +
          '<button class="btn fb-up">&uarr;</button>' +
          '<div class="fb-crumbs"></div>' +
          '<div style="margin-left:auto;display:flex;gap:8px">' +
            '<input class="text-input fb-newname" placeholder="New folder name" style="width:150px">' +
            '<button class="btn primary fb-mkdir">+ New Folder</button>' +
          '</div>' +
        '</div>' +
        '<div class="fb-grid"></div>' +
        '<div class="fb-preview hidden"></div>' +
      '</div>' +
    '</div>';

  var side = $('.fb-side', body), crumbs = $('.fb-crumbs', body), grid = $('.fb-grid', body), prev = $('.fb-preview', body);
  var stack = [cwd];

  /* sidebar quick links */
  [['/Home', 'Home', 'files'], ['/Home/Desktop', 'Desktop', 'files'], ['/Home/Documents', 'Documents', 'files'], ['/Home/Pictures', 'Pictures', 'img'], ['/Home/Music', 'Music', 'music'], ['/System', 'System', 'terminal']].forEach(function (q) {
    var s = el('div', 'fb-side-item');
    s.innerHTML = iconSVG(q[2]) + '<span>' + esc(q[1]) + '</span>';
    s.addEventListener('click', function () { nav(q[0]); });
    s.setAttribute('data-path', q[0]);
    side.appendChild(s);
  });

  function parentOf(p) {
    if (p === '/') return null;
    var i = p.lastIndexOf('/');
    return i <= 0 ? '/' : p.slice(0, i);
  }
  function join(p, name) { return (p === '/' ? '' : p) + '/' + name; }

  function nav(p) {
    if (!FS[p] || FS[p].type !== 'dir') return;
    cwd = p; selected = null;
    stack.push(p);
    render();
  }
  win.fbNav = nav;

  function render() {
    $$('.fb-side-item', side).forEach(function (s) { s.classList.toggle('active', s.getAttribute('data-path') === cwd); });
    /* breadcrumbs */
    crumbs.innerHTML = '';
    var parts = cwd === '/' ? [''] : cwd.split('/');
    var acc = '';
    parts.forEach(function (part, i) {
      acc = i === 0 ? '/' : acc + '/' + part;
      var pathAt = acc;
      var c = el('span', 'crumb' + (i === parts.length - 1 ? ' cur' : ''), esc(i === 0 ? 'This PC' : part));
      c.addEventListener('click', function () { nav(pathAt); });
      crumbs.appendChild(c);
      if (i < parts.length - 1) crumbs.appendChild(el('span', null, '<span style="color:var(--text-dim)">/</span>'));
    });
    /* grid */
    grid.innerHTML = '';
    var dir = FS[cwd];
    dir.children.slice().sort(function (a, b) {
      var fa = FS[join(cwd, a)], fb = FS[join(cwd, b)];
      var da = fa && fa.type === 'dir', db = fb && fb.type === 'dir';
      if (da !== db) return da ? -1 : 1;
      return a.localeCompare(b);
    }).forEach(function (name) {
      var path = join(cwd, name);
      var item = el('div', 'fb-item');
      item.innerHTML = fileKindIcon(path) + '<span>' + esc(name) + '</span>';
      item.addEventListener('click', function () {
        $$('.fb-item.sel', grid).forEach(function (x) { x.classList.remove('sel'); });
        item.classList.add('sel');
        selected = path;
        showPreview(path);
      });
      item.addEventListener('dblclick', function () {
        var f = FS[path];
        if (f && f.type === 'dir') nav(path);
      });
      item.addEventListener('contextmenu', function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        var f = FS[path];
        var items = [{ label: 'Open', fn: function () { if (f.type === 'dir') nav(path); else { selected = path; showPreview(path); } } }];
        if (f.type === 'dir') items.push({ label: 'Delete folder', fn: function () { deleteRecursive(path); saveFS(); render(); toast('Deleted ' + name); } });
        showContextMenu(ev.clientX, ev.clientY, items);
      });
      grid.appendChild(item);
    });
    if (!dir.children.length) grid.appendChild(el('div', null, '<span style="color:var(--text-dim);font-size:12.5px;padding:8px">Empty folder — use “New Folder” above.</span>'));
    prev.classList.add('hidden');
  }

  function deleteRecursive(p) {
    var f = FS[p];
    if (!f) return;
    if (f.type === 'dir') f.children.slice().forEach(function (c) { deleteRecursive(join(p, c)); });
    var par = FS[parentOf(p)];
    if (par && par.children) par.children = par.children.filter(function (c) { return join(p, c) !== p && !(c === p.slice(p.lastIndexOf('/') + 1)); });
    delete FS[p];
  }

  function showPreview(path) {
    var f = FS[path];
    prev.classList.remove('hidden');
    if (!f) { prev.innerHTML = ''; return; }
    if (f.type === 'dir') {
      prev.innerHTML = '<div class="pv-title">' + esc(path) + '</div>' + f.children.length + ' items:\n' + f.children.map(esc).join('\n');
    } else {
      prev.innerHTML = '<div class="pv-title">' + esc(path) + ' &nbsp;·&nbsp; ' + fakeSize(path) + '</div>' + esc(f.content);
    }
  }

  $('.fb-back', body).addEventListener('click', function () {
    if (stack.length > 1) { stack.pop(); cwd = stack[stack.length - 1]; render(); }
  });
  $('.fb-up', body).addEventListener('click', function () {
    var p = parentOf(cwd); if (p !== null) nav(p);
  });

  function mkdir() {
    var inp = $('.fb-newname', body);
    var name = inp.value.trim();
    if (!name) { toast('Type a folder name first'); inp.focus(); return; }
    if (/[\/]/.test(name)) { toast('Folder names cannot contain /'); return; }
    var path = join(cwd, name);
    if (FS[path]) { toast('“' + name + '” already exists here'); return; }
    FS[path] = { type: 'dir', children: [] };
    FS[cwd].children.push(name);
    saveFS(); inp.value = ''; render();
    toast('Created ' + path);
  }
  $('.fb-mkdir', body).addEventListener('click', mkdir);
  $('.fb-newname', body).addEventListener('keydown', function (e) { if (e.key === 'Enter') mkdir(); });

  render();
}
