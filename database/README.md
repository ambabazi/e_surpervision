# Database SQL files

PostgreSQL setup for the **E-Supervision Portal** — no Docker required.

Full schema reference (ERD, relationships, API map, timezone rules): **[DATABASE.md](../DATABASE.md)**

---

## Files

| File | Purpose | Run as |
|------|---------|--------|
| [`01_create_e_supervision.sql`](01_create_e_supervision.sql) | Creates empty `e_supervision` database | `postgres` superuser |
| [`01_create_database.sql`](01_create_database.sql) | Creates `uok_esupervision` DB + `uok` user (legacy) | `postgres` superuser |
| [`schema.sql`](schema.sql) | Creates all **8 tables**, indexes, and comments | Connected to `e_supervision` |

---

## Tables created by `schema.sql`

| # | Table | Purpose |
|---|-------|---------|
| 1 | `users` | Students, supervisors, HODs |
| 2 | `projects` | One capstone project per assigned student |
| 3 | `tasks` | Milestones and work items |
| 4 | `submissions` | Student PDF/Word uploads |
| 5 | `feedback` | Supervisor comments |
| 6 | `notifications` | In-app alerts |
| 7 | `topic_proposals` | Public `/apply` form (pre-account) |
| 8 | `supervisor_student_requests` | Supervisor asks HOD for more students |

---

## Already have `e_supervision` in pgAdmin?

Port **5432** in use usually means local PostgreSQL is running — that is expected. You do **not** need Docker.

### Step 1 — Connect the backend

Edit `backend/.env` (copy from `.env.example` if needed).

**If your password contains `@`, `#`, or other special characters**, use split variables:

```env
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_pgadmin_password
PGDATABASE=e_supervision
```

**Or** a single URL with URL-encoded password (`@` → `%40`):

```env
DATABASE_URL=postgresql://postgres:Hello12%4012@localhost:5432/e_supervision
```

Test:

```bash
cd backend
source .venv/bin/activate
python check_db.py
```

### Step 2 — Create tables (pick one)

**Option A — pgAdmin:** Connect to `e_supervision` → **Query Tool** → run [`schema.sql`](schema.sql).

**Option B — Automatic:** Start the backend once — SQLAlchemy creates the same tables (`backend/app/models.py`).

### Step 3 — Seed demo data

**First startup** on an empty DB inserts demo users automatically.

For a **full refresh** (truncate + reseed):

```bash
cd backend
source .venv/bin/activate
python reseed_db.py
```

This loads 4 HODs, 10 supervisors, ~15 students, topic proposals, submissions (with demo PDFs in `backend/uploads/`), and notifications.

### Demo logins

| Role | Login | Password |
|------|-------|----------|
| Student | `202305000078` | `202305000078` |
| Supervisor | `jean.bosco@uok.ac.rw` | `Password@123` |
| HOD (IT) | `hod.it@uok.ac.rw` | `Password@123` |

Staff must use `@uok.ac.rw` emails. Registration numbers are **12 digits** (`YYYYTTNNNNNN`, e.g. `202305000078`).

### Step 4 — Run the app

```bash
# Backend (from backend/)
./run.sh

# Frontend (from frontend/)
cd ../frontend && npm install && npm run dev
```

If port 8080 is busy:

```bash
fuser -k 8080/tcp
./run.sh
```

---

## Production (Neon + Render)

1. Create Neon project → database name **`e_supervision`** (not `neondb`).
2. Set Render env: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE=e_supervision`.
3. Seed once: `cd backend && ./seed_neon_demo.sh` (or `python reseed_db.py` with Neon credentials).
4. See [DEPLOYMENT.md](../DEPLOYMENT.md) for Vercel + CORS + `VITE_API_URL`.

---

## Timestamps

- SQL defaults use `(NOW() AT TIME ZONE 'utc')`.
- Application code writes UTC via `backend/app/datetime_utils.py`.
- The React app displays all dates in **Africa/Kigali**.

---

## Do I need to run `schema.sql`?

**No, if you prefer automation.** Starting the Python backend creates all tables via SQLAlchemy.

Use the SQL files when you want:

- Manual pgAdmin setup before first run
- Schema documentation in version control
- Database coursework / viva demonstrations

If you run `schema.sql` first, then start the backend, both work together — SQLAlchemy skips existing tables.

---

## Related docs

- [DATABASE.md](../DATABASE.md) — ERD, foreign keys, enums, API map, business rules
- [README.md](../README.md) — Quick start and demo accounts
- [DEPLOYMENT.md](../DEPLOYMENT.md) — Neon, Render, Vercel
