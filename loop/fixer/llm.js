// OpenAI-compatible chat-completions fixer. Works with OpenAI, OpenRouter, xAI, Together, Ollama, vLLM...
//   FIXER_API_KEY (or OPENAI_API_KEY / OPENROUTER_API_KEY / XAI_API_KEY)
//   FIXER_BASE_URL (default https://api.openai.com/v1)   FIXER_MODEL (default gpt-4o-mini)
const fs = require('fs');
const path = require('path');
const { buildPrompt } = require('./prompt');

function cfg() {
  const key = process.env.FIXER_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.XAI_API_KEY;
  return { key, base: (process.env.FIXER_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, ''), model: process.env.FIXER_MODEL || 'gpt-4o-mini' };
}

function applyEdits(shopDir, edits) {
  for (const e of edits) {
    const p = path.resolve(shopDir, e.file);
    if (!p.startsWith(path.resolve(shopDir) + path.sep)) throw new Error('edit outside shop dir: ' + e.file);
    const src = fs.readFileSync(p, 'utf8');
    const n = src.split(e.find).length - 1;
    if (n !== 1) throw new Error(`edit for ${e.file}: 'find' text matched ${n} times (need exactly 1)`);
    fs.writeFileSync(p, src.replace(e.find, () => e.replace));
  }
}

module.exports = {
  id: 'llm',
  label: 'LLM fixer (OpenAI-compatible API)',
  available: () => !!cfg().key || /localhost|127\.0\.0\.1/.test(process.env.FIXER_BASE_URL || ''),
  async fix(report, files, shopDir) {
    const c = cfg();
    const res = await fetch(`${c.base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(c.key ? { Authorization: `Bearer ${c.key}` } : {}) },
      body: JSON.stringify({ model: c.model, temperature: 0, response_format: { type: 'json_object' }, messages: [{ role: 'user', content: buildPrompt(report, files) }] }),
    });
    if (!res.ok) throw new Error(`fixer LLM HTTP ${res.status}`);
    const body = await res.json();
    const out = JSON.parse(body.choices[0].message.content);
    applyEdits(shopDir, out.edits || []);
    return { explanation: out.explanation || '', edits: (out.edits || []).map((e) => ({ file: e.file })), model: c.model };
  },
  applyEdits,
};
