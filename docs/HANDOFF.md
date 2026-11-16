# Handoff checklist (internal, delete or keep out of the public README if you like)

## Kane CLI auth (Oyen must do these; nothing here was done by the bot)
1. Register at https://www.testmuai.com (same email you will use on the hackathon form), claim the 10,000 free credits.
2. On the box (needs a browser): `kane-cli login --oauth` — or non-interactive with the access key from the TestMu AI dashboard:
   `kane-cli login --username <user> --access-key <key>`.
3. Verify: `kane-cli whoami` (should show logged in) and `kane-cli balance`.
4. First proof run (required by the rules: "must have run Kane CLI"): `npm run kane:baseline` — runs the 3 flows on the untouched shop.
5. If a flow is flaky/over-strict, tweak the objective in `flows/flows.json` or `.testmuai/context.md`; re-run until baseline is green 3× in a row.
6. Record the real run: `npm run demo -- --bugs=4`, then copy `runs/latest.json` to `recorded/kane-run.json` and commit.

## Remaining blockers
- Kane login (above). Until then no flow has been executed by Kane itself — only by the Playwright stand-in.
- A real fixer: no LLM key/CLI agent is available on the box. Set `FIXER_API_KEY` (+ `FIXER_BASE_URL`/`FIXER_MODEL`) or `FIXER_CMD`.
- Public repo, YouTube upload, 2 posts, form submission — all need Oyen's explicit go-ahead.
- Author identity in git history is "Grok Bot <bot@localhost>"; rewrite before pushing if wanted.
