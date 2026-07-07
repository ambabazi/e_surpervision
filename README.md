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
| Student     | 12-digit registration number | Same as reg number, e.g. `202305000078` |
| Supervisor  | `@uok.ac.rw` email      | `Password@123`         |
| HOD         | `@uok.ac.rw` email      | `Password@123`         |

Students and supervisors **cannot self-register**. HODs create student accounts after approving topic proposals.

### Security measures in this codebase

| Layer | Implementation |
| ----- | -------------- |
| Password storage | **bcrypt** hashing (never plain text) |
| Session tokens | **JWT** signed with `JWT_SECRET` (default **48h** expiry) |
| Role enforcement | Every protected route checks `STUDENT` / `SUPERVISOR` / `HOD` |
| Staff email policy | Supervisors/HOD must use `@uok.ac.rw` emails |
| Portal separation | Login includes `portal` — student token cannot access supervisor routes |
| File uploads | PDF/Word only; stored in `backend/uploads/`; download requires auth and supervisor/student ownership |
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

Full table definitions, column lists, enums, ERD, FK map, and API flows: **[DATABASE.md](DATABASE.md)**  
SQL setup (pgAdmin, Neon, reseed): **[database/README.md](database/README.md)**

The application uses **8 PostgreSQL tables**: `users`, `projects`, `tasks`, `submissions`, `feedback`, `notifications`, `topic_proposals`, `supervisor_student_requests`.

Quick overview:

```mermaid
erDiagram
    users ||--o{ projects : supervises_or_owns
    projects ||--o{ submissions : contains
    projects ||--o{ tasks : contains
    users ||--o{ topic_proposals : applies
```

**Submission rules:** students upload between **08:00–17:00** (Rwanda time). Supervisors see pending reviews sorted by **submission hour** — morning uploads appear before afternoon ones.

---

## Environment variables

Copy `backend/.env.example` to `backend/.env`:

| Variable | Description | Example |
| -------- | ----------- | ------- |
| `DATABASE_URL` | SQLAlchemy connection string | `postgresql://postgres:YOUR_PASSWORD@localhost:5432/e_supervision` |
| `JWT_SECRET` | Signs auth tokens | Long random string |
| `JWT_EXPIRATION_HOURS` | Token lifetime | `48` |
| `CORS_ORIGINS` | Allowed frontend URLs (no path) | `http://localhost:5173` |
| `SUBMISSION_WINDOW_ENABLED` | Enforce 08:00–17:00 upload window | `true` |
| `SUBMISSION_TIMEZONE` | Window timezone | `Africa/Kigali` |
| `SUBMISSION_WINDOW_START_HOUR` | First allowed hour | `8` |
| `SUBMISSION_WINDOW_END_HOUR` | Last allowed hour (exclusive) | `17` |
| `MAIL_ENABLED` | Send real emails | `false` (dev) / `true` (prod) |
| `SMTP_*` | Email server settings | Your provider's SMTP |

---

## Demo accounts

Reload anytime:

```bash
cd backend && python reseed_db.py
```

### Featured student
| Registration | Password | Notes |
| ------------ | -------- | ----- |
| `202305000078` | `202305000078` | Aggie Moraa — IT, supervisor Dr. Jean Bosco |

### Unassigned students (HOD assign testing)
| Registration | Password | Department |
| ------------ | -------- | ---------- |
| `202205000210` | `202205000210` | IT — Aline Uwimana |
| `202205000215` | `202205000215` | IT — Kevin Mugisha |

### Supervisors (password `Password@123`)
| Email | Department |
| ----- | ---------- |
| `jean.bosco@uok.ac.rw` | IT |
| `sarah.mukandoli@uok.ac.rw` | IT |
| `eric.habimana@uok.ac.rw` | IT |
| `it.nshuti@uok.ac.rw` | IT |
| `finance.uwase@uok.ac.rw` | Business |
| `business.mugisha@uok.ac.rw` | Business |
| `law.kamanzi@uok.ac.rw` | Law |
| `law.uwase@uok.ac.rw` | Law |
| `education.niyonsenga@uok.ac.rw` | Education |
| `education.mutoni@uok.ac.rw` | Education |

### Heads of Department (password `Password@123`)
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
- Dashboard, tasks, submissions (PDF/Word, **08:00–17:00 window**), feedback, progress tracker

### Supervisor
- **Open student documents** from the reviews page (authenticated download)
- Review queue sorted by **submission hour** (morning before afternoon)
- **7-day review countdown** on dashboard for each pending submission
- Request additional students from HOD

### HOD (per department)
- Topic applicant pipeline with similarity scores vs active projects
- Approve proposal → creates student account + project
- **Assign supervisor immediately** to unassigned students (`/hod/students`)
- Create students manually
- Department dashboard and analytics

---

## API overview

| Method | Endpoint | Access |
| ------ | -------- | ------ |
| POST | `/api/auth/login` | Public |
| GET | `/api/public/programs` | Public |
| GET | `/api/public/supervisors?department=IT` | Public |
| POST | `/api/public/topic-proposals` | Public |
| GET | `/api/public/submission-window` | Public |
| POST | `/api/hod/students/{id}/assign-supervisor` | HOD |
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
