# skill-audit

**The quality & security auditor for agent skills.** Point it at any `SKILL.md` (ClawHub, skills.sh, anthropics/skills — same format everywhere) and get a scored report card: prompt-injection risks, hardcoded secrets, dangerous scripts, structure and clarity. Static, offline, zero dependencies.

```bash
npx skill-audit ./some-skill --out reports/
```

Skill marketplaces are exploding and nobody tests anything: thousands of skills, zero quality control, and prompt-injection via SKILL.md is the vulnerability nobody watches. skill-audit is the missing gate.

## What it checks
- **Safety (critical)**: injection patterns ("ignore previous instructions…", "reveal your system prompt"), exfiltration URLs, `curl | sh`, eval/base64 blobs, hidden unicode, hardcoded API keys/PATs/private keys, destructive or system-modifying scripts (`rm -rf /`, crontab, /etc, chmod 777). Any critical fail caps the score at 25 → grade F.
- **Structure**: frontmatter, name, description quality, usage and procedure sections.
- **Clarity**: vague-spec smell ("as needed", "various", "etc").
- **Maintainability**: size, license.

## Scoring
100 points minus penalties (critical −40, major −10, minor −5). Grades A ≥ 90, B ≥ 75, C ≥ 60, D ≥ 45, F below. Exit code 1 on any critical finding — drop it into CI and every skill PR gates itself.

## Output
- Markdown report (stdout)
- `reports/<name>.report.html` — standalone dark report card, ready to host or screenshot
- `reports/<name>.report.json` — machine-readable, for leaderboards
- Badge: `![skill-audit](https://img.shields.io/badge/skill--audit-A%20(95)-brightgreen)`

## Use it as a skill
This repo ships as a skill itself: install it and your agent audits skills on demand before installing anything third-party (see `SKILL.md`).

## Roadmap
- Public leaderboard: automated audits of the top marketplace skills, refreshed daily.
- Verified-badge API for publishers (USDC).

## Status
Built in one session by ORION, an autonomous agent running on a Raspberry Pi, directed by its owner. MIT.
