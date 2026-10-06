const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readConfig } = require('../src/config');
const { followUpStatus } = require('../src/serializers');
const { validDate } = require('../src/validation');
const { safeStartupError } = require('../index');
test('configuration fails safely on absent secrets and invalid bounds', () => {
  assert.throws(() => readConfig({}), /MONGODB_URI/);
  const env = { MONGODB_URI: 'mongodb://127.0.0.1/test', JWT_SECRET: 'x'.repeat(48) };
  assert.equal(readConfig(env).port, 5000);
  assert.deepEqual(readConfig({ ...env, MONGODB_DNS_SERVERS: '1.1.1.1, 8.8.8.8' }).mongoDnsServers, ['1.1.1.1', '8.8.8.8']);
  for (const value of [{ JWT_SECRET: '' }, { PORT: 'abc' }, { BCRYPT_ROUNDS: '4' }, { CORS_ORIGINS: '*' }, { JWT_ACCESS_TTL_SECONDS: '-1' }, { MONGODB_DNS_SERVERS: 'dns.example.com' }]) assert.throws(() => readConfig({ ...env, ...value }));
});
test('follow-up boundary and calendar validation are deterministic', () => {
  const now = new Date('2026-10-05T12:00:00Z');
  assert.equal(followUpStatus({ dueAt: now, completedAt: null }, now), 'PENDING');
  assert.equal(followUpStatus({ dueAt: new Date(now - 1), completedAt: null }, now), 'OVERDUE');
  assert.equal(followUpStatus({ dueAt: new Date(0), completedAt: now }, now), 'COMPLETED');
  assert.equal(validDate('2024-02-29T00:00:00Z'), true);
  for (const value of ['2025-02-29T00:00:00Z', '2026-10-05', '2026-10-05T24:00:00Z', 123, null]) assert.equal(validDate(value), false);
});
test('startup diagnostics retain useful error metadata without disclosing MongoDB credentials', () => {
  const report = safeStartupError({ name: 'MongoServerSelectionError', code: 'ECONNREFUSED', message: 'Could not connect to mongodb+srv://user:secret-password@cluster.example.net/db' });
  assert.equal(report.name, 'MongoServerSelectionError');
  assert.equal(report.code, 'ECONNREFUSED');
  assert.equal(report.message.includes('secret-password'), false);
  assert.equal(report.message.includes('MongoDB URI [redacted]'), true);
});
