# X posts — DRAFTS (English). Not posted. Need #KaneCLIHackDay and the repo/video links.

## Post 1 — launch (with a screen recording of one cycle, ~30s)

I built a checkout that sabotages itself.

A breaker agent injects a realistic bug (dead button, wrong total, mobile layout).
@testmuai's Kane CLI tests it in a real browser.
A fixer agent gets Kane's verdict, patches the code, Kane re-runs.

Loop until green. In the recorded run: 4 bugs injected, 3 caught, 22 Kane flow runs, 547.3 credits. 🐍

Repo: <repo link>
Demo: <youtube link>
#KaneCLIHackDay

## Post 2 — the interesting bit (screenshot of the dashboard)

The cycle I like most from my #KaneCLIHackDay project:

The breaker set "Place order" to type=button, so the form stopped submitting.
Kane CLI filled a valid checkout, clicked the button, and reported it never reached the thank-you page.
First fixer call timed out. Second try, Gemini 3.5 Flash flipped the button back to type=submit. Kane re-ran → ✅

(One of the four injections — a mobile overlay — was not caught. That cycle is still in the recording.)

Self-Healing Checkout: <repo link>

## Spare — Hacker News / Reddit title
"Show HN: Self-Healing Checkout – a shop that breaks itself, with Kane CLI verifying the agent's fixes in a real browser"
