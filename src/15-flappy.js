/* ============================================================
   Part 15: Flappy Bird — gravity physics, pipes, scoring.
   ============================================================ */
function launchFlappy() {
  createGameWindow('flappy', 'Flappy', 'flappy', 360, 480, mountFlappy);
}

function mountFlappy(api) {
  var win = api.win, ctx = api.ctx;
  var W = 360, H = 480;
  var bird, pipes, score, best, alive, started, lastT, frame;
  best = Store.get('flappyBest', 0);

  function reset() {
    bird = { x: 90, y: H / 2, vy: 0, r: 13, rot: 0 };
    pipes = []; score = 0; alive = true; started = false; frame = 0;
    lastT = performance.now();
    api.help('Space / click to flap · thread the gaps');
    api.showOverlay('<h2>Flappy</h2><p>Press <b>Space</b> or click to flap.</p>');
  }

  function addPipe() {
    var gap = 130 - Math.min(30, score * 2);
    var gapY = rndi(70 + gap / 2, H - 70 - gap / 2);
    pipes.push({ x: W + 30, gapY: gapY, gap: gap, passed: false });
  }

  function flap() {
    if (!alive) return;
    if (!started) { started = true; api.hideOverlay(); }
    bird.vy = -330;
  }

  function die() {
    if (!alive) return;
    alive = false;
    if (score > best) { best = score; Store.set('flappyBest', best); }
    api.showOverlay('<h2>Splat!</h2><p>Score: <b>' + score + '</b> · Best: <b>' + best + '</b></p><button class="btn primary" style="font-size:14px;padding:8px 22px">Fly again</button>');
    var b = $('button', api.overlay);
    if (b) b.addEventListener('click', reset);
  }

  function update(dt) {
    if (!alive || !started) return;
    frame++;
    bird.vy += 1050 * dt;
    bird.y += bird.vy * dt;
    bird.rot = clamp(bird.vy / 600, -0.45, 1.2);
    if (bird.y + bird.r > H - 46) { bird.y = H - 46 - bird.r; return die(); }
    if (bird.y - bird.r < 0) { bird.y = bird.r; bird.vy = 0; }

    var speed = 150 + Math.min(80, score * 4);
    if (frame % Math.round(110 - Math.min(35, score * 2)) === 0) addPipe();
    for (var i = pipes.length - 1; i >= 0; i--) {
      var p = pipes[i];
      p.x -= speed * dt;
      if (p.x < -70) { pipes.splice(i, 1); continue; }
      /* collision: circle vs two rects approximated with AABB of bird */
      if (bird.x + bird.r > p.x && bird.x - bird.r < p.x + 52) {
        if (bird.y - bird.r < p.gapY - p.gap / 2 || bird.y + bird.r > p.gapY + p.gap / 2) return die();
      }
      if (!p.passed && p.x + 52 < bird.x - bird.r) { p.passed = true; score++; }
    }
  }

  function draw() {
    /* sky */
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2e4a8f'); g.addColorStop(.7, '#4d79c7'); g.addColorStop(1, '#7fb2e5');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    /* stars/dots parallax */
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    for (var i = 0; i < 14; i++) {
      var sx = ((i * 97 - (performance.now() / 60 * (0.2 + (i % 3) * 0.1))) % (W + 20) + W + 20) % (W + 20) - 10;
      ctx.beginPath(); ctx.arc(sx, 30 + (i * 53) % 180, 1.6 + (i % 3), 0, Math.PI * 2); ctx.fill();
    }
    /* pipes */
    pipes.forEach(function (p) {
      var topH = p.gapY - p.gap / 2, botY = p.gapY + p.gap / 2;
      var pg = ctx.createLinearGradient(p.x, 0, p.x + 52, 0);
      pg.addColorStop(0, '#1e8f4e'); pg.addColorStop(.5, '#2ecc71'); pg.addColorStop(1, '#177a41');
      ctx.fillStyle = pg;
      ctx.fillRect(p.x, 0, 52, topH);
      ctx.fillRect(p.x, botY, 52, H - 46 - botY);
      ctx.fillStyle = '#14683a';
      ctx.fillRect(p.x - 3, topH - 16, 58, 16);
      ctx.fillRect(p.x - 3, botY, 58, 16);
    });
    /* ground */
    ctx.fillStyle = '#c9b458'; ctx.fillRect(0, H - 46, W, 46);
    ctx.fillStyle = '#8a7a35';
    for (var gx = -(performance.now() / 8 % 24); gx < W; gx += 24) ctx.fillRect(gx, H - 46, 12, 6);
    /* bird */
    ctx.save();
    ctx.translate(bird.x, bird.y); ctx.rotate(bird.rot);
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); ctx.arc(0, 0, bird.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e6b800';
    var wing = Math.sin(performance.now() / 70) * 5;
    ctx.beginPath(); ctx.ellipse(-3, 2 + wing / 3, 7, 4.5, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8a2a';
    ctx.beginPath(); ctx.moveTo(bird.r - 3, -2); ctx.lineTo(bird.r + 7, 1); ctx.lineTo(bird.r - 3, 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(5, -4, 4.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(6.4, -4, 2.1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    /* score */
    ctx.fillStyle = '#fff'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(String(score), W / 2, 60);
    ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 2; ctx.strokeText(String(score), W / 2, 60);
    ctx.textAlign = 'left';
    api.hud.textContent = 'SCORE ' + score + '   BEST ' + best;
  }

  function loop(t) {
    if (!win.el.isConnected) return;
    requestAnimationFrame(loop);
    var dt = Math.min(.05, (t - lastT) / 1000); lastT = t;
    update(dt); draw();
  }

  gameKeyRouter(win, function (e) {
    if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'ArrowUp') flap();
  });
  api.canvas.addEventListener('pointerdown', function () { flap(); });
  api.canvas.style.cursor = 'pointer';

  reset();
  requestAnimationFrame(loop);
}
