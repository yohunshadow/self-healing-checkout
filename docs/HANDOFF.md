# Handoff checklist (internal, delete or keep out of the public README if you like)

## Done (local only — nothing has been published)

- Kane CLI is logged in on the box (basic-auth; OAuth callback to 127.0.0.1 was refused here). Do not print or commit `KANE_ACCESS_KEY`.
- An LLM fixer is wired: Gemini OpenAI-compatible API (`FIXER_API_KEY` in `.env`, never commit it) with model chain `gemini-3.8-flash` → `gemini-3.7-flash` → `gemini-3.5-flash`, plus an optional NVIDIA NIM second provider (`NVIDIA_API_KEY`) that was added after this recorded run started and was not used in it.
- Recorded real Kane run is committed as `recorded/kane-run.json` (copy of `runs/2026-11-16T13-36-20-731Z/timeline.json`, seed 5, 16 Nov 20:36:20 WIB → 17 Nov 00:48:44 WIB).
  - 4 bugs injected, 3 caught, 4 cycles ended green.
  - `mobile-summary-overlay` was **not caught** (after-bug already green; fixer did not run). Do not describe this run as 4/4 caught.
  - 6 fix attempts, 22 Kane flow runs, 547.3 credits summed from every `flow_end` (the file's `summary.credits` is 471.2 because baseline was originally excluded).
  - Replay: `npm run replay` → http://localhost:4000/?src=recorded/kane-run.json
- README, form-answer draft, demo script, and X post drafts now use those timeline numbers. `[FIXER AGENT]` is filled in as Gemini 3.5 Flash.

## Still needs Oyen's explicit go-ahead (do not do any of these unasked)

- Public GitHub repo (and any rewrite of the "Grok Bot <bot@localhost>" author before pushing).
- YouTube upload of the 3–5 min demo.
- 2+ public posts (drafts in `docs/x-posts.md`).
- Hackathon form submission (drafts in `docs/form-answers.md`).
- Deadline: 19 Nov 11:59 PM IST = 20 Nov 01:29 WIB.

## Notes

- `shop/` is never mutated; the loop edits `work/shop` (gitignored).
- Never print or commit `FIXER_API_KEY`, `KANE_ACCESS_KEY`, or `NVIDIA_API_KEY`.
- `gh` is not authenticated on the box; the repo is local-only so far.
