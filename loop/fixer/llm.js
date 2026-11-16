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
    // Gemini returns transient 503 "high demand" / slow responses: try the primary model, then the
    // fallbacks in FIXER_FALLBACK_MODELS (comma-separated), two passes. The model that answered is logged.
    const models = [c.model, ...(process.env.FIXER_FALLBACK_MODELS || '').split(',').map((x) => x.trim()).filter(Boolean)];
    let res, lastErr, used;
    outer: for (let pass = 0; pass < 2; pass++) {
      for (const model of models) {
        try {
          res = await fetch(`${c.base}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(c.key ? { Authorization: `Bearer ${c.key}` } : {}) },
            signal: AbortSignal.timeout(Number(process.env.FIXER_TIMEOUT_MS || 75000)),
            body: JSON.stringify({ model, temperature: 0, response_format: { type: 'json_object' }, messages: [{ role: 'user', content: buildPrompt(report, files) }] }),
          });
          if (res.ok) { used = model; break outer; }
          lastErr = `${model}: HTTP ${res.status} ${(await res.text()).slice(0, 120).replace(/\s+/g, ' ')}`;
        } catch (e) { lastErr = `${model}: ${e.message}`; res = null; }
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
    if (!res || !res.ok) throw new Error(`fixer LLM failed: ${lastErr}`);
    const body = await res.json();
    const out = JSON.parse(body.choices[0].message.content);
    applyEdits(shopDir, out.edits || []);
    return { explanation: out.explanation || '', edits: (out.edits || []).map((e) => ({ file: e.file })), model: used };
  },
  applyEdits,
};
