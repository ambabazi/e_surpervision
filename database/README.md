# Database SQL files

These scripts set up PostgreSQL **without Docker**.

## Files

| File | Purpose | Run as |
|------|---------|--------|
| `01_create_e_supervision.sql` | Creates empty `e_supervision` database | postgres superuser |
| `01_create_database.sql` | Creates `uok_esupervision` database and `uok` user | postgres superuser |
| `schema.sql` | Creates all tables, indexes, and comments | Connect to your app database |

## Already have `e_supervision` in pgAdmin? (most common)

You do **not** need Docker. Port 5432 is already in use because your local PostgreSQL is running — that is expected.

### Step 1 — Connect the backend

Edit `backend/.env` (copy from `.env.example` if needed).

**If your password contains `@`, `#`, or other special characters** (common with pgAdmin), use separate variables — do not put the raw password in `DATABASE_URL`:

```env
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_pgadmin_password
PGDATABASE=e_supervision
```

**Or** a single URL with the password URL-encoded (`@` → `%40`):

```env
DATABASE_URL=postgresql://postgres:Hello12%4012@localhost:5432/e_supervision
```

Test the connection:

```bash
cd backend
source .venv/bin/activate
python check_db.py
```

### Step 2 — Create tables (pick one)

**Option A — pgAdmin:** Right-click `e_supervision` → **Query Tool** → open and run `schema.sql`.

**Option B — Automatic:** Start the backend once — it creates all tables via SQLAlchemy.

### Step 3 — Seed demo data

On first startup with an empty database, the backend automatically inserts demo users, projects, and sample topic proposals. All API data is read from PostgreSQL only.

Demo staff password: `Uok@Hod2026!` (HOD) / `Uok@Sup2026!` (supervisors)  
Demo student: `202305000078` / `202305000078` (password = reg number)

Staff must use `@uok.ac.rw` emails (e.g. `hod.it@uok.ac.rw` for IT HOD).

Rich demo data (18+ students, 4 departments, proposals, requests, submissions): `python reseed_db.py`

### Step 4 — Run the app

```bash
# Backend (from backend/)
./run.sh

# Frontend (from project root — not from backend/)
cd ../frontend && npm install && npm run dev
```

If `./run.sh` says **Address already in use**, another backend is already running on port 8080:

```bash
fuser -k 8080/tcp
./run.sh
```

## Fresh pgAdmin workflow (new database)

1. Install PostgreSQL from [postgresql.org/download](https://www.postgresql.org/download/) (includes pgAdmin).
2. Open **pgAdmin 4** → connect to **PostgreSQL**.
3. **Query Tool** on `postgres` → run `01_create_e_supervision.sql` (or create `e_supervision` manually).
4. Connect to **`e_supervision`** → **Query Tool** → run `schema.sql`.
5. Set `backend/.env` as above and start the backend.

## Do I need to run schema.sql?

**No, if you prefer automation.** Starting the Python backend once also creates all tables via SQLAlchemy. The `.sql` files are for:

- Manual setup in pgAdmin before running the app
- Documentation and version control of the schema
- Database courses / viva demonstrations

If you run `schema.sql` first, then start the backend, both work together — SQLAlchemy skips tables that already exist.
