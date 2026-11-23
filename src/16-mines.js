/* ============================================================
   Part 16: Minesweeper — 9x9, 10 mines, flags, flood reveal, timer.
   ============================================================ */
function launchMines() {
  createGameWindow('mines', 'Minesweeper', 'mines', 340, 420, mountMines);
}

function mountMines(api) {
  var win = api.win, ctx = api.ctx;
  var N = 9, MINES = 10, CELL = 34, OX = 17, OY = 58;
  var grid, revealed, flagged, alive, won, firstClick, startTime, endTime, face, flagCount;

  function reset() {
    grid = []; revealed = []; flagged = [];
    for (var r = 0; r < N; r++) {
      grid.push([]); revealed.push([]); flagged.push([]);
      for (var c = 0; c < N; c++) { grid[r].push(0); revealed[r].push(false); flagged[r].push(false); }
    }
    alive = true; won = false; firstClick = true; flagCount = 0;
    startTime = performance.now(); endTime = 0; face = '🙂';
    api.hideOverlay();
    api.help('Left-click reveal · right-click flag · smiley restarts');
  }

  function plantMines(safeR, safeC) {
    var placed = 0, guard = 0;
    while (placed < MINES && guard++ < 2000) {
      var r = rndi(0, N - 1), c = rndi(0, N - 1);
      if (grid[r][c] === -1) continue;
      if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue; /* never die on click 1 */
      grid[r][c] = -1; placed++;
    }
    for (r = 0; r < N; r++) for (c = 0; c < N; c++) {
      if (grid[r][c] === -1) continue;
      var n = 0;
      neighbors(r, c, function (rr, cc) { if (grid[rr][cc] === -1) n++; });
      grid[r][c] = n;
    }
  }
  function neighbors(r, c, fn) {
    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      var rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < N && cc >= 0 && cc < N) fn(rr, cc);
    }
  }

  function reveal(r, c) {
    if (!alive || revealed[r][c] || flagged[r][c]) return;
    if (firstClick) { plantMines(r, c); firstClick = false; }
    revealed[r][c] = true;
    if (grid[r][c] === -1) { boom(); return; }
    if (grid[r][c] === 0) {
      neighbors(r, c, function (rr, cc) { if (!revealed[rr][cc]) reveal(rr, cc); });
    }
    checkWin();
  }
  function chordReveal(r, c) {
    /* middle-click / clicking a satisfied number reveals remaining neighbors */
    if (!alive || !revealed[r][c] || grid[r][c] <= 0) return;
    var nFlags = 0;
    neighbors(r, c, function (rr, cc) { if (flagged[rr][cc]) nFlags++; });
    if (nFlags === grid[r][c]) neighbors(r, c, function (rr, cc) { if (!flagged[rr][cc]) reveal(rr, cc); });
  }
  function toggleFlag(r, c) {
    if (!alive || revealed[r][c]) return;
    flagged[r][c] = !flagged[r][c];
    flagCount += flagged[r][c] ? 1 : -1;
  }
  function boom() {
    alive = false; face = '😵'; endTime = performance.now();
    setTimeout(function () {
      api.showOverlay('<h2>💥 Boom!</h2><p>You hit a mine. The board is revealed below — study it, then try again.</p><button class="btn primary" style="font-size:14px;padding:8px 22px">Retry</button>');
      $('button', api.overlay).addEventListener('click', reset);
    }, 450);
  }
  function checkWin() {
    var hiddenSafe = 0;
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++)
      if (!revealed[r][c] && grid[r][c] !== -1) hiddenSafe++;
    if (hiddenSafe === 0 && alive) {
      alive = false; won = true; face = '😎'; endTime = performance.now();
      var secs = ((endTime - startTime) / 1000).toFixed(1);
      setTimeout(function () {
        api.showOverlay('<h2>🏆 Field cleared!</h2><p>All 10 mines located in <b>' + secs + 's</b>. Flags used: <b>' + flagCount + '</b>.</p><button class="btn primary" style="font-size:14px;padding:8px 22px">Play again</button>');
        $('button', api.overlay).addEventListener('click', reset);
      }, 300);
    }
  }

  var NUMCOL = ['', '#4f9dff', '#3ecf6a', '#ff6b6b', '#b56cff', '#ff9f43', '#2ecc71', '#e84393', '#95a5a6'];
  function draw() {
    ctx.fillStyle = '#141824'; ctx.fillRect(0, 0, 340, 420);
    /* header bar */
    ctx.fillStyle = 'rgba(255,255,255,.06)'; roundRect(ctx, 12, 10, 316, 38, 9);
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#ff6b6b';
    ctx.textAlign = 'left';
    var counter = String(Math.max(-99, MINES - flagCount)).padStart(3, '0');
    ctx.fillText('💣 ' + counter, 24, 35);
    ctx.textAlign = 'right';
    var secs = alive ? (performance.now() - startTime) / 1000 : (endTime - startTime) / 1000;
    if (firstClick && alive) secs = 0;
    ctx.fillStyle = '#9fe8a8';
    ctx.fillText('⏱ ' + pad2(Math.floor(secs / 60)) + ':' + pad2(Math.floor(secs % 60)), 316, 35);
    ctx.textAlign = 'center';
    ctx.font = '20px sans-serif';
    ctx.fillText(face, 170, 38);
    ctx.textAlign = 'left';

    /* field */
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      var x = OX + c * CELL, y = OY + r * CELL;
      if (!revealed[r][c]) {
        var gg = ctx.createLinearGradient(x, y, x, y + CELL);
        gg.addColorStop(0, '#5a6478'); gg.addColorStop(1, '#3c4354');
        ctx.fillStyle = gg;
        roundRect(ctx, x + 1, y + 1, CELL - 2, CELL - 2, 5);
        ctx.fillStyle = 'rgba(255,255,255,.14)';
        roundRect(ctx, x + 3, y + 3, CELL - 6, 4, 2);
        if (flagged[r][c]) {
          ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('🚩', x + CELL / 2, y + CELL / 2 + 6); ctx.textAlign = 'left';
        }
      } else {
        ctx.fillStyle = grid[r][c] === -1 ? '#7c2d33' : '#1d2331';
        roundRect(ctx, x + 1, y + 1, CELL - 2, CELL - 2, 5);
        if (grid[r][c] === -1) {
          ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('💣', x + CELL / 2, y + CELL / 2 + 6); ctx.textAlign = 'left';
        } else if (grid[r][c] > 0) {
          ctx.fillStyle = NUMCOL[grid[r][c]];
          ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center';
          ctx.fillText(String(grid[r][c]), x + CELL / 2, y + CELL / 2 + 6); ctx.textAlign = 'left';
        }
      }
    }
    if (!alive && !won) {
      ctx.fillStyle = 'rgba(255,60,60,' + (0.15 + 0.1 * Math.sin(performance.now() / 120)) + ')';
      ctx.fillRect(OX, OY, N * CELL, N * CELL);
    }
    api.hud.textContent = won ? 'CLEARED' : (alive ? (firstClick ? 'CLICK TO ARM MINES' : 'MINES: ' + MINES) : 'GAME OVER');
  }

  function cellAt(ev) {
    var rect = api.canvas.getBoundingClientRect();
    var sx = 340 / rect.width, sy = 420 / rect.height;
    var mx = (ev.clientX - rect.left) * sx, my = (ev.clientY - rect.top) * sy;
    var c = Math.floor((mx - OX) / CELL), r = Math.floor((my - OY) / CELL);
    if (r < 0 || r >= N || c < 0 || c >= N) return null;
    return { r: r, c: c };
  }

  api.canvas.addEventListener('contextmenu', function (ev) {
    ev.preventDefault();
    var p = cellAt(ev); if (p) toggleFlag(p.r, p.c);
  });
  api.canvas.addEventListener('pointerdown', function (ev) {
    /* face button restart */
    var rect = api.canvas.getBoundingClientRect();
    var sx = 340 / rect.width, sy = 420 / rect.height;
    var mx = (ev.clientX - rect.left) * sx, my = (ev.clientY - rect.top) * sy;
    if (my >= 10 && my <= 48 && mx >= 150 && mx <= 190) { reset(); return; }
    var p = cellAt(ev); if (!p) return;
    if (ev.button === 2) return;
    if (revealed[p.r][p.c]) chordReveal(p.r, p.c);
    else reveal(p.r, p.c);
  });

  function loop() {
    if (!win.el.isConnected) return;
    requestAnimationFrame(loop);
    draw();
  }

  reset();
  requestAnimationFrame(loop);
}
