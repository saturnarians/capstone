const path = require('node:path');
// Keep the downloaded binary inside ignored node_modules, not in the user's home.
process.env.MONGOMS_DOWNLOAD_DIR ||= path.resolve(__dirname, '../../../node_modules/.cache/mongodb-binaries');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const { randomBytes } = require('node:crypto');
const { readConfig } = require('../src/config');

async function createTestDatabase() {
  return MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' }, binary: { version: '7.0.24' } });
}
function testConfig(uri) {
  return readConfig({ MONGODB_URI: uri, JWT_SECRET: randomBytes(48).toString('hex'), BCRYPT_ROUNDS: '10', AUTH_RATE_LIMIT: '1000' });
}
module.exports = { createTestDatabase, testConfig };
