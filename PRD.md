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

# Small Business CRM

> Backend setup, environment variables, tests and current implementation details: [apps/api/README.md](apps/api/README.md). The authoritative endpoint reference is [API_CONTRACT.md](API_CONTRACT.md), using `/api/v1`. Older planning examples below are superseded by that contract. The monorepo workspaces remain `apps/api` and `apps/frontend`.

A simple and user-friendly **Customer Relationship Management (CRM)** system designed to help small businesses organize, manage, and maintain their customer relationships from one centralized platform.

Instead of keeping customer information across notebooks, spreadsheets, phone contacts, WhatsApp messages, and other places, the CRM provides one system for managing **customers, interactions, and follow-ups**.

---

## 📌 Project Overview

The Small Business CRM is an MVP web application built for small business owners, sales representatives, customer service staff, and small business teams.

The system allows users to:

* Register and log in securely
* Add and manage customers
* Search for customers
* View customer information
* Record customer interactions
* Manage follow-ups
* Track upcoming and overdue follow-ups
* View customer interaction history
* Monitor important customer information from a dashboard

The goal is to create a practical CRM that is simple enough for a small business to use while still following the structure of a real-world software product.

---

## 🎯 Problem Statement

Many small businesses manage customer information using different tools such as:

* Notebooks
* Excel spreadsheets
* Phone contacts
* WhatsApp
* Emails
* Personal notes
* Paper records

This can make it difficult to:

* Find customer information quickly
* Remember previous conversations
* Track customer interactions
* Remember follow-up dates
* Know which customers need attention
* Maintain organized customer records

### Our Solution

The CRM brings these activities into one centralized system where business users can manage customers, interactions, and follow-ups more efficiently.

---

## 👥 Target Users

The CRM is designed primarily for business-side users such as:

* Small business owners
* Sales representatives
* Customer service staff
* Business administrators
* Small business teams

> Customers themselves do not need to create accounts for the MVP. They are stored as customer records managed by authorized business users.

---

# 🚀 MVP Features

## 1. Authentication

Users can:

* Register an account
* Log in
* Log out
* Access protected areas of the application
* Maintain an authenticated session

Authentication should include appropriate security measures such as password hashing and token-based authentication.

---

## 2. Customer Management

Users can:

* Add customers
* View customers
* Search customers
* View customer details
* Edit customer information
* Delete customers

Customer information may include:

* Name
* Email
* Phone number
* Company
* Status
* Notes
* Date created

---

## 3. Customer Interactions

Users can record and manage interactions with customers.

Examples include:

* Phone calls
* Emails
* Meetings
* Messages
* Notes

Users can:

* Add interactions
* View interaction history
* Edit interactions
* Delete interactions

Each interaction is associated with a specific customer.

---

## 4. Follow-Ups

Users can create follow-up tasks for customers.

Follow-ups include:

* Title
* Description
* Due date
* Status

Follow-up statuses include:

* Pending
* Completed
* Overdue

Users can:

* Create follow-ups
* View follow-ups
* Edit follow-ups
* Delete follow-ups
* Track upcoming follow-ups
* Identify overdue follow-ups

---

## 5. Dashboard

The dashboard gives users a quick overview of their CRM activities.

It can display:

* Total customers
* Pending follow-ups
* Upcoming follow-ups
* Recent interactions
* Quick actions

The dashboard is designed to help users understand what requires their attention without searching through the entire system.

---

# 🖥️ Frontend Pages

The MVP frontend contains five main pages.

### 1. Home / Landing Page

Introduces the CRM and explains:

* What the system does
* The problem it solves
* Main features
* Benefits of using the CRM

Includes a call-to-action that leads users to authentication.

---

### 2. Authentication Page

Contains:

* Login
* Registration

The page also displays friendly validation and error messages.

Examples:

> Incorrect email or password.

> Please enter a valid email address.

> Something went wrong. Please try again.

---

### 3. Dashboard

Displays important CRM information such as:

* Customer count
* Pending follow-ups
* Recent interactions
* Upcoming follow-ups
* Quick actions

---

### 4. Customers Page

Allows users to manage their customer records.

Features include:

* Customer list
* Search
* Add customer
* Edit customer
* Delete customer
* View customer details

---

### 5. Customer Details Page

Displays information about a specific customer.

The page contains:

### Customer Information

* Name
* Email
* Phone
* Company
* Status
* Notes

### Interaction History

Shows previous interactions with the customer.

### Follow-Ups

Shows pending, completed, and overdue follow-ups.

Interaction and follow-up forms can be displayed through modals, tabs, or sections instead of creating additional pages.

---

# 🔄 User Flow

```text
HOME
  │
  ▼
AUTHENTICATION
  │
  ▼
DASHBOARD
  │
  ▼
CUSTOMERS
  │
  ▼
CUSTOMER DETAILS
  │
  ├──► INTERACTIONS
  │
  └──► FOLLOW-UPS
```

---

# 🏗️ System Architecture

The application follows a frontend/backend architecture.

```text
┌──────────────────────┐
│       User           │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   React Frontend     │
└──────────┬───────────┘
           │
           │ HTTP Requests
           ▼
┌──────────────────────┐
│     Backend API      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│      Database        │
└──────────────────────┘
```

The frontend communicates with the backend through API endpoints.

The frontend should **not** communicate directly with the database.

---

# 🔌 API Endpoints

## Authentication

| Method | Endpoint             | Description         |
| ------ | -------------------- | ------------------- |
| POST   | `/api/auth/register` | Register a new user |
| POST   | `/api/auth/login`    | Log in a user       |
| POST   | `/api/auth/logout`   | Log out             |
| GET    | `/api/auth/me`       | Get current user    |

---

## Customers

| Method | Endpoint             | Description          |
| ------ | -------------------- | -------------------- |
| POST   | `/api/customers`     | Create customer      |
| GET    | `/api/customers`     | Get customers        |
| GET    | `/api/customers/:id` | Get customer details |
| PATCH  | `/api/customers/:id` | Update customer      |
| DELETE | `/api/customers/:id` | Delete customer      |

---

## Interactions

| Method | Endpoint                                  | Description               |
| ------ | ----------------------------------------- | ------------------------- |
| GET    | `/api/customers/:customerId/interactions` | Get customer interactions |
| POST   | `/api/customers/:customerId/interactions` | Create interaction        |
| GET    | `/api/interactions/:id`                   | Get interaction           |
| PATCH  | `/api/interactions/:id`                   | Update interaction        |
| DELETE | `/api/interactions/:id`                   | Delete interaction        |

---

## Follow-Ups

| Method | Endpoint             | Description      |
| ------ | -------------------- | ---------------- |
| GET    | `/api/followups`     | Get follow-ups   |
| GET    | `/api/followups/:id` | Get follow-up    |
| POST   | `/api/followups`     | Create follow-up |
| PATCH  | `/api/followups/:id` | Update follow-up |
| DELETE | `/api/followups/:id` | Delete follow-up |

---

# 🗄️ Database Structure

## User

```text
id
name
email
password
createdAt
```

## Customer

```text
id
userId
name
email
phone
company
status
notes
createdAt
```

## Interaction

```text
id
customerId
userId
type
description
interactionDate
createdAt
```

## Follow-Up

```text
id
customerId
userId
title
description
dueDate
status
createdAt
```

---

# 📁 Project Structure

```text
small-business-crm/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Auth.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Customers.jsx
│   │   │   └── CustomerDetails.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── CustomerForm.jsx
│   │   │   ├── InteractionForm.jsx
│   │   │   └── FollowUpForm.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── .env
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── config/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── package.json
│   └── .env
│
├── docs/
│   └── API.md
│
├── .gitignore
└── README.md
```

---

# ⚙️ Technologies

### Frontend

* React
* JavaScript
* HTML
* CSS
* React Router
* Axios or Fetch API

### Backend

* Node.js
* Express.js

### Database

The database technology will be selected by the team based on the project requirements.

### Development & Deployment

* Git
* GitHub
* Vercel
* Render

---

# 🔐 Security

The application should follow basic security practices.

These include:

* Password hashing
* Authentication tokens
* Protected routes
* Authorization
* Input validation
* Environment variables
* Secure API requests
* Proper error handling
* Never returning passwords in API responses

Sensitive information such as:

```text
.env
API keys
Database credentials
JWT secrets
Passwords
```

must not be committed to GitHub.

---

# ⚠️ Error Handling

The application should provide user-friendly error messages instead of displaying raw backend or Axios errors.

### Example

Instead of:

```text
AxiosError: Request failed with status code 500
```

Display:

```text
Something went wrong while loading customers.
Please try again.
```

Other examples:

```text
Please enter the customer's name.

Incorrect email or password.

Customer could not be deleted. Please try again.

Unable to connect to the server.
Please check your internet connection.
```

---

# ⏳ Loading States

The application should clearly communicate when an operation is taking place.

Examples:

```text
Loading customers...

Saving customer...

Deleting customer...

Loading customer details...

Creating follow-up...
```

This prevents users from wondering whether the application is working.

---

# 🤝 GitHub Collaboration

The project uses a feature-branch workflow.

```text
main
 │
 └── develop
      │
      ├── feature/auth
      ├── feature/dashboard
      ├── feature/customers
      ├── feature/interactions
      └── feature/followups
```

### Development Rules

1. Do not push directly to `main`.
2. Create a feature branch before starting work.
3. Pull the latest changes from `develop`.
4. Make your changes.
5. Commit your work with a clear commit message.
6. Push your feature branch.
7. Create a Pull Request.
8. Have another team member review the changes.
9. Merge approved work into `develop`.
10. Test the integrated application.
11. Merge the stable version into `main`.

### Example

```bash
git checkout develop
git pull origin develop
git checkout -b feature/customers
```

After completing the work:

```bash
git add .
git commit -m "feat: add customer management"
git push origin feature/customers
```

Then create:

```text
feature/customers → develop
```

---

# 🧩 API Contract

The frontend and backend teams should agree on the API contract before integration.

The contract defines:

* Endpoint names
* HTTP methods
* Request data
* Response data
* Authentication requirements
* Error responses
* Status codes

Example successful response:

```json
{
  "success": true,
  "message": "Customer created successfully",
  "data": {}
}
```

Example error response:

```json
{
  "success": false,
  "message": "Customer not found",
  "data": null
}
```

This allows the frontend and backend teams to work independently while still knowing how their systems will communicate.

---

# 🎨 UI/UX

The application's UI/UX has been designed in **Figma** before development.

The Figma design serves as the visual reference for:

* Layout
* Navigation
* Components
* Forms
* Buttons
* Colors
* Typography
* User flow
* Responsive behavior

Once development begins, the Figma design should remain the primary visual reference rather than continuously redesigning the interface during development.

---

# 🚫 MVP Scope

The project focuses on delivering a functional MVP.

The following features are intentionally outside the initial scope unless the team later decides they are necessary:

* AI recommendations
* Advanced analytics
* Blockchain
* Complex payment systems
* Mobile applications
* Excessive automation
* Unnecessary enterprise-level features

The goal is to build a **small but complete and realistic CRM product**.

---

# 🧪 Testing

The team should test:

### Authentication

* Registration
* Login
* Logout
* Invalid credentials
* Protected routes

### Customers

* Create customer
* View customers
* Search customer
* Update customer
* Delete customer

### Interactions

* Create interaction
* View interaction history
* Update interaction
* Delete interaction

### Follow-Ups

* Create follow-up
* Update follow-up
* Complete follow-up
* Delete follow-up
* Identify overdue follow-ups

### General

* Loading states
* Error states
* Empty states
* API failures
* Responsive layout

---

# 🚀 Development Workflow

The overall development process is:

```text
DEFINE PROBLEM
      ↓
DEFINE USERS
      ↓
DEFINE MVP
      ↓
DATABASE DESIGN
      ↓
API CONTRACT
      ↓
FIGMA DESIGN
      ↓
GITHUB SETUP
      ↓
BACKEND DEVELOPMENT
      ↓
FRONTEND DEVELOPMENT
      ↓
INTEGRATION
      ↓
TESTING
      ↓
BUG FIXING
      ↓
DEPLOYMENT
```

---

# 📦 Installation

Clone the repository:

```bash
git clone <repository-url>
```

Move into the project:

```bash
cd small-business-crm
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

Open another terminal:

```bash
cd backend
npm install
npm run dev
```

---

# 🔑 Environment Variables

Create a `.env` file inside the appropriate project directory.

Example:

```env
PORT=5000
DATABASE_URL=your_database_url
JWT_SECRET=your_secret_key
```

Do not commit `.env` files to GitHub.

---

# 📈 Future Improvements

Possible future improvements may include:

* Advanced customer analytics
* Email integration
* Calendar integration
* Automated reminders
* Customer segmentation
* Exportable reports
* Role-based team permissions
* Notifications
* Mobile application

These features are not required for the initial MVP.

---

# 👨‍💻 Team

This project is developed as a collaborative team capstone project.

Team members are responsible for different parts of:

* UI/UX
* Frontend development
* Backend development
* Database
* API development
* Testing
* Documentation
* Deployment

All contributions are managed through GitHub feature branches and Pull Requests.

---

# 📄 License

This project is developed for educational and portfolio purposes.

---

## ⭐ Project Goal

The goal of the Small Business CRM is simple:

> **Help small businesses organize their customers, interactions, and follow-ups in one place.**

Build small. Build clearly. Build something that works.
