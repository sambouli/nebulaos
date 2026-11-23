/* ============================================================
   Part 17: Turbo City — top-down driving: city grid, traffic AI,
   package pickups, lives, camera follow.
   ============================================================ */
function launchGTA() {
  createGameWindow('gta', 'Turbo City', 'gta', 640, 420, mountGTA);
}

function mountGTA(api) {
  var win = api.win, ctx = api.ctx;
  var VW = 640, VH = 420;
  var BLOCK = 320, ROAD = 96, GRIDN = 5; /* 5x5 blocks => world */
  var WORLD = BLOCK * GRIDN;
  var player, traffic, packages, keys, score, lives, alive, started, lastT, cam, best, skids;

  best = Store.get('gtaBest', 0);

  function isRoad(x, y) {
    var m = function (v) { return ((v % BLOCK) + BLOCK) % BLOCK; };
    return m(x) < ROAD || m(y) < ROAD;
  }
  function roadCenterCoord(v) {
    /* nearest lane center for a coordinate on the road network */
    var b = Math.floor(v / BLOCK);
    var local = v - b * BLOCK;
    if (local < ROAD) return b * BLOCK + ROAD / 2;
    return b * BLOCK + ROAD / 2;
  }
  function snapToLane(x, y) {
    var mx = ((x % BLOCK) + BLOCK) % BLOCK, my = ((y % BLOCK) + BLOCK) % BLOCK;
    if (mx < ROAD && my < ROAD) return { x: Math.floor(x / BLOCK) * BLOCK + ROAD / 2, y: Math.floor(y / BLOCK) * BLOCK + ROAD / 2, cross: true };
    if (mx < ROAD) return { x: Math.floor(x / BLOCK) * BLOCK + ROAD / 2, y: y, cross: false };
    return { x: x, y: Math.floor(y / BLOCK) * BLOCK + ROAD / 2, cross: false };
  }

  function spawnPackage() {
    var guard = 0, p;
    do {
      p = { x: rnd(ROAD / 2, WORLD - ROAD / 2), y: rnd(ROAD / 2, WORLD - ROAD / 2) };
      guard++;
    } while (!isRoad(p.x, p.y) && guard < 800);
    if (!isRoad(p.x, p.y)) { /* fallback: intersection */
      p.x = rndi(0, GRIDN - 1) * BLOCK + ROAD / 2;
      p.y = rndi(0, GRIDN - 1) * BLOCK + ROAD / 2;
    }
    packages.push({ x: p.x, y: p.y, t: 0 });
  }

  function makeCar(forceDir) {
    /* spawn on a random road segment away from player */
    var horiz = Math.random() < .5;
    var line = rndi(0, GRIDN - 1) * BLOCK + ROAD / 2;
    var along = rnd(0, WORLD);
    var off = (Math.random() < .5 ? -1 : 1) * 22;
    var c = horiz
      ? { x: along, y: line + off, dir: off > 0 ? Math.PI : 0, speed: rnd(60, 110), horiz: true }
      : { x: line + off, y: along, dir: off > 0 ? -Math.PI / 2 : Math.PI / 2, speed: rnd(60, 110), horiz: false };
    if (forceDir !== undefined) c.dir = forceDir;
    c.w = 38; c.h = 20;
    c.color = ['#e74c3c', '#3498db', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c'][rndi(0, 5)];
    return c;
  }

  function reset() {
    player = { x: ROAD / 2, y: ROAD / 2 + BLOCK, angle: 0, speed: 0, w: 38, h: 20 };
    traffic = [];
    for (var i = 0; i < 14; i++) traffic.push(makeCar());
    packages = []; score = 0; lives = 3; alive = true; started = false;
    keys = {}; skids = [];
    cam = { x: 0, y: 0 };
    lastT = performance.now();
    spawnPackage(); spawnPackage(); spawnPackage();
    api.help('WASD / arrows to drive · deliver glowing 📦 packages · avoid traffic · 3 lives');
    api.showOverlay('<h2>Turbo City</h2><p>Drive with <b>WASD</b> or arrow keys.<br>Collect the pulsing packages, dodge traffic.<br>Press any drive key to start.</p>');
  }

  function respawn() {
    player.x = ROAD / 2; player.y = ROAD / 2 + BLOCK; player.angle = 0; player.speed = 0;
    /* clear cars near respawn */
    traffic = traffic.filter(function (t) { return dist(t.x, t.y, player.x, player.y) > 140; });
  }

  function dist(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); }

  function carHitsWall(x, y, angle) {
    /* check the 4 corners of the car rect against non-road */
    var cos = Math.cos(angle), sin = Math.sin(angle);
    var pts = [[-19, -10], [19, -10], [19, 10], [-19, 10]];
    for (var i = 0; i < pts.length; i++) {
      var px = x + pts[i][0] * cos - pts[i][1] * sin;
      var py = y + pts[i][0] * sin + pts[i][1] * cos;
      if (!isRoad(px, py)) return true;
    }
    return false;
  }

  function crash() {
    if (!alive) return;
    lives--;
    skids.push({ x: player.x, y: player.y, t: 1 });
    if (lives <= 0) {
      alive = false;
      if (score > best) { best = score; Store.set('gtaBest', best); }
      api.showOverlay('<h2>🚨 Busted!</h2><p>Score: <b>' + score + '</b> · Best: <b>' + best + '</b></p><button class="btn primary" style="font-size:14px;padding:8px 22px">Drive again</button>');
      $('button', api.overlay).addEventListener('click', reset);
    } else {
      toast2('Crash! ' + lives + ' lives left');
      respawn();
    }
  }
  var toastTimer = null;
  function toast2(msg) {
    api.overlay.classList.remove('hidden');
    api.overlay.style.background = 'transparent';
    api.overlay.innerHTML = '<div style="background:rgba(200,40,40,.85);padding:10px 26px;border-radius:12px;font-size:16px;font-weight:700">' + msg + '</div>';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { if (alive) { api.hideOverlay(); api.overlay.style.background = ''; } }, 1100);
  }

  function update(dt) {
    if (!alive || !started) return;
    /* --- player physics --- */
    var accel = 0, steer = 0;
    if (keys.up) accel = 1; if (keys.down) accel = -0.7;
    if (keys.left) steer = -1; if (keys.right) steer = 1;
    player.speed += accel * 300 * dt;
    player.speed *= (1 - 1.6 * dt); /* friction */
    player.speed = clamp(player.speed, -120, 260);
    if (Math.abs(player.speed) > 8) {
      player.angle += steer * 2.6 * dt * clamp(Math.abs(player.speed) / 160, 0.25, 1) * (player.speed >= 0 ? 1 : -1);
    }
    var nx = player.x + Math.cos(player.angle) * player.speed * dt;
    var ny = player.y + Math.sin(player.angle) * player.speed * dt;
    nx = clamp(nx, 20, WORLD - 20); ny = clamp(ny, 20, WORLD - 20);
    if (carHitsWall(nx, ny, player.angle)) {
      /* scrape along wall: kill most of the speed, try axis-separated moves */
      player.speed *= -0.25;
      if (!carHitsWall(nx, player.y, player.angle)) player.x = nx;
      else if (!carHitsWall(player.x, ny, player.angle)) player.y = ny;
      if (Math.abs(player.speed) > 200) crash();
    } else {
      player.x = nx; player.y = ny;
    }
    if (Math.abs(player.speed) > 190 && (keys.left || keys.right) && Math.random() < .4) {
      skids.push({ x: player.x, y: player.y, t: .5, skid: true });
    }

    /* --- traffic --- */
    traffic.forEach(function (t) {
      var tx = t.x + Math.cos(t.dir) * t.speed * dt;
      var ty = t.y + Math.sin(t.dir) * t.speed * dt;
      if (!isRoad(tx, ty)) {
        /* reached an intersection edge: turn or continue */
        var s = snapToLane(t.x, t.y);
        t.x = s.x; t.y = s.y;
        var turns = [t.dir, t.dir + Math.PI / 2, t.dir - Math.PI / 2];
        var opts = turns.filter(function (d) {
          var fx = t.x + Math.cos(d) * 60, fy = t.y + Math.sin(d) * 60;
          return isRoad(fx, fy);
        });
        t.dir = opts.length ? opts[rndi(0, opts.length - 1)] : t.dir + Math.PI;
      } else { t.x = tx; t.y = ty; }
      /* wrap around world */
      if (t.x < -40) t.x = WORLD + 30; if (t.x > WORLD + 40) t.x = -30;
      if (t.y < -40) t.y = WORLD + 30; if (t.y > WORLD + 40) t.y = -30;
      /* collision with player (circle approx) */
      if (alive && dist(t.x, t.y, player.x, player.y) < 30) crash();
    });
    if (traffic.length < 14 && Math.random() < .02) traffic.push(makeCar());

    /* --- packages --- */
    packages.forEach(function (p) { p.t += dt; });
    for (var i = packages.length - 1; i >= 0; i--) {
      if (dist(packages[i].x, packages[i].y, player.x, player.y) < 28) {
        packages.splice(i, 1);
        score += 100;
        toast2('📦 +100');
        spawnPackage();
      }
    }
    while (packages.length < 3) spawnPackage();

    /* skid fade */
    skids.forEach(function (s) { s.t -= dt; });
    skids = skids.filter(function (s) { return s.t > 0; });

    /* camera follows with smoothing */
    cam.x += (player.x - VW / 2 - cam.x) * Math.min(1, 6 * dt);
    cam.y += (player.y - VH / 2 - cam.y) * Math.min(1, 6 * dt);
    cam.x = clamp(cam.x, -40, WORLD - VW + 40);
    cam.y = clamp(cam.y, -40, WORLD - VH + 40);
  }

  function drawCar(x, y, angle, color, isPlayer) {
    ctx.save();
    ctx.translate(x - cam.x, y - cam.y);
    ctx.rotate(angle);
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    roundRect(ctx, -18, -8, 38, 20, 5);
    ctx.fillStyle = color;
    roundRect(ctx, -19, -10, 38, 20, 5);
    ctx.fillStyle = 'rgba(20,25,40,.85)';
    roundRect(ctx, -6, -7, 12, 14, 3);
    ctx.fillStyle = '#fff8dc';
    ctx.fillRect(16, -8, 3, 5); ctx.fillRect(16, 3, 3, 5);
    ctx.fillStyle = '#ff5f57';
    ctx.fillRect(-19, -8, 2.5, 5); ctx.fillRect(-19, 3, 2.5, 5);
    if (isPlayer) {
      ctx.strokeStyle = 'rgba(120,200,255,.8)'; ctx.lineWidth = 1.6;
      ctx.strokeRect(-20, -11, 40, 22);
    }
    ctx.restore();
  }

  function draw() {
    /* grass base */
    ctx.fillStyle = '#1c3a24'; ctx.fillRect(0, 0, VW, VH);
    /* roads: draw each horizontal & vertical band in view */
    ctx.fillStyle = '#3a3f4a';
    var c0 = Math.floor(cam.x / BLOCK) - 1, c1 = Math.ceil((cam.x + VW) / BLOCK) + 1;
    var r0 = Math.floor(cam.y / BLOCK) - 1, r1 = Math.ceil((cam.y + VH) / BLOCK) + 1;
    for (var gy = r0; gy <= r1; gy++) {
      ctx.fillRect(0, gy * BLOCK - cam.y, VW, ROAD);
    }
    for (var gx = c0; gx <= c1; gx++) {
      ctx.fillRect(gx * BLOCK - cam.x, 0, ROAD, VH);
    }
    /* lane dashes */
    ctx.strokeStyle = 'rgba(255,220,120,.55)'; ctx.lineWidth = 2; ctx.setLineDash([14, 18]);
    for (gy = r0; gy <= r1; gy++) {
      var yy = gy * BLOCK + ROAD / 2 - cam.y;
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(VW, yy); ctx.stroke();
    }
    for (gx = c0; gx <= c1; gx++) {
      var xx = gx * BLOCK + ROAD / 2 - cam.x;
      ctx.beginPath(); ctx.moveTo(xx, 0); ctx.lineTo(xx, VH); ctx.stroke();
    }
    ctx.setLineDash([]);
    /* building blocks (draw pseudo-buildings per block cell) */
    for (gy = r0; gy <= r1; gy++) for (gx = c0; gx <= c1; gx++) {
      var bx = gx * BLOCK + ROAD - cam.x, by = gy * BLOCK + ROAD - cam.y;
      var bw = BLOCK - ROAD, bh = BLOCK - ROAD;
      if (bx > VW || by > VH || bx + bw < 0 || by + bh < 0) continue;
      var seed = (gx * 73856093 ^ gy * 19349663) >>> 0;
      var hue = seed % 40 + 200;
      ctx.fillStyle = 'hsl(' + hue + ',18%,26%)';
      roundRect(ctx, bx + 8, by + 8, bw - 16, bh - 16, 8);
      /* windows */
      ctx.fillStyle = 'rgba(255,230,150,' + (0.10 + ((seed >> 3) % 10) / 90) + ')';
      for (var wy = 0; wy < 4; wy++) for (var wx = 0; wx < 4; wx++) {
        if (((seed >> (wx * 4 + wy)) & 1)) ctx.fillRect(bx + 22 + wx * ((bw - 44) / 3), by + 22 + wy * ((bh - 44) / 3), 10, 10);
      }
    }
    /* skids */
    skids.forEach(function (s) {
      ctx.fillStyle = 'rgba(20,20,20,' + (s.t * (s.skid ? .5 : .8)) + ')';
      ctx.beginPath(); ctx.arc(s.x - cam.x, s.y - cam.y, s.skid ? 4 : 10, 0, Math.PI * 2); ctx.fill();
    });
    /* packages */
    packages.forEach(function (p) {
      var bob = Math.sin(p.t * 4) * 3;
      var px = p.x - cam.x, py = p.y - cam.y + bob;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Math.sin(p.t * 2) * .2);
      ctx.fillStyle = '#ffb64d'; roundRect(ctx, -10, -10, 20, 20, 4);
      ctx.strokeStyle = '#8a5b1a'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, 10); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,210,120,' + (0.4 + 0.3 * Math.sin(p.t * 5)) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px, py, 16 + Math.sin(p.t * 5) * 3, 0, Math.PI * 2); ctx.stroke();
    });
    /* traffic + player */
    traffic.forEach(function (t) { drawCar(t.x, t.y, t.dir, t.color, false); });
    drawCar(player.x, player.y, player.angle, '#e63946', true);
    /* minimap */
    var MM = 92, MX = VW - MM - 10, MY = VH - MM - 10;
    ctx.fillStyle = 'rgba(10,14,22,.75)';
    roundRect(ctx, MX - 3, MY - 3, MM + 6, MM + 6, 8);
    ctx.fillStyle = '#243040';
    ctx.fillRect(MX, MY, MM, MM);
    ctx.fillStyle = '#556070';
    for (var i = 0; i <= GRIDN; i++) {
      ctx.fillRect(MX + (i * BLOCK / WORLD) * MM - 1, MY, 2.4, MM);
      ctx.fillRect(MX, MY + (i * BLOCK / WORLD) * MM - 1, MM, 2.4);
    }
    packages.forEach(function (p) {
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(MX + (p.x / WORLD) * MM - 1.5, MY + (p.y / WORLD) * MM - 1.5, 3, 3);
    });
    ctx.fillStyle = '#ff5f57';
    ctx.fillRect(MX + (player.x / WORLD) * MM - 2, MY + (player.y / WORLD) * MM - 2, 4, 4);
    /* hud */
    api.hud.textContent = 'SCORE ' + score + '   LIVES ' + '❤'.repeat(Math.max(0, lives)) + '   BEST ' + best + '   SPEED ' + Math.round(Math.abs(player.speed)) + ' km/h';
  }

  function loop(t) {
    if (!win.el.isConnected) return;
    requestAnimationFrame(loop);
    var dt = Math.min(.05, (t - lastT) / 1000); lastT = t;
    update(dt); draw();
  }

  gameKeyRouter(win, function (e) {
    var k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') { keys.up = 1; startIfNeeded(); }
    else if (k === 's' || k === 'arrowdown') { keys.down = 1; startIfNeeded(); }
    else if (k === 'a' || k === 'arrowleft') { keys.left = 1; startIfNeeded(); }
    else if (k === 'd' || k === 'arrowright') { keys.right = 1; startIfNeeded(); }
  }, function (e) {
    var k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') keys.up = 0;
    else if (k === 's' || k === 'arrowdown') keys.down = 0;
    else if (k === 'a' || k === 'arrowleft') keys.left = 0;
    else if (k === 'd' || k === 'arrowright') keys.right = 0;
  });
  function startIfNeeded() {
    if (!started && alive) { started = true; api.hideOverlay(); api.overlay.style.background = ''; }
  }

  reset();
  requestAnimationFrame(loop);
}
