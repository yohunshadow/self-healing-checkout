// Serves the timeline dashboard. Live: /api/timeline (runs/latest.json). Replay: /recorded/*.json.
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

function start(port) {
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    const send = (code, body, type) => { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(body); };
    if (u.pathname === '/' ) return send(200, fs.readFileSync(path.join(__dirname, 'index.html')), 'text/html');
    if (u.pathname === '/api/timeline') {
      const f = path.join(ROOT, 'runs', 'latest.json');
      return fs.existsSync(f) ? send(200, fs.readFileSync(f), 'application/json') : send(404, '{}', 'application/json');
    }
    const m = u.pathname.match(/^\/recorded\/([\w.-]+\.json)$/);
    if (m && fs.existsSync(path.join(ROOT, 'recorded', m[1]))) return send(200, fs.readFileSync(path.join(ROOT, 'recorded', m[1])), 'application/json');
    send(404, 'not found', 'text/plain');
  });
  return new Promise((r) => srv.listen(port, () => r(srv)));
}
if (require.main === module) {
  const port = Number(process.env.PORT || 4000);
  const replay = process.argv.includes('--replay');
  const rec = fs.existsSync(path.join(ROOT, 'recorded', 'kane-run.json')) ? 'kane-run.json' : 'standin-run.json';
  start(port).then(() => console.log(`Dashboard: http://localhost:${port}/${replay ? '?src=recorded/' + rec : ''}`));
}
module.exports = { start };
