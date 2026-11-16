// Plumbing test for the `llm` fixer: a MOCK OpenAI-compatible endpoint (a test double, not a model)
// returns a fixed edit. Proves prompt -> HTTP -> JSON edits -> patched source -> green re-run.
const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const root = path.resolve(__dirname, '..');

const srv = http.createServer((req, res) => {
  let b = ''; req.on('data', (d) => (b += d)); req.on('end', () => {
    const prompt = JSON.parse(b).messages[0].content;
    const seesKane = /Verifier report/.test(prompt) && /Subtotal|subtotal|total/i.test(prompt);
    const content = JSON.stringify({ explanation: 'mock: subtotal must multiply by qty', edits: seesKane
      ? [{ file: 'lib/pricing.js', find: 'subtotal += item.price;', replace: 'subtotal += item.price * item.qty;' }] : [] });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ choices: [{ message: { content } }] }));
  });
}).listen(0, () => {
  const port = srv.address().port;
  const c = spawn(process.execPath, ['loop/cli.js', '--verifier=playwright', '--fixer=llm', '--bugs=1', '--only=total-ignores-quantity', '--no-hold'], {
    cwd: root, env: { ...process.env, FIXER_BASE_URL: `http://localhost:${port}/v1`, FIXER_API_KEY: 'test', FIXER_MODEL: 'mock' },
  });
  let out = ''; c.stdout.on('data', (d) => (out += d)); c.stderr.on('data', (d) => (out += d));
  c.on('close', (code) => {
    srv.close();
    console.log(out.replace(/\x1b\[[0-9;]*m/g, '').split('\n').filter((l) => /healed|FAIL|mock|Done|✘/.test(l)).join('\n'));
    process.exit(code);
  });
});
