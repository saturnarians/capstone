const path = require('node:path');
const fs = require('node:fs');
const net = require('node:net');
const dotenv = require('dotenv');

function loadEnvironment() {
  // Resolve from this file, never from process.cwd(), so `npm run dev` works
  // from both the monorepo root and apps/api. Shell variables retain priority.
  const apiEnvPath = path.resolve(__dirname, '../.env');
  const rootEnvPath = path.resolve(__dirname, '../../../.env');
  const apiEnvFound = fs.existsSync(apiEnvPath);
  const rootEnvFound = fs.existsSync(rootEnvPath);
  if (apiEnvFound) dotenv.config({ path: apiEnvPath, quiet: true });
  if (rootEnvFound) dotenv.config({ path: rootEnvPath, quiet: true });
  return { apiEnvFound, rootEnvFound };
}

function readConfig(env = process.env) {
  function integer(key, fallback, min, max) {
    const value = Number(env[key] ?? fallback);
    if (!Number.isInteger(value) || value < min || value > max) throw new Error(`Invalid ${key}.`);
    return value;
  }
  if (!env.MONGODB_URI || !/^mongodb(\+srv)?:\/\//.test(env.MONGODB_URI)) throw new Error('Set MONGODB_URI to a MongoDB replica set URI.');
  if (!env.JWT_SECRET || Buffer.byteLength(env.JWT_SECRET) < 32) throw new Error('Set JWT_SECRET to at least 32 random bytes.');
  const origins = (env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim());
  if (origins.some(origin => { try { return new URL(origin).origin !== origin; } catch { return true; } })) throw new Error('CORS_ORIGINS must contain comma-separated origins.');
  const mongoDnsServers = (env.MONGODB_DNS_SERVERS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (mongoDnsServers.some(server => net.isIP(server) === 0)) throw new Error('MONGODB_DNS_SERVERS must contain comma-separated IP addresses.');
  return {
    mongoUri: env.MONGODB_URI, jwtSecret: env.JWT_SECRET,
    port: integer('PORT', 5000, 1, 65535), origins,
    accessTtlSeconds: integer('JWT_ACCESS_TTL_SECONDS', 900, 60, 86400),
    refreshTtlDays: integer('REFRESH_TOKEN_TTL_DAYS', 7, 1, 90),
    bcryptRounds: integer('BCRYPT_ROUNDS', 12, 10, 15),
    authRateLimit: integer('AUTH_RATE_LIMIT', 30, 1, 1000),
    trustProxy: integer('TRUST_PROXY_HOPS', 0, 0, 10),
    mongoDnsServers,
  };
}

module.exports = { loadEnvironment, readConfig };
