# University of Kigali — Capstone E-Supervision Portal

A full-stack web platform for capstone/thesis supervision at the **University of Kigali**. It connects **students**, **supervisors**, and **Heads of Department (HOD)** across four departments: **IT**, **Law**, **Business**, and **Education**.

**Backend:** Python (FastAPI) only  
**Frontend:** React + TypeScript + Vite  
**Database:** PostgreSQL (production) or SQLite (quick local dev)

---

## Table of contents

1. [Project structure](#project-structure)
2. [Quick start (local)](#quick-start-local)
3. [PostgreSQL + pgAdmin setup](#postgresql--pgadmin-setup)
4. [Authentication & security](#authentication--security)
5. [Database schema & relationships](#database-schema--relationships)
6. [Environment variables](#environment-variables)
7. [Demo accounts](#demo-accounts)
8. [Features by role](#features-by-role)
9. [API overview](#api-overview)
10. [Free deployment recommendations](#free-deployment-recommendations)
11. [Production checklist](#production-checklist)

---

## Project structure

```
e-supervision/
├── backend/                 # Python FastAPI API
│   ├── app/
│   ├── requirements.txt
│   ├── .env.example
│   └── run.sh
├── database/                # PostgreSQL SQL scripts (no Docker required)
│   ├── 01_create_database.sql
│   ├── schema.sql           # All tables & relationships
│   └── README.md
├── frontend/                # React SPA
├── docker-compose.yml       # Optional — only if you prefer Docker for Postgres
└── README.md
```

> **Note:** The legacy Java/Spring backend has been removed. All API logic lives under `backend/app/`.

---

## Quick start (local — no Docker)

### Prerequisites

- Python 3.11+
- Node.js 18+
- **PostgreSQL 14+** installed on your machine ([download](https://www.postgresql.org/download/))
- **pgAdmin 4** (usually installed with PostgreSQL)

### 1. Install PostgreSQL (Ubuntu / Debian example)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib pgadmin4
```

On Windows or macOS, use the installer from [postgresql.org/download](https://www.postgresql.org/download/) — it includes pgAdmin.

### 2. Create the database (pgAdmin)

**Already created `e_supervision` in pgAdmin?** Skip Docker entirely. Set `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:YOUR_PGADMIN_PASSWORD@localhost:5432/e_supervision
```

Then run `python check_db.py` from `backend/` to verify the connection. See [`database/README.md`](database/README.md).

**Option A — SQL files (recommended for pgAdmin users)**

1. Open **pgAdmin** → connect to your local server (password you chose at install).
2. If needed, run [`database/01_create_e_supervision.sql`](database/01_create_e_supervision.sql) on the `postgres` database.
3. Connect to **`e_supervision`** → Query Tool → run [`database/schema.sql`](database/schema.sql).
4. Refresh **Tables** under `public` — you should see `users`, `projects`, `topic_proposals`, etc.

**Option B — Let the backend create tables automatically**

Create only the empty `e_supervision` database in pgAdmin (if you have not already), set `.env`, then start the backend — SQLAlchemy creates all tables on first run.

> See [`database/README.md`](database/README.md) for full details on the `.sql` files.

### 3. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` — replace `YOUR_PGADMIN_PASSWORD` with your pgAdmin login password:

```env
DATABASE_URL=postgresql://postgres:YOUR_PGADMIN_PASSWORD@localhost:5432/e_supervision
JWT_SECRET=your-long-random-secret-here
```

### 4. Run the backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
chmod +x run.sh
./run.sh
```

API: **http://localhost:8080** · Docs: **http://localhost:8080/docs**

On first startup the app seeds demo users and sample data if the database is empty.

### 5. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

App: **http://localhost:5173**

### Optional: Docker instead of native PostgreSQL

Skip this if you already use pgAdmin — Docker will fail with **port 5432 already in use**.

If you prefer Docker and do not have local PostgreSQL:

```bash
docker compose up -d db
```

Use `DATABASE_URL=postgresql://uok:uok@localhost:5432/uok_esupervision` in `.env`.

### SQLite (not recommended)

SQLite is only for quick offline tests. For your project use PostgreSQL so all users, projects, and proposals live in `e_supervision`:

```env
# Do not use for production or viva demo
DATABASE_URL=sqlite:///./uok.db
```

---

## PostgreSQL + pgAdmin setup

### Connect pgAdmin (native install — no Docker)

| Field    | Value                |
| -------- | -------------------- |
| Host     | `localhost`          |
| Port     | `5432`               |
| Database | `e_supervision`      |
| Username | `postgres` (or your pgAdmin user) |
| Password | Your pgAdmin password |

If you used your own postgres user during install instead of the SQL script, adjust `DATABASE_URL` accordingly (e.g. `postgresql://postgres:YOUR_PASSWORD@localhost:5432/e_supervision`).

### SQL files in this repo

| File | What it does |
| ---- | ------------ |
| [`database/01_create_e_supervision.sql`](database/01_create_e_supervision.sql) | Creates `e_supervision` database |
| [`database/01_create_database.sql`](database/01_create_database.sql) | Creates `uok_esupervision` + `uok` user (Docker/alternative) |
| [`database/schema.sql`](database/schema.sql) | Creates all 9 tables, indexes, comments |

You can run these in pgAdmin **or** let the Python backend create tables automatically — both approaches work.

### Useful pgAdmin actions

| Task | How |
| ---- | --- |
| Create schema from scratch | Run `01_create_e_supervision.sql` then `schema.sql` on `e_supervision` |
| View all students | `SELECT * FROM users WHERE role = 'STUDENT';` |
| Pending proposals | `SELECT * FROM topic_proposals WHERE status = 'PENDING';` |
| Supervisor workload | `SELECT u.full_name, COUNT(p.id) FROM users u LEFT JOIN projects p ON p.supervisor_id = u.id WHERE u.role = 'SUPERVISOR' GROUP BY u.id, u.full_name;` |
| Backup database | Right-click database → **Backup…** |
| Reset demo data | Drop database → re-run SQL files → restart backend |

### Create database manually (terminal, no Docker)

```bash
sudo -u postgres psql -f database/01_create_e_supervision.sql
sudo -u postgres psql -d e_supervision -f database/schema.sql
```

Or interactively:

```sql
CREATE USER uok WITH PASSWORD 'uok';
CREATE DATABASE uok_esupervision OWNER uok;
```

---

## Authentication & security

### How login works

```
Client                    Backend
  │  POST /api/auth/login
  │  { email, password, portal }
  ├──────────────────────────►  Verify credentials
  │                             Issue JWT (HS256)
  │◄──────────────────────────  { token, user }
  │
  │  GET /api/student/dashboard
  │  Authorization: Bearer <token>
  ├──────────────────────────►  Decode JWT → load user → check role
  │◄──────────────────────────  Dashboard JSON
```

| Role        | Login with              | Password (demo)        |
| ----------- | ----------------------- | ---------------------- |
| Student     | Registration number     | Same as reg number, e.g. `202305000078` |
| Supervisor  | `@uok.ac.rw` email      | `Uok@Sup2026!`         |
| HOD         | `@uok.ac.rw` email      | `Uok@Hod2026!`         |

Students and supervisors **cannot self-register**. HODs create student accounts after approving topic proposals.

### Security measures in this codebase

| Layer | Implementation |
| ----- | -------------- |
| Password storage | **bcrypt** hashing (never plain text) |
| Session tokens | **JWT** signed with `JWT_SECRET` (default 24h expiry) |
| Role enforcement | Every protected route checks `STUDENT` / `SUPERVISOR` / `HOD` |
| Staff email policy | Supervisors/HOD must use `@uok.ac.rw` emails |
| Portal separation | Login includes `portal` — student token cannot access supervisor routes |
| File uploads | PDF/Word only; stored outside web root; download requires auth |
| CORS | Restricted to configured frontend origins |
| SQL injection | SQLAlchemy ORM (parameterised queries) |
| Proposal routing | Students only see supervisors in their department with open capacity |

### What you must change for production

1. Set a strong **`JWT_SECRET`** (32+ random characters) — never commit `.env`
2. Use **HTTPS** everywhere (deployment platforms usually provide this)
3. Set **`MAIL_ENABLED=true`** with Gmail SMTP — students receive progress emails on Gmail when supervisors review submissions
4. Restrict **`CORS_ORIGINS`** to your real frontend URL only
5. Use a managed PostgreSQL instance with backups (Neon, Supabase, etc.)
6. Rotate demo passwords before public launch; run `python reseed_db.py` for fresh demo data

---

## Database schema & relationships

### Entity-relationship overview

```mermaid
erDiagram
    users ||--o{ projects : "student_id"
    users ||--o{ projects : "supervisor_id"
    users ||--o{ notifications : "user_id"
    users ||--o{ feedback : "author_id"
    users ||--o{ supervisor_student_requests : "supervisor_id"

    projects ||--o{ tasks : "project_id"
    projects ||--o{ submissions : "project_id"
    projects ||--o{ feedback : "project_id"

    tasks ||--o{ submissions : "task_id"
    submissions ||--o{ feedback : "submission_id"

    users ||--o{ topic_proposals : "supervisor_choice_1"
    users ||--o{ topic_proposals : "supervisor_choice_2"
    users ||--o{ topic_proposals : "assigned_supervisor"
    users ||--o{ topic_proposals : "student_user_id"

    users {
        int id PK
        string email UK
        string registration_number UK
        enum role "STUDENT|SUPERVISOR|HOD"
        string department "IT|LAW|BUSINESS|EDUCATION"
        string password "bcrypt hash"
    }

    projects {
        int id PK
        int student_id FK
        int supervisor_id FK
        enum status
        int progress
    }

    topic_proposals {
        int id PK
        string registration_number
        string department
        enum status "PENDING|APPROVED|REJECTED"
        int supervisor_choice_1_id FK
        int supervisor_choice_2_id FK
        int assigned_supervisor_id FK
        int student_user_id FK
    }
```

### Tables explained

#### `users`
Central account table for students, supervisors, and HODs.

| Column | Purpose |
| ------ | ------- |
| `role` | `STUDENT`, `SUPERVISOR`, or `HOD` |
| `department` | `IT`, `LAW`, `BUSINESS`, or `EDUCATION` — used to route proposals and filter dashboards |
| `registration_number` | Student login ID (unique) |
| `email` | Staff login; also used for student contact |
| `password` | bcrypt hash |

#### `projects`
One capstone project per assigned student.

| Relationship | Meaning |
| ------------ | ------- |
| `student_id → users` | The student owner |
| `supervisor_id → users` | Assigned supervisor |

#### `tasks`
Milestones and work items belonging to a project.

| Relationship | Meaning |
| ------------ | ------- |
| `project_id → projects` | Parent project |

#### `submissions`
Files (PDF/Word) uploaded by students for supervisor review.

| Relationship | Meaning |
| ------------ | ------- |
| `project_id → projects` | Which project |
| `task_id → tasks` | Optional linked milestone |

#### `feedback`
Written supervisor comments on submissions or general project feedback.

| Relationship | Meaning |
| ------------ | ------- |
| `author_id → users` | Supervisor who wrote it |
| `submission_id → submissions` | Optional linked submission |

#### `notifications`
In-app alerts (deadlines, new submissions, proposal updates).

| Relationship | Meaning |
| ------------ | ------- |
| `user_id → users` | Recipient |
| `action_path` | Frontend route when clicked |

#### `topic_proposals`
Public topic applications **before** a student account exists.

| Column | Purpose |
| ------ | ------- |
| `department` | Routes to the correct HOD (`IT`, `LAW`, etc.) |
| `topic_1..3`, `abstract_1..3` | Three proposed topics |
| `supervisor_choice_1/2_id` | Ranked supervisor preferences |
| `status` | `PENDING` → HOD approves or rejects |
| `student_user_id` | Set when HOD approves and creates the portal account |

**Workflow:** Applicant submits → department HOD reviews (similarity vs active projects) → approve creates `users` + `projects` row → student can log in.

#### `supervisor_student_requests`
Supervisors asking their department HOD for an additional student.

| Relationship | Meaning |
| ------------ | ------- |
| `supervisor_id → users` | Requesting supervisor |

### Enum values (stored in PostgreSQL)

| Enum | Values |
| ---- | ------ |
| Role | `STUDENT`, `SUPERVISOR`, `HOD` |
| ProjectStatus | `PROPOSAL`, `IN_PROGRESS`, `UNDER_REVIEW`, `REVISION`, `COMPLETED`, `ON_HOLD` |
| TaskStatus | `UPCOMING`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE` |
| SubmissionStatus | `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `NEEDS_REVISION` |
| ProposalStatus | `PENDING`, `APPROVED`, `REJECTED` |
| NotificationType | `DEADLINE`, `FEEDBACK`, `ASSIGNMENT`, `SYSTEM`, `APPROVAL` |

---

## Environment variables

Copy `backend/.env.example` to `backend/.env`:

| Variable | Description | Example |
| -------- | ----------- | ------- |
| `DATABASE_URL` | SQLAlchemy connection string | `postgresql://postgres:YOUR_PASSWORD@localhost:5432/e_supervision` |
| `JWT_SECRET` | Signs auth tokens | Long random string |
| `JWT_EXPIRATION_HOURS` | Token lifetime | `24` |
| `CORS_ORIGINS` | Allowed frontend URLs | `http://localhost:5173` |
| `MAIL_ENABLED` | Send real emails | `false` (dev) / `true` (prod) |
| `SMTP_*` | Email server settings | Your provider's SMTP |

---

## Demo accounts

Reload anytime: `cd backend && python reseed_db.py`

### Example student
| Registration | Password | Gmail (progress emails) |
| ------------ | -------- | ----------------------- |
| `UOK/2023/05000090` | `Stu@202305000090!` | `aggie.moraa.capstone@gmail.com` |

### Supervisors (password `Uok@Sup2026!`)
| Email |
| ----- |
| `jean.bosco@uok.ac.rw` |
| `sarah.mukandoli@uok.ac.rw` |
| `eric.habimana@uok.ac.rw` |
| `it.nshuti@uok.ac.rw` |
| `finance.uwase@uok.ac.rw` |
| `law.kamanzi@uok.ac.rw` |
| `education.niyonsenga@uok.ac.rw` |

### Heads of Department (password `Uok@Hod2026!`)
| Department | Email |
| ---------- | ----- |
| IT | `hod.it@uok.ac.rw` |
| Law | `hod.law@uok.ac.rw` |
| Business | `hod.business@uok.ac.rw` |
| Education | `hod.education@uok.ac.rw` |

---

## Features by role

### Applicant (public `/apply`)
- Submit registration number, 3 topics, 2 supervisor choices
- Only supervisors with open spots in the same department are shown
- Email notification when approved or rejected

### Student
- Dashboard, tasks, submissions (PDF/Word), feedback, progress tracker

### Supervisor
- Review submissions with countdown reminders
- Request additional students from HOD
- Department-scoped workload

### HOD (per department)
- Topic applicant pipeline with similarity scores vs active projects
- Approve & approve account for student
- Create students manually, assign supervisors
- Department dashboard and analytics

---

## API overview

| Method | Endpoint | Access |
| ------ | -------- | ------ |
| POST | `/api/auth/login` | Public |
| GET | `/api/public/programs` | Public |
| GET | `/api/public/supervisors?department=IT` | Public |
| POST | `/api/public/topic-proposals` | Public |
| GET | `/api/student/*` | Student |
| GET | `/api/supervisor/*` | Supervisor |
| GET | `/api/hod/*` | HOD |
| GET | `/api/docs` | Swagger UI |

Full docs: **http://localhost:8080/docs**

---

## Free deployment recommendations

A typical split: **frontend on a static host**, **backend on a Python host**, **PostgreSQL on a free DB tier**.

### Recommended stack (easiest free tier)

| Layer | Service | Free tier notes |
| ----- | ------- | --------------- |
| **Frontend** | [Vercel](https://vercel.com) or [Netlify](https://netlify.com) | Deploy `frontend/` build; set env `VITE_API_URL=https://your-api.onrender.com/api` |
| **Backend** | [Render](https://render.com) | Free web service; sleeps after inactivity (cold starts) |
| **Database** | [Neon](https://neon.tech) or [Supabase](https://supabase.com) | Free PostgreSQL; copy connection string to Render env |

### Alternative options

| Service | Good for | Limitation |
| ------- | -------- | ---------- |
| **Railway** | Backend + Postgres in one project | Limited free credits/month |
| **Fly.io** | Backend close to users | Requires `fly.toml` setup |
| **PythonAnywhere** | Simple Python hosting | Free tier has restricted outbound HTTP |
| **Cloudflare Pages** | Frontend CDN | Pair with Render/Railway for API |

### Deployment steps (Render + Neon + Vercel example)

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the full step-by-step guide.

### Why not one free host for everything?

- React needs a static/CDN host for fast global delivery
- FastAPI needs a always-on or on-demand Python runtime
- PostgreSQL needs persistent storage — SQLite on Render resets on redeploy

---

## Production checklist

- [ ] PostgreSQL on Neon/Supabase (not SQLite)
- [ ] Strong `JWT_SECRET` in host environment variables
- [ ] `CORS_ORIGINS` set to production frontend URL only
- [ ] HTTPS enabled (automatic on Vercel/Render)
- [ ] SMTP configured for proposal emails
- [ ] Remove or disable demo seed in production (empty DB + manual admin setup)
- [ ] Regular pgAdmin or provider backups
- [ ] Persistent storage for uploaded submission files

---

## Health check

```bash
curl http://localhost:8080/api/health
# {"status":"UP","service":"uok-esupervision"}
```

---

## Licence

University of Kigali — academic project use.
