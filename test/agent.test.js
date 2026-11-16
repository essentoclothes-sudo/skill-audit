'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { runAgent, sanitizeId } = require('../agent');

test('sanitizeId keeps urls filesystem-safe', () => {
  assert.ok(!/[\\/]/.test(sanitizeId('anthropics/skills/foo/SKILL.md')));
});

test('agent run on local source produces sorted leaderboard and cards', async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-out-'));
  const cfg = { top: 10, out, stateFile: path.join(out, 'state.json'), publish: false, notify: false, sources: [{ type: 'local', dir: path.join(__dirname, '..', 'examples') }] };
  const rows = await runAgent(cfg, {});
  assert.equal(rows.length, 2);
  assert.ok(rows[0].score >= rows[1].score, 'sorted desc');
  assert.ok(rows.some(r => r.grade === 'F'), 'sample-bad detected');
  const html = fs.readFileSync(path.join(out, 'leaderboard.html'), 'utf8');
  assert.ok(html.includes('sample-good') && html.includes('sample-bad'));
  assert.ok(fs.existsSync(path.join(out, 'cards')));
});