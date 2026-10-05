const { test, before, after, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { createApp } = require('../src/app');
const { connectDatabase } = require('../src/database');
const { User, Customer, Interaction, FollowUp, AuthSession } = require('../src/models');
const { UUID } = require('../src/validation');
const { createTestDatabase, testConfig } = require('./helpers');
const { applySharedDataMigration } = require('../scripts/migrate-shared-data');

let database, app, config;
const password = 'Capstone test password!';
before(async () => {
  database = await createTestDatabase();
  config = testConfig(database.getUri('crm_test'));
  await connectDatabase(config.mongoUri);
  app = createApp(config, { logger: { error() {} } });
}, { timeout: 900000 });
after(async () => { await mongoose.disconnect(); await database?.stop(); });
beforeEach(async () => {
  mock.restoreAll();
  await Promise.all([User, Customer, Interaction, FollowUp, AuthSession].map(Model => Model.deleteMany({})));
});
const api = (method, route, token, body) => {
  const req = request(app)[method](`/api/v1${route}`);
  if (token) req.set('Authorization', `Bearer ${token}`);
  if (body !== undefined) req.send(body);
  return req;
};
async function register(email = 'owner@example.com') {
  const response = await api('post', '/auth/register', null, { name: 'Owner', email, password }).expect(201);
  return response.body.data;
}
async function customer(token, body = { name: 'Acme' }) {
  return (await api('post', '/customers', token, body).expect(201)).body.data;
}
async function staff(token, body = { name: 'Agent', email: 'agent@example.com', password }) {
  return (await api('post', '/staff', token, body).expect(201)).body.data;
}
async function interaction(token, id, body = { type: 'PHONE_CALL', description: 'Discussed quote.' }) {
  return (await api('post', `/customers/${id}/interactions`, token, body).expect(201)).body.data;
}
async function followUp(token, id, body = { title: 'Send quote', dueAt: '2099-01-01T10:00:00Z' }) {
  return (await api('post', `/customers/${id}/follow-ups`, token, body).expect(201)).body.data;
}

test('registration hashes passwords, normalizes email, hides secrets and rejects duplicate accounts', async () => {
  const data = await register('OWNER@EXAMPLE.COM');
  assert.match(data.user.id, UUID);
  assert.deepEqual(Object.keys(data.user).sort(), ['email', 'id', 'name', 'role']);
  assert.equal(data.user.role, 'ADMIN');
  const stored = await User.findById(data.user.id).select('+passwordHash');
  assert.notEqual(stored.passwordHash, password);
  assert.equal(await bcrypt.compare(password, stored.passwordHash), true);
  assert.equal(stored.email, 'owner@example.com');
  const session = await AuthSession.findOne({ userId: stored._id }).select('+refreshHash');
  assert.notEqual(session.refreshHash, data.refreshToken);
  assert.equal(session.refreshHash.length, 64);
  await api('post', '/auth/register', null, { name: 'Other', email: stored.email, password }).expect(409);
  assert.equal(await User.countDocuments(), 1);
  assert.equal(await AuthSession.countDocuments(), 1);
  const me = await api('get', '/auth/me', data.accessToken).expect(200);
  assert.deepEqual(me.body.data, data.user);
});

test('login, refresh and logout enforce session expiry and revoke only the current session', async () => {
  const owner = await register();
  const login = (await api('post', '/auth/login', null, { email: owner.user.email, password }).expect(200)).body.data;
  const wrong = await api('post', '/auth/login', null, { email: owner.user.email, password: 'incorrect' }).expect(401);
  const unknown = await api('post', '/auth/login', null, { email: 'absent@example.com', password: 'incorrect' }).expect(401);
  assert.deepEqual(wrong.body, unknown.body);
  const fresh = await api('post', '/auth/refresh', null, { refreshToken: login.refreshToken }).expect(200);
  assert.deepEqual(Object.keys(fresh.body.data), ['accessToken']);
  await api('get', '/auth/me', fresh.body.data.accessToken).expect(200);
  await api('post', '/auth/logout', login.accessToken).expect(204);
  await api('get', '/auth/me', login.accessToken).expect(401);
  await api('post', '/auth/refresh', null, { refreshToken: login.refreshToken }).expect(401);
  await api('get', '/auth/me', owner.accessToken).expect(200);
  await AuthSession.updateMany({}, { expiresAt: new Date(0) });
  await api('get', '/auth/me', owner.accessToken).expect(401);
  await api('post', '/auth/refresh', null, { refreshToken: owner.refreshToken }).expect(401);
});

test('every protected endpoint rejects missing, invalid and expired tokens', async () => {
  const id = randomUUID();
  const routes = [['get', '/auth/me'], ['post', '/auth/logout'], ['get', '/dashboard'], ['get', '/customers'], ['post', '/customers'], ['get', '/staff'], ['post', '/staff'], ...['get', 'patch', 'delete'].map(m => [m, `/customers/${id}`]), ...['interactions', 'follow-ups'].flatMap(p => [['get', `/customers/${id}/${p}`], ['post', `/customers/${id}/${p}`], ...['get', 'patch', 'delete'].map(m => [m, `/${p}/${id}`])]), ['post', `/follow-ups/${id}/complete`]];
  for (const [method, path] of routes) await api(method, path).expect(401);
  await api('get', '/customers', 'invalid').expect(401);
  const owner = await register();
  const claims = jwt.decode(owner.accessToken);
  const expired = jwt.sign({ sid: claims.sid }, config.jwtSecret, { subject: claims.sub, issuer: 'small-business-crm', audience: 'crm-api', expiresIn: -1 });
  await api('get', '/customers', expired).expect(401);
  const wrongAudience = jwt.sign({ sid: claims.sid }, config.jwtSecret, { subject: claims.sub, audience: 'other' });
  await api('get', '/customers', wrongAudience).expect(401);
});

test('customer CRUD, all search fields, status filter and bounded pagination follow the contract', async () => {
  const { accessToken: token } = await register();
  const doc = await customer(token, { name: 'Jane [VIP]', email: 'jane@example.com', phone: '+23400123', company: 'Acme', notes: 'Call first.' });
  assert.equal(doc.status, 'ACTIVE');
  assert.equal(doc.phone, '+23400123');
  assert.match(doc.id, UUID);
  assert.equal('_id' in doc || 'userId' in doc, false);
  await customer(token, { name: 'Other', status: 'INACTIVE' });
  for (const search of ['JANE', 'example.com', '+234', 'ACME', '[VIP]']) {
    const response = await api('get', `/customers?search=${encodeURIComponent(search)}`, token).expect(200);
    assert.equal(response.body.meta.total, 1);
    assert.equal(response.body.data[0].id, doc.id);
  }
  const empty = await api('get', '/customers?search=.*', token).expect(200);
  assert.deepEqual(empty.body, { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } });
  const page = await api('get', '/customers?page=2&limit=1', token).expect(200);
  assert.deepEqual(page.body.meta, { page: 2, limit: 1, total: 2, totalPages: 2 });
  assert.equal(page.body.data.length, 1);
  assert.equal((await api('get', '/customers?status=INACTIVE', token).expect(200)).body.meta.total, 1);
  const updated = await api('patch', `/customers/${doc.id}`, token, { name: 'Jane Updated', email: '', status: 'INACTIVE' }).expect(200);
  assert.equal(updated.body.data.name, 'Jane Updated');
  assert.equal(updated.body.data.email, '');
  assert.equal((await api('get', `/customers/${doc.id}`, token).expect(200)).body.data.company, 'Acme');
  await api('delete', `/customers/${doc.id}`, token).expect(204);
  for (const method of ['get', 'patch', 'delete']) {
    const response = await api(method, `/customers/${doc.id}`, token, method === 'patch' ? { name: 'Missing' } : undefined).expect(404);
    assert.equal(response.body.error.code, 'CUSTOMER_NOT_FOUND');
  }
});

test('the company CRM is shared by all active users and staff have operational-only access', async () => {
  const a = await register(), b = await register('other@example.com');
  const c = await customer(a.accessToken);
  const i = await interaction(a.accessToken, c.id), f = await followUp(a.accessToken, c.id);
  assert.equal((await api('get', '/customers', b.accessToken).expect(200)).body.meta.total, 1);
  await api('patch', `/customers/${c.id}`, b.accessToken, { company: 'Shared Company' }).expect(200);
  assert.equal((await api('get', `/customers/${c.id}`, a.accessToken).expect(200)).body.data.company, 'Shared Company');
  const person = await staff(a.accessToken);
  const agent = (await api('post', '/auth/login', null, { email: person.email, password }).expect(200)).body.data;
  assert.equal(agent.user.role, 'STAFF');
  assert.equal((await api('get', '/customers', agent.accessToken).expect(200)).body.meta.total, 1);
  await api('get', `/interactions/${i.id}`, agent.accessToken).expect(200);
  await api('patch', `/interactions/${i.id}`, agent.accessToken, { description: 'Updated by staff' }).expect(200);
  await api('post', `/customers/${c.id}/interactions`, agent.accessToken, { type: 'EMAIL', description: 'Staff email' }).expect(201);
  await api('post', `/customers/${c.id}/follow-ups`, agent.accessToken, { title: 'Staff follow-up', dueAt: '2099-01-01T00:00:00Z' }).expect(201);
  await api('post', `/follow-ups/${f.id}/complete`, agent.accessToken).expect(200);
  const dashboard = (await api('get', '/dashboard', agent.accessToken).expect(200)).body.data;
  assert.deepEqual(dashboard.summary, { totalCustomers: 1, pendingFollowUps: 1 });
  for (const path of [`/customers/${c.id}`, `/interactions/${i.id}`, `/follow-ups/${f.id}`]) await api('delete', path, agent.accessToken).expect(403);
  for (const [method, path, body] of [['get', '/staff'], ['post', '/staff', { name: 'No', email: 'no@example.com', password }], ['patch', `/staff/${person.id}`, { status: 'INACTIVE' }], ['delete', `/staff/${person.id}`]]) await api(method, path, agent.accessToken, body).expect(403);
});

test('admins can create, view, edit, deactivate and reactivate staff accounts', async () => {
  const admin = await register();
  const person = await staff(admin.accessToken, { name: 'Ada Agent', email: 'ADA@EXAMPLE.COM', password });
  assert.deepEqual(Object.keys(person).sort(), ['createdAt', 'email', 'id', 'name', 'role', 'status', 'updatedAt']);
  assert.equal(person.role, 'STAFF');
  assert.equal(person.status, 'ACTIVE');
  const list = await api('get', '/staff?status=ACTIVE', admin.accessToken).expect(200);
  assert.equal(list.body.meta.total, 1);
  assert.equal(list.body.data[0].email, 'ada@example.com');
  const agent = (await api('post', '/auth/login', null, { email: person.email, password }).expect(200)).body.data;
  const updated = await api('patch', `/staff/${person.id}`, admin.accessToken, { name: 'Ada Updated', status: 'INACTIVE' }).expect(200);
  assert.equal(updated.body.data.status, 'INACTIVE');
  await api('get', '/auth/me', agent.accessToken).expect(401);
  await api('post', '/auth/refresh', null, { refreshToken: agent.refreshToken }).expect(401);
  await api('post', '/auth/login', null, { email: person.email, password }).expect(401);
  const reactivated = await api('patch', `/staff/${person.id}`, admin.accessToken, { status: 'ACTIVE' }).expect(200);
  assert.equal(reactivated.body.data.status, 'ACTIVE');
  const relogin = await api('post', '/auth/login', null, { email: person.email, password }).expect(200);
  await api('delete', `/staff/${person.id}`, admin.accessToken).expect(204);
  await api('get', '/auth/me', relogin.body.data.accessToken).expect(401);
  assert.equal((await api('get', '/staff?status=INACTIVE', admin.accessToken).expect(200)).body.meta.total, 1);
});

test('the shared-data migration removes only legacy customer ownership and preserves company data', async () => {
  const legacyUserId = randomUUID(), legacyCustomerId = randomUUID();
  const now = new Date();
  await User.collection.insertOne({ _id: legacyUserId, name: 'Legacy Admin', email: 'legacy@example.com', passwordHash: 'hash', createdAt: now, updatedAt: now });
  await Customer.collection.insertOne({ _id: legacyCustomerId, userId: legacyUserId, name: 'Legacy Customer', status: 'ACTIVE', activityVersion: 0, createdAt: now, updatedAt: now });
  await Customer.collection.createIndex({ userId: 1, createdAt: -1, _id: 1 }, { name: 'userId_1_createdAt_-1__id_1' });
  await Customer.collection.createIndex({ userId: 1, status: 1 }, { name: 'userId_1_status_1' });
  const result = await applySharedDataMigration(mongoose.connection.db);
  assert.deepEqual(result, { usersGrantedAdminRole: 1, usersActivated: 1, legacyCustomerOwnershipFieldsRemoved: 1, legacyIndexesRemoved: 2 });
  const migratedUser = await User.collection.findOne({ _id: legacyUserId });
  const migratedCustomer = await Customer.collection.findOne({ _id: legacyCustomerId });
  assert.equal(migratedUser.role, 'ADMIN');
  assert.equal(migratedUser.isActive, true);
  assert.equal(Object.hasOwn(migratedCustomer, 'userId'), false);
  assert.equal((await Customer.collection.indexes()).some(index => index.name.startsWith('userId_')), false);
  const rerun = await applySharedDataMigration(mongoose.connection.db);
  assert.deepEqual(rerun, { usersGrantedAdminRole: 0, usersActivated: 0, legacyCustomerOwnershipFieldsRemoved: 0, legacyIndexesRemoved: 0 });
});

test('interaction CRUD supports date default, explicit date, stable ordering and pagination', async () => {
  const { accessToken: token } = await register(), c = await customer(token);
  const i = await interaction(token, c.id);
  assert.ok(Math.abs(Date.parse(i.date) - Date.now()) < 10000);
  await interaction(token, c.id, { type: 'EMAIL', description: 'Older', date: '2020-01-01T00:00:00Z' });
  const history = await api('get', `/customers/${c.id}/interactions?limit=1`, token).expect(200);
  assert.equal(history.body.meta.total, 2);
  assert.equal(history.body.data[0].id, i.id);
  const update = await api('patch', `/interactions/${i.id}`, token, { type: 'MEETING', date: '2026-09-29T10:00:00+01:00', description: 'Met customer' }).expect(200);
  assert.equal(update.body.data.date, '2026-09-29T09:00:00.000Z');
  assert.equal((await api('get', `/interactions/${i.id}`, token).expect(200)).body.data.type, 'MEETING');
  await api('delete', `/interactions/${i.id}`, token).expect(204);
  await api('get', `/interactions/${i.id}`, token).expect(404);
});

test('follow-up CRUD derives overdue status and completion is idempotent under concurrency', async () => {
  const { accessToken: token } = await register(), c = await customer(token);
  const pending = await followUp(token, c.id);
  assert.equal(pending.status, 'PENDING');
  assert.equal(pending.completedAt, null);
  const overdue = await followUp(token, c.id, { title: 'Overdue', dueAt: '2020-01-01T00:00:00Z' });
  assert.equal(overdue.status, 'OVERDUE');
  const page = await api('get', `/customers/${c.id}/follow-ups?limit=1`, token).expect(200);
  assert.equal(page.body.data[0].id, overdue.id);
  assert.equal(page.body.meta.total, 2);
  const completions = await Promise.all(Array.from({ length: 3 }, () => api('post', `/follow-ups/${overdue.id}/complete`, token).expect(200)));
  assert.equal(new Set(completions.map(r => r.body.data.completedAt)).size, 1);
  const edited = await api('patch', `/follow-ups/${overdue.id}`, token, { title: 'Done', dueAt: '2019-01-01T00:00:00Z' }).expect(200);
  assert.equal(edited.body.data.status, 'COMPLETED');
  assert.equal((await api('get', `/follow-ups/${overdue.id}`, token).expect(200)).body.data.title, 'Done');
  await api('delete', `/follow-ups/${pending.id}`, token).expect(204);
  await api('get', `/follow-ups/${pending.id}`, token).expect(404);
});

test('dashboard counts company-wide incomplete follow-ups and limits and orders activity', async () => {
  const { accessToken: token } = await register(), c = await customer(token);
  await customer(token, { name: 'Second' });
  for (let index = 1; index <= 7; index++) {
    await interaction(token, c.id, { type: 'GENERAL_NOTE', description: `Note ${index}`, date: `2020-01-0${index}T00:00:00Z` });
    await followUp(token, c.id, { title: `Task ${index}`, dueAt: `2020-01-0${index}T00:00:00Z` });
  }
  const done = await followUp(token, c.id);
  await api('post', `/follow-ups/${done.id}/complete`, token).expect(200);
  const dashboard = (await api('get', '/dashboard', token).expect(200)).body.data;
  assert.deepEqual(dashboard.summary, { totalCustomers: 2, pendingFollowUps: 7 });
  assert.equal(dashboard.recentInteractions.length, 5);
  assert.equal(dashboard.recentInteractions[0].description, 'Note 7');
  assert.deepEqual(dashboard.recentInteractions[0].customer, { id: c.id, name: c.name });
  assert.equal(dashboard.upcomingFollowUps.length, 5);
  assert.equal(dashboard.upcomingFollowUps[0].title, 'Task 1');
  assert.equal(dashboard.upcomingFollowUps.every(f => f.status === 'OVERDUE'), true);
});

test('validation rejects malformed IDs, injection, unknown fields, invalid dates and pagination', async () => {
  await api('post', '/auth/register', null, { name: 'User', email: 'bad', password: 'short' }).expect(422);
  await api('post', '/auth/register', null, { name: 'User', email: 'user@invalid..example.com', password }).expect(422);
  await api('post', '/auth/register', null, { name: 'User', email: 'ok@example.com', password: '😀'.repeat(20) }).expect(422);
  const { accessToken: token } = await register(), c = await customer(token);
  for (const body of [{}, { name: '' }, { name: 'x', email: 'bad' }, { name: 'x', phone: 123 }, { name: 'x', userId: randomUUID() }, { name: { $ne: null } }, { name: 'x'.repeat(121) }, { name: 'x', status: 'ADMIN' }]) await api('post', '/customers', token, body).expect(422);
  await api('patch', `/customers/${c.id}`, token, {}).expect(422);
  await api('get', '/customers/not-a-uuid', token).expect(422);
  for (const query of ['page=0', 'limit=101', 'page=1.2', 'page=1&page=2', 'search[x]=a', 'status=WRONG', 'limit=-1']) await api('get', `/customers?${query}`, token).expect(422);
  for (const body of [{ type: 'WRONG', description: 'x' }, { type: 'EMAIL', description: '' }, { type: 'EMAIL', description: 'x', date: '2025-02-30T00:00:00Z' }, { type: 'EMAIL', description: 'x', customerId: c.id }]) await api('post', `/customers/${c.id}/interactions`, token, body).expect(422);
  for (const body of [{ title: 'x' }, { title: 'x', dueAt: 'tomorrow' }, { title: 'x', dueAt: '2099-01-01T00:00:00Z', status: 'COMPLETED' }]) await api('post', `/customers/${c.id}/follow-ups`, token, body).expect(422);
  const f = await followUp(token, c.id);
  await api('patch', `/follow-ups/${f.id}`, token, { completedAt: '2020-01-01T00:00:00Z' }).expect(422);
  await api('post', '/auth/login', null, { email: { $ne: null }, password }).expect(422);
  for (const body of [{}, { name: 'Staff', email: 'bad', password }, { name: 'Staff', email: 'staff@example.com', password: 'short' }, { name: 'Staff', email: 'staff@example.com', password, role: 'ADMIN' }]) await api('post', '/staff', token, body).expect(422);
  const person = await staff(token);
  for (const query of ['status=ADMIN', 'limit=101', 'page=0', 'role=STAFF']) await api('get', `/staff?${query}`, token).expect(422);
  for (const body of [{}, { role: 'ADMIN' }, { status: 'ADMIN' }, { email: 'not-an-email' }]) await api('patch', `/staff/${person.id}`, token, body).expect(422);
  await api('get', '/staff/not-a-uuid', token).expect(422);
});

test('customer deletion cascades atomically and a database failure rolls everything back', async () => {
  const { accessToken: token } = await register(), c = await customer(token);
  const i = await interaction(token, c.id), f = await followUp(token, c.id);
  const failure = mock.method(FollowUp, 'deleteMany', () => { throw new Error('sensitive database credentials'); });
  const response = await api('delete', `/customers/${c.id}`, token).expect(500);
  assert.equal(JSON.stringify(response.body).includes('sensitive'), false);
  assert.ok(await Customer.exists({ _id: c.id }));
  assert.ok(await Interaction.exists({ _id: i.id }));
  assert.ok(await FollowUp.exists({ _id: f.id }));
  failure.mock.restore();
  await api('delete', `/customers/${c.id}`, token).expect(204);
  assert.equal(await Customer.countDocuments(), 0);
  assert.equal(await Interaction.countDocuments(), 0);
  assert.equal(await FollowUp.countDocuments(), 0);
  await api('get', `/interactions/${i.id}`, token).expect(404);
  await api('get', `/follow-ups/${f.id}`, token).expect(404);
});

test('concurrent customer deletion and child creation never leave orphan records', async () => {
  const { accessToken: token } = await register();
  for (let index = 0; index < 3; index++) {
    const c = await customer(token);
    const [created, deleted] = await Promise.all([
      api('post', `/customers/${c.id}/interactions`, token, { type: 'EMAIL', description: 'Race' }),
      api('delete', `/customers/${c.id}`, token),
    ]);
    assert.ok([201, 404].includes(created.status));
    assert.equal(deleted.status, 204);
    assert.equal(await Interaction.countDocuments({ customerId: c.id }), 0);
  }
});

test('JSON errors, payload limits, CORS, unknown routes and auth rate limits use safe responses', async () => {
  const malformed = await request(app).post('/api/v1/auth/login').set('Content-Type', 'application/json').send('{').expect(400);
  assert.equal(malformed.body.error.code, 'INVALID_JSON');
  await api('post', '/auth/register', null, { name: 'x'.repeat(40000) }).expect(413);
  await request(app).get('/api/health').set('Origin', 'https://untrusted.example').expect(403);
  const cors = await request(app).options('/api/v1/customers').set('Origin', 'http://localhost:5173').set('Access-Control-Request-Method', 'POST').expect(204);
  assert.equal(cors.headers['access-control-allow-origin'], 'http://localhost:5173');
  const missing = await request(app).get('/missing').expect(404);
  assert.equal(missing.body.error.code, 'ROUTE_NOT_FOUND');
  const limited = createApp({ ...config, authRateLimit: 1 });
  await request(limited).post('/api/v1/auth/login').send({}).expect(422);
  const blocked = await request(limited).post('/api/v1/auth/login').send({}).expect(429);
  assert.equal(blocked.body.error.code, 'RATE_LIMITED');
  await request(limited).post('/api/v1/auth/LOGIN/').send({}).expect(429);
});
