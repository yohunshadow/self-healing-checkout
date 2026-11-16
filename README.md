# Self-Healing Checkout

> A checkout that gets sabotaged on purpose, then heals itself — with **Kane CLI** as the referee.

A *breaker* injects a realistic bug into a small web shop (a dead button, a wrong total, a validation
regression, a mobile layout bug). **Kane CLI** runs plain-English checkout flows in a real browser and
returns pass/fail. A *fixer* coding agent receives Kane's verdict, patches the code, and Kane re-runs —
**looping until green**. Every cycle lands on a live timeline dashboard.

Built for the [KaneCLI Online Hackathon](https://www.kaneclihack.sh/) (12–19 Nov 2026).

```
          ┌──────────┐  bug   ┌───────────┐  verdict (pass/fail + why)  ┌──────────┐
          │ BREAKER  ├───────►│ Kane CLI  ├────────────────────────────►│  FIXER   │
          └──────────┘        │ real      │                             │  agent   │
                 ▲            │ browser   │◄────────────────────────────┤ (patches │
                 │            └───────────┘      re-run after patch     │  source) │
                 └──────────── next cycle, new random bug ──────────────┴──────────┘
```

## Judge quick start (one command)

Requirements: Node 20+, Google Chrome.

```bash
git clone <this repo> && cd self-healing-checkout && npm install
npm i -g @testmuai/kane-cli && kane-cli login --oauth     # once; free account, 10k credits
npm run demo                                              # → open http://localhost:4000
```

`npm run demo` starts the dashboard, checks the untouched shop is green (baseline), then runs 3 cycles with
random bugs. In the recorded Kane run below, flows used about 25 credits each (547.3 credits across 22 runs),
so a shorter 3-bug live demo is typically a few hundred credits.

**Fallback if you can't run Kane / have no credits:** `npm run replay` serves the dashboard on a
**recorded real Kane run** (`recorded/kane-run.json`, with links to the Kane evidence) at http://localhost:4000/?src=recorded/kane-run.json.
`npm run demo:standin` runs the loop with a scripted Playwright check instead of Kane — it is clearly labelled
"TEMPORARY STAND-IN" in the terminal and on the dashboard, and only exists to exercise the plumbing offline.

## What Kane actually does here

Three plain-English flows (`flows/flows.json`) are handed to `kane-cli run … --agent --headless`:

| Flow | Viewport | What Kane must prove |
|---|---|---|
| `happy-path` | 1280×800 | 2× Mug + 1× Tote → cart shows Subtotal $42.50 / Shipping $5.00 / Tax $4.25 / Total $51.75, form accepts ZIP `02139`, "Place order" leads to a confirmation charging $51.75 |
| `validation` | 1280×800 | Email `not-an-email` is rejected with an inline error and **no** confirmation appears |
| `mobile-checkout` | 390×844 | On a phone-sized screen the "Place order" button is reachable and completes the order ($25.35) |

The verifier (`loop/verifier/kane.js`) reads Kane's NDJSON stream and exit code (`0` pass, `1` fail, `2` didn't start, `3` timeout),
and extracts the `run_end` summary/reason and the failing step. **That text is the only thing the fixer is told about the bug.**

## The bugs the breaker can inject (`loop/mutations.js`)

| Category | Bug | Caught by flow |
|---|---|---|
| broken button | "Place order" is `type="button"` and no longer submits | happy-path, mobile-checkout |
| wrong total | subtotal ignores quantity | happy-path |
| wrong total | tax is also charged on shipping (off by $0.50) | happy-path |
| wrong total | free-shipping threshold typo ($5 instead of $50) | happy-path |
| validation regression | ZIPs starting with `0` rejected | happy-path |
| validation regression | any string accepted as an email | validation |
| mobile layout | order summary pinned over the Place order button on phones | mobile-checkout |

Each cycle picks a random bug (seeded: `--seed=N`), so the demo differs every time but is reproducible.

## The closed loop

1. **Baseline** – Kane must pass all flows on the untouched shop (otherwise the loop proves nothing).
2. **Break** – breaker mutates a *work copy* of `shop/` (`work/shop`). Your `shop/` is never touched.
3. **Verify** – Kane runs the flows (fail-fast). A red flow is a *catch*.
4. **Fix** – the verdict + app source go to the fixer, which edits the code.
5. **Re-verify** – Kane re-runs. Green → cycle healed; red → feed the new verdict back (up to `--max-fix=3` attempts).

### Fixer backends (`--fixer=…`, default `auto`)

| Backend | Use | Needs |
|---|---|---|
| `llm` | any OpenAI-compatible chat API (OpenAI, OpenRouter, xAI, Ollama, …). Model returns exact-match edits. | `FIXER_API_KEY` (or `OPENAI_API_KEY`), optional `FIXER_BASE_URL`, `FIXER_MODEL` |
| `cmd` | bring your own coding agent: it edits the files in place | `FIXER_CMD`, e.g. `claude -p --dangerously-skip-permissions`, `codex exec --full-auto -`, `gemini -p -y` |
| `heuristic` | **offline demo only** – scripted playbook that matches Kane's failure text to a known repair. *Not an LLM.* | nothing |

`auto` picks `cmd` → `llm` → `heuristic`. The dashboard always shows which one ran.

## Recorded Kane run (16–17 Nov 2026)

`recorded/kane-run.json` is a real Kane CLI run — not the Playwright stand-in. Seed 5, `--bugs=4`.
Started 16 Nov 2026, 20:36:20 WIB (UTC+7); finished 17 Nov 2026, 00:48:44 WIB. Wall clock 4 h 12 min.

`npm run replay` serves this file by default (falls back to `recorded/standin-run.json` if it is missing)
at http://localhost:4000/?src=recorded/kane-run.json.

| Cycle | Bug | Caught by | Fix attempts | Model on the patch that landed | Time (inject → cycle end) |
|---|---|---|---|---|---|
| 1 | `email-accepts-anything` | `validation` | 1, applied | `gemini-3.5-flash` | 27 min 30 s |
| 2 | `mobile-summary-overlay` | **not caught** — all 3 flows passed after injection | 0 (fixer never ran) | — | 21 min 55 s (after-bug already green) |
| 3 | `place-order-dead` | `happy-path` | 2 (1 timeout, no change; 1 applied) | `gemini-3.5-flash` | 33 min 59 s |
| 4 | `total-ignores-quantity` | `happy-path` | 3 (two failed: HTTP 503 / timeout; the 3rd changed the work tree) | not recorded (fixer threw after a partial apply) | 164 min 13 s |

Totals, taken only from the timeline events:

- 4 bugs injected, **3 caught**, 4 cycles ended green. Cycle 2 is marked `healed` only because the after-bug verify was already green; Kane did not catch that injection.
- 6 fix attempts, 3 of which actually changed the work tree.
- 22 Kane flow runs (16 pass, 6 fail).
- **547.3 Kane credits** is the sum of every `flow_end.credits` value, rounded to one decimal. The run's own `summary.credits` field is 471.2 because the loop originally started counting after baseline; the 3 baseline flows used 76.1 credits. That accounting is fixed in this repo for future runs; the recorded JSON is an unchanged copy of the original timeline.
- Fixer: the Gemini OpenAI-compatible API. Configured chain: `gemini-3.8-flash` → `gemini-3.7-flash` → `gemini-3.5-flash`. The two patches that record a model were applied by **gemini-3.5-flash**. A second-provider NVIDIA NIM fallback exists in the code but was **not used** in this recorded run (the process had already started on earlier code).

Kane evidence (share links from the timeline):

- [Email bug caught by `validation`](https://test-manager.lambdatest.com/projects/01M7AV3YP8WCG0N72S5RNYFQWC/test-cases/01M7JA2JWW6E05ZWVHDF1C8PTX/dashboard/share/US_L5I1AVSAM9QWOHXQX6KIODQPS7ZXUUQRMF4P3FBQJZUBAGIR6O77E22ZLHFM3TMR?type=summary&agentView=true&fqdn=summary-page)
- [Dead "Place order" button caught by `happy-path`](https://test-manager.lambdatest.com/projects/01M7AV3YP8WCG0N72S5RNYFQWC/test-cases/01M7JC8NHQ3GBXXYZ4NZQW5MQH/dashboard/share/US_PI55V4CX641LWEVLCMWLO791N1FKMNFNPLUE0M36ILJR9H8DJRXQHPF9Z8BMSS1W?type=summary&agentView=true&fqdn=summary-page)
- [Quantity-total bug caught by `happy-path`](https://test-manager.lambdatest.com/projects/01M7AV3YP8WCG0N72S5RNYFQWC/test-cases/01M7JE6WDHPZ22S1FH7NVMN31R/dashboard/share/US_71NEGGN7H1UK437IL3KQZEAKK6FCUSEPAMZ8MPLMCM0PLB3C24Q4412I0CZPOIVO?type=summary&agentView=true&fqdn=summary-page)
- [Final green `mobile-checkout` that closed the run](https://test-manager.lambdatest.com/projects/01M7AV3YP8WCG0N72S5RNYFQWC/test-cases/01M7JNBWVSG3V3TM22VMYJQ8C4/dashboard/share/US_ZQA5G66Z4N7H01BIYD5RYZ9APPYBV39U6FG7MSJMQSF98IUHCV99NHS3329YHE3A?type=summary&agentView=true&fqdn=summary-page)

The work copy is not reset between cycles that end green, so the uncaught mobile overlay stayed in CSS during later cycles. Kane's later `mobile-checkout` runs also passed. The leftover CSS was removed as a side effect of cycle 4's third, partial fix (visible in that event's tree diff).

## Dashboard

`http://localhost:4000` — stats (including Kane credits summed from every flow), and one card per cycle: the injected diff, each Kane flow (pass/fail, duration, credits, **link to the Kane run**),
the verdict handed to the fixer, the fixer's patch (and model, when recorded), and the final green. A cycle whose after-bug verify is already green is labelled **not caught**.

## Layout

```
shop/        the app under test (zero-dependency Node server + 4 static pages)
flows/       plain-English Kane flows
loop/        breaker catalog, verifiers (kane.js, playwright.js), fixers, orchestrator (cli.js)
dashboard/   live timeline UI + replay server
recorded/    recorded runs for the no-credentials fallback
test/        fixer-plumbing test with a mock LLM endpoint
.testmuai/   context file Kane reads on every run
```

## Options

`node loop/cli.js --bugs=3 --seed=42 --verifier=kane|playwright|auto --fixer=auto|llm|cmd|heuristic --max-fix=3 --only=id1,id2 --serve`

## Notes & honesty

- The app is intentionally small; the point is the loop, not the shop.
- The offline `heuristic` fixer is a stand-in so the loop runs anywhere; real results should use `llm` or `cmd`.
- Kane's result is the only oracle: the fixer is never shown which bug was injected.
- The recorded Kane run is published as-is, including the mobile-layout injection that Kane did not catch.
