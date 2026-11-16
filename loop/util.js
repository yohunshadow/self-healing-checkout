const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');

function copyDir(src, dst) {
  fs.rmSync(dst, { recursive: true, force: true });
  fs.cpSync(src, dst, { recursive: true });
}

function readTree(dir, base = dir, out = {}) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) readTree(p, base, out);
    else out[path.relative(base, p)] = fs.readFileSync(p, 'utf8');
  }
  return out;
}

// Minimal line diff (unified-ish) between two strings, enough for the dashboard.
function lineDiff(file, a, b) {
  if (a === b) return '';
  const A = a.split('\n'), B = b.split('\n');
  let s = 0;
  while (s < A.length && s < B.length && A[s] === B[s]) s++;
  let ea = A.length - 1, eb = B.length - 1;
  while (ea >= s && eb >= s && A[ea] === B[eb]) { ea--; eb--; }
  const out = [`--- a/${file}`, `+++ b/${file}`, `@@ line ${s + 1} @@`];
  for (let i = Math.max(0, s - 1); i < s; i++) out.push('  ' + A[i]);
  for (let i = s; i <= ea; i++) out.push('- ' + A[i]);
  for (let i = s; i <= eb; i++) out.push('+ ' + B[i]);
  return out.join('\n');
}

function treeDiff(before, after) {
  const files = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...files].map((f) => lineDiff(f, before[f] || '', after[f] || '')).filter(Boolean).join('\n');
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function waitForHttp(url, ms = 8000) {
  const t0 = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      http.get(url, (r) => { r.resume(); resolve(); }).on('error', () => {
        if (Date.now() - t0 > ms) reject(new Error('shop did not start: ' + url));
        else setTimeout(tick, 100);
      });
    };
    tick();
  });
}

// Start the shop under test from a directory; returns {url, stop()}.
async function startShop(dir, port) {
  const child = spawn(process.execPath, [path.join(dir, 'server.js')], {
    env: { ...process.env, PORT: String(port) }, stdio: 'ignore',
  });
  const url = `http://localhost:${port}`;
  await waitForHttp(url + '/');
  return { url, stop: () => child.kill('SIGKILL') };
}

module.exports = { ROOT, copyDir, readTree, treeDiff, lineDiff, mulberry32, startShop };
