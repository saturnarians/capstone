const mongoose = require('mongoose');
const dns = require('node:dns');
const { User, Customer, Interaction, FollowUp, AuthSession } = require('./models');

async function connectDatabase(uri, { mongoDnsServers = [] } = {}) {
  // Atlas mongodb+srv URIs require SRV DNS resolution. Keep any resolver change
  // explicit and environment-driven; credentials remain solely in MONGODB_URI.
  if (mongoDnsServers.length) dns.setServers(mongoDnsServers);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000, maxPoolSize: 10 });
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== 'isdbgrid') {
    await mongoose.disconnect();
    throw new Error('MongoDB must be a replica set or sharded cluster for transactional CRM writes.');
  }
  await Promise.all([User, Customer, Interaction, FollowUp, AuthSession].map(Model => Model.init()));
}
module.exports = { connectDatabase };
