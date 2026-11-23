// builder: assemble src/*.js into template.html -> index.html
// Gate: refuses to emit if the assembled inline script does not parse.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');

function parts() {
  return fs.readdirSync(SRC)
    .filter(f => f.endsWith('.js'))
    .sort()
    .map(f => ({ name: f, code: fs.readFileSync(path.join(SRC, f), 'utf8') }));
}

function build() {
  const list = parts();
  const body = list.map(p => '// ===== ' + p.name + ' =====\n' + p.code.trim() + '\n').join('\n');

  try {
    new vm.Script(body, { filename: 'webos.js' });
  } catch (e) {
    console.error('PARSE FAIL: ' + e.message);
    const m = /webos\.js:(\d+)/.exec(e.stack || '');
    if (m) {
      const lines = body.split('\n');
      const n = parseInt(m[1], 10);
      for (let i = Math.max(0, n - 4); i < Math.min(lines.length, n + 3); i++) {
        console.error(String(i + 1).padStart(5) + ' | ' + lines[i]);
      }
    }
    process.exit(1);
  }

  const tpl = fs.readFileSync(path.join(ROOT, 'template.html'), 'utf8');
  if (!tpl.includes('/*__APP_JS__*/')) {
    console.error('template.html missing /*__APP_JS__*/ marker');
    process.exit(1);
  }
  const out = tpl.replace('/*__APP_JS__*/', function () { return body; });
  fs.writeFileSync(path.join(ROOT, 'index.html'), out);
  console.log('built index.html: ' + (out.length / 1024).toFixed(1) + ' KB, ' + list.length + ' parts [' + list.map(p => p.name).join(', ') + ']');
}

build();
