# Small Business CRM — API Contract

**API version:** v1  
**Base path:** `/api/v1`  
**Protocol:** HTTPS in production  
**Format:** JSON  
**Architecture:** REST

---

## 1. Purpose

This document defines the API contract between the CRM frontend and backend.

It is the shared implementation reference for:

- Endpoint names
- HTTP methods
- Request payloads
- Response payloads
- Validation
- Authentication
- Authorization
- Resource relationships
- Error handling
- Pagination
- Search
- Dashboard behavior

Frontend implementation should not invent API behavior, and backend implementation should not introduce UI requirements without agreement.

---

## 2. Resource Model

```text
Company CRM
 ├── ADMIN users
 ├── STAFF users
 └── Customers
      ├── Interactions
      └── Follow-ups
```

This CRM serves one company. All active ADMIN and STAFF users access the same
customer, interaction, follow-up, and dashboard data. There are no businesses,
workspaces, organizations, tenant identifiers, or per-user-owned CRM records.

Authorization is role-based:

- `ADMIN` has full CRM access and manages staff accounts.
- `STAFF` can view, create, and edit CRM data and complete follow-ups, but cannot delete CRM data or manage staff.

---

## 3. Authentication

Protected endpoints use:

```http
Authorization: Bearer <access_token>
```

JSON requests use:

```http
Content-Type: application/json
```

---

## 4. Identifier Standard

All public resource IDs should use UUIDs.

Example:

```text
550e8400-e29b-41d4-a716-446655440000
```

The API should not expose internal numeric database IDs if the database uses auto-increment identifiers internally.

---

## 5. Standard Response Structure

### Single resource

```json
{
  "data": {
    "id": "uuid",
    "name": "John Smith"
  }
}
```

### List

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

### Action

```json
{
  "data": {
    "message": "Operation completed successfully."
  }
}
```

---

## 6. Standard Error Structure

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid data.",
    "fields": {
      "email": "Enter a valid email address."
    }
  }
}
```

For errors without field-level validation:

```json
{
  "error": {
    "code": "CUSTOMER_NOT_FOUND",
    "message": "Customer not found."
  }
}
```

Production API responses must not expose:

- Stack traces
- SQL errors
- Database credentials
- Internal infrastructure details
- Password hashes
- Other secrets

---

## 7. HTTP Status Codes

| Status | Meaning |
|---|---|
| 200 | Successful request |
| 201 | Resource created |
| 204 | Successful operation with no response body |
| 400 | Invalid request |
| 401 | Unauthenticated |
| 403 | Authenticated but not permitted |
| 404 | Resource not found |
| 409 | Conflict |
| 422 | Validation failure |
| 429 | Rate limited |
| 500 | Internal server error |

---

# 8. Authentication API

## POST `/auth/register`

Create a new CRM user.

### Request

```json
{
  "name": "Israel Ayinde",
  "email": "israel@example.com",
  "password": "SecurePassword123!"
}
```

### Validation

`name`

- Required
- String

`email`

- Required
- Valid email
- Unique

`password`

- Required
- Must satisfy the backend password policy

Public registration creates an active `ADMIN` account.

### Success

**201 Created**

```json
{
  "data": {
    "user": {
      "id": "user-uuid",
      "name": "Israel Ayinde",
      "email": "israel@example.com",
      "role": "ADMIN"
    },
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

---

## POST `/auth/login`

Authenticate an existing user.

### Request

```json
{
  "email": "israel@example.com",
  "password": "SecurePassword123!"
}
```

### Success

**200 OK**

```json
{
  "data": {
    "user": {
      "id": "user-uuid",
      "name": "Israel Ayinde",
      "email": "israel@example.com",
      "role": "ADMIN"
    },
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### Invalid credentials

**401 Unauthorized**

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect."
  }
}
```

Do not reveal whether the email exists.

---

## POST `/auth/refresh`

Issue a new access token.

### Request

```json
{
  "refreshToken": "refresh-token"
}
```

### Response

```json
{
  "data": {
    "accessToken": "new-access-token"
  }
}
```

---

## POST `/auth/logout`

Invalidate the current refresh token/session.

### Response

**204 No Content**

---

## GET `/auth/me`

Return the authenticated user's basic profile.

### Response

```json
{
  "data": {
    "id": "user-uuid",
    "name": "Israel Ayinde",
    "email": "israel@example.com",
    "role": "ADMIN"
  }
}
```

Never return password hashes.

---

## Staff API (ADMIN only)

Staff accounts are company users. They do not own a separate CRM dataset.

### GET `/staff`

Return staff members. Query parameters: `page`, `limit`, and optional
`status=ACTIVE|INACTIVE`.

### POST `/staff`

Create a staff account.

```json
{
  "name": "Ada Agent",
  "email": "ada@example.com",
  "password": "SecurePassword123!"
}
```

The server always assigns `STAFF`; the client cannot choose a role.

### GET `/staff/:id`

Return one staff member.

### PATCH `/staff/:id`

Update staff `name`, `email`, and/or `status` (`ACTIVE` or `INACTIVE`).
Setting `INACTIVE` immediately revokes that staff member's sessions. An admin may
reactivate a member by setting `ACTIVE`.

### DELETE `/staff/:id`

Deactivate a staff account and revoke its sessions. This is a 204 response and
does not permanently delete the account.

Staff management attempts by a `STAFF` user return:

```json
{
  "error": {
    "code": "ADMIN_REQUIRED",
    "message": "Administrator access is required."
  }
}
```

---

# 9. Customer API

## GET `/customers`

Return customers in the shared company CRM.

### Query Parameters

```text
page
limit
search
status
```

Example:

```http
GET /api/v1/customers?page=1&limit=20&search=john
```

### Search fields

Search applies to:

- Name
- Email
- Phone
- Company

### Response

```json
{
  "data": [
    {
      "id": "customer-uuid",
      "name": "John Smith",
      "email": "john@example.com",
      "phone": "+2348012345678",
      "company": "Acme Ltd",
      "status": "ACTIVE",
      "notes": "Important customer",
      "createdAt": "2026-09-28T10:00:00Z",
      "updatedAt": "2026-09-28T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## GET `/customers/:id`

Return one customer.

### Response

```json
{
  "data": {
    "id": "customer-uuid",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+2348012345678",
    "company": "Acme Ltd",
    "status": "ACTIVE",
    "notes": "Important customer",
    "createdAt": "2026-09-28T10:00:00Z",
    "updatedAt": "2026-09-28T10:00:00Z"
  }
}
```

Every authenticated active user can view this shared customer.

---

## POST `/customers`

Create a customer.

### Request

```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "+2348012345678",
  "company": "Acme Ltd",
  "status": "ACTIVE",
  "notes": "Important customer"
}
```

### Response

**201 Created**

```json
{
  "data": {
    "id": "customer-uuid",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+2348012345678",
    "company": "Acme Ltd",
    "status": "ACTIVE",
    "notes": "Important customer",
    "createdAt": "2026-09-28T10:00:00Z",
    "updatedAt": "2026-09-28T10:00:00Z"
  }
}
```

---

## PATCH `/customers/:id`

Update a customer.

Only supplied editable fields need to be included.

### Request

```json
{
  "name": "John A. Smith",
  "phone": "+2348012345679",
  "status": "INACTIVE"
}
```

### Response

```json
{
  "data": {
    "id": "customer-uuid",
    "name": "John A. Smith",
    "phone": "+2348012345679",
    "status": "INACTIVE"
  }
}
```

---

## DELETE `/customers/:id`

Delete a customer.

### Response

**204 No Content**

Recommended MVP deletion behavior:

> Deleting a customer permanently deletes the customer's associated interactions and follow-ups.

This operation should be transactional.

---

## Customer Not Found

For:

```text
GET /customers/:id
PATCH /customers/:id
DELETE /customers/:id
```

return:

**404 Not Found**

```json
{
  "error": {
    "code": "CUSTOMER_NOT_FOUND",
    "message": "Customer not found."
  }
}
```

Do not disclose whether the resource belongs to another user.

---

# 10. Interaction API

## GET `/customers/:customerId/interactions`

Return interactions belonging to a customer.

### Query Parameters

```text
page
limit
```

### Response

```json
{
  "data": [
    {
      "id": "interaction-uuid",
      "customerId": "customer-uuid",
      "type": "PHONE_CALL",
      "description": "Discussed quotation.",
      "date": "2026-09-28T14:30:00Z",
      "createdAt": "2026-09-28T14:30:00Z",
      "updatedAt": "2026-09-28T14:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## GET `/interactions/:id`

Return one interaction.

Every authenticated active user can view interactions in the shared company CRM.

---

## POST `/customers/:customerId/interactions`

Create an interaction.

### Request

```json
{
  "type": "PHONE_CALL",
  "description": "Discussed quotation and next steps.",
  "date": "2026-09-28T14:30:00Z"
}
```

The customer is determined from the URL.

The client must not submit a conflicting `customerId` in the request body.

### Response

**201 Created**

```json
{
  "data": {
    "id": "interaction-uuid",
    "customerId": "customer-uuid",
    "type": "PHONE_CALL",
    "description": "Discussed quotation and next steps.",
    "date": "2026-09-28T14:30:00Z",
    "createdAt": "2026-09-28T14:30:00Z",
    "updatedAt": "2026-09-28T14:30:00Z"
  }
}
```

---

## PATCH `/interactions/:id`

Update an interaction.

### Request

```json
{
  "type": "MEETING",
  "description": "Met with customer to discuss the project.",
  "date": "2026-09-29T10:00:00Z"
}
```

---

## DELETE `/interactions/:id`

Delete an interaction.

### Response

**204 No Content**

---

## Interaction Types

Allowed values:

```text
PHONE_CALL
EMAIL
MEETING
MESSAGE
GENERAL_NOTE
```

Invalid values must return `422 Unprocessable Entity`.

Example:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid interaction type.",
    "fields": {
      "type": "Type must be one of PHONE_CALL, EMAIL, MEETING, MESSAGE, GENERAL_NOTE."
    }
  }
}
```

---

# 11. Follow-up API

## GET `/customers/:customerId/follow-ups`

Return follow-ups belonging to a customer.

### Response

```json
{
  "data": [
    {
      "id": "followup-uuid",
      "customerId": "customer-uuid",
      "title": "Follow up on quotation",
      "description": "Confirm whether the customer is ready to proceed.",
      "dueAt": "2026-10-01T10:00:00Z",
      "status": "PENDING",
      "completedAt": null,
      "createdAt": "2026-09-28T10:00:00Z",
      "updatedAt": "2026-09-28T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## GET `/follow-ups/:id`

Return one follow-up.

Every authenticated active user can view follow-ups in the shared company CRM.

---

## POST `/customers/:customerId/follow-ups`

Create a follow-up.

### Request

```json
{
  "title": "Follow up on quotation",
  "description": "Confirm whether the customer is ready to proceed.",
  "dueAt": "2026-10-01T10:00:00Z"
}
```

The client does not submit:

```text
status
completedAt
```

The server determines the initial state.

### Response

**201 Created**

```json
{
  "data": {
    "id": "followup-uuid",
    "customerId": "customer-uuid",
    "title": "Follow up on quotation",
    "description": "Confirm whether the customer is ready to proceed.",
    "dueAt": "2026-10-01T10:00:00Z",
    "status": "PENDING",
    "completedAt": null,
    "createdAt": "2026-09-28T10:00:00Z",
    "updatedAt": "2026-09-28T10:00:00Z"
  }
}
```

---

## PATCH `/follow-ups/:id`

Update a follow-up.

### Request

```json
{
  "title": "Follow up on revised quotation",
  "description": "Confirm the revised quotation.",
  "dueAt": "2026-10-03T10:00:00Z"
}
```

The client should not freely set `OVERDUE`.

The backend calculates status.

---

## POST `/follow-ups/:id/complete`

Mark a follow-up as completed.

### Request

No body required.

### Response

```json
{
  "data": {
    "id": "followup-uuid",
    "status": "COMPLETED",
    "completedAt": "2026-09-28T15:30:00Z"
  }
}
```

Recommended implementation: make completion idempotent. Repeating the operation on an already completed follow-up should return its completed state rather than create an inconsistent result.

---

## DELETE `/follow-ups/:id`

Delete a follow-up.

### Response

**204 No Content**

---

# 12. Follow-up Status Rules

Status is derived from `dueAt` and `completedAt`.

Conceptually:

```typescript
if (completedAt !== null) {
  status = "COMPLETED";
} else if (dueAt < now) {
  status = "OVERDUE";
} else {
  status = "PENDING";
}
```

The frontend must not be trusted to determine follow-up status.

Completed takes precedence over overdue.

---

# 13. Dashboard API

## GET `/dashboard`

Return the information required by the Dashboard Overview.

### Response

```json
{
  "data": {
    "summary": {
      "totalCustomers": 128,
      "pendingFollowUps": 12
    },
    "recentInteractions": [
      {
        "id": "interaction-uuid",
        "customer": {
          "id": "customer-uuid",
          "name": "John Smith"
        },
        "type": "PHONE_CALL",
        "description": "Discussed quotation.",
        "date": "2026-09-28T14:30:00Z"
      }
    ],
    "upcomingFollowUps": [
      {
        "id": "followup-uuid",
        "customer": {
          "id": "customer-uuid",
          "name": "Acme Ltd"
        },
        "title": "Follow up on quotation",
        "dueAt": "2026-10-01T10:00:00Z",
        "status": "PENDING"
      }
    ]
  }
}
```

---

## Dashboard Data Rules

### `totalCustomers`

Count of all customer records in the shared company CRM.

### `pendingFollowUps`

Recommended definition:

```text
All incomplete follow-ups
```

This includes:

```text
PENDING
OVERDUE
```

because both require action.

### `recentInteractions`

Latest interactions ordered by:

```text
date DESC
```

Recommended default:

```text
5 records
```

### `upcomingFollowUps`

Incomplete follow-ups ordered by due date ascending.

Recommended default:

```text
5 records
```

Overdue follow-ups remain visible because they still require action.

---

# 14. Quick Action API Behavior

The Dashboard quick actions use the existing resource endpoints.

### Add Customer

```http
POST /api/v1/customers
```

### Add Interaction

After customer selection:

```http
POST /api/v1/customers/:customerId/interactions
```

### Create Follow-up

After customer selection:

```http
POST /api/v1/customers/:customerId/follow-ups
```

The Dashboard does not need separate CRUD endpoints for these actions.

---

# 15. Pagination

Recommended defaults:

```text
page = 1
limit = 20
```

Maximum:

```text
limit = 100
```

Example:

```http
GET /api/v1/customers?page=2&limit=20
```

Response:

```json
{
  "data": [],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 84,
    "totalPages": 5
  }
}
```

---

# 16. Search

Customer search:

```http
GET /api/v1/customers?search=john
```

The API should perform case-insensitive matching against:

```text
name
email
phone
company
```

No-result response:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

A no-result search is not an API error.

---

# 17. Validation Error Example

### Request

```json
{
  "name": "",
  "email": "wrong-email"
}
```

### Response

**422 Unprocessable Entity**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "fields": {
      "name": "Name is required.",
      "email": "Enter a valid email address."
    }
  }
}
```

---

# 18. Authorization

CRM data is shared by every active company user. Authorization depends on role,
not ownership. A `STAFF` user who attempts an ADMIN-only endpoint, including
staff management or CRM deletion, receives **403 Forbidden** with
`ADMIN_REQUIRED`.

---

# 19. Database Model

Recommended conceptual schema:

```text
users
-----
id
name
email
password_hash
role (ADMIN | STAFF)
is_active
created_at
updated_at


customers
---------
id
name
email
phone
company
status
notes
created_at
updated_at


interactions
------------
id
customer_id
type
description
date
created_at
updated_at


follow_ups
----------
id
customer_id
title
description
due_at
completed_at
created_at
updated_at
```

Follow-up status can be derived rather than persisted.

If status is persisted for performance, it must never be independently editable by the client.

---

# 20. Database Relationships

```text
customers
  │
  ├──── 1:N ──── interactions
  │
  └──── 1:N ──── follow_ups
```

Foreign keys:

```text
interactions.customer_id
    → customers.id

follow_ups.customer_id
    → customers.id
```

---

# 21. Delete Relationship

Recommended MVP behavior:

```text
Customer deleted
      ↓
Interactions deleted
      ↓
Follow-ups deleted
```

The operation should be transactional.

The database must not be left in a partially deleted state if one operation fails.

---

# 22. Date/Time Standard

API timestamps should use ISO 8601.

Example:

```text
2026-09-28T14:30:00Z
```

The backend should store timestamps consistently.

The frontend is responsible for displaying dates/times according to the user's locale/timezone.

---

# 23. Recommended Field Limits

These are initial API validation limits:

| Field | Recommended maximum |
|---|---:|
| User name | 120 |
| Customer name | 120 |
| Email | 254 |
| Phone | 40 |
| Company | 160 |
| Customer notes | 2,000 |
| Interaction description | 5,000 |
| Follow-up title | 200 |
| Follow-up description | 2,000 |

These can be adjusted by engineering when justified.

---

# 24. Frontend/API Responsibility

## Frontend

Responsible for:

- Rendering UI
- Form interaction
- Client-side validation for UX
- Loading states
- Empty states
- No-result states
- Error states
- Success feedback
- Search interaction
- Navigation
- Responsive behavior

## Backend

Responsible for:

- Authentication
- Authorization
- Validation
- Data persistence
- Role-based access
- Business rules
- Follow-up status calculation
- Search
- Pagination
- Data integrity
- Security

Client-side validation never replaces backend validation.

---

# 25. Frontend State Mapping

| API situation | UI behavior |
|---|---|
| Request pending | Loading/skeleton |
| 200 | Render data |
| 201 | Update UI + success feedback |
| 204 | Remove item/update UI |
| 400 | Request error message |
| 401 | Authentication handling |
| 403 | Permission message |
| 404 | Not found state |
| 409 | Conflict message |
| 422 | Field validation |
| 429 | Retry/wait message |
| 500 | Friendly error + retry |

---

# 26. API Endpoint Map

```text
AUTH
────────────────────────────────────
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me


DASHBOARD
────────────────────────────────────
GET    /api/v1/dashboard


CUSTOMERS
────────────────────────────────────
GET    /api/v1/customers
POST   /api/v1/customers
GET    /api/v1/customers/:id
PATCH  /api/v1/customers/:id
DELETE /api/v1/customers/:id


INTERACTIONS
────────────────────────────────────
GET    /api/v1/customers/:customerId/interactions
POST   /api/v1/customers/:customerId/interactions
GET    /api/v1/interactions/:id
PATCH  /api/v1/interactions/:id
DELETE /api/v1/interactions/:id


FOLLOW-UPS
────────────────────────────────────
GET    /api/v1/customers/:customerId/follow-ups
POST   /api/v1/customers/:customerId/follow-ups
GET    /api/v1/follow-ups/:id
PATCH  /api/v1/follow-ups/:id
POST   /api/v1/follow-ups/:id/complete
DELETE /api/v1/follow-ups/:id
```

---

# 27. API Security Requirements

The API must:

- Authenticate protected routes.
- Authorize every resource access.
- Hash passwords.
- Validate all input.
- Sanitize appropriate user-generated content.
- Use HTTPS in production.
- Store secrets in environment variables.
- Never expose password hashes.
- Never expose database credentials.
- Avoid verbose production errors.
- Apply reasonable rate limiting to authentication endpoints.
- Protect refresh-token/session mechanisms.
- Validate UUIDs.
- Enforce maximum field lengths.

---

# 28. API Implementation Order

## Phase 1 — Backend foundation

1. Project setup
2. Database
3. User model
4. Customer model
5. Interaction model
6. Follow-up model
7. Authentication
8. Authorization middleware
9. Validation
10. Error handling

## Phase 2 — Customer API

```text
GET    /customers
GET    /customers/:id
POST   /customers
PATCH  /customers/:id
DELETE /customers/:id
```

## Phase 3 — Interaction API

```text
GET    /customers/:customerId/interactions
GET    /interactions/:id
POST   /customers/:customerId/interactions
PATCH  /interactions/:id
DELETE /interactions/:id
```

## Phase 4 — Follow-up API

```text
GET    /customers/:customerId/follow-ups
GET    /follow-ups/:id
POST   /customers/:customerId/follow-ups
PATCH  /follow-ups/:id
POST   /follow-ups/:id/complete
DELETE /follow-ups/:id
```

## Phase 5 — Dashboard

```text
GET /dashboard
```

## Phase 6 — Frontend integration

Integrate the approved UX/UI with the API contract.

---

# 29. API Definition of Done

The API is ready for frontend integration when:

### Authentication

- Registration works.
- Login works.
- Logout works.
- Refresh/session behavior works.
- Protected routes reject unauthenticated requests.
- Invalid credentials return safe errors.

### Staff and roles

- Public registration creates an ADMIN.
- ADMIN can manage STAFF accounts and delete CRM records.
- STAFF accounts can perform operational CRM work but cannot delete CRM records or manage staff.
- Deactivated staff sessions are revoked.

### Customers

- CRUD works.
- Search works.
- Pagination works.
- Validation works.
- Shared CRM access and ADMIN-only deletion are enforced.
- Delete behavior is transactional.

### Interactions

- CRUD works.
- Allowed types are enforced.
- Customer association works.
- Shared CRM access and ADMIN-only deletion are enforced.

### Follow-ups

- CRUD works.
- Completion works.
- Pending/overdue/completed state is derived correctly.
- Shared CRM access and ADMIN-only deletion are enforced.

### Dashboard

- Customer count is accurate.
- Follow-up count is accurate.
- Recent interactions are accurate.
- Upcoming follow-ups are accurate.
- Data is shared by active company users.

### Security

- Passwords are hashed.
- Sensitive fields are never exposed.
- Unauthorized resource access is blocked.
- Production errors do not expose internals.
- Authentication endpoints have appropriate protection.

---

# 30. Contract Change Rule

Any change to the following requires agreement between product, UX, frontend, and backend:

- Endpoint
- HTTP method
- Request field
- Required field
- Response field
- Entity structure
- Status value
- Business rule
- Authentication behavior
- Authorization behavior
- Data relationship
- Deletion behavior

The API contract should be versioned when breaking changes are introduced.

---

## Final Endpoint Summary

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me

GET    /api/v1/staff
POST   /api/v1/staff
GET    /api/v1/staff/:id
PATCH  /api/v1/staff/:id
DELETE /api/v1/staff/:id

GET    /api/v1/dashboard

GET    /api/v1/customers
POST   /api/v1/customers
GET    /api/v1/customers/:id
PATCH  /api/v1/customers/:id
DELETE /api/v1/customers/:id

GET    /api/v1/customers/:customerId/interactions
POST   /api/v1/customers/:customerId/interactions
GET    /api/v1/interactions/:id
PATCH  /api/v1/interactions/:id
DELETE /api/v1/interactions/:id

GET    /api/v1/customers/:customerId/follow-ups
POST   /api/v1/customers/:customerId/follow-ups
GET    /api/v1/follow-ups/:id
PATCH  /api/v1/follow-ups/:id
POST   /api/v1/follow-ups/:id/complete
DELETE /api/v1/follow-ups/:id
```
