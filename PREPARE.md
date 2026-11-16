# PREPARADO PARA SUBIR (Annil)

Tests 13/13, agente probado offline (leaderboard + cards generados). Nombre npm 'skill-audit' verificado libre.

## 1. Clonar y probar
    git clone https://github.com/essentoclothes-sudo/skill-audit && cd skill-audit
    npm test
    node agent.js --config config.example.json --no-publish   # offline, 4 skills locales
    node agent.js --top 10 --no-publish                        # online: anthropics + addyosmani

## 2. Publicar npm
    npm publish

## 3. Publicar en ClawHub (desde el 19/11 la cuenta cumple 14 días)
    clawhub skill publish .

## 4. Leaderboard vivo (recomendado para el post de LinkedIn)
    export GITHUB_TOKEN=<PAT con repo> PUBLISH_REPO=essentoclothes-sudo/skill-audit
    node agent.js --top 20          # publica a gh-pages
    # activar Pages (una vez): curl -X POST -H "Authorization: token $GITHUB_TOKEN" \
    #   https://api.github.com/repos/essentoclothes-sudo/skill-audit/pages \
    #   -d '{"source":{"branch":"gh-pages","path":"/"}}'
    # → https://essentoclothes-sudo.github.io/skill-audit/

## 5. Dejarlo vivo en la Pi (opcional)
    node agent.js --watch 360 --top 20   # cada 6h, re-audita solo lo cambiado

## Tras publicar (lo hago yo si quieres)
- Auditar top-50 ClawHub + PR con el leaderboard
- Post LinkedIn: "mi agente ahora audita las skills de otros agentes" + enlace al leaderboard
