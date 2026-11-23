/* ============================================================
   Part 12: About app (documents the special feature) + game helpers.
   ============================================================ */
function launchAbout() {
  createWindow({ appId: 'about', title: 'About NebulaOS', icon: 'about', width: 640, height: 560, onMount: mountAbout });
}

function mountAbout(body) {
  body.innerHTML =
    '<div class="about">' +
      '<h1>' + ICONS.os() + ' NebulaOS</h1>' +
      '<div class="ver">Version ' + OS.version + ' · single-file edition · zero external dependencies</div>' +
      '<p>A complete desktop environment — window manager, dock, apps and games — implemented in one self-contained HTML file with vanilla JavaScript, CSS gradients and inline SVG only.</p>' +

      '<h3>System</h3>' +
      '<ul>' +
        '<li><b>Windows:</b> drag by the titlebar, resize from any edge/corner, minimize / maximize / close with the traffic-light buttons. Clicking any window brings it to front (proper z-order stacking).</li>' +
        '<li><b>Dock:</b> shows running apps with an indicator dot; click to focus or minimize. Right-click a dock icon for options.</li>' +
        '<li><b>Desktop:</b> right-click the wallpaper to change the gradient (Aurora, Sunset, Ocean, Forest, Vaporwave), refresh, or toggle Light/Dark mode. Icons are draggable and snap to a grid; positions persist.</li>' +
        '<li><b>Start menu:</b> searchable launcher for every app and game.</li>' +
      '</ul>' +

      '<h3>Built-in apps</h3>' +
      '<ul>' +
        '<li><b>Files</b> — mock filesystem: navigate folders, preview files, create new folders (persisted).</li>' +
        '<li><b>Notes</b> — autosaves to localStorage, Save/Export .txt/Clear.</li>' +
        '<li><b>Mail</b> — inbox with unread markers, reading pane, compose & delete.</li>' +
        '<li><b>Calendar</b> — month view, today highlighted, prev/next navigation, per-day events.</li>' +
        '<li><b>Assistant</b> — terminal: /help /time /weather /apps /open /theme /wallpaper /calc /neofetch … plain words search the app catalog.</li>' +
      '</ul>' +

      '<h3>Games</h3>' +
      '<ul>' +
        '<li><b>Turbo City</b> — top-down driving: WASD/arrows to drive, collect glowing packages, dodge traffic. 3 lives.</li>' +
        '<li><b>Tetris</b> — rotation, line clears, levels, soft/hard drop (Space), game over.</li>' +
        '<li><b>Snake</b> — grid movement, food, self-collision, score.</li>' +
        '<li><b>Flappy</b> — Space/click to flap through pipe gaps.</li>' +
        '<li><b>Minesweeper</b> — 9×9, 10 mines: left-click reveal, right-click flag, counter + timer.</li>' +
      '</ul>' +

      '<h3>★ Special Feature: Quantum Calculator</h3>' +
      '<div class="card">' +
        '<p>Every OS needs one great utility, so this build ships <b>Quantum Calc</b> — a scientific calculator that goes beyond four operations:</p>' +
        '<ul>' +
          '<li><b>History tape:</b> every computation is logged under the display and saved across refreshes. <b>Click any history line to reuse its result</b> as the current value.</li>' +
          '<li><b>Memory register:</b> MC / MR / MS / M+ with the value shown on the display and persisted between sessions.</li>' +
          '<li><b>Scientific keys:</b> sin cos tan (degrees), ln, log₁₀, √, x², x^y, n!, %, π, e, ±, parentheses, mod, Ans.</li>' +
          '<li><b>Full keyboard control:</b> digits, <kbd>+ - * / ^ % ( )</kbd>, <kbd>Enter</kbd> equals, <kbd>Backspace</kbd> delete, <kbd>Esc</kbd> clear, <kbd>R</kbd> memory-recall, <kbd>S</kbd> memory-store — while the calculator window is focused.</li>' +
        '</ul>' +
        '<p>Open it from the dock, Start menu, desktop icon, or by typing <kbd>/open calc</kbd> in the Assistant.</p>' +
      '</div>' +

      '<h3>Tips</h3>' +
      '<ul>' +
        '<li>Double-click a titlebar to maximize/restore.</li>' +
        '<li>The clock in the dock opens Calendar.</li>' +
        '<li>All state (theme, wallpaper, notes, files, events, calc history) survives a page refresh via localStorage.</li>' +
      '</ul>' +
    '</div>';
}

/* ---------- shared game window helper ---------- */
function createGameWindow(appId, title, icon, cw, ch, buildFn) {
  return createWindow({
    appId: appId, title: title, icon: icon,
    width: Math.max(360, cw + 24), height: Math.max(320, ch + 96),
    onMount: function (body, win) {
      body.innerHTML =
        '<div class="app-toolbar">' +
          '<button class="btn primary g-restart">Restart</button>' +
          '<span class="g-help" style="font-size:11.5px;color:var(--text-dim)"></span>' +
        '</div>' +
        '<div class="game-frame"><canvas></canvas><div class="game-hud"></div><div class="game-overlay hidden"></div></div>';
      var frame = $('.game-frame', body), canvas = $('canvas', body);
      canvas.width = cw; canvas.height = ch;
      var hud = $('.game-hud', body), overlay = $('.game-overlay', body);
      var api = {
        canvas: canvas, ctx: canvas.getContext('2d'), hud: hud, overlay: overlay, frame: frame, win: win,
        help: function (t) { $('.g-help', body).innerHTML = t; },
        showOverlay: function (html) { overlay.innerHTML = html; overlay.classList.remove('hidden'); },
        hideOverlay: function () { overlay.classList.add('hidden'); }
      };
      $('.g-restart', body).addEventListener('click', function () { buildFn(api); });
      buildFn(api);
    }
  });
}

/* keep key handling scoped: games only receive keys when their window is focused */
function gameKeyRouter(win, onKeyDown, onKeyUp) {
  function down(e) {
    if (!win.el.isConnected || !OS.focused || OS.focused !== win) return;
    if (D.activeElement && /INPUT|TEXTAREA/.test(D.activeElement.tagName)) return;
    if (onKeyDown(e) !== false) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Spacebar'].indexOf(e.key) >= 0) e.preventDefault();
    }
  }
  function up(e) {
    if (!win.el.isConnected || !OS.focused || OS.focused !== win) return;
    if (onKeyUp) onKeyUp(e);
  }
  D.addEventListener('keydown', down);
  D.addEventListener('keyup', up);
  var prevClose = win.onClose;
  win.onClose = function () {
    D.removeEventListener('keydown', down);
    D.removeEventListener('keyup', up);
    if (prevClose) prevClose();
  };
}
