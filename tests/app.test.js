import test from 'node:test';
import assert from 'node:assert';

process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/test';
process.env.JWT_SECRET = 'test-secret-test-secret';
process.env.LOG_LEVEL = 'silent';
process.env.NODE_ENV = 'test';

// env must be set before the app (and its config) is loaded
const { default: app } = await import('../src/app.js');

let server, base;
test.before(() => new Promise((r) => { server = app.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }); }));
test.after(() => server.close());

test('swagger spec lists all modules', async () => {
  const spec = await (await fetch(`${base}/api-docs.json`)).json();
  for (const p of ['/auth/login', '/users/me', '/jobs', '/jobs/{jobId}/applications', '/applications/me', '/health']) assert.ok(spec.paths[p], p);
});
test('swagger UI is served', async () => assert.strictEqual((await fetch(`${base}/api-docs/`)).status, 200));
test('protected route requires auth', async () => assert.strictEqual((await fetch(`${base}/api/v1/users/me`)).status, 401));
test('validation errors return 400', async () => {
  const res = await fetch(`${base}/api/v1/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"email":"x"}' });
  assert.strictEqual(res.status, 400);
});
test('unknown route returns 404', async () => assert.strictEqual((await fetch(`${base}/nope`)).status, 404));
