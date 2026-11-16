#!/usr/bin/env node
'use strict';
/* skill-audit-agent: autonomous agent that audits skill marketplaces and publishes a leaderboard. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { auditMarkdown } = require('./src/audit');
const { toHtml } = require('./src/report');

function sha1(s) { return crypto.createHash('sha1').update(s).digest('hex'); }
function sanitizeId(id) { return id.replace(/[^A-Za-z0-9._-]+/g, '__'); }

function defaultConfig() {
  return {
    top: 20,
    out: 'public',
    publish: false,
    notify: false,
    sources: [
      { type: 'github', repo: 'anthropics/skills' },
      { type: 'github', repo: 'addyosmani/agent-skills' },
    ],
  };
}

function loadConfig(file) {
  const cfg = defaultConfig();
  if (file && fs.existsSync(file)) Object.assign(cfg, JSON.parse(fs.readFileSync(file, 'utf8')));
  else if (fs.existsSync('config.json')) Object.assign(cfg, JSON.parse(fs.readFileSync('config.json', 'utf8')));
  return cfg;
}

function localSkills(dir) {
  const hits = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (['node_modules', '.git', 'public', 'state'].includes(e.name)) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === 'SKILL.md') hits.push({ id: path.basename(path.dirname(p)), path: p });
    }
  })(dir);
  return hits;
}

async function githubSkills(repo, token) {
  const headers = { 'User-Agent': 'skill-audit-agent' };
  if (token) headers.Authorization = 'token ' + token;
  const r = await fetch('https://api.github.com/repos/' + repo + '/git/trees/HEAD?recursive=1', { headers });
  if (!r.ok) throw new Error('github tree ' + repo + ' HTTP ' + r.status);
  const j = await r.json();
  return j.tree
    .filter(t => t.type === 'blob' && /SKILL\.md$/i.test(t.path))
    .map(t => ({ id: repo + '/' + t.path, url: 'https://raw.githubusercontent.com/' + repo + '/HEAD/' + t.path }));
}

async function discover(cfg, token) {
  const targets = [];
  for (const s of cfg.sources) {
    try {
      if (s.type === 'local') targets.push(...localSkills(s.dir));
      else if (s.type === 'github') targets.push(...await githubSkills(s.repo, token));
    } catch (e) { console.error('[discover] ' + (s.repo || s.dir) + ': ' + e.message); }
  }
  return targets.slice(0, cfg.top);
}

function loadState(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return {}; } }

function leaderboardHtml(rows, generatedAt) {
  const items = rows.map(r =>
    '<tr><td><a href="cards/' + sanitizeId(r.id) + '.html">' + r.id + '</a></td>' +
    '<td><span class="pill ' + r.grade + '">' + r.grade + '</span></td>' +
    '<td>' + r.score + '</td>' +
    '<td>' + (r.critical ? 'yes' : 'no') + '</td></tr>').join('\n');
  return '<!doctype html><html><head><meta charset="utf-8"><title>skill-audit leaderboard</title>' +
    '<style>body{font-family:system-ui,sans-serif;background:#0f1420;color:#e6e9f0;max-width:860px;margin:40px auto;padding:0 16px}' +
    'table{width:100%;border-collapse:collapse}td,th{padding:10px 8px;border-bottom:1px solid #232d42;text-align:left}' +
    '.pill{padding:2px 10px;border-radius:999px;font-weight:700}.A{background:#14532d}.B{background:#1a3a2a}.C{background:#4a3a12}.D{background:#4a2a12}.F{background:#4a1212}' +
    'a{color:#7aa2f7;text-decoration:none}h1{font-size:1.5rem}p{color:#8b93a7}</style></head><body>' +
    '<h1>skill-audit leaderboard</h1>' +
    '<p>Automated quality &amp; security audit of agent skills. Static analysis only, nothing is executed. ' +
    rows.length + ' skills &middot; generated ' + generatedAt + ' &middot; by skill-audit-agent</p>' +
    '<table><tr><th>Skill</th><th>Grade</th><th>Score</th><th>Critical</th></tr>' + items + '</table>' +
    '<p>Grades: A &ge;90 &middot; B &ge;75 &middot; C &ge;60 &middot; D &ge;45 &middot; F below. Critical findings cap the score at 25.</p>' +
    '</body></html>';
}

async function ghPut(repo, filePath, content, token, message) {
  const api = 'https://api.github.com/repos/' + repo + '/contents/' + filePath;
  const headers = { 'Authorization': 'token ' + token, 'User-Agent': 'skill-audit-agent', 'Accept': 'application/vnd.github+json' };
  let sha;
  try { const g = await fetch(api + '?ref=gh-pages', { headers }); if (g.ok) sha = (await g.json()).sha; } catch {}
  const body = { message, branch: 'gh-pages', content: Buffer.from(content).toString('base64') };
  if (sha) body.sha = sha;
  const p = await fetch(api, { method: 'PUT', headers, body: JSON.stringify(body) });
  return p.ok;
}

async function telegramNotify(text, cfg) {
  const token = process.env.TG_BOT_TOKEN, chat = process.env.TG_CHAT_ID;
  if (!token || !chat) return;
  await fetch('https://api.telegram.org/bot' + token + '/sendMessage?chat_id=' + chat + '&text=' + encodeURIComponent(text)).catch(() => {});
}

async function runAgent(cfg, opts) {
  opts = opts || {};
  const token = process.env.GITHUB_TOKEN;
  const outDir = cfg.out, cardsDir = path.join(outDir, 'cards');
  fs.mkdirSync(cardsDir, { recursive: true });
  fs.mkdirSync('state', { recursive: true });
  const stateFile = 'state/seen.json';
  const state = loadState(stateFile);
  const targets = await discover(cfg, token);
  console.log('[agent] auditing ' + targets.length + ' skills');
  const rows = [];
  for (const t of targets) {
    try {
      let md;
      if (t.path) md = fs.readFileSync(t.path, 'utf8');
      else { const r = await fetch(t.url, { headers: { 'User-Agent': 'skill-audit-agent' } }); if (!r.ok) throw new Error('HTTP ' + r.status); md = await r.text(); }
      const h = sha1(md);
      let res;
      if (state[t.id] && state[t.id].hash === h) res = state[t.id].res;
      else { res = auditMarkdown(md, '.'); res.findings = res.findings; state[t.id] = { hash: h, res: { ...res, findings: undefined, stats: { ...res.stats, urls: [] } } }; }
      rows.push({ id: t.id, score: res.score, grade: res.grade, critical: res.findings.some(f => !f.pass && f.severity === 'critical') });
      fs.writeFileSync(path.join(cardsDir, sanitizeId(t.id) + '.html'), toHtml(res));
    } catch (e) { console.error('[audit] ' + t.id + ': ' + e.message); }
  }
  rows.sort((x, y) => y.score - x.score);
  const now = new Date().toISOString();
  fs.writeFileSync(path.join(outDir, 'leaderboard.json'), JSON.stringify({ generatedAt: now, rows }, null, 2));
  fs.writeFileSync(path.join(outDir, 'leaderboard.html'), leaderboardHtml(rows, now));
  fs.writeFileSync(stateFile, JSON.stringify(state));
  const fCount = rows.filter(r => r.grade === 'F').length;
  console.log('[agent] done: ' + rows.length + ' audited, ' + fCount + ' grade F');
  if (cfg.publish && token && !opts.noPublish) {
    const repo = process.env.PUBLISH_REPO;
    let ok = await ghPut(repo, 'leaderboard.html', fs.readFileSync(path.join(outDir, 'leaderboard.html'), 'utf8'), token, 'leaderboard update ' + now);
    ok = ok && await ghPut(repo, 'leaderboard.json', fs.readFileSync(path.join(outDir, 'leaderboard.json'), 'utf8'), token, 'leaderboard json ' + now);
    for (const r of rows) ok = ok && await ghPut(repo, 'cards/' + sanitizeId(r.id) + '.html', fs.readFileSync(path.join(cardsDir, sanitizeId(r.id) + '.html'), 'utf8'), token, 'card ' + r.id);
    console.log('[agent] publish to gh-pages: ' + (ok ? 'ok' : 'with errors'));
  }
  if (cfg.notify) await telegramNotify('skill-audit: ' + rows.length + ' skills audited, ' + fCount + ' grade F. Top: ' + (rows[0] ? rows[0].id + ' (' + rows[0].score + ')' : '-'), cfg);
  return rows;
}

module.exports = { runAgent, leaderboardHtml, sanitizeId, localSkills };

if (require.main === module) {
  const args = process.argv.slice(2);
  const cfg = loadConfig(args[args.indexOf('--config') + 1]);
  if (args.includes('--top')) cfg.top = parseInt(args[args.indexOf('--top') + 1], 10);
  const noPublish = args.includes('--no-publish');
  const watchIdx = args.indexOf('--watch');
  const once = () => runAgent(cfg, { noPublish }).catch(e => { console.error(e); process.exitCode = 1; });
  if (watchIdx !== -1) {
    const mins = parseInt(args[watchIdx + 1], 10) || 60;
    once(); setInterval(once, mins * 60000);
  } else once();
}