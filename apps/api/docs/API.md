# CRM API guide

The [API contract](../../../API_CONTRACT.md) is the source of truth. This guide records implementation defaults and integration details. It is a single-company CRM with one shared customer dataset; it has no workspace, organization, business, tenant, or tenant identifier. Base path: `/api/v1`. Send JSON using `Content-Type: application/json`. Protected requests require `Authorization: Bearer <accessToken>`.

## Endpoints

| Method | Path relative to `/api/v1` | Result |
| --- | --- | --- |
| POST | `/auth/register` | 201 `{data:{user,accessToken,refreshToken}}` |
| POST | `/auth/login` | 200 same shape as registration |
| POST | `/auth/refresh` | 200 `{data:{accessToken}}` |
| POST | `/auth/logout` | 204, bearer token identifies the session |
| GET | `/auth/me` | 200 `{data:{id,name,email,role}}` |
| GET / POST | `/staff` | ADMIN only: paginated staff / create staff |
| GET / PATCH / DELETE | `/staff/:id` | ADMIN only: staff details / update or reactivate / deactivate |
| GET | `/dashboard` | 200 `{data:{summary,recentInteractions,upcomingFollowUps}}` |
| GET | `/customers` | 200 paginated customers |
| POST | `/customers` | 201 customer |
| GET / PATCH / DELETE | `/customers/:id` | 200 / 200 / 204 |
| GET / POST | `/customers/:customerId/interactions` | 200 paginated interactions / 201 interaction |
| GET / PATCH / DELETE | `/interactions/:id` | 200 / 200 / 204 |
| GET / POST | `/customers/:customerId/follow-ups` | 200 paginated follow-ups / 201 follow-up |
| GET / PATCH / DELETE | `/follow-ups/:id` | 200 / 200 / 204 |
| POST | `/follow-ups/:id/complete` | 200 `{data:{id,status,completedAt}}` |

Only register/login/refresh are public. Registration creates an active `ADMIN` account. Logout accepts no required body; use a valid access token, refreshing first if necessary. Logout revokes the current session, leaving other login sessions active. Refresh tokens expire after seven days by default. Refresh does not extend expiry. Rejected credentials use the same 401 message for unknown emails, inactive users, and wrong passwords. Registration with a duplicate normalized email returns 409.

## Roles and staff management

This application serves one company. Every active account can access the same customers, interactions, follow-ups, and dashboard. `ADMIN` has full access, including CRM deletion and staff management. `STAFF` can list, view, create, and edit CRM records and complete follow-ups, but cannot delete CRM records or call any `/staff` endpoint. Admin-only rejection is `403` with `ADMIN_REQUIRED`.

`GET /staff` accepts `page`, `limit`, and optional `status=ACTIVE|INACTIVE`, returning the standard list envelope. `POST /staff` accepts `name`, `email`, and `password`, and always creates `role: "STAFF"`; clients cannot choose a role. `PATCH /staff/:id` accepts `name`, `email`, and/or `status`. `DELETE /staff/:id` deactivates the account rather than permanently deleting it. A deactivated account's sessions are revoked immediately; an admin can reactivate it with `PATCH {"status":"ACTIVE"}`. Admin accounts are never targets of staff endpoints.

## Payloads and validation

| Resource | Editable fields |
| --- | --- |
| Registration | `name` (required, 120), `email` (required, 254), `password` (required) |
| Login | `email`, `password` |
| Refresh | `refreshToken` |
| Staff create (ADMIN) | `name` (required, 120), `email` (required, 254), `password` (required) |
| Staff update (ADMIN) | `name`, `email`, `status` (`ACTIVE` or `INACTIVE`) |
| Customer | `name` (required, 120), `email` (254), `phone` (40), `company` (160), `status`, `notes` (2000) |
| Interaction | `type` (required), `description` (required, 5000), `date` |
| Follow-up | `title` (required, 200), `description` (2000), `dueAt` (required) |

Numbers in parentheses are maximum character lengths. Strings are trimmed except passwords. Emails are normalized to lowercase and must be valid when nonempty. Optional customer strings and follow-up descriptions default to `""`; sending `""` clears them. `null`, arrays, objects and numeric phone values are rejected. Password policy: at least 8 characters and at most 72 UTF-8 bytes; passwords are never silently truncated by bcrypt. Unknown and server-controlled fields are rejected with 422, including `role`, `isActive`, `customerId`, `completedAt`, follow-up `status`, and MongoDB operators. PATCH must supply at least one editable field.

Customer status is `ACTIVE` (default) or `INACTIVE`. Interaction types: `PHONE_CALL`, `EMAIL`, `MEETING`, `MESSAGE`, `GENERAL_NOTE`. Omitted interaction dates default to the server's current time, per the PRD; supplied dates must be valid ISO 8601 timestamps with seconds and a timezone, e.g. `2026-10-05T09:00:00Z`. All returned timestamps use UTC. Invalid calendar dates are rejected.

Follow-up status is derived at read time: `COMPLETED` when `completedAt` is set, otherwise `OVERDUE` when due before now, otherwise `PENDING`. Past due dates are accepted and immediately show `OVERDUE`. Completion is idempotent, preserving its first timestamp. Editing a completed follow-up does not reopen it.

## Lists, search and dashboard

All three list endpoints accept `page` (default 1) and `limit` (default 20, maximum 100). Page must be a positive integer, at most 1,000,000. Unknown or repeated query parameters are rejected. Lists return:

```json
{"data":[],"meta":{"page":1,"limit":20,"total":0,"totalPages":0}}
```

Customers additionally accept `search` (maximum 200 characters) and `status=ACTIVE|INACTIVE`. Search matches literal text case-insensitively across name, email, phone and company. Search/filter conditions combine. No matches or an out-of-range page return an empty array, not an error. Customers sort newest first, interactions by date descending, follow-ups by due date ascending; UUID provides a stable tie-breaker.

Dashboard `summary.totalCustomers` counts all company customers. `summary.pendingFollowUps` counts all incomplete follow-ups, including overdue. `recentInteractions` returns at most five, date descending. `upcomingFollowUps` returns at most five incomplete items, due date ascending, including overdue. Both lists include `{id,name}` customer summaries and are shared by all active users.

## Errors and authorization

```json
{"error":{"code":"VALIDATION_ERROR","message":"Please correct the highlighted fields.","fields":{"email":"Enter a valid email address."}}}
```

Malformed JSON: 400. Missing/invalid/expired/revoked credentials: 401. Missing ADMIN role: 403. Disallowed browser origin: 403. Missing resource: 404. Duplicate email: 409. Body over 32 KiB: 413. Unsupported encoding: 415. Validation: 422. Auth rate limit: 429 with retry headers. Unexpected server failure: 500 with a generic message. Errors never expose stack traces or database details. DELETE success has no body (204).

There is no per-user ownership check: the data is intentionally shared company-wide. Deleting a customer is ADMIN-only and atomically deletes its interactions and follow-ups. Child creation coordinates with deletion so concurrent requests cannot leave orphaned records. The frontend should confirm the destructive cascade before issuing DELETE.

## Example flow (POSIX shell with curl and jq)

```sh
BASE=http://localhost:5000/api/v1
AUTH=$(curl -fsS "$BASE/auth/register" -H 'Content-Type: application/json' \
  -d '{"name":"Demo User","email":"demo@example.com","password":"ExamplePass123!"}')
TOKEN=$(printf '%s' "$AUTH" | jq -r '.data.accessToken')
REFRESH=$(printf '%s' "$AUTH" | jq -r '.data.refreshToken')
CUSTOMER=$(curl -fsS "$BASE/customers" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"Acme","phone":"+2348012345678"}')
ID=$(printf '%s' "$CUSTOMER" | jq -r '.data.id')
curl -fsS "$BASE/customers/$ID/interactions" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"type":"PHONE_CALL","description":"Discussed quotation."}'
curl -fsS "$BASE/customers/$ID/follow-ups" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"title":"Send quote","dueAt":"2099-01-01T09:00:00Z"}'
curl -fsS "$BASE/dashboard" -H "Authorization: Bearer $TOKEN"
curl -fsS "$BASE/auth/refresh" -H 'Content-Type: application/json' \
  -d "$(jq -n --arg token "$REFRESH" '{refreshToken:$token}')"
curl -i -X POST "$BASE/auth/logout" -H "Authorization: Bearer $TOKEN"
```

For a cross-platform disposable verification of this flow, run `npm run test:smoke` from the monorepo root.
