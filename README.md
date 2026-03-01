# Honest Auto

## Project Description

A full-stack, server-side rendered web application for a used car dealership. Visitors can browse vehicle inventory by category, view individual vehicle detail pages, and submit contact inquiries. Registered users can leave reviews on vehicles and submit service requests for their vehicles. Employees and owners have access to management dashboards for handling inventory, reviews, service requests, and contact submissions.

## Tech Stack

- Node.js with Express.js
- EJS for server-side rendering
- PostgreSQL for the database
- Session-based authentication with express-session
- Deployed on Render

## User Roles

**Owner**
The owner has full administrative control over the system. This includes adding, editing, and deleting vehicle categories and inventory, managing employee accounts, viewing all user data, and performing every action available to employees.

**Employee**
Employees can edit vehicle details such as price, description, and availability. They can also moderate and delete inappropriate reviews, view and manage all service requests, update service request statuses (Submitted, In Progress, Completed), add notes to service requests, and view contact form submissions.

**Standard User**
Registered users can leave reviews on vehicles and edit or delete their own reviews. They can also submit service requests for their vehicles and view the status and history of their submitted requests.

## Test Account Credentials

All test accounts use the password: `P@$$w0rd!`

| Role     | Email                        |
|----------|------------------------------|
| Owner    | owner@dealership.com         |
| Employee | employee@dealership.com      |
| User     | user@dealership.com          |

## Repository Structure

```
.
├── controllers/
├── models/
├── views/
│   ├── partials/
│   └── layouts/
├── routes/
├── middleware/
├── public/
│   ├── css/
│   └── images/
├── .env.example
├── server.js
└── README.md
```

## Getting Started

1. Clone the repository
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in your database credentials and session secret
4. Set up your PostgreSQL database and run the provided SQL seed file
5. Run `npm start` to start the development server

## Live Deployment

> Render deployment URL will be added here.
