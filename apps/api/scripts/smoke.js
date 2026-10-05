// Boots the real entry point against a disposable MongoDB replica set.
// Overrides all API configuration; never overwrites or connects to a developer's database.
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { createServer } = require('node:net');
const path = require('node:path');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { createTestDatabase } = require('../test/helpers');

async function main() {
  const database = await createTestDatabase();
  let child;
  try {
    const probe = createServer().listen(0, '127.0.0.1');
    await once(probe, 'listening');
    const port = probe.address().port;
    await new Promise(resolve => probe.close(resolve));
    child = spawn(process.execPath, ['index.js'], {
      cwd: path.resolve(__dirname, '..'), windowsHide: true,
      env: { ...process.env, NODE_ENV: 'test', PORT: String(port), MONGODB_URI: database.getUri('crm_smoke'), JWT_SECRET: randomBytes(48).toString('hex'), JWT_ACCESS_TTL_SECONDS: '900', REFRESH_TOKEN_TTL_DAYS: '7', BCRYPT_ROUNDS: '10', CORS_ORIGINS: 'http://localhost:5173', AUTH_RATE_LIMIT: '100', TRUST_PROXY_HOPS: '0' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { output += chunk; });
    const base = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let index = 0; index < 100; index++) {
      if (child.exitCode !== null) throw new Error(`API exited before startup: ${output}`);
      try { ready = (await fetch(`${base}/api/health`)).ok; } catch { /* Startup in progress. */ }
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(ready, `API startup timed out: ${output}`);
    let token;
    async function call(method, route, body, status = 200) {
      const response = await fetch(`${base}/api/v1${route}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
      const payload = response.status === 204 ? undefined : await response.json();
      assert.equal(response.status, status, `${method} ${route}: ${JSON.stringify(payload)}`);
      return payload?.data;
    }
    const auth = await call('POST', '/auth/register', { name: 'Smoke User', email: 'smoke@example.com', password: 'Local smoke password!' }, 201);
    assert.equal(auth.user.role, 'ADMIN');
    token = auth.accessToken;
    const customer = await call('POST', '/customers', { name: 'Smoke Customer', phone: '+23400123' }, 201);
    await call('PATCH', `/customers/${customer.id}`, { company: 'Smoke Ltd' });
    const interaction = await call('POST', `/customers/${customer.id}/interactions`, { type: 'EMAIL', description: 'Confirmed local HTTP flow.' }, 201);
    const followUp = await call('POST', `/customers/${customer.id}/follow-ups`, { title: 'Check quote', dueAt: '2020-01-01T00:00:00Z' }, 201);
    assert.equal(followUp.status, 'OVERDUE');
    assert.deepEqual((await call('GET', '/dashboard')).summary, { totalCustomers: 1, pendingFollowUps: 1 });
    await call('POST', `/follow-ups/${followUp.id}/complete`);
    assert.equal((await call('GET', '/dashboard')).summary.pendingFollowUps, 0);
    const fresh = await call('POST', '/auth/refresh', { refreshToken: auth.refreshToken });
    token = fresh.accessToken;
    const adminToken = token;
    const agent = await call('POST', '/staff', { name: 'Smoke Agent', email: 'agent@example.com', password: 'Local agent password!' }, 201);
    const agentAuth = await call('POST', '/auth/login', { email: agent.email, password: 'Local agent password!' });
    assert.equal(agentAuth.user.role, 'STAFF');
    token = agentAuth.accessToken;
    assert.equal((await call('GET', '/customers')).length, 1);
    await call('PATCH', `/customers/${customer.id}`, { company: 'Shared CRM' });
    await call('DELETE', `/customers/${customer.id}`, undefined, 403);
    await call('GET', '/staff', undefined, 403);
    token = adminToken;
    await call('DELETE', `/customers/${customer.id}`, undefined, 204);
    await call('GET', `/interactions/${interaction.id}`, undefined, 404);
    await call('GET', `/follow-ups/${followUp.id}`, undefined, 404);
    await call('POST', '/auth/logout', undefined, 204);
    await call('GET', '/auth/me', undefined, 401);
    await call('POST', '/auth/refresh', { refreshToken: auth.refreshToken }, 401);
    console.log('PASS: real HTTP startup, ADMIN/STAFF access control, shared CRM operations, dashboard, cascade deletion and logout.');
  } finally {
    if (child && child.exitCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
    await database.stop();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
