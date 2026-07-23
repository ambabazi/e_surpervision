# University of Kigali — Capstone E-Supervision Portal

A full-stack web platform for capstone/thesis supervision at the **University of Kigali**. It connects **students**, **supervisors**, and **Heads of Department (HOD)** across four departments: **IT**, **Law**, **Business**, and **Education**.

**Backend:** Python (FastAPI) only  
**Frontend:** React + TypeScript + Vite  
**Database:** PostgreSQL (production) or SQLite (quick local dev)

---

## Table of contents

1. [Project structure](#project-structure)
2. [Local setup by operating system](#local-setup-by-operating-system)
3. [Application users & portals](#application-users--portals)
4. [PostgreSQL + pgAdmin setup](#postgresql--pgadmin-setup)
5. [Authentication & security](#authentication--security)
6. [Database schema & relationships](#database-schema--relationships)
7. [Environment variables](#environment-variables)
8. [Demo accounts](#demo-accounts)
9. [Features by role](#features-by-role)
10. [API overview](#api-overview)
11. [Free deployment recommendations](#free-deployment-recommendations)
12. [Production checklist](#production-checklist)

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

## Local setup by operating system

Use these steps to run the full stack locally on **Windows**, **Linux**, or **macOS**. You need:

| Tool | Version | Purpose |
| ---- | ------- | ------- |
| Python | 3.11+ | FastAPI backend |
| Node.js | 18+ | React frontend |
| PostgreSQL | 14+ | Database (`e_supervision`) |
| pgAdmin 4 | optional | GUI for PostgreSQL |

Clone the repo once, then follow your OS section below.

```bash
git clone https://github.com/ambabazi/e_surpervision.git
cd e_surpervision
```

---

### Windows

#### 1. Install prerequisites

1. **Python 3.11+** — [python.org/downloads](https://www.python.org/downloads/)  
   During install, check **“Add python.exe to PATH”**.
2. **Node.js 18+** — [nodejs.org](https://nodejs.org/)
3. **PostgreSQL 14+** — [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)  
   The installer includes **pgAdmin 4**. Remember the **postgres** superuser password you set.

Open **PowerShell** or **Command Prompt** for the commands below.

#### 2. Create the database

**Option A — pgAdmin (recommended)**

1. Open **pgAdmin** → Servers → PostgreSQL → connect with your install password.
2. Right-click **Databases** → **Query Tool** on `postgres` → run [`database/01_create_e_supervision.sql`](database/01_create_e_supervision.sql).
3. Connect to **`e_supervision`** → Query Tool → run [`database/schema.sql`](database/schema.sql).

**Option B — SQL Shell (psql)**

```powershell
psql -U postgres -f database\01_create_e_supervision.sql
psql -U postgres -d e_supervision -f database\schema.sql
```

#### 3. Configure the backend

```powershell
cd backend
copy .env.example .env
```

Edit `backend\.env`. Use the **postgres** user and the password from installation:

```env
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=YOUR_WINDOWS_POSTGRES_PASSWORD
PGDATABASE=e_supervision
JWT_SECRET=your-long-random-secret-here
CORS_ORIGINS=http://localhost:5173
```

If your password contains `@` or `#`, use the split `PG*` variables above (do not put a raw `@` inside `DATABASE_URL`).

Test the connection:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python check_db.py
```

#### 4. Run the backend

```powershell
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

API: **http://localhost:8080** · Docs: **http://localhost:8080/docs**

> `run.sh` is for Linux/macOS. On Windows, use the `uvicorn` command above (or Git Bash/WSL if you prefer `./run.sh`).

#### 5. Run the frontend

Open a **second** terminal:

```powershell
cd frontend
npm install
npm run dev
```

App: **http://localhost:5173**

---

### Linux (Ubuntu / Debian)

#### 1. Install prerequisites


```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nodejs npm postgresql postgresql-contrib
```

Install **pgAdmin** if you want a GUI: `sudo apt install pgadmin4` or use the [pgAdmin installer](https://www.pgadmin.org/download/).

Set a password for the Linux **postgres** system user if needed:

```bash
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your_password';"
```

#### 2. Create the database

**Option A — terminal**

```bash
sudo -u postgres psql -f database/01_create_e_supervision.sql
sudo -u postgres psql -d e_supervision -f database/schema.sql
```

**Option B — pgAdmin** — same steps as the Windows pgAdmin section.

**Option C — automatic tables** — create only the empty `e_supervision` database, configure `.env`, start the backend once; SQLAlchemy creates tables.

#### 3. Configure the backend

```bash
cd backend
cp .env.example .env
```

```env
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=e_supervision
JWT_SECRET=your-long-random-secret-here
CORS_ORIGINS=http://localhost:5173
```

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python check_db.py
```

#### 4. Run the backend

```bash
chmod +x run.sh
./run.sh
```

#### 5. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

---

### macOS

#### 1. Install prerequisites

**Homebrew** (recommended):

```bash
brew install python@3.11 node postgresql@16
brew services start postgresql@16
```

Add PostgreSQL to your PATH if needed (Homebrew prints the exact command after install).

Download **pgAdmin** from [pgadmin.org/download](https://www.pgadmin.org/download/) if you want a GUI.

#### 2. Create the database

**Option A — terminal**

```bash
createdb e_supervision   # if empty DB is enough; tables via backend or schema.sql
psql -d e_supervision -f database/schema.sql
```

Or use the SQL script on the default cluster:

```bash
psql postgres -f database/01_create_e_supervision.sql
psql -d e_supervision -f database/schema.sql
```

**Option B — pgAdmin** — same as Windows.

On Apple Silicon, your PostgreSQL user is often your **macOS login name**, not `postgres`. Check with:

```bash
whoami
psql -l
```

If `psql` connects without `-U postgres`, set in `.env`:

```env
PGUSER=your_mac_username
PGPASSWORD=
PGDATABASE=e_supervision
```

(Leave `PGPASSWORD` empty if local trust auth is enabled.)

#### 3. Configure the backend

```bash
cd backend
cp .env.example .env
# Edit .env — PGUSER may be your Mac username, not postgres
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python check_db.py
```

#### 4. Run the backend

```bash
chmod +x run.sh
./run.sh
```

#### 5. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

---

### After first startup (all platforms)

- Backend seeds **demo users** if the database is empty.
- Reload demo data anytime: `cd backend && python reseed_db.py` (with venv active).
- Health check: `curl http://localhost:8080/api/health`

### Optional: Docker instead of native PostgreSQL

Skip if port **5432** is already in use by local PostgreSQL.

```bash
docker compose up -d db
```

Use in `backend/.env`:

```env
DATABASE_URL=postgresql://uok:uok@localhost:5432/uok_esupervision
```

This uses the **`uok`** database user from [`database/01_create_database.sql`](database/01_create_database.sql) (legacy Docker setup).

### SQLite (not recommended)

Only for quick offline tests — not for viva or production:

```env
DATABASE_URL=sqlite:///./uok.db
```

---

## Application users & portals

The system has **three login portals**. Each user type signs in on a different screen at **http://localhost:5173**.

| Portal | Who | Login field | Demo password | URL path |
| ------ | --- | ----------- | ------------- | -------- |
| **Student** | Enrolled capstone students | 12-digit registration number | Same as reg number (e.g. `202305000078`) | `/login` → Student |
| **Supervisor** | Department lecturers | `@uok.ac.rw` email | `Password@123` | `/login` → Supervisor |
| **HOD** | Head of Department | `@uok.ac.rw` email | `Password@123` | `/login` → HOD |

**Public (no login):** anyone can submit a topic at **`/apply`**. After HOD approval, a student account is created.

Students and supervisors **cannot self-register**. HODs approve applicants and can create or assign students manually.

### PostgreSQL users (database layer)

These are **not** app logins — they are database accounts on your machine:

| DB user | When to use | Connection example |
| ------- | ----------- | ------------------ |
| **`postgres`** | Default superuser on Windows/Linux installers | `PGUSER=postgres` in `backend/.env` |
| **Your OS username** | Common default on macOS Homebrew PostgreSQL | `PGUSER=aggie` (your `whoami`) |
| **`uok`** | Optional; created by `01_create_database.sql` for Docker | `postgresql://uok:uok@localhost:5432/uok_esupervision` |

Always use database name **`e_supervision`** for normal local development (unless using Docker legacy `uok_esupervision`).

See [Demo accounts](#demo-accounts) for full test emails and registration numbers.

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
| `SUBMISSION_WINDOW_ENABLED` | Enforce 08:00–17:00 upload window | `false` (set `true` to restrict) |
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
| `202305000078` | `202305000078` | Faith Uwase — IT, supervisor Dr. Jean Bosco |

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
