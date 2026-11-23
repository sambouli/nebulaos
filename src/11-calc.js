/* ============================================================
   Part 11: ★ SPECIAL FEATURE — Quantum Calculator.
   A scientific calculator with a persistent history tape, memory
   register (MS/MR/M+/MC), full keyboard control, and clickable
   history reuse. Chosen because every OS needs one great utility.
   ============================================================ */
function launchCalc() {
  createWindow({ appId: 'calc', title: 'Quantum Calc', icon: 'calc', width: 380, height: 560, onMount: mountCalc });
}

function mountCalc(body, win) {
  var acc = 0, pending = null, pendingOp = null, fresh = true, exprStr = '';
  var mem = Store.get('calcMem', 0);
  var hist = Store.get('calcHist', []);

  body.innerHTML =
    '<div class="calc">' +
      '<div class="calc-screen"><div class="calc-expr"></div><div class="calc-acc">0</div></div>' +
      '<div class="calc-history"></div>' +
      '<div class="calc-keys"></div>' +
    '</div>';

  var accEl = $('.calc-acc', body), exprEl = $('.calc-expr', body), histEl = $('.calc-history', body), keys = $('.calc-keys', body);

  function fmt(n) {
    if (!isFinite(n)) return n > 0 ? '∞' : (n < 0 ? '-∞' : 'NaN');
    if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
    var s = n.toPrecision(10).replace(/0+$/, '').replace(/\.$/, '');
    return s;
  }
  function render() {
    accEl.textContent = fmt(acc);
    exprEl.textContent = exprStr + (pending !== null && pendingOp ? ' ' + pendingOp : '') + (mem !== 0 ? '   [M:' + fmt(mem) + ']' : '');
    histEl.innerHTML = '';
    hist.slice(-40).reverse().forEach(function (h) {
      var d = el('div', null, esc(h.e) + ' = ' + esc(h.r));
      d.addEventListener('click', function () { acc = h.r; fresh = true; render(); toast('Reused ' + h.r); });
      histEl.appendChild(d);
    });
  }
  function pushHist(e, r) {
    hist.push({ e: e, r: fmt(r) });
    if (hist.length > 200) hist = hist.slice(-200);
    Store.set('calcHist', hist);
  }

  function inputDigit(d) {
    if (fresh) { acc = 0; fresh = false; }
    if (d === '.' && String(acc).indexOf('.') >= 0) return;
    var neg = acc < 0;
    var s = (neg ? '-' : '') + String(Math.abs(acc));
    s = (s === '0' && d !== '.') || s === '-0' ? '' : s;
    var num = parseFloat((s + d));
    acc = isNaN(num) ? 0 : num;
    render();
  }
  function applyOp(a, b, op) {
    switch (op) {
      case '+': return a + b; case '-': return a - b; case '*': return a * b;
      case '/': return b === 0 ? NaN : a / b; case '^': return Math.pow(a, b);
      case 'mod': return b === 0 ? NaN : a % b;
    }
    return b;
  }
  function setOp(op) {
    if (pending !== null && pendingOp && !fresh) {
      var r = applyOp(pending, acc, pendingOp);
      if (!isFinite(r)) { errorState(); return; }
      pushHist(fmt(pending) + ' ' + pendingOp + ' ' + fmt(acc), r);
      pending = r; acc = r;
    } else {
      pending = acc;
    }
    pendingOp = op; fresh = true;
    exprStr = fmt(pending) + ' ' + op;
    render();
  }
  function equals() {
    if (pending === null || !pendingOp) return;
    var r = applyOp(pending, acc, pendingOp);
    if (!isFinite(r)) { errorState(); return; }
    pushHist(exprStr + ' ' + fmt(acc), r);
    exprStr = exprStr + ' ' + fmt(acc) + ' =';
    acc = r; pending = null; pendingOp = null; fresh = true;
    render();
  }
  function errorState() {
    accEl.textContent = 'Error'; exprEl.textContent = 'cannot compute — press C';
    acc = 0; pending = null; pendingOp = null; fresh = true;
  }
  function unary(fn, label) {
    var r = fn(acc);
    if (!isFinite(r)) { errorState(); return; }
    exprStr = label + '(' + fmt(acc) + ')';
    acc = r; fresh = true; render();
  }

  var KEYMAP = [
    ['MC', 'fn'], ['MR', 'fn'], ['MS', 'fn'], ['M+', 'fn'], ['C', 'fn'],
    ['sin', 'fn'], ['cos', 'fn'], ['tan', 'fn'], ['ln', 'fn'], ['log', 'fn'],
    ['√', 'fn'], ['x²', 'fn'], ['x^y', 'fn'], ['π', 'fn'], ['e', 'fn'],
    ['7', 'num'], ['8', 'num'], ['9', 'num'], ['%', 'op'], ['⌫', 'fn'],
    ['4', 'num'], ['5', 'num'], ['6', 'num'], ['÷', 'op'], ['(', 'fn'],
    ['1', 'num'], ['2', 'num'], ['3', 'num'], ['×', 'op'], [')', 'fn'],
    ['0', 'num'], ['.', 'num'], ['±', 'fn'], ['−', 'op'], ['+', 'op'],
    ['n!', 'fn'], ['mod', 'op'], ['Ans', 'fn'], ['=', 'eq', 2]
  ];
  var lastAns = 0;

  KEYMAP.forEach(function (k) {
    var b = el('button', 'calc-key ' + k[1], k[0]);
    if (k[2]) b.style.gridColumn = 'span ' + k[2];
    b.setAttribute('data-k', k[0]);
    b.addEventListener('click', function () { press(k[0]); });
    keys.appendChild(b);
  });

  function press(k) {
    if (/^[0-9]$/.test(k)) return inputDigit(k);
    switch (k) {
      case '.': return inputDigit('.');
      case '+': return setOp('+');
      case '−': return setOp('-');
      case '×': return setOp('*');
      case '÷': return setOp('/');
      case 'mod': return setOp('mod');
      case 'x^y': return setOp('^');
      case '=': lastAns = acc; return equals();
      case 'C': acc = 0; pending = null; pendingOp = null; fresh = true; exprStr = ''; return render();
      case '⌫': {
        if (fresh) return;
        var s = String(acc);
        acc = s.length <= 1 || (s.length === 2 && s.charAt(0) === '-') ? 0 : parseFloat(s.slice(0, -1));
        if (isNaN(acc)) acc = 0;
        return render();
      }
      case '±': acc = -acc; return render();
      case '%': acc = acc / 100; exprStr = fmt(acc) + '%'; return render();
      case '√': return unary(Math.sqrt, '√');
      case 'x²': return unary(function (x) { return x * x; }, 'sqr');
      case 'sin': return unary(function (x) { return Math.sin(x * Math.PI / 180); }, 'sin');
      case 'cos': return unary(function (x) { return Math.cos(x * Math.PI / 180); }, 'cos');
      case 'tan': return unary(function (x) { return Math.tan(x * Math.PI / 180); }, 'tan');
      case 'ln': return unary(function (x) { if (x <= 0) return NaN; return Math.log(x); }, 'ln');
      case 'log': return unary(function (x) { if (x <= 0) return NaN; return Math.log10(x); }, 'log');
      case 'n!': return unary(function (x) {
        if (x < 0 || x !== Math.floor(x) || x > 170) return NaN;
        var r = 1; for (var i = 2; i <= x; i++) r *= i; return r;
      }, 'fact');
      case 'π': acc = Math.PI; fresh = true; exprStr = 'π'; return render();
      case 'e': acc = Math.E; fresh = true; exprStr = 'e'; return render();
      case 'Ans': acc = lastAns; fresh = true; exprStr = 'Ans'; return render();
      case 'MC': mem = 0; Store.set('calcMem', mem); return render();
      case 'MR': acc = mem; fresh = true; exprStr = 'M'; return render();
      case 'MS': mem = acc; Store.set('calcMem', mem); return render();
      case 'M+': mem += acc; Store.set('calcMem', mem); return render();
      case '(': case ')': exprStr += k; return render();
    }
  }

  /* full keyboard control while the calc window is focused */
  function keyHandler(e) {
    if (!body.isConnected) return D.removeEventListener('keydown', keyHandler);
    if (D.activeElement && /INPUT|TEXTAREA/.test(D.activeElement.tagName)) return;
    if (!OS.focused || OS.focused.appId !== 'calc') return;
    var k = e.key;
    if (/^[0-9]$/.test(k)) { press(k); e.preventDefault(); return; }
    var map = { '+': '+', '-': '−', '*': '×', '/': '÷', '.': '.', '^': 'x^y', '(': '(', ')': ')', '%': '%' };
    if (map[k]) { press(map[k]); e.preventDefault(); return; }
    if (k === 'Enter' || k === '=') { press('='); e.preventDefault(); return; }
    if (k === 'Backspace') { press('⌫'); e.preventDefault(); return; }
    if (k === 'Escape') { press('C'); e.preventDefault(); return; }
    if (k.toLowerCase() === 'r') { press('MR'); e.preventDefault(); }
    if (k.toLowerCase() === 's') { press('MS'); e.preventDefault(); }
  }
  D.addEventListener('keydown', keyHandler);
  win.onClose = function () { D.removeEventListener('keydown', keyHandler); };

  render();
}
