/* ============================================================
   Part 10: Assistant / Terminal — commands, app search, system responses.
   ============================================================ */
var TERM_QUEUE = [];
function launchTerminalWith(cmd) {
  var existing = OS.windows.filter(function (w) { return w.appId === 'terminal'; })[0];
  if (cmd) TERM_QUEUE.push(cmd);
  if (existing) { focusWindow(existing); flushTermQueue(existing); return existing; }
  var win = createWindow({ appId: 'terminal', title: 'Assistant', icon: 'terminal', width: 640, height: 430, onMount: mountTerminal });
  flushTermQueue(win);
  return win;
}
function launchTerminal() { return launchTerminalWith(null); }
function flushTermQueue(win) {
  setTimeout(function () {
    while (TERM_QUEUE.length && win.body.isConnected) {
      var c = TERM_QUEUE.shift();
      var inp = $('.term-input', win.body);
      if (inp) { inp.value = c; submitTerm(win.body, win); }
    }
  }, 120);
}

function mountTerminal(body, win) {
  body.innerHTML =
    '<div class="term"></div>' +
    '<div class="term-input-row"><span class="term-prompt">nebula&gt;</span><input class="term-input" spellcheck="false" autocomplete="off" placeholder="Type a command or keyword — try /help"></div>';
  var term = $('.term', body), inp = $('.term-input', body);
  var history = [], hIdx = -1;

  function out(text, cls) {
    var lines = String(text).split('\n');
    lines.forEach(function (ln) {
      var l = el('div', 'term-line' + (cls ? ' ' + cls : ''));
      l.textContent = ln.length ? ln : ' ';
      term.appendChild(l);
    });
    term.scrollTop = term.scrollHeight;
  }

  win.termOut = out;
  out('NebulaOS Assistant v' + OS.version + ' — type /help for commands, or just words to search apps.', 'sys');
  out('Tip: /open tetris launches an app. /theme light switches the whole system.', 'sys');

  var WEATHER = [
    { c: 'Clear skies', t: 24, w: 'light breeze 6 km/h' },
    { c: 'Partly cloudy', t: 19, w: 'wind 12 km/h' },
    { c: 'Light rain', t: 15, w: 'humid, wind 9 km/h' },
    { c: 'Overcast', t: 17, w: 'still air' },
    { c: 'Sunny with a chance of dopamine', t: 27, w: 'breezy 15 km/h' }
  ];

  function cmdHelp() {
    out('COMMANDS', 'hdr');
    out('/help                this list');
    out('/time                current date and time');
    out('/weather             forecast for your location (simulated)');
    out('/apps                list all installed apps and games');
    out('/open <app>          launch an app or game');
    out('/theme <dark|light>  switch system theme');
    out('/wallpaper <name>    ' + Object.keys(WALLPAPERS).join(', '));
    out('/calc <expr>         quick math, e.g. /calc 12*(3+4)');
    out('/echo <text>         print text back');
    out('/whoami              who you are');
    out('/sysinfo             system information');
    out('/neofetch            stylish system art');
    out('/history             your command history');
    out('/clear               clear the screen');
  }
  function cmdCalc(expr) {
    try {
      if (!/^[\d\s+\-*\/().^%eE,]*$/.test(expr)) throw new Error('only numbers and operators');
      var safe = expr.replace(/\^/g, '**');
      var r = Function('"use strict";return (' + safe + ')')();
      if (typeof r !== 'number' || !isFinite(r)) throw new Error('not a finite number');
      out(expr + ' = ' + r, 'ok');
    } catch (e) { out('calc error: ' + e.message, 'err'); }
  }
  function cmdOpen(arg) {
    var q = arg.toLowerCase().trim();
    if (!q) { out('usage: /open <app>  (see /apps)', 'err'); return; }
    var hit = null;
    Object.keys(APPS).forEach(function (k) {
      var a = APPS[k];
      if (!hit && (k === q || a.name.toLowerCase() === q || a.name.toLowerCase().indexOf(q) === 0 || k.indexOf(q) === 0)) hit = k;
    });
    if (!hit) Object.keys(APPS).forEach(function (k) {
      var a = APPS[k];
      if (!hit && (a.name.toLowerCase().indexOf(q) >= 0 || k.indexOf(q) >= 0)) hit = k;
    });
    if (hit) { out('Launching ' + APPS[hit].name + '…', 'ok'); launchApp(hit); }
    else out('No app matches "' + arg + '". Try /apps.', 'err');
  }
  function searchApps(q) {
    var hits = Object.keys(APPS).map(function (k) { return APPS[k]; }).filter(function (a) {
      return a.name.toLowerCase().indexOf(q) >= 0 || a.id.indexOf(q) >= 0 || a.cat.toLowerCase().indexOf(q) >= 0;
    });
    if (!hits.length) { out('No apps match "' + q + '".', 'sys'); return; }
    out(hits.length + ' result(s):', 'hdr');
    hits.forEach(function (a) {
      out('  • ' + a.name + '  [' + a.cat + ']  → /open ' + a.id, 'acc');
    });
  }

  function run(raw) {
    var line = raw.trim();
    if (!line) return;
    history.push(line); hIdx = history.length;
    out('nebula> ' + line, 'ok');
    if (line.charAt(0) === '/') {
      var sp = line.indexOf(' ');
      var cmd = (sp < 0 ? line.slice(1) : line.slice(1, sp)).toLowerCase();
      var arg = sp < 0 ? '' : line.slice(sp + 1);
      switch (cmd) {
        case 'help': cmdHelp(); break;
        case 'time': {
          var n = new Date();
          out(DAYS[n.getDay()] + ', ' + MONTHS[n.getMonth()] + ' ' + n.getDate() + ', ' + n.getFullYear() + ' — ' + pad2(n.getHours()) + ':' + pad2(n.getMinutes()) + ':' + pad2(n.getSeconds()), 'ok');
          break; }
        case 'weather': {
          var wk = WEATHER[new Date().getDate() % WEATHER.length];
          out('Forecast (simulated, deterministic by date):', 'hdr');
          out('  ' + wk.c + ' — ' + wk.t + '°C, ' + wk.w);
          out('  Umbrella probability: ' + (wk.c.indexOf('rain') >= 0 ? 'high' : 'low') + '.');
          break; }
        case 'apps':
          out('INSTALLED SOFTWARE', 'hdr');
          Object.keys(APPS).forEach(function (k) {
            var a = APPS[k];
            out('  ' + pad((k), 14) + a.name + (a.special ? '  ★ special feature' : ''), 'acc');
          });
          break;
        case 'open': cmdOpen(arg); break;
        case 'theme':
          if (/^(dark|light)$/.test(arg.trim())) { applyTheme(arg.trim()); out('Theme set to ' + arg.trim() + '.', 'ok'); }
          else out('usage: /theme dark|light', 'err');
          break;
        case 'wallpaper':
          if (WALLPAPERS[arg.trim()]) { applyWallpaper(arg.trim()); out('Wallpaper set to ' + arg.trim() + '.', 'ok'); }
          else out('known wallpapers: ' + Object.keys(WALLPAPERS).join(', '), 'err');
          break;
        case 'calc': cmdCalc(arg); break;
        case 'echo': out(arg, null); break;
        case 'whoami': out('you@nebula — logged in as Guest (all privileges, zero responsibilities).', null); break;
        case 'sysinfo': {
          var up = Math.floor((Date.now() - OS.bootTime) / 1000);
          out('NebulaOS ' + OS.version, 'hdr');
          out('Kernel        nebula-web 1.0 (single-file edition)');
          out('Host          ' + navigator.userAgent.slice(0, 60));
          out('Screen        ' + D.documentElement.clientWidth + 'x' + D.documentElement.clientHeight);
          out('Windows open  ' + OS.windows.length);
          out('Uptime        ' + Math.floor(up / 60) + 'm ' + (up % 60) + 's');
          out('Storage       localStorage ' + (Store.get ? 'enabled' : 'memory fallback'));
          break; }
        case 'neofetch':
          out('      ╱╲        you@nebula', 'acc');
          out('     ╱  ╲       ────────────', 'acc');
          out('    ╱ ╱╲ ╲      OS: NebulaOS ' + OS.version, 'acc');
          out('   ╱ ╱  ╲ ╲     Apps: ' + Object.keys(APPS).length + ' (5 sys, 5 games, 1 special)', 'acc');
          out('   ╲ ╲  ╱ ╱     Theme: ' + OS.settings.theme + ', wallpaper: ' + OS.settings.wallpaper, 'acc');
          out('    ╲ ╲╱ ╱      Windows: ' + OS.windows.length + ' open', 'acc');
          out('      ╲╱        Uptime: ' + Math.floor((Date.now() - OS.bootTime) / 1000) + 's', 'acc');
          break;
        case 'history': history.forEach(function (h, i) { out(' ' + pad2(i + 1) + '  ' + h, 'sys'); }); break;
        case 'clear': term.innerHTML = ''; break;
        default: out('Unknown command: /' + cmd + ' — try /help', 'err');
      }
    } else {
      searchApps(line.toLowerCase());
    }
  }

  function pad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }

  function submit() {
    var v = inp.value; inp.value = '';
    run(v);
  }
  win.submitTerm = submit;
  inp.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') submit();
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (history.length) { hIdx = Math.max(0, hIdx - 1); inp.value = history[hIdx] || ''; } }
    else if (e.key === 'ArrowDown') { e.preventDefault(); hIdx = Math.min(history.length, hIdx + 1); inp.value = history[hIdx] || ''; }
  });
  body.addEventListener('pointerdown', function (e) { if (!e.target.closest('.term-line')) setTimeout(function () { inp.focus(); }, 10); });
  setTimeout(function () { inp.focus(); }, 80);
}

function submitTerm(body, win) { if (win && win.submitTerm) win.submitTerm(); }
