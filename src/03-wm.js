/* ============================================================
   Part 03: Window manager — drag, resize, z-ordering, min/max/close.
   ============================================================ */
OS.zTop = 100;
OS.windows = [];

function byId(id) { for (var i = 0; i < OS.windows.length; i++) if (OS.windows[i].id === id) return OS.windows[i]; return null; }

function focusWindow(w) {
  OS.windows.forEach(function (o) { o.el.classList.toggle('focused', o === w); });
  OS.zTop += 1;
  w.el.style.zIndex = OS.zTop;
  OS.focused = w;
  updateDock();
}

function createWindow(opts) {
  var id = 'win' + (OS.winSeq = (OS.winSeq || 0) + 1);
  var layer = $('#windows-layer');
  var frameW = D.documentElement.clientWidth, frameH = D.documentElement.clientHeight - 64;
  var w = opts.width || 720, h = opts.height || 480;
  w = Math.min(w, frameW - 20); h = Math.min(h, frameH - 20);
  var x = opts.x !== undefined ? opts.x : Math.max(10, (frameW - w) / 2 + (OS.winSeq % 5) * 26 - 52);
  var y = opts.y !== undefined ? opts.y : Math.max(10, (frameH - h) / 2 + (OS.winSeq % 5) * 22 - 44);

  var win = el('div', 'window');
  win.id = id;
  win.style.left = x + 'px'; win.style.top = y + 'px';
  win.style.width = w + 'px'; win.style.height = h + 'px';

  var tb = el('div', 'titlebar');
  tb.innerHTML = '<span class="tb-app-ic">' + iconSVG(opts.icon || 'file') + '</span><span class="tb-title">' + esc(opts.title) + '</span>' +
    '<div class="win-btns">' +
    '<button class="win-btn btn-min" title="Minimize"><svg viewBox="0 0 12 12"><line x1="2.5" y1="6" x2="9.5" y2="6" stroke="#5a4500" stroke-width="1.8" stroke-linecap="round"/></svg></button>' +
    '<button class="win-btn btn-max" title="Maximize"><svg viewBox="0 0 12 12"><path d="M3 8 L8 3 M8 3 H4.6 M8 3 V6.4" stroke="#0a4d1e" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg></button>' +
    '<button class="win-btn btn-close" title="Close"><svg viewBox="0 0 12 12"><path d="M3 3 l6 6 M9 3 l-6 6" stroke="#5c1010" stroke-width="1.8" stroke-linecap="round"/></svg></button></div>';

  var body = el('div', 'win-body');
  win.appendChild(tb); win.appendChild(body);
  ['w', 'e', 's', 'se'].forEach(function (dir) {
    var r = el('div', 'resizer rz-' + dir); r.setAttribute('data-rz', dir); win.appendChild(r);
  });
  layer.appendChild(win);

  var W_ = {
    id: id, el: win, body: body, titlebar: tb, appId: opts.appId || null,
    title: opts.title, minimized: false, maximized: false, restore: null,
    onClose: opts.onClose || null, single: opts.single || null
  };
  OS.windows.push(W_);

  /* window control buttons */
  $('.btn-close', tb).addEventListener('click', function (ev) { ev.stopPropagation(); closeWindow(W_); });
  $('.btn-min', tb).addEventListener('click', function (ev) { ev.stopPropagation(); minimizeWindow(W_); });
  $('.btn-max', tb).addEventListener('click', function (ev) { ev.stopPropagation(); toggleMaximize(W_); });
  tb.addEventListener('dblclick', function (ev) { if (!ev.target.closest('.win-btn')) toggleMaximize(W_); });

  /* bring to front on any interaction with the window */
  win.addEventListener('pointerdown', function () { if (OS.focused !== W_) focusWindow(W_); }, true);

  /* dragging via titlebar (pointer capture keeps it smooth off-window) */
  tb.addEventListener('pointerdown', function (ev) {
    if (ev.button !== 0 || ev.target.closest('.win-btn')) return;
    if (W_.maximized) return;
    var sx = ev.clientX, sy = ev.clientY;
    var ox = parseFloat(win.style.left), oy = parseFloat(win.style.top);
    var moved = false;
    tb.setPointerCapture(ev.pointerId);
    function mv(e) {
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      if (!moved) return;
      var nx = clamp(ox + dx, -win.offsetWidth + 90, D.documentElement.clientWidth - 60);
      var ny = clamp(oy + dy, 0, D.documentElement.clientHeight - 64 - 34);
      win.style.left = nx + 'px'; win.style.top = ny + 'px';
    }
    function up(e) {
      tb.removeEventListener('pointermove', mv); tb.removeEventListener('pointerup', up);
      try { tb.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    tb.addEventListener('pointermove', mv); tb.addEventListener('pointerup', up);
  });

  /* resizing from edges/corners */
  $$('.resizer', win).forEach(function (r) {
    r.addEventListener('pointerdown', function (ev) {
      if (ev.button !== 0 || W_.maximized) return;
      ev.preventDefault(); ev.stopPropagation();
      var dir = r.getAttribute('data-rz');
      var sx = ev.clientX, sy = ev.clientY;
      var ox = win.offsetLeft, oy = win.offsetTop, ow = win.offsetWidth, oh = win.offsetHeight;
      r.setPointerCapture(ev.pointerId);
      function mv(e) {
        var dx = e.clientX - sx, dy = e.clientY - sy;
        if (dir.indexOf('e') >= 0 || dir === 'se') win.style.width = Math.max(320, ow + dx) + 'px';
        if (dir === 'w') { var nw = Math.max(320, ow - dx); win.style.width = nw + 'px'; win.style.left = (ox + ow - nw) + 'px'; }
        if (dir === 's' || dir === 'se') win.style.height = Math.max(200, oh + dy) + 'px';
      }
      function up(e) {
        r.removeEventListener('pointermove', mv); r.removeEventListener('pointerup', up);
        try { r.releasePointerCapture(e.pointerId); } catch (err) {}
        OS.emit('winresize', W_);
      }
      r.addEventListener('pointermove', mv); r.addEventListener('pointerup', up);
    });
  });

  focusWindow(W_);
  updateDock();
  if (opts.onMount) opts.onMount(body, W_);
  return W_;
}

function closeWindow(w) {
  w.el.classList.add('closing');
  setTimeout(function () {
    if (w.el.parentNode) w.el.parentNode.removeChild(w.el);
    OS.windows = OS.windows.filter(function (o) { return o !== w; });
    try { if (w.onClose) w.onClose(); } catch (e) { console.error(e); }
    OS.emit('winclose', w);
    updateDock();
  }, 140);
}

function minimizeWindow(w) {
  w.minimized = true;
  w.el.classList.add('minimized');
  OS.focused = null;
  updateDock();
}
function unminimize(w) {
  w.minimized = false;
  w.el.classList.remove('minimized');
  focusWindow(w);
}
function toggleMaximize(w) {
  if (!w.maximized) {
    w.restore = { x: w.el.style.left, y: w.el.style.top, width: w.el.style.width, height: w.el.style.height };
    w.el.style.left = '0px'; w.el.style.top = '0px';
    w.el.style.width = D.documentElement.clientWidth + 'px';
    w.el.style.height = (D.documentElement.clientHeight - 64) + 'px';
    w.maximized = true; w.el.classList.add('maximized');
  } else {
    w.el.style.left = w.restore.x; w.el.style.top = w.restore.y;
    w.el.style.width = w.restore.width; w.el.style.height = w.restore.height;
    w.maximized = false; w.el.classList.remove('maximized');
  }
  OS.emit('winresize', w);
}

/* keep maximized windows fitted on browser resize */
W.addEventListener('resize', function () {
  OS.windows.forEach(function (w) {
    if (w.maximized) {
      w.el.style.width = D.documentElement.clientWidth + 'px';
      w.el.style.height = (D.documentElement.clientHeight - 64) + 'px';
    }
  });
});
