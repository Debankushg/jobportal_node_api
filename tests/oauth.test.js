import test from 'node:test';
import assert from 'node:assert';

process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/test';
process.env.JWT_SECRET = 'test-secret-test-secret';
process.env.LOG_LEVEL = 'silent';
process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.BASE_URL = 'https://api.example.test';
// only Google is configured, so GitHub / LinkedIn exercise the "not configured" path
process.env.GOOGLE_CLIENT_ID = 'google-id';
process.env.GOOGLE_CLIENT_SECRET = 'google-secret';
delete process.env.GITHUB_CLIENT_ID;
delete process.env.LINKEDIN_CLIENT_ID;

const { default: app } = await import('../src/app.js');

let server, base;
test.before(() => new Promise((r) => { server = app.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }); }));
test.after(() => server.close());

const get = (path, headers) => fetch(`${base}/api/v1${path}`, { redirect: 'manual', headers });

test('start redirects to the provider with state, redirect_uri and an httpOnly nonce cookie', async () => {
  const res = await get('/auth/google?role=employer');
  assert.strictEqual(res.status, 302);
  const url = new URL(res.headers.get('location'));
  assert.strictEqual(url.origin + url.pathname, 'https://accounts.google.com/o/oauth2/v2/auth');
  assert.strictEqual(url.searchParams.get('client_id'), 'google-id');
  assert.strictEqual(url.searchParams.get('redirect_uri'), 'https://api.example.test/api/v1/auth/google/callback');
  assert.ok(url.searchParams.get('state'));
  assert.match(res.headers.get('set-cookie'), /oauth_nonce=.*HttpOnly/i);
});

test('an unconfigured provider sends the browser back to the frontend with an error code', async () => {
  const res = await get('/auth/github');
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.get('location'), 'http://localhost:3000/auth/callback#error=provider_not_configured');
});

test('unknown provider and invalid role are 400', async () => {
  assert.strictEqual((await get('/auth/facebook')).status, 400);
  assert.strictEqual((await get('/auth/google?role=admin')).status, 400);
});

test('callback with a forged state is rejected and never creates a session', async () => {
  const res = await get('/auth/google/callback?code=abc&state=forged', { cookie: 'oauth_nonce=whatever' });
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.get('location'), 'http://localhost:3000/auth/callback#error=invalid_state');
});

test('callback after the user denies consent reports access_denied', async () => {
  const res = await get('/auth/google/callback?error=access_denied');
  assert.strictEqual(res.headers.get('location'), 'http://localhost:3000/auth/callback#error=access_denied');
});
