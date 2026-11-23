'use strict';
/* ============================================================
   NebulaOS — a browser operating system in one file.
   Part 01: core utilities + system state
   ============================================================ */
var W = window, D = document;
var OS = { version: '1.0.0', name: 'NebulaOS', bootTime: Date.now() };

function el(tag, cls, html) {
  var e = D.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined && html !== null) e.innerHTML = html;
  return e;
}
function $(sel, root) { return (root || D).querySelector(sel); }
function $$(sel, root) { return Array.prototype.slice.call((root || D).querySelectorAll(sel)); }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function rnd(a, b) { return a + Math.random() * (b - a); }
function rndi(a, b) { return Math.floor(rnd(a, b + 1)); }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function pad2(n) { return (n < 10 ? '0' : '') + n; }

/* namespaced localStorage with graceful fallback */
var Store = (function () {
  var mem = {};
  var ok = false;
  try { window.localStorage.setItem('__nb_test', '1'); window.localStorage.removeItem('__nb_test'); ok = true; } catch (e) { ok = false; }
  return {
    get: function (k, dflt) {
      try {
        var v = ok ? window.localStorage.getItem('nebula.' + k) : mem[k];
        return v === null || v === undefined ? dflt : JSON.parse(v);
      } catch (e) { return dflt; }
    },
    set: function (k, v) {
      var s = JSON.stringify(v);
      try { if (ok) window.localStorage.setItem('nebula.' + k, s); else mem[k] = s; }
      catch (e) { mem[k] = s; }
    },
    del: function (k) {
      try { if (ok) window.localStorage.removeItem('nebula.' + k); else delete mem[k]; } catch (e) {}
    }
  };
})();

/* system settings persisted across refreshes */
OS.settings = Store.get('settings', { theme: 'dark', wallpaper: 'aurora', iconPos: {} });
function saveSettings() { Store.set('settings', OS.settings); }

var WALLPAPERS = {
  aurora: { label: 'Aurora', css: null, preview: 'linear-gradient(160deg,#1b2a5e,#0d1024 55%,#2b1055)' },
  sunset: { label: 'Sunset', preview: 'linear-gradient(160deg,#7a1f3d,#42203f 50%,#1b2340)', vars: ['#5e1f3a', '#241a33', '#3b1650'] },
  ocean:  { label: 'Ocean', preview: 'linear-gradient(160deg,#0b3a53,#08263f 50%,#0c4a6e)', vars: ['#0b3a53', '#08263f', '#0c4a6e'] },
  forest: { label: 'Forest', preview: 'linear-gradient(160deg,#123524,#0b2418 50%,#1d4d2b)', vars: ['#123524', '#0b2418', '#1d4d2b'] },
  vapor:  { label: 'Vaporwave', preview: 'linear-gradient(160deg,#3d1350,#1c1140 50%,#0e2a52)', vars: ['#3d1350', '#1c1140', '#0e2a52'] }
};

function applyWallpaper(key) {
  if (!WALLPAPERS[key]) key = 'aurora';
  OS.settings.wallpaper = key; saveSettings();
  var wp = $('#wallpaper'), w = WALLPAPERS[key];
  var a = getComputedStyle(D.documentElement).getPropertyValue('--bg-accent-a').trim();
  if (w.vars) {
    wp.style.setProperty('--bg-accent-a', w.vars[0]);
    wp.style.setProperty('--bg-accent-b', w.vars[1]);
    wp.style.setProperty('--bg-accent-c', w.vars[2]);
  } else {
    wp.style.removeProperty('--bg-accent-a');
    wp.style.removeProperty('--bg-accent-b');
    wp.style.removeProperty('--bg-accent-c');
  }
  $$('[data-wpswatch]').forEach(function (s) { s.classList.toggle('active', s.getAttribute('data-wpswatch') === key); });
}

function applyTheme(theme) {
  OS.settings.theme = theme; saveSettings();
  D.documentElement.setAttribute('data-theme', theme);
  OS.emit('theme', theme);
}
function toggleTheme() { applyTheme(OS.settings.theme === 'dark' ? 'light' : 'dark'); }

/* tiny event bus so apps can react to system events */
OS.bus = {};
OS.on = function (ev, fn) { (OS.bus[ev] = OS.bus[ev] || []).push(fn); };
OS.emit = function (ev, data) { (OS.bus[ev] || []).forEach(function (fn) { try { fn(data); } catch (e) { console.error(e); } }); };
