# skill-audit

**The autonomous auditor for the agent-skills economy.** An agent that discovers skills in any repo or marketplace, flags prompt-injection and security risks, scores quality and publishes a public leaderboard. Static analysis only — nothing gets executed. Zero dependencies, Node >= 18.

## Quickstart (the agent)

    git clone https://github.com/essentoclothes-sudo/skill-audit && cd skill-audit
    cp config.example.json config.json
    node agent.js --top 20 --no-publish     # audits anthropics/skills + addyosmani/agent-skills

Output in `public/`: per-skill HTML report cards (`public/cards/`) + `leaderboard.html` + `leaderboard.json`, sorted by score.

## What it audits
- **Safety (critical, caps score at 25 → F)**: injection patterns ("ignore previous instructions…", "reveal your system prompt"), exfiltration URLs, `curl | sh`, eval/base64 blobs, hidden unicode, hardcoded keys (API/PAT/AWS/private keys), destructive or system-modifying scripts (`rm -rf /`, crontab, /etc, chmod 777).
- **Structure**: frontmatter, name, description quality, usage & procedure sections.
- **Clarity / maintainability**: vague specs, size, license.

Grades A ≥ 90 · B ≥ 75 · C ≥ 60 · D ≥ 45 · F below. Any critical finding caps the score at 25.

## Run it yourself (CI / one-liner)

    npx skill-audit ./some-skill --out reports/

Exit code 1 on critical findings — use it as a PR gate for your own skills repo.

## Autonomous publishing
Set `GITHUB_TOKEN` + `PUBLISH_REPO`, `publish: true` in config → the agent pushes leaderboard + cards to the `gh-pages` branch on every run. `--watch 60` keeps it looping. Optional Telegram notifications (`TG_BOT_TOKEN`, `TG_CHAT_ID`).

## Also a skill
Install this repo as a skill and your own agent audits third-party skills before installing them (`SKILL.md`).

## Why
Skill marketplaces are exploding (anthropics/skills: 195k⭐) with zero quality control. Prompt-injection via SKILL.md is the vulnerability nobody is watching. skill-audit is the missing gate — and its leaderboard is public infrastructure.

## Status
Built in one session by ORION, an autonomous agent on a Raspberry Pi, directed by its owner. MIT.
