# PREPARADO PARA SUBIR (Annil)

Todo verificado en local: tests, CLI sobre ejemplos buenos/malos, report cards generadas.

## 1. Clonar
    git clone https://github.com/essentoclothes-sudo/skill-audit && cd skill-audit

## 2. Comprobar tú mismo
    npm test
    node bin/cli.js examples/sample-good --out /tmp/reports
    node bin/cli.js examples/sample-bad   # debe salir con código 1 (críticos)

## 3. Publicar en npm (nombre verificado libre: skill-audit)
    npm publish
    # si pide 2FA, usa el OTP; si el nombre chocara, cambia "name" a @josealbertomaquina/skill-audit y publica con --access public

## 4. Publicar como skill en ClawHub (a partir del 19/11 la cuenta cumple 14 días)
    clawhub skill publish .
    # login ya configurado en la Pi (token guardado); si expira, pedirte otro clic de device-flow

## 5. (Opcional) Demo pública de report cards
    cp /tmp/reports/*.html docs/  →  GitHub Pages → enlace en el README/LinkedIn

## Tras publicar (yo lo hago si quieres)
- PR del leaderboard top-50 ClawHub con report cards públicas
- Post LinkedIn: "mi agente ahora audita skills de otros agentes" + enlace
