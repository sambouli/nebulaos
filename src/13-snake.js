/* ============================================================
   Part 13: Snake — grid movement, food, self-collision, score+hi.
   ============================================================ */
function launchSnake() {
  createGameWindow('snake', 'Snake', 'snake', 400, 400, mountSnake);
}

function mountSnake(api) {
  var win = api.win, ctx = api.ctx;
  var N = 20, CELL = 20;
  var snake, dir, nextDir, food, score, best, alive, started, speed, acc, lastT;

  best = Store.get('snakeBest', 0);

  function reset() {
    snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
    dir = { x: 1, y: 0 }; nextDir = dir;
    score = 0; alive = true; started = false; speed = 8; acc = 0; lastT = performance.now();
    placeFood();
    api.hideOverlay();
    api.help('Arrows / WASD to steer · eat the red orbs · do not bite yourself');
    api.showOverlay('<h2>Snake</h2><p>Press an arrow key or WASD to start.</p>');
  }

  function placeFood() {
    var ok = false, guard = 0;
    while (!ok && guard++ < 500) {
      food = { x: rndi(0, N - 1), y: rndi(0, N - 1) };
      ok = !snake.some(function (s) { return s.x === food.x && s.y === food.y; });
    }
  }

  function step() {
    dir = nextDir;
    var head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    /* wall = death (classic) */
    if (head.x < 0 || head.y < 0 || head.x >= N || head.y >= N) return gameOver();
    /* self collision (tail cell vacates this tick unless we just ate) */
    for (var i = 0; i < snake.length - 1; i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) return gameOver();
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      if (score % 50 === 0 && speed < 16) speed += 1;
      placeFood();
    } else {
      snake.pop();
    }
  }

  function gameOver() {
    alive = false;
    if (score > best) { best = score; Store.set('snakeBest', best); }
    api.showOverlay('<h2>Game Over</h2><p>Score: <b>' + score + '</b> · Best: <b>' + best + '</b></p><button class="btn primary" style="font-size:14px;padding:8px 22px">Play again</button>');
    var b = $('button', api.overlay);
    if (b) b.addEventListener('click', reset);
  }

  function draw() {
    ctx.fillStyle = '#10141f'; ctx.fillRect(0, 0, 400, 400);
    ctx.strokeStyle = 'rgba(255,255,255,.045)'; ctx.lineWidth = 1;
    for (var i = 1; i < N; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, 400); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(400, i * CELL); ctx.stroke();
    }
    /* food */
    var pulse = 2 + Math.sin(performance.now() / 150) * 1.5;
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath(); ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 3 + pulse / 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(food.x * CELL + CELL / 2 - 1, food.y * CELL + 2, 2, 4);
    /* snake */
    snake.forEach(function (s, i) {
      var t = i / snake.length;
      ctx.fillStyle = i === 0 ? '#7bed9f' : 'rgb(' + Math.round(46 - 20 * t) + ',' + Math.round(204 - 90 * t) + ',' + Math.round(113 - 50 * t) + ')';
      var pad = i === 0 ? 1 : 2;
      roundRect(ctx, s.x * CELL + pad, s.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 5);
    });
    /* eyes on head */
    var h = snake[0];
    ctx.fillStyle = '#0a2a14';
    var ex = h.x * CELL + CELL / 2 + dir.x * 4, ey = h.y * CELL + CELL / 2 + dir.y * 4;
    ctx.beginPath(); ctx.arc(ex - dir.y * 4, ey - dir.x * 4, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ex + dir.y * 4, ey + dir.x * 4, 2, 0, Math.PI * 2); ctx.fill();
    api.hud.textContent = 'SCORE ' + score + '   BEST ' + best + '   LEN ' + snake.length;
  }

  function loop(t) {
    if (!win.el.isConnected) return;
    requestAnimationFrame(loop);
    var dt = (t - lastT) / 1000; lastT = t;
    if (alive && started) {
      acc += dt;
      while (acc >= 1 / speed) { acc -= 1 / speed; if (alive) step(); }
    }
    draw();
  }

  gameKeyRouter(win, function (e) {
    var k = e.key.toLowerCase();
    var d = null;
    if (k === 'arrowup' || k === 'w') d = { x: 0, y: -1 };
    else if (k === 'arrowdown' || k === 's') d = { x: 0, y: 1 };
    else if (k === 'arrowleft' || k === 'a') d = { x: -1, y: 0 };
    else if (k === 'arrowright' || k === 'd') d = { x: 1, y: 0 };
    if (d) {
      if (!started && alive) { started = true; api.hideOverlay(); }
      /* forbid instant reversal */
      if (d.x !== -dir.x || d.y !== -dir.y) nextDir = d;
    }
  });

  reset();
  requestAnimationFrame(loop);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}
