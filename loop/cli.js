#!/usr/bin/env node
// Self-Healing Checkout loop:  breaker → verifier (Kane) → fixer → verifier … until green.
const fs = require('fs');
const path = require('path');
const { ROOT, copyDir, readTree, treeDiff, mulberry32, startShop } = require('./util');
const mutations = require('./mutations');
const verifierMod = require('./verifier');
const fixerMod = require('./fixer');
const { Timeline } = require('./timeline');

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
}));
const opt = {
  verifier: args.verifier || 'auto', fixer: args.fixer || 'auto',
  bugs: Number(args.bugs || 3), seed: Number(args.seed || Date.now() % 100000),
  maxFix: Number(args['max-fix'] || 3), shopPort: Number(args['shop-port'] || 4010),
  dashPort: Number(args['dash-port'] || 4000), serve: !!args.serve, only: args.only ? String(args.only).split(',') : null,
};

const c = { dim: (s) => `\x1b[2m${s}\x1b[0m`, red: (s) => `\x1b[31m${s}\x1b[0m`, green: (s) => `\x1b[32m${s}\x1b[0m`, bold: (s) => `\x1b[1m${s}\x1b[0m`, yel: (s) => `\x1b[33m${s}\x1b[0m` };
const log = (s) => console.log(s);

async function main() {
  const verifier = await verifierMod.pick(opt.verifier);
  const fixer = fixerMod.pick(opt.fixer);
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const runDir = path.join(ROOT, 'runs', runId);
  const tl = new Timeline(path.join(runDir, 'timeline.json'), {
    runId, verifier: verifier.id, verifierLabel: verifier.label, fixer: fixer.id, fixerLabel: fixer.label,
    standIn: verifier.id !== 'kane', seed: opt.seed, plannedBugs: opt.bugs,
  });
  fs.mkdirSync(path.join(ROOT, 'runs'), { recursive: true });
  fs.copyFileSync(tl.file, path.join(ROOT, 'runs', 'latest.json'));
  const sync = () => fs.copyFileSync(tl.file, path.join(ROOT, 'runs', 'latest.json'));
  const origFlush = tl.flush.bind(tl); tl.flush = () => { origFlush(); try { sync(); } catch {} };

  if (opt.serve) { const d = require('../dashboard/server'); await d.start(opt.dashPort); log(c.bold(`Dashboard: http://localhost:${opt.dashPort}/`)); }
  log(c.bold('Self-Healing Checkout'));
  log(`  verifier: ${verifier.label}`);
  log(`  fixer:    ${fixer.label}`);
  if (verifier.id !== 'kane') log(c.yel('  ⚠ Kane CLI not available/logged in → using the TEMPORARY Playwright stand-in. Do not count this run as Kane-verified.'));

  const work = path.join(ROOT, 'work', 'shop');
  copyDir(path.join(ROOT, 'shop'), work);
  const rnd = mulberry32(opt.seed);
  let pool = mutations.filter((m) => !opt.only || opt.only.includes(m.id));
  const order = []; while (order.length < opt.bugs && pool.length) order.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);

  async function runVerify(label, cycle) {
    const shop = await startShop(work, opt.shopPort);
    try {
      tl.add('verify_start', { cycle, label, verifier: verifier.id });
      const rep = await verifierMod.verify(verifier, shop.url, {
        failFast: true,
        onFlow: (e) => {
          if (e.phase === 'start') { log(c.dim(`    ▸ ${e.flow.name}: ${e.flow.title}`)); tl.add('flow_start', { cycle, flow: e.flow.name, title: e.flow.title, objective: e.flow.objective }); }
          else { const r = e.result; log(`    ${r.ok ? c.green('✔ pass') : c.red('✘ FAIL')} ${e.flow.name} ${c.dim(`(${(r.durationMs / 1000).toFixed(1)}s)`)}${r.ok ? '' : '\n      ' + r.summary}`); tl.add('flow_end', { cycle, flow: e.flow.name, ok: r.ok, summary: r.summary, reason: r.reason, testUrl: r.testUrl, credits: r.credits, durationMs: r.durationMs }); }
        },
      });
      if (rep.results.some((r) => r.notStarted)) throw new Error('Kane CLI did not start (exit 2): ' + rep.results.find((r) => r.notStarted).summary);
      tl.add('verify_result', { cycle, label, ok: rep.ok, failing: rep.results.filter((r) => !r.ok).map((r) => r.name) });
      return rep;
    } finally { shop.stop(); }
  }

  // Cycle 0: the untouched shop must be green, otherwise the loop proves nothing.
  log(c.bold('\n● Baseline'));
  tl.add('baseline_start', { cycle: 0 });
  const base = await runVerify('baseline', 0);
  if (!base.ok) { tl.add('abort', { reason: 'baseline is not green' }); tl.finish({ aborted: true }); console.error(c.red('Baseline is red; fix the shop or the flows first.')); process.exit(1); }
  tl.add('baseline_green', { cycle: 0 });

  let healed = 0, caught = 0, totalFixAttempts = 0, credits = 0;
  for (let i = 0; i < order.length; i++) {
    const m = order[i], cycle = i + 1;
    log(c.bold(`\n● Cycle ${cycle}/${order.length} — breaker injects: `) + c.red(`${m.category}`) + c.dim(` (${m.id})`));
    const file = path.join(work, m.file);
    const before = fs.readFileSync(file, 'utf8');
    if (!before.includes(m.good)) throw new Error('mutation target not found: ' + m.id);
    fs.writeFileSync(file, before.replace(m.good, m.bad));
    tl.add('bug_injected', { cycle, bugId: m.id, category: m.category, title: m.title, file: m.file, diff: treeDiff({ [m.file]: before }, { [m.file]: fs.readFileSync(file, 'utf8') }) });

    let green = false;
    for (let attempt = 1; attempt <= opt.maxFix + 1; attempt++) {
      const rep = await runVerify(attempt === 1 ? 'after-bug' : `after-fix-${attempt - 1}`, cycle);
      rep.results.forEach((r) => (credits += r.credits || 0));
      if (rep.ok) { green = true; break; }
      if (attempt === 1) caught++;
      if (attempt > opt.maxFix) break;
      log(c.dim(`    → feeding verdict to fixer (${fixer.id}), attempt ${attempt}`));
      tl.add('fixer_input', { cycle, attempt, failing: rep.results.filter((r) => !r.ok).map((r) => ({ flow: r.name, summary: r.summary, reason: r.reason, testUrl: r.testUrl })) });
      const snap = readTree(work);
      totalFixAttempts++;
      let res;
      try { res = await fixer.fix(rep, snap, work); } catch (e) { res = { explanation: 'Fixer error: ' + e.message, edits: [] }; }
      const diff = treeDiff(snap, readTree(work));
      log(`    🛠  ${res.explanation}`);
      tl.add('fix_applied', { cycle, attempt, explanation: res.explanation, model: res.model, diff, changed: !!diff });
    }
    if (green) { healed++; log(c.green(`    ✔ Cycle ${cycle} healed: all flows green again`)); tl.add('healed', { cycle, bugId: m.id }); }
    else { log(c.red(`    ✘ Cycle ${cycle}: fixer could not heal the app`)); tl.add('unhealed', { cycle, bugId: m.id }); copyDir(path.join(ROOT, 'shop'), work); }
  }
  const summary = { bugsInjected: order.length, caught, healed, fixAttempts: totalFixAttempts, credits: Math.round(credits * 10) / 10 };
  tl.add('run_end', summary); tl.finish(summary);
  log(c.bold(`\nDone: ${healed}/${order.length} bugs caught by the verifier and healed by the fixer.`));
  log(c.dim(`Timeline: ${path.relative(process.cwd(), tl.file)}   (runs/latest.json)`));
  if (opt.serve && !args['no-hold']) log(c.dim('Dashboard still serving; Ctrl+C to exit.')); else process.exit(healed === order.length ? 0 : 1);
}
main().catch((e) => { console.error(c.red('✘ ' + e.message)); process.exit(2); });
