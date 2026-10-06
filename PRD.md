# Small Business CRM — Product Requirements Document

**Document status:** Implementation-ready draft  
**Product version:** MVP v1.0  
**Product type:** Web-based CRM  
**Primary users:** Small business owners, sales representatives, customer service staff, business administrators, and small teams

---

## 1. Product Overview

The Small Business CRM is a lightweight customer relationship management application designed to help small businesses move customer information and follow-up activities from scattered notebooks, spreadsheets, phone contacts, WhatsApp conversations, emails, and personal reminders into one organized workspace.

The MVP allows authenticated business users to:

- Create and manage customers
- Search customers
- View customer details
- Record customer interactions
- Create and manage follow-ups
- Track pending, completed, and overdue follow-ups
- See customer and activity summaries from a dashboard

The product is intentionally simple. It focuses on the core workflow:

> **Know the customer → record what happened → remember what needs to happen next.**

---

## 2. Product Vision

Create a CRM that a small business employee can understand and use without CRM training.

The product should feel:

- Simple
- Clear
- Fast
- Organized
- Reliable
- Human
- Practical

The interface should prioritize useful actions over complexity.

---

## 3. Problem Statement

Small businesses often manage customer relationships through disconnected tools and informal processes.

Customer information may exist in:

- Phone contacts
- WhatsApp
- Email
- Notebooks
- Spreadsheets
- Personal reminders
- Individual employee memory

This creates problems such as:

- Customer information being difficult to find
- Previous conversations being forgotten
- Follow-ups being missed
- Customer history being scattered
- Employees lacking a shared view of customer activity
- Business owners having limited visibility into outstanding follow-ups

The CRM centralizes this information into one lightweight workspace.

---

## 4. Product Goals

The MVP must allow a user to:

1. Register and authenticate.
2. Access a protected dashboard.
3. Add customers.
4. View customers.
5. Search customers.
6. Edit customers.
7. Delete customers.
8. View an individual customer's profile.
9. Record customer interactions.
10. Edit interactions.
11. Delete interactions.
12. Create follow-ups.
13. Edit follow-ups.
14. Complete follow-ups.
15. Delete follow-ups.
16. See relevant activity on the dashboard.
17. Understand loading, empty, success, and error states.

---

## 5. Target Users

### 5.1 Small Business Owner

Needs to:

- Know who their customers are
- Keep customer records organized
- Remember follow-ups
- See recent customer activity

### 5.2 Sales Representative

Needs to:

- Find customers quickly
- Record calls, meetings, and messages
- Know which customers require follow-up

### 5.3 Customer Service Staff

Needs to:

- Access customer information
- Understand previous interactions
- Record customer communications
- Track outstanding follow-ups

### 5.4 Business Administrator

Needs to:

- Maintain customer records
- Keep information organized
- Monitor basic customer activity

---

## 6. User Account Model

Customers do not create CRM accounts.

There are two fundamental concepts:

### CRM User

The authenticated person using the CRM.

CRM users have one of two roles:

- `ADMIN`: full CRM access and staff account management.
- `STAFF`: shared CRM operational access without staff management or CRM deletion.

### Customer

A business contact in the company's shared CRM.

All active CRM users work in the same company dataset. This MVP does not have
businesses, workspaces, organizations, tenants, or per-user-owned CRM records.

---

## 7. Information Architecture

### Public

- Home

### Authentication

- Auth
  - Login
  - Register

### Protected CRM

- Dashboard
- Customers
- Customer Details

Customer CRUD actions and interaction/follow-up CRUD actions should use contextual UI such as modals, drawers, dialogs, or inline editing rather than creating unnecessary routes.

---

## 8. Routes

Recommended frontend routes:

```text
/
 /auth
 /dashboard
 /customers
 /customers/:id
```

Protected routes:

```text
/dashboard
/customers
/customers/:id
```

---

## 9. Primary Navigation

Authenticated navigation:

- Dashboard
- Customers

Account controls:

- User/profile indicator
- Logout

The MVP should not contain unnecessary navigation items.

---

## 10. Core User Journeys

### 10.1 New User

```text
Home
  ↓
Register
  ↓
Account created
  ↓
Dashboard
  ↓
Add Customer
  ↓
Customer created
  ↓
Customer Details / Customers
```

### 10.2 Returning User

```text
Home
  ↓
Login
  ↓
Dashboard
```

### 10.3 Add Customer

```text
Customers
  ↓
Add Customer
  ↓
Enter information
  ↓
Validation
  ↓
Save
  ↓
Customer created
  ↓
Customer list updated
```

### 10.4 View Customer

```text
Customers
  ↓
Search/select customer
  ↓
Customer Details
```

### 10.5 Add Interaction

From Customer Details:

```text
Customer Details
  ↓
Add Interaction
  ↓
Enter interaction
  ↓
Save
  ↓
Interaction appears in customer history
```

From Dashboard:

```text
Dashboard
  ↓
Add Interaction
  ↓
Select Customer
  ↓
Enter interaction
  ↓
Save
```

When an interaction starts from the Dashboard, the customer must be selected because no customer context exists yet.

### 10.6 Create Follow-up

From Customer Details:

```text
Customer Details
  ↓
Create Follow-up
  ↓
Enter follow-up
  ↓
Save
```

From Dashboard:

```text
Dashboard
  ↓
Create Follow-up
  ↓
Select Customer
  ↓
Enter follow-up
  ↓
Save
```

---

## 11. Customer Requirements

| Field | Type | Required |
|---|---|---|
| ID | UUID | System |
| Name | String | Yes |
| Email | String | No |
| Phone | String | No |
| Company | String | No |
| Status | Enum | Yes |
| Notes | Text | No |
| Created At | DateTime | System |
| Updated At | DateTime | System |

Status values:

```text
ACTIVE
INACTIVE
```

### Customer Rules

- Name is required.
- Email is optional but must be valid when supplied.
- Phone is stored as a string to preserve country codes and leading zeros.
- Company is optional.
- Notes are optional.
- Status defaults to `ACTIVE`.
- Status is manually controlled by the user.

---

## 12. Customer Search

The Customers screen must allow searching by:

- Name
- Email
- Phone
- Company

Search should be case-insensitive.

No-result search is a valid state, not an API error.

---

## 13. Customer Deletion

Customer deletion is destructive and requires confirmation.

Recommended MVP behavior:

> Deleting a customer also deletes the customer's associated interactions and follow-ups.

The confirmation UI must clearly communicate this consequence.

The backend must limit deletion to administrators.

---

## 14. Customer Details

Customer Details must contain:

### Customer Information

- Name
- Email
- Phone
- Company
- Status
- Notes

Actions:

- Edit
- Delete

### Interactions

Display the customer's interaction history.

### Follow-ups

Display the customer's follow-ups.

---

## 15. Interaction Requirements

Interaction types:

```text
PHONE_CALL
EMAIL
MEETING
MESSAGE
GENERAL_NOTE
```

### Interaction Rules

- Every interaction belongs to exactly one customer.
- From Customer Details, customer context is implicit.
- From Dashboard, customer selection is required.
- Interaction date defaults to the current date/time but can be changed.
- Interactions are displayed in reverse chronological order by default.

---

## 16. Follow-up Requirements

Status values:

```text
PENDING
COMPLETED
OVERDUE
```

---

## 17. Follow-up Status Rules

The user must not manually select `OVERDUE`.

The system determines the status.

### Pending

```text
due_at >= current time
AND completed_at IS NULL
```

### Overdue

```text
due_at < current time
AND completed_at IS NULL
```

### Completed

```text
completed_at IS NOT NULL
```

Completed takes precedence.

A completed follow-up remains `COMPLETED` even when its original due date has passed.

---

## 18. Complete Follow-up

When a pending or overdue follow-up is completed:

```text
completed_at = current timestamp
status = COMPLETED
```

The change must be reflected in:

- Customer Details
- Dashboard pending count
- Dashboard follow-up list
- Follow-up status

---

## 19. Dashboard Requirements

The Dashboard contains:

### Summary

#### Total Customers

Count of customers in the shared company CRM.

#### Pending Follow-ups

Recommended definition:

> All incomplete follow-ups, including overdue follow-ups.

The UI should distinguish pending and overdue states visually.

### Recent Interactions

Display a limited number of recent interactions.

Recommended default:

```text
5
```

Each item displays:

- Customer
- Interaction type
- Description/summary
- Date

### Upcoming Follow-ups

Display incomplete follow-ups ordered by due date.

Recommended default:

```text
5
```

Each item displays:

- Customer
- Follow-up title
- Due date
- Status

Overdue follow-ups remain visible because they still require action.

### Quick Actions

Approved actions:

- Add Customer
- Add Interaction
- Create Follow-up

---

## 20. Dashboard States

The dashboard should not become an empty screen simply because one dataset is empty.

### New account

If there are no customers:

- Show a useful onboarding/empty state.
- Provide `Add Customer`.

### No interactions

Only the Recent Interactions section becomes empty.

### No follow-ups

Only the Follow-ups section becomes empty.

### Loading

Show skeletons or contextual loading indicators.

### Error

Show a friendly error message and retry action where appropriate.

---

## 21. UI State Requirements

Every major data operation must account for:

### Loading

Use skeletons or contextual loading indicators.

### Empty

Explain what is missing and what the user can do.

### No Results

Used specifically when a search returns no matching data.

### Validation Error

Show the error at or near the relevant field.

### API Error

Show a friendly human-readable message.

### Saving

Prevent duplicate submissions while a request is being processed.

### Success

Show contextual confirmation.

### Not Found

Used when a requested customer/resource does not exist or is no longer accessible.

---

## 22. Responsive Requirements

The CRM must support:

- Desktop
- Tablet
- Mobile

Forms should become single-column layouts on small screens.

Tables may:

- Become cards
- Scroll horizontally
- Use a responsive alternative

Dialogs may become mobile sheets or full-height dialogs where appropriate.

The product must remain usable without page-level horizontal overflow.

---

## 23. Accessibility

The MVP should support:

- Keyboard navigation
- Visible focus states
- Proper form labels
- Accessible buttons
- Accessible dialog titles
- Screen-reader-friendly error messages
- Adequate contrast
- Status indicators that do not depend solely on color
- Destructive-action confirmation

---

## 24. Security Requirements

The backend must:

- Hash passwords.
- Never return passwords.
- Authenticate protected requests.
- Authorize access to resources.
- Enforce ADMIN/STAFF permissions for the shared company data.
- Validate request payloads.
- Validate resource IDs.
- Protect against unauthorized customer access.
- Store secrets in environment variables.
- Never expose database credentials to the frontend.
- Avoid returning internal stack traces to clients.

The frontend communicates with the API and never directly accesses the production database.

---

## 25. Shared CRM Access

```text
Company CRM
 ├── ADMIN users
 ├── STAFF users
 └── Customers
      ├── Interactions
      └── Follow-ups
```

Every active user accesses the same customer records. Every interaction and
follow-up belongs to one customer. Authorization follows the user's role, not
resource ownership. ADMIN manages staff and performs destructive CRM actions;
STAFF performs non-destructive operational CRM work.

---

## 26. Performance Expectations

The MVP should:

- Avoid unnecessary API requests.
- Return only required dashboard data.
- Support customer search.
- Support pagination on customer lists.
- Avoid loading all historical interactions when only recent records are needed.
- Provide predictable response times under normal small-business usage.

---

## 27. Acceptance Criteria

### Authentication

- User can register with valid credentials.
- Duplicate email registration is rejected.
- User can log in.
- Invalid credentials produce a friendly error.
- Protected routes require authentication.
- User can log out.
- Authentication state behaves consistently according to the selected auth strategy.

### Customers

- User can create a customer.
- Name is required.
- Optional fields are accepted when valid.
- User can search.
- User can view details.
- User can edit.
- User can delete after confirmation.
- Deleted customer is no longer available.
- Unauthorized users cannot access another user's customer.

### Interactions

- Interaction must belong to a customer.
- Type is required.
- Description is required.
- Date is required.
- User can create, edit, and delete interactions.
- New interaction appears after successful creation.

### Follow-ups

- Follow-up must belong to a customer.
- Title is required.
- Due date is required.
- New follow-up defaults to Pending.
- Overdue is system-derived.
- User can complete it.
- Completed follow-up remains Completed.
- User can edit and delete it.

### Dashboard

- Customer count is accurate.
- Follow-up count is accurate.
- Recent interactions are accurate.
- Upcoming follow-ups are accurate.
- Data is shared by active company users.

---


## 28. Definition of Done

The MVP is complete when:

### Authentication
- Registration works.
- Login works.
- Logout works.
- Protected routes work.
- Authentication errors are handled.

### Customers
- Full CRUD works.
- Search works.
- ADMIN/STAFF permissions are enforced.
- Validation works.
- Delete confirmation works.

### Interactions
- Full CRUD works.
- Interaction types are enforced.
- Customer association works.
- ADMIN/STAFF permissions are enforced.

### Follow-ups
- Create/read/update/delete works.
- Complete action works.
- Overdue is automatically derived.
- Dashboard reflects status changes.

### Dashboard
- Customer count is accurate.
- Follow-up count is accurate.
- Recent interactions are accurate.
- Upcoming follow-ups are accurate.

### UX
- Loading states exist.
- Empty states exist.
- No-result states exist.
- Validation states exist.
- Error states exist.
- Success feedback exists.
- Responsive layouts exist.

### Security
- Passwords are hashed.
- Protected resources require authentication.
- User data is isolated.
- Frontend cannot directly access the database.
- Sensitive server information is not exposed.
