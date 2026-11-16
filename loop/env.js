// Loads non-secret config from .env (KEY=VALUE lines) without overriding real environment variables.
const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, '..', '.env');
if (fs.existsSync(f)) {
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}
