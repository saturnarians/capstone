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
