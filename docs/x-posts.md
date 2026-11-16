# X posts — DRAFTS (English). Not posted. Need #KaneCLIHackDay and the repo/video links.

## Post 1 — launch (with a screen recording of one cycle, ~30s)

I built a checkout that sabotages itself.

A breaker agent injects a realistic bug (dead button, wrong total, mobile layout).
@testmuai's Kane CLI tests it in a real browser.
A fixer agent gets Kane's verdict, patches the code, Kane re-runs.

Loop until green. 🐍

Repo: <repo link>
Demo: <youtube link>
#KaneCLIHackDay

## Post 2 — the interesting bit (screenshot of the dashboard)

The bug I like most from my #KaneCLIHackDay project:

On a 390px phone screen, the order summary was pinned over the "Place order" button.
Unit tests: green. Kane CLI tried to click it like a human and reported "covered by another element."
Fixer patched the CSS, Kane re-ran → ✅

Self-Healing Checkout: <repo link>

## Spare — Hacker News / Reddit title
"Show HN: Self-Healing Checkout – a shop that breaks itself, with Kane CLI verifying the agent's fixes in a real browser"
