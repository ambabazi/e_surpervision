# University of Kigali — Capstone E-Supervision Portal

A web platform that streamlines capstone/thesis supervision between **students**,
**supervisors**, and the **Head of Department (HOD)** at the University of Kigali.
It provides progress tracking, milestones, submissions, feedback, alerts, and
department-wide analytics.

The UI follows the **mycampus.uok.ac.rw** SME school design: gold header, maroon
navigation drawer, and sky-blue section labels.

---

## Tech stack

| Layer      | Technology                                                        |
| ---------- | ----------------------------------------------------------------- |
| Backend    | Python 3, FastAPI, SQLAlchemy, JWT (python-jose), bcrypt          |
| Database   | SQLite (zero-setup dev default) · PostgreSQL (production)          |
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS, React Router, Recharts  |
| Auth       | JWT, role-based access (STUDENT / SUPERVISOR / HOD)               |

---

## Project structure

```
e-supervision/
├── backend/           # FastAPI REST API (Python)
│   ├── app/
│   ├── requirements.txt
│   └── run.sh
├── frontend/          # React + Vite single-page app
├── docker-compose.yml # Postgres for production-like runs
└── README.md
```

---

## Running the app

### 1. Backend (FastAPI)

By default the backend uses **SQLite** and seeds demo data on first startup.

```bash
cd backend
chmod +x run.sh
./run.sh
```

Or manually:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

The API starts on **http://localhost:8080**.

#### Using PostgreSQL instead

```bash
docker compose up -d db
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/esupervision"
cd backend && ./run.sh
```

### 2. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

The app starts on **http://localhost:5173** and proxies `/api` to the backend.

---

## Demo accounts

All accounts share the password **`password123`**.

| Role        | Email                          | Lands on            |
| ----------- | ------------------------------ | ------------------- |
| Student     | `alex.mwangi@st.uok.ac.rw`     | Student dashboard   |
| Supervisor  | `jean.bosco@uok.ac.rw`         | Supervisor dashboard|
| HOD         | `grace.uwase@uok.ac.rw`        | HOD dashboard       |

On the login screen, pick a portal tab to auto-fill the email.

---

## Key API endpoints

| Method | Endpoint                                  | Role        |
| ------ | ----------------------------------------- | ----------- |
| POST   | `/api/auth/login`                         | public      |
| GET    | `/api/auth/me`                            | any         |
| GET    | `/api/student/dashboard`                  | STUDENT     |
| GET    | `/api/student/tasks`                      | STUDENT     |
| GET/POST | `/api/student/submissions`              | STUDENT     |
| GET    | `/api/student/feedback`                   | STUDENT     |
| GET    | `/api/supervisor/dashboard`               | SUPERVISOR  |
| GET    | `/api/supervisor/students`                | SUPERVISOR  |
| GET    | `/api/supervisor/reviews`                 | SUPERVISOR  |
| POST   | `/api/supervisor/submissions/{id}/review` | SUPERVISOR  |
| GET    | `/api/hod/dashboard`                      | HOD         |
| GET    | `/api/notifications`                      | any         |

---

## Features by role

- **Student** — project overview, progress %, days remaining, tasks & milestones
  board, submissions, supervisor info, and feedback.
- **Supervisor** — workload stats, pending submission reviews (with rating +
  feedback), critical alerts, and a department research pipeline.
- **HOD** — faculty performance, project-status breakdown, supervisor workload
  charts, and unassigned-student management.
# e_surpervision
