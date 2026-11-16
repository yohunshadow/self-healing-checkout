# Demo video script — "Self-Healing Checkout" (target 4:00, limit 3–5 min)

Screen layout: left = terminal, right = browser with the dashboard (http://localhost:4000). Record 1080p. Voice-over in English.
Recommended path: replay the recorded real Kane run so the numbers and evidence links match the repo (`npm run replay`, then open the URL it prints). Live `npm run demo` is fine too, but it will be a different seed and will spend Kane credits.
Pre-flight if recording a live run: `kane-cli whoami` shows logged in, `kane-cli balance` has several hundred credits to spare, `npm run demo` rehearsed once.

| Time | On screen | Voice-over |
|---|---|---|
| 0:00–0:20 | Title card, then a shop checkout page | "AI agents write code fast but can't check their own work. I wanted to see what happens when you wire Kane CLI straight into the agent loop — and then attack it on purpose." |
| 0:20–0:50 | Quick tour of the shop (add 2 mugs, cart, checkout, success). Show `flows/flows.json` | "This is a tiny shop: products, cart, a checkout form, a success page. Kane gets three plain-English flows — no selectors, no test code. Happy path with exact totals, a validation check, and a phone-sized checkout." |
| 0:50–1:10 | Architecture diagram from the README | "A breaker injects a realistic bug. Kane tests it in a real browser. The fixer agent only sees Kane's verdict. Then Kane re-runs. Loop until green." |
| 1:10–1:40 | Replay (or live `npm run demo`); dashboard opens; Baseline card goes green | "First, a baseline: Kane has to pass on the untouched shop, otherwise the loop proves nothing. In the recorded run the baseline was green in about five minutes." |
| 1:40–2:40 | **Cycle 1** (`email-accepts-anything`). Dashboard: red diff. Kane `validation` FAILs. Click the "Kane run ↗" evidence link | "Cycle one: the breaker disabled email validation. Kane's happy path still passed — a valid email is fine — but the validation flow submitted `not-an-email` and got a thank-you page, which is forbidden. Here's Kane's own report." |
| 2:40–3:15 | Fixer card: verdict → patch by gemini-3.5-flash → Kane re-runs all three flows → green "healed" | "That verdict goes to the fixer. Gemini 3.5 Flash restores the email regex. Kane re-runs — green. The loop is closed." |
| 3:15–3:40 | Cycle 2 (`mobile-summary-overlay`) — pause on the **not caught** pill. All three flows, including mobile-checkout, passed | "I am not going to hide the miss. Cycle two pinned the order summary over the Place order button on a 390-pixel screen. Kane still passed every flow, so the fixer never ran. The recording keeps that cycle as-is." |
| 3:40–4:20 | Cycle 3 sped up (dead Place order button, two attempts) and a beat on cycle 4 (wrong totals, three attempts). Final stats: 4 injected, 3 caught, 22 Kane runs, 547.3 credits | "When Kane does catch the bug, the loop works. A dead Place order button took two fixer attempts — the first Gemini call timed out, the second changed the button back to `type=submit`, Kane went green. A quantity-total bug took three attempts because Gemini was throwing 503s and timeouts. Four bugs injected, three caught, twenty-two Kane flow runs, 547.3 credits." |
| 4:20–4:40 | README, `npm run replay` fallback, repo URL | "One command to run it, a recorded Kane run as a fallback, and the fixer is pluggable: any OpenAI-compatible model or CLI agent such as Claude Code or Codex." |

## Shot list / tips
- Prefer `npm run replay` so the video matches `recorded/kane-run.json` (seed 5, 16–17 Nov 2026, times in WIB).
- To show Kane's browser window on camera in a *live* run, use `KANE_HEADED=1 npm run demo` (needs a desktop session).
- If you record a fresh live run instead, do not quote the 547.3 / 3-of-4 figures from the recorded timeline — those belong to seed 5 only.
- Show the "Kane run" evidence link once, on the first red flow (the email validation catch).
- Tell the truth about the fixer on camera: Gemini 3.5 Flash applied the two patches that name a model.
- Be explicit that one of the four injections was not caught.
- Upload to YouTube (public or unlisted), title: "Self-Healing Checkout — a checkout that breaks itself and heals with Kane CLI".
