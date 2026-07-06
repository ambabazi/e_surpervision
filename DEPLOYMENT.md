# Deployment guide — UoK Capstone E-Supervision Portal

Deploy **frontend** (Vercel), **backend** (Render), and **database** (Neon) on free tiers.

## Prerequisites

- GitHub repo pushed with this project
- Gmail account with [App Password](https://myaccount.google.com/apppasswords) for student notifications
- Run locally first: `python reseed_db.py` then verify login

---

## Step 1 — PostgreSQL (Neon)

1. Create a project at [neon.tech](https://neon.tech) and copy the connection string.
2. Save Neon credentials in `backend/.env.neon` (gitignored):

```env
PGHOST=ep-xxxxx-pooler.region.aws.neon.tech
PGPORT=5432
PGUSER=neondb_owner
PGPASSWORD=your_neon_password
PGDATABASE=neondb
PGSSLMODE=require
```

3. Initialize the cloud database (creates tables + demo data):

```bash
cd backend
chmod +x setup_neon.sh
./setup_neon.sh
```

You should see `Connected to database: neondb` and `Step 1 complete`.

4. Optional: in Neon **SQL Editor**, run `database/schema.sql` — not required if `setup_neon.sh` succeeded.

**Render env vars (copy from `.env.neon` for Step 2):**

| Variable | Your value |
|----------|------------|
| `PGHOST` | `ep-noisy-dawn-atqp05p1-pooler.c-9.us-east-1.aws.neon.tech` |
| `PGPORT` | `5432` |
| `PGUSER` | `neondb_owner` |
| `PGPASSWORD` | *(from Neon dashboard — same as in `.env.neon`)* |
| `PGDATABASE` | `neondb` |
| `PGSSLMODE` | `require` |

---

## Step 2 — Backend (Render)

1. [render.com](https://render.com) → **New Web Service** → connect GitHub repo
2. Settings:

| Setting | Value |
|---------|--------|
| Root directory | `backend` |
| Runtime | Python 3 |
| Build command | `pip install --upgrade pip && pip install -r requirements.txt` |
| Start command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

> **Build failed on `pydantic-core` / Rust / Python 3.14?** Add `backend/runtime.txt` with `python-3.12.8` and redeploy. Render defaults to the newest Python, which may lack pre-built wheels for some packages.

3. Environment variables:

| Variable | Example |
|----------|---------|
| `PGHOST` | From Neon host |
| `PGPORT` | `5432` |
| `PGUSER` | Neon user |
| `PGPASSWORD` | Neon password |
| `PGDATABASE` | `neondb` |
| `JWT_SECRET` | Long random string (32+ chars) |
| `CORS_ORIGINS` | `https://your-app.vercel.app` |
| `MAIL_ENABLED` | `true` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASSWORD` | Gmail app password |
| `SMTP_USE_TLS` | `true` |
| `MAIL_FROM` | Same Gmail address |

4. Deploy → note URL, e.g. `https://uok-esupervision.onrender.com`

5. Seed production DB once (Render shell or local with Neon credentials):

```bash
cd backend && source .venv/bin/activate
python reseed_db.py
```

Health check: `https://YOUR-API.onrender.com/api/health`

---

## Step 3 — Frontend (Vercel)

1. [vercel.com](https://vercel.com) → Import repo
2. Settings:

| Setting | Value |
|---------|--------|
| Root directory | `frontend` |
| Build command | `npm run build` |
| Output directory | `dist` |

3. Environment variable:

| Variable | Value |
|----------|--------|
| `VITE_API_URL` | `https://YOUR-API.onrender.com/api` |

4. Deploy → open your Vercel URL

---

## Step 4 — Verify

- Student login: `UOK/2023/05000090` / `Stu@202305000090!`
- IT HOD: `hod.it@uok.ac.rw` / `Uok@Hod2026!`
- Supervisor: `jean.bosco@uok.ac.rw` / `Uok@Sup2026!`
- Submit work as student → supervisor reviews → student Gmail receives progress email (if `MAIL_ENABLED=true`)

---

## Production checklist

- [ ] Strong `JWT_SECRET` on Render
- [ ] `CORS_ORIGINS` matches Vercel URL only
- [ ] Gmail SMTP tested with a real student Gmail in seed data
- [ ] Rotate demo passwords before public launch
- [ ] Neon automatic backups enabled
- [ ] File uploads: Render disk is ephemeral — use S3/Cloudinary for production files

---

## Optional: `render.yaml`

This repo includes `render.yaml` for one-click Render setup — adjust env vars in the Render dashboard after deploy.
