/**
 * Source/AI-generated: Ocean Quest Chronicles Project (see docs/references.md)
 * File: backend/test/api.test.js
 * Description: End-to-end test of login, session cookie, Fish API proxy and verified scoring.
 * The Fish Game API is replaced by a local mock so the test is repeatable offline.
 * Run:  npm test      (Node 18+)
 */
const assert = require('assert');
const http = require('http');
const os = require('os');
const path = require('path');

process.env.DB_PATH = path.join(os.tmpdir(), `oq-test-${Date.now()}.sqlite`);
process.env.NODE_ENV = 'test';

const mock = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html'); // the real API also sends text/html
  res.end(JSON.stringify({ question: 'iVBORw0KGgoAAAANSUhEUg==', fish: 5, chest: 2 }));
});

(async () => {
  await new Promise((r) => mock.listen(0, r));
  process.env.FISH_API_URL = `http://127.0.0.1:${mock.address().port}/api.php?out=json&base64=yes`;
  const app = require('../server');
  const server = await new Promise((r) => { const s = app.listen(0, () => r(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api`;

  let cookie = '';
  const call = async (method, url, body) => {
    const res = await fetch(base + url, {
      method,
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    return { status: res.status, data: await res.json().catch(() => ({})), set };
  };
  const ok = (name) => console.log('  ok -', name);

  assert.strictEqual((await call('GET', '/puzzle/new')).status, 401); ok('puzzle needs login');

  const signup = await call('POST', '/signup', { username: 'diver1', email: 'd@x.com', password: 'secret1' });
  assert.strictEqual(signup.status, 201);
  assert.ok(/HttpOnly/i.test(signup.set) && /SameSite=Lax/i.test(signup.set)); ok('signup sets HttpOnly SameSite cookie');
  assert.strictEqual((await call('GET', '/me')).data.user.username, 'diver1'); ok('/me returns the session user');

  await call('POST', '/puzzle/run');
  const p1 = await call('GET', '/puzzle/new');
  assert.strictEqual(p1.status, 200);
  assert.ok(!JSON.stringify(p1.data).includes('"solution"') && p1.data.fish === undefined);
  assert.ok(p1.data.question.startsWith('data:image/png;base64,')); ok('puzzle hides the solution, image is a data URI');

  const wrong = await call('POST', '/puzzle/answer', { puzzleId: p1.data.puzzleId, answer: 4 });
  assert.strictEqual(wrong.data.correct, false); assert.strictEqual(wrong.data.points, 0); ok('wrong answer scores 0');
  assert.strictEqual((await call('POST', '/puzzle/answer', { puzzleId: p1.data.puzzleId, answer: 5 })).status, 409); ok('puzzle is single use');

  const p2 = await call('GET', '/puzzle/new');
  const right = await call('POST', '/puzzle/answer', { puzzleId: p2.data.puzzleId, answer: 5 });
  assert.strictEqual(right.data.correct, true); assert.strictEqual(right.data.points, 250); ok('right answer scores 250 on the server');

  const saved = await call('POST', '/scores', { score: 999999, explorationScore: 999999, depthReached: 99999 });
  assert.strictEqual(saved.status, 201);
  assert.ok(saved.data.score.score >= 250 && saved.data.score.score <= 400, `score was ${saved.data.score.score}`);
  assert.ok(saved.data.score.depthReached <= 400); ok('cheated score is clamped by the server');
  assert.strictEqual((await call('POST', '/scores', { score: 1 })).status, 409); ok('a run can be submitted only once');

  const lb = await call('GET', '/leaderboard');
  assert.strictEqual(lb.data[0].username, 'diver1'); ok('leaderboard lists the pilot');

  const oldCookie = cookie;
  assert.strictEqual((await call('POST', '/login', { email: 'd@x.com', password: 'nope' })).status, 401); ok('wrong password rejected');
  const login = await call('POST', '/login', { email: 'd@x.com', password: 'secret1' });
  assert.strictEqual(login.status, 200); assert.notStrictEqual(cookie, oldCookie); ok('login issues a NEW session id (no fixation)');

  await call('POST', '/logout');
  cookie = '';
  assert.strictEqual((await call('GET', '/me')).status, 401); ok('logout ends the identity');

  console.log('\nAll backend tests passed.');
  server.close(); mock.close(); setTimeout(() => process.exit(0), 100);
})().catch((e) => { console.error('\nTEST FAILED:', e.message); process.exit(1); });
