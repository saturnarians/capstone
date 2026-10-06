const mongoose = require('mongoose');
const { loadEnvironment, readConfig } = require('./src/config');
const { connectDatabase } = require('./src/database');
const { createApp } = require('./src/app');

let environmentLoad;

function safeStartupError(error) {
  const message = String(error?.message || 'Unknown startup error')
    .replace(/mongodb(?:\+srv)?:\/\/[^\s'"`]+/gi, 'MongoDB URI [redacted]')
    .replace(/(password|pwd)=([^\s,&;]+)/gi, '$1=[redacted]');
  return {
    name: error?.name || 'Error',
    code: error?.code || undefined,
    message,
    environmentFiles: environmentLoad || { apiEnvFound: false, rootEnvFound: false },
  };
}

async function start() {
  environmentLoad = loadEnvironment();
  const config = readConfig();
  await connectDatabase(config.mongoUri, config);
  const server = createApp(config).listen(config.port, () => console.log(`CRM API listening on port ${config.port}`));
  server.on('error', async error => {
    console.error('HTTP server startup failed:', JSON.stringify(safeStartupError(error)));
    await mongoose.disconnect();
    process.exitCode = 1;
  });
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    const timer = setTimeout(() => process.exit(1), 10000).unref();
    server.close(async () => { await mongoose.disconnect(); clearTimeout(timer); });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  return server;
}
if (require.main === module) start().catch(async error => {
  console.error('API startup failed:', JSON.stringify(safeStartupError(error)));
  await mongoose.disconnect();
  process.exitCode = 1;
});
module.exports = { start, safeStartupError };
