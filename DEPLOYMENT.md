# Deployment guide — UoK Capstone E-Supervision Portal

Deploy **frontend** (Vercel), **backend** (Render), and **database** (Neon) on free tiers.

## Prerequisites

- GitHub repo pushed with this project
- Gmail account with [App Password](https://myaccount.google.com/apppasswords) for student notifications
- Run locally first: `python reseed_db.py` then verify login

---

## Step 1 — PostgreSQL (Neon)

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string (`postgresql://...`)
3. In Neon SQL editor, paste and run `database/schema.sql` (optional — backend also creates tables)
4. For passwords with `@`, set split vars on Render instead of raw `DATABASE_URL` (see backend `.env.example`)

---

## Step 2 — Backend (Render)

1. [render.com](https://render.com) → **New Web Service** → connect GitHub repo
2. Settings:

| Setting | Value |
|---------|--------|
| Root directory | `backend` |
| Runtime | Python 3 |
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

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
