# CRM backend

The existing `@repo/api` workspace implements the MVP from [API_CONTRACT.md](../../API_CONTRACT.md) and [PRD.md](../../PRD.md). It is a single-company CRM: customers are shared across all active accounts, with `ADMIN` and `STAFF` role-based access. There are no business, workspace, organization, or tenant records or identifiers.

## Run locally

Requirements: Node.js 20.19+ and a MongoDB replica set (MongoDB 7+ recommended), or MongoDB Atlas. Transactions are required for registration, child creation, and atomic customer deletion. A standalone `mongod` is rejected at startup.

From the monorepo root:

```sh
npm ci
cp apps/api/.env.example apps/api/.env
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

In PowerShell use `Copy-Item apps/api/.env.example apps/api/.env`. Put the generated secret into `JWT_SECRET` in your local file and configure `MONGODB_URI`. Never commit that file. Run:

```sh
npm run dev --workspace @repo/api
# or without the development watcher:
npm start --workspace @repo/api
```

To prepare an installed local MongoDB server, create a data directory and run `mongod --replSet rs0 --bind_ip 127.0.0.1 --dbpath <your-data-directory>`. In another terminal run `mongosh --eval "rs.initiate()"`. The example URI then works. Database startup and index creation complete before the API listens.

`GET http://localhost:5000/api/health` returns `{ "data": { "status": "OK" } }`. The API base is `http://localhost:5000/api/v1`. Production must use HTTPS through a trusted reverse proxy.

## Environment

Shell variables take precedence over `apps/api/.env`, then the root `.env`. Existing files are never rewritten. All defaults are in [.env.example](.env.example).

| Variable | Default / requirement |
| --- | --- |
| `MONGODB_URI` | Required replica set or Atlas URI |
| `MONGODB_DNS_SERVERS` | Optional comma-separated DNS resolver IPs for Atlas SRV lookups |
| `JWT_SECRET` | Required; at least 32 bytes, generated randomly |
| `PORT` | `5000` |
| `JWT_ACCESS_TTL_SECONDS` | `900`; 60–86400 |
| `REFRESH_TOKEN_TTL_DAYS` | `7`; 1–90 |
| `BCRYPT_ROUNDS` | `12`; 10–15 |
| `CORS_ORIGINS` | `http://localhost:5173`; comma-separated exact origins |
| `AUTH_RATE_LIMIT` | 30 requests per IP per 15 minutes across register/login/refresh |
| `TRUST_PROXY_HOPS` | `0`; set only for your exact trusted proxy topology |
| `NODE_ENV` | Set to `production` in deployment |

The rate-limit store is in-process, appropriate for a single API process. Multiple API instances require a shared limiter store. Secrets and database errors are never returned to clients. User input is plain text; frontend renderers must escape it rather than inserting it as HTML.

If an Atlas `mongodb+srv` connection reports `querySrv ECONNREFUSED`, the machine DNS server is refusing the required SRV lookup. Set `MONGODB_DNS_SERVERS` to resolver IP addresses permitted by your network, for example `1.1.1.1`, rather than changing or exposing the Atlas URI. The API reports safe startup diagnostics: error class, error code, redacted error message, and whether each expected environment file exists.

## API behavior

See [the API guide](docs/API.md) for endpoints, role permissions, validation, session behavior and runnable examples. Public IDs are UUIDs stored as string MongoDB `_id` values. Responses explicitly serialize `id` and editable fields; they exclude password hashes, session hashes and MongoDB metadata.

Authentication uses bcrypt and HS256 JWT access tokens tied to server-side sessions. Refresh tokens are cryptographically random and only SHA-256 digests are stored. Logout revokes that session immediately, including its access tokens. The refresh response intentionally returns only `accessToken`, as specified in the contract; the original refresh token has a fixed expiry and is not rotated or extended.

Public registration creates an active `ADMIN`. An admin can create, update, deactivate, reactivate, and list `STAFF` through the staff endpoints. Staff can view, create, and edit the shared CRM data and complete follow-ups. Only admins can delete CRM records or manage staff. Deactivation immediately blocks the staff account and revokes its sessions.

### Upgrading the earlier per-user backend

The current branch originally implemented per-user customer ownership. Before deploying this change to an existing database, back it up and run:

```sh
npm run migrate:shared-data --workspace @repo/api
```

The migration gives users without a role the `ADMIN` role, activates users without an active-state field, removes only the prior customer `userId` ownership field, and drops the two known ownership indexes. It is idempotent. It does not create tenants or move data between businesses.

## Tests

```sh
npm test
npm run test:smoke
```

Tests use Node's test runner, Supertest and an automatically managed MongoDB 7.0.24 replica set. The first run downloads the official MongoDB binary into ignored `node_modules/.cache/mongodb-binaries`; subsequent runs reuse it. On Windows the first download is approximately 600 MB, so setup permits up to 15 minutes. Integration tests never load `.env`; the smoke process overrides every API setting through its environment. Neither uses an existing CRM database. No external account or cloud database is needed. For offline runs, provision the binary in advance or set `MONGOMS_SYSTEM_BINARY` to a compatible local `mongod` executable.

Integration tests cover all contract endpoints, bcrypt hashing, token/session expiry and revocation, ADMIN/STAFF authorization, staff deactivation, shared CRM access, search/pagination, derived follow-up status, concurrent completion, dashboard ordering/counts, transactional rollback, and deletion/create races. The smoke command starts the actual `index.js` process on a temporary port and verifies the complete flow over HTTP, then removes its temporary database and stops the server.

## Structure

- `index.js`: environment loading, database startup, HTTP lifecycle.
- `src/app.js`: Express setup, CORS, headers, rate limiting, routes, errors.
- `src/auth.js`: registration/login, sessions, token verification, logout.
- `src/crm.js`: shared customer and child resources, dashboard.
- `src/staff.js`: ADMIN-only staff account management.
- `src/models.js`: Mongoose models and indexes.
- `src/validation.js`, `serializers.js`, `errors.js`: request validation, public responses and centralized errors.
- `test/`, `scripts/smoke.js`: isolated backend verification.

Reference implementation guidance: [Mongoose transactions](https://mongoosejs.com/docs/transactions.html), [Express error handling](https://expressjs.com/en/guide/error-handling/), [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken).
