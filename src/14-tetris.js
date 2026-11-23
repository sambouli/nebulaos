/* ============================================================
   Part 14: Tetris — SRS-ish rotation, line clears, levels, game over.
   ============================================================ */
function launchTetris() {
  createGameWindow('tetris', 'Tetris', 'tetris', 260, 480, mountTetris);
}

var TETRO = {
  I: { m: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], c: '#00c2ff' },
  O: { m: [[1, 1], [1, 1]], c: '#ffd23f' },
  T: { m: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], c: '#b56cff' },
  S: { m: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], c: '#2ecc71' },
  Z: { m: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], c: '#e74c3c' },
  J: { m: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], c: '#3f7fe0' },
  L: { m: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], c: '#ff9f43' }
};

function rotateCW(m) {
  var n = m.length, out = [];
  for (var r = 0; r < n; r++) { out.push([]); for (var c = 0; c < n; c++) out[r].push(m[n - 1 - c][r]); }
  return out;
}

function mountTetris(api) {
  var win = api.win, ctx = api.ctx;
  var COLS = 10, ROWS = 16, CELL = 26;
  var board, piece, next, score, lines, level, alive, started, dropAcc, lastT, flashRows, flashT, best;

  best = Store.get('tetrisBest', 0);

  function emptyBoard() {
    var b = []; for (var r = 0; r < ROWS; r++) { b.push([]); for (var c = 0; c < COLS; c++) b[r].push(null); }
    return b;
  }
  function bag() {
    var ks = Object.keys(TETRO);
    for (var i = ks.length - 1; i > 0; i--) { var j = rndi(0, i); var t = ks[i]; ks[i] = ks[j]; ks[j] = t; }
    return ks;
  }
  var queue = [];
  function pull() { if (!queue.length) queue = bag(); return queue.shift(); }

  function spawn() {
    var kind = next || pull();
    next = pull();
    piece = { kind: kind, m: TETRO[kind].m.map(function (r) { return r.slice(); }), x: Math.floor((COLS - TETRO[kind].m[0].length) / 2), y: 0 };
    if (collides(piece.m, piece.x, piece.y)) { gameOver(); }
  }

  function collides(m, px, py) {
    for (var r = 0; r < m.length; r++) for (var c = 0; c < m[r].length; c++) {
      if (!m[r][c]) continue;
      var x = px + c, y = py + r;
      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y >= 0 && board[y][x]) return true;
    }
    return false;
  }

  function lock() {
    piece.m.forEach(function (row, r) { row.forEach(function (v, c) {
      if (v && piece.y + r >= 0) board[piece.y + r][piece.x + c] = piece.kind;
    }); });
    /* clear full rows */
    var full = [];
    for (var r = 0; r < ROWS; r++) if (board[r].every(function (v) { return v !== null; })) full.push(r);
    if (full.length) {
      flashRows = full; flashT = 0.22;
      full.forEach(function (r) { board.splice(r, 1); var row = []; for (var c = 0; c < COLS; c++) row.push(null); board.unshift(row); });
      lines += full.length;
      score += [0, 100, 300, 500, 800][full.length] * level;
      level = 1 + Math.floor(lines / 10);
    }
    spawn();
  }

  function stepDown() {
    if (!collides(piece.m, piece.x, piece.y + 1)) piece.y++;
    else lock();
  }

  function hardDrop() {
    while (!collides(piece.m, piece.x, piece.y + 1)) { piece.y++; score += 2; }
    lock();
  }

  function tryRotate() {
    var r = rotateCW(piece.m);
    /* simple wall kicks: try offsets */
    var kicks = [0, -1, 1, -2, 2];
    for (var i = 0; i < kicks.length; i++) {
      if (!collides(r, piece.x + kicks[i], piece.y)) { piece.m = r; piece.x += kicks[i]; return; }
    }
  }

  function gameOver() {
    alive = false;
    if (score > best) { best = score; Store.set('tetrisBest', best); }
    api.showOverlay('<h2>Game Over</h2><p>Score <b>' + score + '</b> · Lines <b>' + lines + '</b> · Level <b>' + level + '</b><br>Best: <b>' + best + '</b></p><button class="btn primary" style="font-size:14px;padding:8px 22px">Play again</button>');
    var b = $('button', api.overlay);
    if (b) b.addEventListener('click', reset);
  }

  function reset() {
    board = emptyBoard(); queue = []; next = null;
    score = 0; lines = 0; level = 1; alive = true; started = false;
    dropAcc = 0; lastT = performance.now(); flashRows = null; flashT = 0;
    spawn();
    api.help('← → move · ↑ rotate · ↓ soft drop · Space hard drop · P pause');
    api.showOverlay('<h2>Tetris</h2><p>Press <b>↑</b> or any move key to begin.</p>');
  }

  function drawCell(x, y, kind, ghost) {
    var col = TETRO[kind].c;
    var px = x * CELL, py = y * CELL;
    if (ghost) {
      ctx.strokeStyle = col; ctx.globalAlpha = .35; ctx.lineWidth = 1.5;
      roundRectStroke(ctx, px + 2, py + 2, CELL - 4, CELL - 4, 4);
      ctx.globalAlpha = 1;
      return;
    }
    ctx.fillStyle = col;
    roundRect(ctx, px + 1.5, py + 1.5, CELL - 3, CELL - 3, 4);
    ctx.fillStyle = 'rgba(255,255,255,.28)';
    roundRect(ctx, px + 3.5, py + 3.5, CELL - 7, 5, 2);
  }

  function draw() {
    ctx.fillStyle = '#0d1017'; ctx.fillRect(0, 0, 260, 480);
    ctx.strokeStyle = 'rgba(255,255,255,.05)';
    for (var c = 1; c < COLS; c++) { ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, 480); ctx.stroke(); }
    for (var r = 1; r < ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(260, r * CELL); ctx.stroke(); }
    for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) if (board[r][c]) drawCell(c, r, board[r][c]);
    if (flashT > 0) {
      ctx.fillStyle = 'rgba(255,255,255,' + (flashT / 0.22 * 0.8) + ')';
      (flashRows || []).forEach(function (rr) { ctx.fillRect(0, rr * CELL, 260, CELL); });
    }
    if (alive && piece) {
      /* ghost */
      var gy = piece.y;
      while (!collides(piece.m, piece.x, gy + 1)) gy++;
      piece.m.forEach(function (row, r) { row.forEach(function (v, c) { if (v && gy + r >= 0) drawCell(piece.x + c, gy + r, piece.kind, true); }); });
      piece.m.forEach(function (row, r) { row.forEach(function (v, c) { if (v && piece.y + r >= 0) drawCell(piece.x + c, piece.y + r, piece.kind); }); });
    }
    /* next preview panel */
    ctx.fillStyle = 'rgba(255,255,255,.06)';
    roundRect(ctx, 260 - 78, 6, 72, 72, 8);
    if (next) {
      var m = TETRO[next].m, off = (4 - m.length) * 6;
      m.forEach(function (row, r) { row.forEach(function (v, c) {
        if (v) { ctx.fillStyle = TETRO[next].c; roundRect(ctx, 260 - 70 + c * 14 + off, 14 + r * 14 + off, 12, 12, 3); }
      }); });
    }
    api.hud.textContent = 'SCORE ' + score + '  LINES ' + lines + '  LV ' + level + '  BEST ' + best;
  }

  function loop(t) {
    if (!win.el.isConnected) return;
    requestAnimationFrame(loop);
    var dt = Math.min(.1, (t - lastT) / 1000); lastT = t;
    if (flashT > 0) flashT -= dt;
    if (alive && started) {
      dropAcc += dt;
      var interval = Math.max(0.08, 0.8 - (level - 1) * 0.07);
      while (dropAcc >= interval) { dropAcc -= interval; if (alive) stepDown(); }
    }
    draw();
  }

  gameKeyRouter(win, function (e) {
    if (!alive) return;
    var k = e.key;
    var moved = false;
    if (k === 'ArrowLeft') { if (!collides(piece.m, piece.x - 1, piece.y)) piece.x--; moved = true; }
    else if (k === 'ArrowRight') { if (!collides(piece.m, piece.x + 1, piece.y)) piece.x++; moved = true; }
    else if (k === 'ArrowDown') { stepDown(); score += 1; moved = true; }
    else if (k === 'ArrowUp') { tryRotate(); moved = true; }
    else if (k === ' ' || k === 'Spacebar') { hardDrop(); moved = true; }
    else if (k.toLowerCase() === 'p') { started = !started; if (!started) api.showOverlay('<h2>Paused</h2><p>Press P to resume.</p>'); else api.hideOverlay(); }
    if (moved && !started) { started = true; api.hideOverlay(); }
  });

  reset();
  requestAnimationFrame(loop);
}

function roundRectStroke(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.stroke();
}
