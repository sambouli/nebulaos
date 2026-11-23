/* ============================================================
   Part 08: Mail Client — inbox, reading pane, compose.
   ============================================================ */
function defaultMail() {
  return [
    { id: 1, from: 'Nebula Team', addr: 'team@nebulaos.local', subj: 'Welcome to NebulaOS', time: '09:12', unread: true,
      body: 'Hi there,\n\nWelcome aboard NebulaOS 1.0. Everything you see — the window manager, the dock, the five apps and five games — runs from a single HTML file with zero external dependencies.\n\nA few things worth trying:\n• Right-click the desktop for wallpapers and dark/light mode.\n• Open the Assistant and type /help.\n• Beat us at Minesweeper (9x9, 10 mines. Good luck.)\n\n— The Nebula Team' },
    { id: 2, from: 'Captain Pixel', addr: 'pixel@arcade.local', subj: 'High score challenge: Snake', time: '08:47', unread: true,
      body: 'Word on the street is you think you can beat my Snake score of 140.\n\nBring it. I will be waiting by the arcade cabinet, arms crossed, wearing my signature visor.\n\nControls: arrows or WASD. Do NOT bite yourself. It never ends well.' },
    { id: 3, from: 'Grid City PD', addr: 'dispatch@gridcity.gov', subj: 'Traffic advisory: Main St closed', time: 'yesterday', unread: false,
      body: 'Dear driver,\n\nMain Street is closed between 5th and 9th for a parade of extremely slow trucks. Expect congestion in Turbo City and plan your routes accordingly.\n\nRemember: hitting pedestrians costs lives. Actual game lives. Please stop testing this.' },
    { id: 4, from: 'Mom', addr: 'mom@home.local', subj: 'Did you eat?', time: 'yesterday', unread: false,
      body: 'I know you say you are "just about to" eat.\n\nThat has been the status since Tuesday.\n\nLove, Mom who can see you through the screen (metaphorically. mostly.)' },
    { id: 5, from: 'Tetris Analytics', addr: 'stats@blockline.io', subj: 'Your weekly block report is ready', time: 'Mon', unread: false,
      body: 'This week you placed 1,204 blocks, cleared 61 lines, and rotated into a wall 14 times.\n\nWe believe in you anyway.\n\nUpgrade to Tetris PRO for guilt-free stacking and premium rotation analytics.' },
    { id: 6, from: 'Minesweeper Weekly', addr: 'digest@minesweep.press', subj: 'Top 10 strategies to never lose', time: 'Mon', unread: false,
      body: 'In this issue:\n\n1. The flag is your friend.\n2. Numbers do not lie.\n3. Corners are cozy and suspicious.\n4. If you click a mine it was definitely a bug.\n\nRead more at minesweep.press (a fictional publication).' }
  ];
}

function launchMail() {
  createWindow({ appId: 'mail', title: 'Mail', icon: 'mail', width: 820, height: 540, onMount: mountMail });
}

function mountMail(body) {
  var mail = Store.get('mail', null) || defaultMail();
  var readIds = Store.get('mailRead', []);
  var selId = null;
  function persist() { Store.set('mail', mail); Store.set('mailRead', readIds); }

  body.innerHTML =
    '<div class="app-toolbar">' +
      '<button class="btn primary mc-compose">Compose</button>' +
      '<button class="btn mc-refresh">Refresh</button>' +
      '<span style="margin-left:auto;font-size:11.5px;color:var(--text-dim)" class="mc-count"></span>' +
    '</div>' +
    '<div style="display:flex;flex:1;overflow:hidden">' +
      '<div class="mail-list"></div>' +
      '<div class="mail-read"><div class="mail-empty" style="height:100%"><span style="font-size:34px">&#9993;</span>Select an email to read</div></div>' +
    '</div>' +
    '<div class="modal mc-modal"><div class="modal-card">' +
      '<h3>New message</h3>' +
      '<input class="text-input mc-to" placeholder="To">' +
      '<input class="text-input mc-subj" placeholder="Subject">' +
      '<textarea class="text-input mc-body" rows="6" placeholder="Message…" style="resize:vertical;font-family:var(--mono)"></textarea>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end">' +
        '<button class="btn mc-cancel">Cancel</button>' +
        '<button class="btn primary mc-send">Send</button>' +
      '</div>' +
    '</div></div>';

  var list = $('.mail-list', body), read = $('.mail-read', body);

  function renderList() {
    list.innerHTML = '';
    mail.slice().reverse().forEach(function (m) {
      var r = el('div', 'mail-row' + (readIds.indexOf(m.id) < 0 ? ' unread' : '') + (m.id === selId ? ' sel' : ''));
      r.innerHTML = '<div class="from"><span>' + esc(m.from) + '</span><span class="t">' + esc(m.time) + '</span></div>' +
        '<div class="subj">' + esc(m.subj) + '</div>' +
        '<div class="prev">' + esc(m.body.split('\n')[0]) + '</div>';
      r.addEventListener('click', function () { open(m.id); });
      list.appendChild(r);
    });
    var unread = mail.filter(function (m) { return readIds.indexOf(m.id) < 0; }).length;
    $('.mc-count', body).textContent = mail.length + ' messages · ' + unread + ' unread';
  }
  function open(id) {
    selId = id;
    if (readIds.indexOf(id) < 0) { readIds.push(id); persist(); }
    var m = null; mail.forEach(function (x) { if (x.id === id) m = x; });
    if (!m) return;
    read.innerHTML = '<h2>' + esc(m.subj) + '</h2>' +
      '<div class="meta">From <b>' + esc(m.from) + '</b> &lt;' + esc(m.addr) + '&gt; · ' + esc(m.time) + '</div>' +
      '<div class="body-txt">' + esc(m.body) + '</div>' +
      '<div style="margin-top:22px;display:flex;gap:8px"><button class="btn mr-reply">Reply</button><button class="btn danger mr-del">Delete</button></div>';
    $('.mr-reply', read).addEventListener('click', function () { openCompose('Re: ' + m.subj, m.addr, '\n\n--- On ' + m.time + ', ' + m.from + ' wrote:\n> ' + m.body.split('\n').join('\n> ')); });
    $('.mr-del', read).addEventListener('click', function () {
      mail = mail.filter(function (x) { return x.id !== id; });
      selId = null; persist();
      read.innerHTML = '<div class="mail-empty" style="height:100%">Deleted</div>';
      renderList(); toast('Message deleted');
    });
    renderList();
  }
  function openCompose(subj, to, bodyTxt) {
    $('.mc-subj', body).value = subj || '';
    $('.mc-to', body).value = to || '';
    $('.mc-body', body).value = bodyTxt || '';
    $('.mc-modal', body).classList.add('show');
    setTimeout(function () { $('.mc-body', body).focus(); }, 80);
  }
  $('.mc-compose', body).addEventListener('click', function () { openCompose('', '', ''); });
  $('.mc-cancel', body).addEventListener('click', function () { $('.mc-modal', body).classList.remove('show'); });
  $('.mc-send', body).addEventListener('click', function () {
    var to = $('.mc-to', body).value.trim(), sj = $('.mc-subj', body).value.trim(), bd = $('.mc-body', body).value;
    if (!sj && !bd) { toast('Nothing to send'); return; }
    var now = new Date();
    mail.push({ id: Date.now(), from: 'You', addr: 'you@nebulaos.local', subj: sj || '(no subject)', time: pad2(now.getHours()) + ':' + pad2(now.getMinutes()), unread: false, body: bd });
    readIds.push(mail[mail.length - 1].id);
    persist();
    $('.mc-modal', body).classList.remove('show');
    renderList();
    toast('Message sent (to ' + (to || 'nobody, honestly') + ')');
  });
  $('.mc-refresh', body).addEventListener('click', function () {
    renderList(); toast('Inbox up to date');
  });

  renderList();
}
