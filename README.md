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
