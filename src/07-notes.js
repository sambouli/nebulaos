/* ============================================================
   Part 07: Notes App — localStorage-persisted notes + .txt export.
   ============================================================ */
function launchNotes() {
  createWindow({ appId: 'notes', title: 'Notes', icon: 'notes', width: 680, height: 460, onMount: mountNotes });
}

function mountNotes(body) {
  var notes = Store.get('notes', [
    { id: 1, title: 'Welcome to Notes', text: 'This note lives in localStorage.\n\nType something, hit Save (or Ctrl+S), then refresh the page — it will still be here.\n\nSave also offers a .txt download via Export.', ts: Date.now() }
  ]);
  var selId = notes.length ? notes[0].id : null;

  body.innerHTML =
    '<div class="app-toolbar">' +
      '<button class="btn primary nb-save">Save</button>' +
      '<button class="btn nb-new">+ New</button>' +
      '<button class="btn nb-export">Export .txt</button>' +
      '<button class="btn danger nb-clear">Clear</button>' +
      '<button class="btn danger nb-del">Delete</button>' +
      '<span style="margin-left:auto;font-size:11.5px;color:var(--text-dim)" class="nb-status"></span>' +
    '</div>' +
    '<div style="display:flex;flex:1;overflow:hidden">' +
      '<div class="notes-list"></div>' +
      '<div class="notes-editor"><textarea spellcheck="false" placeholder="Start typing…"></textarea></div>' +
    '</div>';

  var list = $('.notes-list', body), ta = $('textarea', body), status = $('.nb-status', body);

  function persist() { Store.set('notes', notes); }
  function fmt(ts) {
    var d = new Date(ts);
    return MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getDate() + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }
  function renderList() {
    list.innerHTML = '';
    notes.slice().sort(function (a, b) { return b.ts - a.ts; }).forEach(function (n) {
      var c = el('div', 'note-card' + (n.id === selId ? ' sel' : ''));
      c.innerHTML = '<b>' + esc(n.title || 'Untitled') + '</b><small>' + esc((n.text.split('\n')[0] || '').slice(0, 40)) + ' · ' + fmt(n.ts) + '</small>';
      c.addEventListener('click', function () { selId = n.id; renderAll(); });
      list.appendChild(c);
    });
    if (!notes.length) list.appendChild(el('div', null, '<div style="padding:10px;font-size:12px;color:var(--text-dim)">No notes yet.<br>Click “+ New”.</div>'));
  }
  function current() { for (var i = 0; i < notes.length; i++) if (notes[i].id === selId) return notes[i]; return null; }
  function renderAll() {
    renderList();
    var n = current();
    ta.value = n ? n.text : '';
    ta.disabled = !n;
    status.textContent = n ? 'Last saved ' + fmt(n.ts) : '';
  }

  $('.nb-save', body).addEventListener('click', function () {
    var n = current(); if (!n) { toast('No note selected'); return; }
    n.text = ta.value;
    n.title = (ta.value.split('\n')[0] || 'Untitled').slice(0, 40);
    n.ts = Date.now();
    persist(); renderAll(); toast('Note saved');
  });
  $('.nb-new', body).addEventListener('click', function () {
    var id = Date.now();
    notes.push({ id: id, title: 'New note', text: '', ts: Date.now() });
    selId = id; persist(); renderAll(); ta.focus();
  });
  $('.nb-clear', body).addEventListener('click', function () {
    var n = current(); if (!n) return;
    n.text = ''; ta.value = ''; toast('Editor cleared (use Delete to remove the note)');
  });
  $('.nb-del', body).addEventListener('click', function () {
    notes = notes.filter(function (n) { return n.id !== selId; });
    selId = notes.length ? notes[0].id : null;
    persist(); renderAll(); toast('Note deleted');
  });
  $('.nb-export', body).addEventListener('click', function () {
    var n = current(); if (!n) { toast('No note selected'); return; }
    var blob = new Blob([n.text], { type: 'text/plain' });
    var a = el('a');
    a.href = URL.createObjectURL(blob);
    a.download = (n.title || 'note').replace(/[^a-z0-9_\- ]/gi, '').slice(0, 40).trim().replace(/\s+/g, '_') + '.txt';
    D.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); D.body.removeChild(a); }, 500);
  });

  /* autosave while typing (debounced) so nothing is lost on refresh */
  var deb = null;
  ta.addEventListener('input', function () {
    clearTimeout(deb);
    deb = setTimeout(function () {
      var n = current(); if (!n) return;
      n.text = ta.value;
      n.title = (ta.value.split('\n')[0] || 'Untitled').slice(0, 40);
      n.ts = Date.now();
      persist(); renderList();
      status.textContent = 'Autosaved ' + fmt(n.ts);
    }, 500);
  });
  ta.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); $('.nb-save', body).click(); }
  });

  renderAll();
}
