// OFFLINE DEMO FIXER (no LLM needed). It reads the verifier's failure text, scans the source for
// known bug patterns and applies the matching repair. Honest label: this is a scripted stand-in for
// an LLM fixer so the loop can run anywhere; use `--fixer llm` or `--fixer cmd` for a real agent.
const fs = require('fs');
const path = require('path');
const mutations = require('../mutations');

module.exports = {
  id: 'heuristic',
  label: 'Heuristic playbook fixer (offline demo, NOT an LLM)',
  async fix(report, files, shopDir) {
    const text = report.results.filter((r) => !r.ok).map((r) => `${r.name} ${r.summary} ${r.reason || ''}`).join(' ');
    const candidates = mutations
      .filter((m) => (files[m.file] || '').includes(m.bad))
      .map((m) => ({ m, score: (text.match(m.hints) || []).length + (new RegExp(m.category.split(' ')[0], 'i').test(text) ? 1 : 0) }))
      .sort((a, b) => b.score - a.score);
    if (!candidates.length) return { explanation: 'No known bug pattern found in the source.', edits: [] };
    const best = candidates[0].m;
    const p = path.join(shopDir, best.file);
    fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(best.bad, best.good));
    return { explanation: `Pattern match on failing flow text → reverted: ${best.title}`, edits: [{ file: best.file }] };
  },
};
