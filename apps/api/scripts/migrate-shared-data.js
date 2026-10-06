// One-time upgrade for the earlier per-user CRM implementation.
// Back up production first. This deliberately removes legacy customer userId
// fields because the application is a single shared company CRM.
const mongoose = require('mongoose');
const { loadEnvironment, readConfig } = require('../src/config');
const { connectDatabase } = require('../src/database');

async function applySharedDataMigration(database) {
  const users = database.collection('users');
  const customers = database.collection('customers');

  const [roles, activeFlags, ownership] = await Promise.all([
    users.updateMany({ role: { $exists: false } }, { $set: { role: 'ADMIN' } }),
    users.updateMany({ isActive: { $exists: false } }, { $set: { isActive: true } }),
    customers.updateMany({ userId: { $exists: true } }, { $unset: { userId: '' } }),
  ]);
  const indexNames = new Set((await customers.indexes())
    .filter(index => ['userId_1_createdAt_-1__id_1', 'userId_1_status_1'].includes(index.name))
    .map(index => index.name));
  for (const name of indexNames) await customers.dropIndex(name);
  return {
    usersGrantedAdminRole: roles.modifiedCount,
    usersActivated: activeFlags.modifiedCount,
    legacyCustomerOwnershipFieldsRemoved: ownership.modifiedCount,
    legacyIndexesRemoved: indexNames.size,
  };
}

async function migrateSharedData() {
  loadEnvironment();
  const config = readConfig();
  await connectDatabase(config.mongoUri, config);
  return applySharedDataMigration(mongoose.connection.db);
}

if (require.main === module) {
  migrateSharedData()
    .then(result => { console.log(JSON.stringify(result)); })
    .catch(() => { console.error('Shared CRM migration failed. Check the backup, environment, and MongoDB replica set.'); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
}
module.exports = { migrateSharedData, applySharedDataMigration };
