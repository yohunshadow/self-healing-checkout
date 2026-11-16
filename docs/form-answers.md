# Submission form — DRAFT answers (do not submit without Oyen's OK)

**1. GitHub URL** — `https://github.com/<oyen's-handle>/self-healing-checkout`  (repo must be public; first commit 16 Nov 2026 ✔ after 12 Nov)

**2. About your app** (paste):

> **Self-Healing Checkout** is a closed loop between a coding agent and Kane CLI. A small web shop (products, cart, checkout form, confirmation page) is attacked by a *breaker* that injects a random, realistic bug — a dead "Place order" button, a wrong order total, a validation regression (ZIPs starting with 0, any string accepted as an email) or a mobile layout bug that hides the buy button. **Kane CLI** runs three plain-English flows in a real browser (desktop happy path with exact totals, validation, and a 390px phone checkout) and returns pass/fail with the reason. That verdict — and nothing else — is handed to a *fixer* agent (Gemini 3.5 Flash via Google's OpenAI-compatible API, with a configured fallback chain of gemini-3.8-flash → gemini-3.7-flash → gemini-3.5-flash), which patches the source. Kane then re-runs, and the loop repeats until every flow is green. Each cycle (injected diff, Kane verdict with a link to the Kane run, fixer patch, re-run) is logged on a live timeline dashboard.
>
> What Kane does: it is the only oracle. It catches bugs that unit tests miss (an obscured button on mobile, an off-by-$0.50 tax), and it proves the fix by re-running the same flow. Kane's pass/fail is parsed from its `--agent` NDJSON output and exit code and fed back to the agent. The repo has a one-command demo (`npm run demo`) plus a recorded real Kane run as a fallback (`recorded/kane-run.json`, seed 5: 4 bugs injected, 3 caught, 4 cycles ended green, 22 Kane flow runs, 547.3 credits). In that recorded run Kane did not catch the mobile-layout injection (all three flows passed after the bug was injected, so the fixer never ran); the other three bugs were caught and healed. That miss is left in the recording on purpose.

**Which agent:** Gemini 3.5 Flash, called through Google's OpenAI-compatible chat-completions API (`FIXER_BASE_URL` / `FIXER_MODEL`, with fallbacks `gemini-3.8-flash` → `gemini-3.7-flash` → `gemini-3.5-flash`). In the recorded Kane run, the two patches that name a model were applied by `gemini-3.5-flash` after earlier models in the chain failed with 503 or timeouts. A third successful tree change (cycle 4, attempt 3) has no model recorded because the fixer threw after a partial apply. The offline `heuristic` fixer is NOT an AI agent and was not used for that run. An optional second-provider fallback (NVIDIA NIM) exists in the repo but was not used in the recorded run.

**3. Demo video (YouTube)** — [URL after upload]

**4. Live URL** — optional; none (runs locally; recorded fallback in repo)

**5. Launch buzz** — [2+ public post URLs: X thread + X/Reddit/LinkedIn/HN post]. Drafts in `docs/x-posts.md`.

**Also required (not in the form):** registered on testmuai.com with the same email as the form; has run Kane CLI at least once; judges' credentials: none needed (shop has no login).
