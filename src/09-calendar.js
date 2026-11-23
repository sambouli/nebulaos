/* ============================================================
   Part 09: Calendar — month grid, today highlight, per-day events.
   ============================================================ */
function launchCalendar() {
  createWindow({ appId: 'calendar', title: 'Calendar', icon: 'calendar', width: 640, height: 560, onMount: mountCalendar });
}

function mountCalendar(body) {
  var now = new Date();
  var viewY = now.getFullYear(), viewM = now.getMonth();
  var selKey = dateKey(now);
  var events = Store.get('events', {});

  function dateKey(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function persist() { Store.set('events', events); }

  body.innerHTML =
    '<div class="cal-wrap">' +
      '<div class="cal-head">' +
        '<div style="display:flex;gap:8px"><button class="btn cal-prev">&larr;</button><button class="btn cal-today">Today</button><button class="btn cal-next">&rarr;</button></div>' +
        '<h2 class="cal-title"></h2>' +
        '<div style="display:flex;gap:6px"><input class="text-input cal-ev-in" placeholder="Add event…" style="width:170px"><button class="btn primary cal-ev-add">Add</button></div>' +
      '</div>' +
      '<div class="cal-grid"></div>' +
      '<div class="cal-day-panel"></div>' +
    '</div>';

  var grid = $('.cal-grid', body), title = $('.cal-title', body), dayPanel = $('.cal-day-panel', body);

  function render() {
    title.textContent = MONTHS[viewM] + ' ' + viewY;
    grid.innerHTML = '';
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(function (d) { grid.appendChild(el('div', 'cal-dow', d)); });
    var first = new Date(viewY, viewM, 1);
    var startDow = first.getDay();
    var daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
    var daysPrev = new Date(viewY, viewM, 0).getDate();
    var todayKey = dateKey(new Date());
    for (var i = 0; i < 42; i++) {
      var dayNum, other = false, m = viewM, y = viewY;
      if (i < startDow) { dayNum = daysPrev - startDow + 1 + i; other = true; m = viewM - 1; if (m < 0) { m = 11; y--; } }
      else if (i - startDow < daysInMonth) { dayNum = i - startDow + 1; }
      else { dayNum = i - startDow - daysInMonth + 1; other = true; m = viewM + 1; if (m > 11) { m = 0; y++; } }
      var key = y + '-' + pad2(m + 1) + '-' + pad2(dayNum);
      var c = el('div', 'cal-cell' + (other ? ' other' : '') + (key === todayKey ? ' today' : '') + (key === selKey ? ' sel' : ''));
      c.textContent = dayNum;
      if (events[key] && events[key].length) c.appendChild(el('span', 'evt-dot'));
      (function (k, isOther) {
        c.addEventListener('click', function () { selKey = k; if (isOther) { var p = k.split('-'); viewY = +p[0]; viewM = +p[1] - 1; } render(); });
      })(key, other);
      grid.appendChild(c);
    }
    renderDay();
  }

  function renderDay() {
    dayPanel.innerHTML = '';
    var p = selKey.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    dayPanel.appendChild(el('h4', null, DAYS[d.getDay()] + ', ' + MONTHS[+p[1] - 1] + ' ' + (+p[2])));
    var evs = events[selKey] || [];
    if (!evs.length) dayPanel.appendChild(el('div', null, '<span style="font-size:12px;color:var(--text-dim)">No events. Type one above and hit Add.</span>'));
    evs.forEach(function (txt, idx) {
      var row = el('div', 'cal-ev');
      row.innerHTML = '<span style="color:var(--warn)">&#9679;</span><span>' + esc(txt) + '</span>';
      var x = el('button', null, '&#10005;');
      x.addEventListener('click', function () { evs.splice(idx, 1); if (!evs.length) delete events[selKey]; persist(); render(); });
      row.appendChild(x);
      dayPanel.appendChild(row);
    });
  }

  function addEvent() {
    var inp = $('.cal-ev-in', body), v = inp.value.trim();
    if (!v) { toast('Type an event first'); return; }
    (events[selKey] = events[selKey] || []).push(v);
    inp.value = ''; persist(); render(); toast('Event added to ' + selKey);
  }
  $('.cal-ev-add', body).addEventListener('click', addEvent);
  $('.cal-ev-in', body).addEventListener('keydown', function (e) { if (e.key === 'Enter') addEvent(); });
  $('.cal-prev', body).addEventListener('click', function () { viewM--; if (viewM < 0) { viewM = 11; viewY--; } render(); });
  $('.cal-next', body).addEventListener('click', function () { viewM++; if (viewM > 11) { viewM = 0; viewY++; } render(); });
  $('.cal-today', body).addEventListener('click', function () {
    var n = new Date(); viewY = n.getFullYear(); viewM = n.getMonth(); selKey = dateKey(n); render();
  });

  /* seed a friendly event on the 1st of this month if calendar is brand new */
  var seedKey = now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-01';
  if (!Object.keys(events).length) { events[seedKey] = ['Welcome to NebulaOS!']; persist(); }

  render();
}
