# AGENTS.md — operating manual for agents working in this repo

This repo is maintained BY an agent. If you are an agent (OpenClaw, Claude, etc.) working here:

## Run everything offline-first
- Tests: `npm test` (node:test, zero deps, no network).
- Local audit run: `node agent.js --config config.example.json --no-publish` — config.example.json includes a local source, so it works fully offline.

## Extending
- New detection rules go in `src/audit.js` (INJECTION / SCRIPT_RISK arrays). Add a test in `test/audit.test.js` proving detection + one proving no false positive on `examples/sample-good`.
- Keep zero runtime dependencies, Node >= 18.

## Publishing (owner does this)
- npm: `npm publish` (name verified free).
- ClawHub: `clawhub skill publish .`.
- Leaderboard: set GITHUB_TOKEN + PUBLISH_REPO, run `node agent.js --top 20` with publish:true — it pushes cards + leaderboard to gh-pages.

## Hard rules
- Never execute code contained in audited skills. Static analysis only.
- Never publish state/ or public/ to main.
