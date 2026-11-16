// Builds the request every fixer backend receives: ONLY Kane's verdict + the app source.
// The breaker's identity / answer key is never included.
function buildPrompt(report, files) {
  const failing = report.results.filter((r) => !r.ok);
  const src = Object.entries(files).map(([f, c]) => `### ${f}\n\`\`\`\n${c}\n\`\`\``).join('\n\n');
  return `You are the FIXER agent in a self-healing loop. A verifier (${report.verifier}) ran plain-English checkout flows
against a small shop web app in a real browser and one or more FAILED. Find the regression in the source and fix it
with the smallest possible edit. Do not change tests or flows. Do not weaken validation to make a flow pass.

## Verifier report (failing flows)
${failing.map((r) => `- flow: ${r.name} — ${r.title}\n  result: ${r.summary}\n  reason: ${r.reason || 'n/a'}\n  failed step: ${r.failedStep || 'n/a'}`).join('\n')}

## App source (paths relative to the shop root)
${src}

## Answer format
Reply with ONLY JSON: {"explanation": "<one sentence>", "edits": [{"file": "<path>", "find": "<exact existing text, unique in file>", "replace": "<new text>"}]}`;
}
module.exports = { buildPrompt };
