## Honest Auto – Implementation Plan

**Due date**: March 28, 2026  
**Final commit deadline**: March 27, 2026  
**Deployment**: Render (auto-deploy on commit)

---

## Commit Schedule Overview

- **2 commits on today (Sat, Mar 14)**.
- Remaining commits **Mon–Fri only**, with **4 commits per week**.
- **Final (10th) commit on Fri, Mar 27**.

### Planned Commits (10) 
(8 commits were present at the time of drafting this plan, although some of them are smaller)


| #   | Date        | Title                                                        |
| --- | ----------- | ------------------------------------------------------------ |
| 1   | Sat, Mar 14 | Replace placeholder home route with basic layout + nav       |
| 2   | Sat, Mar 14 | Core routing skeleton and view structure wired to DB         |
| 3   | Mon, Mar 16 | Database models and queries for vehicles, categories, images |
| 4   | Wed, Mar 18 | Public-facing pages: home, browse, vehicle detail, contact   |
| 5   | Thu, Mar 19 | Authentication, roles, and session configuration             |
| 6   | Fri, Mar 20 | Reviews feature (CRUD for users, moderation hooks)           |
| 7   | Mon, Mar 23 | Service request workflow (multi-stage)                       |
| 8   | Wed, Mar 25 | Employee and owner dashboards (inventory, requests, contact) |
| 9   | Thu, Mar 26 | Security, validation, global error handling, UX polish       |
| 10  | Fri, Mar 27 | Final deployment, docs, ERD, and cleanup                     |

---

## Per-Commit Details

### Commit 1 – Sat, Mar 14

**Title**: Replace placeholder home route with basic layout + nav  
**Goal**: Remove the temporary `/` test route and establish the real home page entry point.

- Replace the current placeholder `/` route with a proper controller or route handler that renders a home view.
- Implement base `main` layout and shared partials (`header`, `nav`, `footer`, flash messages) driven by EJS.
- Ensure navigation includes links for browsing vehicles, logging in/registering, dashboards (to be enabled later), and contact.
- Connect layout to static assets in `public/` (CSS, images, basic branding).

**Requirements touched**: Server-side rendering, layouts/partials, routing foundations.

---

### Commit 2 – Sat, Mar 14

**Title**: Core routing skeleton and view structure wired to DB  
**Goal**: Set up core route files, controllers, and a clean MVC structure using my existing file scaffolding.

- Define top-level route modules (e.g., `home`, `auth`, `vehicles`, `reviews`, `serviceRequests`, `contact`, `dashboard`).
- Create controller stubs that will later be filled out with real logic; ensure ESM (`import`/`export`) is used everywhere.
- Confirm DB connection reuse pattern (e.g., centralized `db` module) and test simple queries against the database in one or two routes.
- Add a basic global error handler and 404 page view to capture routing errors early.

**Requirements touched**: MVC organization, routing, global error handler, PostgreSQL connectivity.

---

### Commit 3 – Mon, Mar 16

**Title**: Database models and queries for vehicles, categories, images  
**Goal**: Implement data-access layer for vehicle browsing and category relationships.

- Implement model/query modules for:
  - Categories (including vehicle relationship).
  - Vehicles (including category and image relationships).
  - Vehicle images (one-to-many with vehicles).
- Add parameterized queries for common operations:
  - List categories.
  - List vehicles (optionally by category).
  - Get vehicle by ID with category and images.
- Ensure foreign keys and cascade behavior match the ERD design.

**Requirements touched**: Database design and relationships, SQL injection prevention (parameterized queries).

---

### Commit 4 – Wed, Mar 18

**Title**: Public-facing pages: home, browse, vehicle detail, contact  
**Goal**: Build all public pages that do not require authentication and hook them to real data.

- Implement:
  - Home page showing featured vehicles (e.g., recent or by flag).
  - Browse-by-category pages (`/vehicles`, `/vehicles/category/:id`).
  - Vehicle detail pages (`/vehicles/:id`) with images, specs, price, and reviews placeholder section.
  - Contact form view and POST handler that saves contact messages to the `contact messages` table.
- Add basic server-side validation for contact form fields and success/error flash messaging.

**Requirements touched**: Public pages, dynamic routing, dynamic content management, contact messages table.

---

### Commit 5 – Thu, Mar 19

**Title**: Authentication, roles, and session configuration  
**Goal**: Implement secure session-based authentication and user roles.

- Create user model with role field (Owner, Employee, Standard User).
- Implement registration and login forms, using bcrypt (or similar) for password hashing.
- Configure `express-session` using `SESSION_SECRET` and secure defaults (cookie options differ for dev vs prod).
- Implement middleware for:
  - `requireAuth` (logged-in users only).
  - `requireRole` (Owner/Employee/Standard access control).
- Wire up login/logout routes and ensure protected routes redirect properly when unauthenticated.

**Requirements touched**: Authentication, authorization, secure sessions, user roles.

---

### Commit 6 – Fri, Mar 20

**Title**: Reviews feature (CRUD for users, moderation hooks)  
**Goal**: Allow users to leave, edit, delete their own vehicle reviews; prepare moderation by staff.

- Implement reviews table model/queries (linked to users and vehicles).
- Add UI and routes for:
  - Creating a review on a vehicle detail page (logged-in users only).
  - Editing and deleting a user’s own reviews.
- Display reviews on vehicle detail pages (with user attribution).
- Provide simple moderation capabilities hooks for employees/owners (e.g., delete button visible to staff).
- Add validation (non-empty content, rating ranges) and sanitization for review input.

**Requirements touched**: User interaction system (reviews), dynamic content management, role-based moderation.

---

### Commit 7 – Mon, Mar 23

**Title**: Service request workflow (multi-stage)  
**Goal**: Implement the multi-stage service request system for logged-in users.

- Implement service requests model/queries linked to users (and optionally vehicles).
- Define status workflow (Submitted → In Progress → Completed) in code and database.
- Add routes and views for:
  - Creating a service request (with validation).
  - Viewing a user’s own service request history and current status.
- Ensure status changes are logged with timestamps/notes where appropriate.

**Requirements touched**: Multi-stage workflow, user interaction system, service requests table.

---

### Commit 8 – Wed, Mar 25

**Title**: Employee and owner dashboards (inventory, requests, contact)  
**Goal**: Deliver the management interfaces for employees and owners.

- Implement dashboard routes and views:
  - Employee dashboard: manage vehicles (edit price/description/availability), moderate/delete reviews, manage service requests (update statuses, add notes), view contact messages.
  - Owner dashboard: everything employees can do plus category and vehicle CRUD and optional employee account management.
- Add filtering and simple sorting where helpful (e.g., open service requests first).
- Ensure all dashboard routes are fully protected by appropriate role middleware.

**Requirements touched**: Admin dashboard, dynamic content management, role-based authorization.

---

### Commit 9 – Thu, Mar 26

**Title**: Security, validation, global error handling, UX polish  
**Goal**: Harden the app and refine the user experience.

- Review all forms and inputs for:
  - Validation (server-side).
  - Sanitization where necessary.
  - Meaningful error messages that do not leak system details.
- Audit all queries to ensure parameterized usage, avoiding SQL injection risks.
- Refine the global error handler and 404 handling.
- Improve UX: consistent flash messages, error states, loading/empty states, and basic responsive layout tweaks.

**Requirements touched**: Security and validation, error handling, production-readiness.

---

### Commit 10 – Fri, Mar 27

**Title**: Final deployment, docs, ERD, and cleanup  
**Goal**: Ensure the project meets all submission requirements and is production-ready.

- Verify Render deployment:
  - App is reachable.
  - DB is connected with production `DB_URL`.
  - Sessions and protected routes function correctly.
- Seed or verify test accounts for each role (Owner, Employee, Standard User) using the shared password.
- Finalize `README.md`:
  - Project description updated.
  - ERD image exported from pgAdmin and linked.
  - User roles clearly described.
  - Test accounts table complete.
  - Known limitations documented.
- Clean up any unused files, `console.log` statements, and ensure consistent formatting.

**Requirements touched**: Deployment, documentation, meaningful commit history, project polish.

