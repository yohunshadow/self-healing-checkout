# Demo video script — "Self-Healing Checkout" (target 4:00, limit 3–5 min)

Screen layout: left = terminal, right = browser with the dashboard (http://localhost:4000). Record 1080p. Voice-over in English.
Pre-flight: `kane-cli whoami` shows logged in, `kane-cli balance` > 500 credits, `npm run demo` rehearsed once.

| Time | On screen | Voice-over |
|---|---|---|
| 0:00–0:20 | Title card, then a shop checkout page | "AI agents write code fast but can't check their own work. I wanted to see what happens when you wire Kane CLI straight into the agent loop — and then attack it on purpose." |
| 0:20–0:50 | Quick tour of the shop (add 2 mugs, cart, checkout, success). Show `flows/flows.json` | "This is a tiny shop: products, cart, a checkout form, a success page. Kane gets three plain-English flows — no selectors, no test code. Happy path with exact totals, a validation check, and a phone-sized checkout." |
| 0:50–1:10 | Architecture diagram from the README | "A breaker injects a realistic bug. Kane tests it in a real browser. The fixer agent only sees Kane's verdict. Then Kane re-runs. Loop until green." |
| 1:10–1:40 | Terminal: `npm run demo`; dashboard opens; Baseline card goes green | "First, a baseline: Kane has to pass on the untouched shop, otherwise the loop proves nothing." |
| 1:40–2:40 | **Cycle 1.** Dashboard: red diff appears (breaker). Kane flow runs in the real browser window (show it clicking). FAIL appears with Kane's explanation. Click the "Kane run ↗" evidence link | "Cycle one: the breaker just made the order total ignore quantity. Watch Kane: it adds the items, opens the cart, and says the total is wrong — here's the evidence in Kane's own report." |
| 2:40–3:20 | Fixer card: verdict → patch diff → Kane re-runs → green "healed" | "That verdict goes to the fixer agent. It patches one line. Kane re-runs the same flow — green. The loop is closed." |
| 3:20–3:50 | Cycle 2 sped up 4× (a **mobile** bug: Place order covered). Pause on Kane's message that the button can't be clicked | "Different bug, different flow. On a 390-pixel screen the summary panel covers the Place order button. Plain code tests wouldn't notice; Kane tries to click like a user and says it can't." |
| 3:50–4:15 | Final dashboard: 3/3 healed, stats row. Mention credits used | "Three bugs injected, three caught by Kane, three healed — each verified by a real browser run." |
| 4:15–4:40 | README, `npm run replay` fallback, repo URL | "One command to run it, a recorded Kane run as a fallback, and the fixer is pluggable: any OpenAI-compatible model or CLI agent such as Claude Code or Codex." |

## Shot list / tips
- To show Kane's browser window on camera, run with `KANE_HEADED=1 npm run demo` (needs a desktop session).
- Seed for a good story: pick a seed whose first bug is `total-ignores-quantity` (or use `--only=total-ignores-quantity,mobile-summary-overlay,email-accepts-anything --bugs=3`).
- Show the "Kane run" evidence link once, in the first red flow.
- Tell the truth about the fixer on camera (which model/agent was used).
- Upload to YouTube (public or unlisted), title: "Self-Healing Checkout — a checkout that breaks itself and heals with Kane CLI".
