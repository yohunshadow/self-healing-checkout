const flows = require('../../flows/flows.json');

async function pick(name) {
  const kane = require('./kane');
  const pw = require('./playwright');
  if (name === 'kane') { const a = await kane.available(); if (!a.ok) throw new Error(a.why); return kane; }
  if (name === 'playwright') return pw;
  const a = await kane.available();           // auto
  return a.ok ? kane : pw;
}

// Runs flows sequentially. failFast stops at the first red flow (tighter loop).
async function verify(verifier, baseUrl, { failFast = true, onFlow } = {}) {
  const results = [];
  for (const flow of flows) {
    onFlow && onFlow({ phase: 'start', flow });
    const r = await verifier.runFlow(flow, baseUrl);
    results.push(r);
    onFlow && onFlow({ phase: 'end', flow, result: r });
    if (!r.ok && failFast) break;
  }
  return { ok: results.length > 0 && results.every((r) => r.ok), results, verifier: verifier.id };
}

module.exports = { pick, verify, flows };
