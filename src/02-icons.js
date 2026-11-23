/* ============================================================
   Part 02: SVG icon factory — every icon is drawn inline, no assets.
   ============================================================ */
function grad(id, c1, c2) {
  return '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs>';
}
function svgWrap(inner, vb) {
  return '<svg viewBox="' + (vb || '0 0 64 64') + '" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>';
}

var ICONS = {};
ICONS.os = function () {
  return svgWrap(grad('gos', '#4f8cff', '#8a5cff') +
    '<polygon points="50,6 88,28 88,72 50,94 12,72 12,28" fill="none" stroke="url(#gos)" stroke-width="5"/>' +
    '<circle cx="50" cy="50" r="14" fill="url(#gos)"/>', '0 0 100 100');
};
ICONS.files = function () {
  return svgWrap(grad('gfl', '#ffb64d', '#ff8a2a') +
    '<path d="M6 16a4 4 0 0 1 4-4h14l6 7h22a4 4 0 0 1 4 4v27a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" fill="url(#gfl)"/>' +
    '<rect x="6" y="24" width="50" height="26" rx="4" fill="#ffc973"/>');
};
ICONS.notes = function () {
  return svgWrap(grad('gnt', '#ffe066', '#f2b705') +
    '<rect x="12" y="8" width="40" height="48" rx="5" fill="url(#gnt)"/>' +
    '<rect x="12" y="8" width="40" height="10" rx="5" fill="#d99e00"/>' +
    '<g stroke="#8a6d00" stroke-width="2.6" stroke-linecap="round"><line x1="20" y1="27" x2="44" y2="27"/><line x1="20" y1="35" x2="44" y2="35"/><line x1="20" y1="43" x2="36" y2="43"/></g>');
};
ICONS.mail = function () {
  return svgWrap(grad('gml', '#5ee7a0', '#1fa86c') +
    '<rect x="8" y="14" width="48" height="36" rx="5" fill="url(#gml)"/>' +
    '<path d="M10 18 L32 36 L54 18" fill="none" stroke="#eafff3" stroke-width="3.4" stroke-linejoin="round"/>');
};
ICONS.calendar = function () {
  return svgWrap(grad('gcl', '#ff7a7a', '#e14594') +
    '<rect x="10" y="12" width="44" height="44" rx="6" fill="url(#gcl)"/>' +
    '<rect x="10" y="12" width="44" height="12" rx="6" fill="#b91c5e"/>' +
    '<g fill="#fff"><rect x="17" y="30" width="8" height="8" rx="1.5"/><rect x="28" y="30" width="8" height="8" rx="1.5"/><rect x="39" y="30" width="8" height="8" rx="1.5"/><rect x="17" y="42" width="8" height="8" rx="1.5"/><rect x="28" y="42" width="8" height="8" rx="1.5"/></g>' +
    '<g stroke="#7c1038" stroke-width="3.4" stroke-linecap="round"><line x1="21" y1="7" x2="21" y2="16"/><line x1="43" y1="7" x2="43" y2="16"/></g>');
};
ICONS.terminal = function () {
  return svgWrap(grad('gtr', '#3ef0a5', '#0ea5e9') +
    '<rect x="7" y="10" width="50" height="44" rx="7" fill="#101521" stroke="url(#gtr)" stroke-width="2.6"/>' +
    '<path d="M16 24 l9 8 -9 8" fill="none" stroke="url(#gtr)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<line x1="30" y1="41" x2="46" y2="41" stroke="url(#gtr)" stroke-width="3.4" stroke-linecap="round"/>');
};
ICONS.calc = function () {
  return svgWrap(grad('gca', '#8a5cff', '#4f8cff') +
    '<rect x="12" y="6" width="40" height="52" rx="7" fill="url(#gca)"/>' +
    '<rect x="17" y="11" width="30" height="11" rx="3" fill="#e9f0ff"/>' +
    '<g fill="#ffffff"><rect x="17" y="27" width="7" height="7" rx="2"/><rect x="28.5" y="27" width="7" height="7" rx="2"/><rect x="40" y="27" width="7" height="7" rx="2"/><rect x="17" y="38" width="7" height="7" rx="2"/><rect x="28.5" y="38" width="7" height="7" rx="2"/><rect x="40" y="38" width="7" height="14" rx="2"/><rect x="17" y="49" width="18.5" height="7" rx="2"/></g>');
};
ICONS.gta = function () {
  return svgWrap(grad('ggta', '#ffd23f', '#ee9b00') +
    '<rect x="6" y="26" width="52" height="18" rx="7" fill="url(#ggta)"/>' +
    '<path d="M16 26 q4-12 14-12 t16 12z" fill="#e63946"/>' +
    '<rect x="20" y="18" width="20" height="8" rx="3" fill="#9ad1ff"/>' +
    '<g fill="#1d1d1d"><rect x="12" y="40" width="11" height="8" rx="3"/><rect x="41" y="40" width="11" height="8" rx="3"/></g>' +
    '<g fill="#fff8dc"><circle cx="11" cy="30" r="2.6"/><circle cx="53" cy="30" r="2.6"/></g>');
};
ICONS.tetris = function () {
  return svgWrap(
    '<g stroke="#0b0e14" stroke-width="1.6">' +
    '<rect x="10" y="10" width="14" height="14" rx="2.5" fill="#00c2ff"/>' +
    '<rect x="24" y="10" width="14" height="14" rx="2.5" fill="#00c2ff"/>' +
    '<rect x="38" y="10" width="14" height="14" rx="2.5" fill="#00c2ff"/>' +
    '<rect x="24" y="24" width="14" height="14" rx="2.5" fill="#00c2ff"/>' +
    '<rect x="24" y="38" width="14" height="14" rx="2.5" fill="#ffd23f"/>' +
    '<rect x="38" y="38" width="14" height="14" rx="2.5" fill="#ffd23f"/>' +
    '<rect x="10" y="38" width="14" height="14" rx="2.5" fill="#8a5cff"/>' +
    '<rect x="10" y="52" width="14" height="8" rx="2.5" fill="#2ecc71"/></g>');
};
ICONS.snake = function () {
  return svgWrap('<g stroke="#08351c" stroke-width="1.4">' +
    '<rect x="10" y="26" width="12" height="12" rx="3" fill="#2ecc71"/>' +
    '<rect x="22" y="26" width="12" height="12" rx="3" fill="#27ae60"/>' +
    '<rect x="34" y="26" width="12" height="12" rx="3" fill="#27ae60"/>' +
    '<rect x="34" y="38" width="12" height="12" rx="3" fill="#1e8f4e"/>' +
    '<rect x="46" y="38" width="12" height="12" rx="3" fill="#1e8f4e"/></g>' +
    '<circle cx="16" cy="31" r="2.2" fill="#08351c"/>' +
    '<circle cx="50" cy="18" r="5" fill="#e74c3c"/><rect x="49" y="10" width="2.4" height="4" rx="1" fill="#2ecc71"/>');
};
ICONS.flappy = function () {
  return svgWrap('<rect x="8" y="8" width="10" height="48" rx="3" fill="#2ecc71"/><rect x="46" y="8" width="10" height="30" rx="3" fill="#2ecc71"/>' +
    '<rect x="8" y="8" width="10" height="48" rx="3" fill="rgba(0,0,0,.15)"/>' +
    '<circle cx="31" cy="32" r="10" fill="#ffd23f"/>' +
    '<circle cx="35" cy="29" r="2.4" fill="#222"/><circle cx="35.8" cy="28.2" r=".9" fill="#fff"/>' +
    '<path d="M24 33 l7 3 7-3 z" fill="#ff8a2a"/>' +
    '<path d="M27 30 q-6 2 -8 6" stroke="#e6b800" stroke-width="3" fill="none" stroke-linecap="round"/>');
};
ICONS.mines = function () {
  return svgWrap('<circle cx="32" cy="35" r="15" fill="#2b2f3a"/>' +
    '<g stroke="#2b2f3a" stroke-width="4" stroke-linecap="round"><line x1="32" y1="12" x2="32" y2="20"/><line x1="32" y1="50" x2="32" y2="58"/><line x1="12" y1="35" x2="20" y2="35"/><line x1="44" y1="35" x2="52" y2="35"/><line x1="18" y1="21" x2="24" y2="27"/><line x1="40" y1="43" x2="46" y2="49"/><line x1="46" y1="21" x2="40" y2="27"/><line x1="24" y1="43" x2="18" y2="49"/></g>' +
    '<circle cx="27" cy="30" r="4" fill="#8f97ab"/>');
};
ICONS.about = function () {
  return svgWrap(grad('gab', '#4f8cff', '#38bdf8') +
    '<circle cx="32" cy="32" r="25" fill="url(#gab)"/>' +
    '<circle cx="32" cy="21" r="4" fill="#fff"/>' +
    '<rect x="29" y="28" width="6" height="19" rx="3" fill="#fff"/>');
};
ICONS.start = function () {
  return svgWrap(grad('gst', '#4f8cff', '#8a5cff') +
    '<rect x="10" y="10" width="20" height="20" rx="5" fill="url(#gst)"/>' +
    '<rect x="34" y="10" width="20" height="20" rx="5" fill="url(#gst)" opacity=".75"/>' +
    '<rect x="10" y="34" width="20" height="20" rx="5" fill="url(#gst)" opacity=".75"/>' +
    '<rect x="34" y="34" width="20" height="20" rx="5" fill="url(#gst)" opacity=".5"/>');
};
ICONS.folder = function (small) {
  return svgWrap(grad('gfo' + Math.random().toString(36).slice(2), '#7fb2ff', '#3f7fe0') +
    '<path d="M6 16a4 4 0 0 1 4-4h14l6 7h22a4 4 0 0 1 4 4v27a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" fill="#5b9bff"/>' +
    '<rect x="6" y="24" width="50" height="26" rx="4" fill="#8ab8ff"/>');
};
ICONS.file = function (hue) {
  hue = hue || 210;
  return svgWrap('<path d="M14 8 h24 l12 12 v36 a3 3 0 0 1-3 3 H17 a3 3 0 0 1-3-3 V11 a3 3 0 0 1 3-3z" fill="hsl(' + hue + ',70%,72%)"/>' +
    '<path d="M38 8 l12 12 h-12z" fill="hsl(' + hue + ',70%,55%)"/>' +
    '<g stroke="hsl(' + hue + ',45%,38%)" stroke-width="2.4" stroke-linecap="round"><line x1="21" y1="30" x2="43" y2="30"/><line x1="21" y1="38" x2="43" y2="38"/><line x1="21" y1="46" x2="35" y2="46"/></g>');
};
ICONS.txt = function () { return ICONS.file(210); };
ICONS.code = function () { return ICONS.file(275); };
ICONS.img = function () {
  return svgWrap('<path d="M14 8 h24 l12 12 v36 a3 3 0 0 1-3 3 H17 a3 3 0 0 1-3-3 V11 a3 3 0 0 1 3-3z" fill="#8fd3a5"/>' +
    '<path d="M38 8 l12 12 h-12z" fill="#4caf7d"/>' +
    '<circle cx="26" cy="30" r="4" fill="#ffd23f"/>' +
    '<path d="M19 48 l9-11 7 7 6-6 8 10z" fill="#2e7d52"/>');
};
ICONS.music = function () { return ICONS.file(330); };
ICONS.pdf = function () { return ICONS.file(0); };
ICONS.readme = function () {
  return svgWrap('<path d="M14 8 h24 l12 12 v36 a3 3 0 0 1-3 3 H17 a3 3 0 0 1-3-3 V11 a3 3 0 0 1 3-3z" fill="#c9d4ff"/>' +
    '<path d="M38 8 l12 12 h-12z" fill="#8fa3e8"/>' +
    '<text x="32" y="46" font-family="Arial" font-size="17" font-weight="bold" fill="#3b5bdb" text-anchor="middle">i</text>');
};
ICONS.sun = function () {
  return svgWrap('<circle cx="32" cy="32" r="11" fill="#ffd23f"/>' +
    '<g stroke="#ffd23f" stroke-width="3.4" stroke-linecap="round"><line x1="32" y1="8" x2="32" y2="15"/><line x1="32" y1="49" x2="32" y2="56"/><line x1="8" y1="32" x2="15" y2="32"/><line x1="49" y1="32" x2="56" y2="32"/><line x1="15" y1="15" x2="20" y2="20"/><line x1="44" y1="44" x2="49" y2="49"/><line x1="49" y1="15" x2="44" y2="20"/><line x1="20" y1="44" x2="15" y2="49"/></g>', '0 0 64 64');
};
ICONS.moon = function () {
  return svgWrap('<path d="M40 8 a24 24 0 1 0 16 40 A20 20 0 0 1 40 8z" fill="#9db4ff"/>');
};
ICONS.refresh = function () {
  return svgWrap('<path d="M50 32 a18 18 0 1 1 -6-13.5" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M46 6 l2 14 -14 1z" fill="currentColor"/>');
};
ICONS.palette = function () {
  return svgWrap('<path d="M32 8 C17 8 8 19 8 31 c0 10 8 15 15 15 4 0 5 3 4 6 0 3 2 4 5 4 12 0 24-9 24-24C56 16 46 8 32 8z" fill="#c084fc"/>' +
    '<g><circle cx="21" cy="24" r="3.6" fill="#f87171"/><circle cx="33" cy="18" r="3.6" fill="#fbbf24"/><circle cx="44" cy="26" r="3.6" fill="#34d399"/><circle cx="18" cy="36" r="3.6" fill="#60a5fa"/></g>');
};
ICONS.theme = function () {
  return svgWrap('<circle cx="32" cy="32" r="22" fill="#e8eaf0"/>' +
    '<path d="M32 10 a22 22 0 0 1 0 44z" fill="#1c2230"/>' +
    '<circle cx="32" cy="32" r="7" fill="#8a5cff"/>');
};
ICONS.power = function () {
  return svgWrap('<path d="M32 8 v20" stroke="currentColor" stroke-width="5.5" stroke-linecap="round"/>' +
    '<path d="M18 16 a20 20 0 1 0 28 0" fill="none" stroke="currentColor" stroke-width="5.5" stroke-linecap="round"/>');
};
function iconSVG(name) {
  var f = ICONS[name];
  return f ? f() : ICONS.file();
}
