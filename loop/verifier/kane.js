// The real verifier: shells out to Kane CLI (npm i -g @testmuai/kane-cli) with a plain-English objective,
// reads the NDJSON stream (--agent) and the exit code (0 pass / 1 fail / 2 did not start / 3 timeout).
const { spawn, spawnSync } = require('child_process');

const BIN = process.env.KANE_BIN || 'kane-cli';
const FLOW_TIMEOUT_S = Number(process.env.KANE_TIMEOUT || 420);

function available() {
  const probe = spawnSync(BIN, ['--version'], { encoding: 'utf8' });
  if (probe.error) return { ok: false, why: 'kane-cli not installed (npm i -g @testmuai/kane-cli)' };
  // `whoami` prints a boxed identity; the reliable signal is a real credential check.
  const w = spawnSync(BIN, ['whoami'], { encoding: 'utf8' });
  const out = (w.stdout || '') + (w.stderr || '');
  if (/Not logged in|not configured|Token\s+missing/i.test(out)) return { ok: false, why: 'kane-cli is not logged in (kane-cli login --oauth)' };
  return { ok: true };
}

function setWindow(v) {
  spawnSync(BIN, ['config', 'set-window', `${v.width}x${v.height}`], { encoding: 'utf8' });
}

function runFlow(flow, baseUrl) {
  setWindow(flow.viewport);
  const t0 = Date.now();
  return new Promise((resolve) => {
    const args = ['run', flow.objective, '--url', baseUrl + '/', '--agent', ...(process.env.KANE_HEADED ? [] : ['--headless']),
      '--max-steps', String(process.env.KANE_MAX_STEPS || 40), '--timeout', String(FLOW_TIMEOUT_S),
      '--local-context', '.testmuai/context.md', '--final-validation', 'on',
      ...(process.env.KANE_EXTRA_ARGS ? process.env.KANE_EXTRA_ARGS.split(' ') : [])];
    const child = spawn(BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let buf = '', runEnd = null; const steps = []; const failedSteps = [];
    child.stdout.on('data', (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line.startsWith('{')) continue;
        let ev; try { ev = JSON.parse(line); } catch { continue; }
        if (ev.type === 'run_end') runEnd = ev;
        else if (ev.step !== undefined && ev.status) {
          if (ev.status === 'done') steps.push(ev.remark);
          if (ev.status === 'failed') failedSteps.push(ev.remark);
        }
      }
    });
    if (process.env.KANE_DEBUG) child.stderr.pipe(process.stderr); else child.stderr.resume();
    child.on('close', (code) => {
      const ok = code === 0 && runEnd && runEnd.status === 'passed';
      const reasonBits = [runEnd && runEnd.reason, ...failedSteps.slice(-2)].filter(Boolean);
      resolve({
        name: flow.name, title: flow.title, ok: !!ok,
        exitCode: code,
        summary: (runEnd && (runEnd.summary || runEnd.one_liner)) || (code === 2 ? 'Kane CLI did not start (auth/config/Chrome)' : `Kane exited with code ${code}`),
        reason: reasonBits.join(' | '),
        failedStep: failedSteps.slice(-1)[0] || null,
        stepsDone: steps.length, testUrl: runEnd && runEnd.test_url, credits: runEnd && runEnd.credits_consumed,
        durationMs: Date.now() - t0, notStarted: code === 2,
      });
    });
  });
}

module.exports = { id: 'kane', label: 'Kane CLI (real browser)', runFlow, available: async () => available() };
