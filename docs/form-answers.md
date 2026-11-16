# Submission form — DRAFT answers (do not submit without Oyen's OK)

**1. GitHub URL** — `https://github.com/<oyen's-handle>/self-healing-checkout`  (repo must be public; first commit 16 Nov 2026 ✔ after 12 Nov)

**2. About your app** (paste):

> **Self-Healing Checkout** is a closed loop between a coding agent and Kane CLI. A small web shop (products, cart, checkout form, confirmation page) is attacked by a *breaker* that injects a random, realistic bug — a dead "Place order" button, a wrong order total, a validation regression (ZIPs starting with 0, any string accepted as an email) or a mobile layout bug that hides the buy button. **Kane CLI** runs three plain-English flows in a real browser (desktop happy path with exact totals, validation, and a 390px phone checkout) and returns pass/fail with the reason. That verdict — and nothing else — is handed to a *fixer* agent ([FIXER AGENT / MODEL — fill in], plugged in through an OpenAI-compatible endpoint or a CLI agent), which patches the source. Kane then re-runs, and the loop repeats until every flow is green. Each cycle (injected diff, Kane verdict with a link to the Kane run, fixer patch, re-run) is logged on a live timeline dashboard.
>
> What Kane does: it is the only oracle. It catches bugs that unit tests miss (an obscured button on mobile, an off-by-$0.50 tax), and it proves the fix by re-running the same flow. Kane's pass/fail is parsed from its `--agent` NDJSON output and exit code and fed back to the agent. The repo has a one-command demo (`npm run demo`) plus a recorded Kane run as a fallback.

**Which agent:** [FIXER AGENT — to fill in, e.g. "Claude Code via FIXER_CMD" / "GPT-… via OpenAI-compatible API"]. Be accurate: the offline `heuristic` fixer is NOT an AI agent.

**3. Demo video (YouTube)** — [URL after upload]

**4. Live URL** — optional; none (runs locally; recorded fallback in repo)

**5. Launch buzz** — [2+ public post URLs: X thread + X/Reddit/LinkedIn/HN post]. Drafts in `docs/x-posts.md`.

**Also required (not in the form):** registered on testmuai.com with the same email as the form; has run Kane CLI at least once; judges' credentials: none needed (shop has no login). 
