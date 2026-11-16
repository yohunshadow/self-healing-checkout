// Bring-your-own coding agent. FIXER_CMD is any shell command that reads the request from stdin
// (and from FIX_REQUEST.md in its cwd) and edits files in place in the work copy of the shop, e.g.
//   FIXER_CMD='claude -p --dangerously-skip-permissions'     (Claude Code)
//   FIXER_CMD='codex exec --full-auto -'                      (Codex CLI)
//   FIXER_CMD='gemini -p -y'                                  (Gemini CLI)
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { buildPrompt } = require('./prompt');

module.exports = {
  id: 'cmd',
  label: 'External coding agent via FIXER_CMD',
  available: () => !!process.env.FIXER_CMD,
  async fix(report, files, shopDir) {
    const prompt = buildPrompt(report, files).replace(/Reply with ONLY JSON[\s\S]*$/, 'Edit the files in the current directory directly, then stop. Print one sentence explaining the fix.');
    fs.writeFileSync(path.join(shopDir, 'FIX_REQUEST.md'), prompt);
    const out = await new Promise((resolve, reject) => {
      const c = spawn(process.env.FIXER_CMD, { shell: true, cwd: shopDir, stdio: ['pipe', 'pipe', 'inherit'] });
      let s = ''; c.stdout.on('data', (d) => (s += d));
      c.on('close', (code) => (code === 0 ? resolve(s) : reject(new Error('FIXER_CMD exited ' + code))));
      c.stdin.end(prompt);
    });
    fs.rmSync(path.join(shopDir, 'FIX_REQUEST.md'), { force: true });
    return { explanation: out.trim().split('\n').slice(-1)[0] || 'External agent edited the files.', edits: [], model: process.env.FIXER_CMD.split(' ')[0] };
  },
};
