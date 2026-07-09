# Capstone Defense — Appendix Code Guide

Use this file to decide **what to paste** into each report appendix and **where the code lives**.

For each appendix: add (1) a short description, (2) a flow diagram or screenshot, (3) one backend excerpt, (4) one frontend excerpt.

---

## Recommended appendix order (12 sections)

| Appendix | Title | Put in report when discussing… |
|----------|-------|------------------------------|
| **A** | Authentication & JWT | Security, login, roles |
| **B** | API & frontend–backend communication | System architecture |
| **C** | Database schema | Data model / ERD |
| **D** | Public topic proposal | Student onboarding |
| **E** | HOD administration | Department management |
| **F** | Supervisor review workflow | Academic supervision |
| **G** | Student submissions | Student module |
| **H** | Secure file handling | Security / uploads |
| **I** | Notifications & email | Alerts & communication |
| **J** | Timezone & submission policy | Business rules |
| **K** | Demo data & testing | Testing / validation |
| **L** | Cloud deployment | Deployment chapter |

**Minimum set (6 appendices):** A, B, C, E, F, G

---

## Appendix A — Authentication & JWT

**Crucial because:** Separates Student, Supervisor, and HOD portals; protects all private routes.

**What to describe:** bcrypt passwords, JWT (48h), Bearer token on every request, portal check at login.

| Excerpt from | File | Function / section |
|--------------|------|-------------------|
| Password + JWT | `backend/app/auth.py` | `hash_password`, `create_token`, `decode_token` |
| Login logic | `backend/app/auth_login.py` | `authenticate_user`, `login_user` |
| Route guard | `backend/app/services.py` | `get_current_user`, `require_role` |
| Login API | `backend/app/main.py` | `POST /api/auth/login`, `GET /api/auth/me` |
| Frontend session | `frontend/src/context/AuthContext.tsx` | `login`, `logout`, token restore |
| API token attach | `frontend/src/lib/api.ts` | Request interceptor (`Authorization: Bearer`) |
| Role-based routes | `frontend/src/App.tsx` | `RequireRole` |
| Login UI | `frontend/src/pages/Login.tsx` | Portal picker + sign-in form |

**Tables:** `users`

**Demo logins:**
- Student: `202305000078` / `202305000078`
- Supervisor: `jean.bosco@uok.ac.rw` / `Password@123`
- HOD: `hod.it@uok.ac.rw` / `Password@123`

---

## Appendix B — API & frontend–backend communication

**Crucial because:** Defines how React talks to FastAPI in local and production.

**What to describe:** REST under `/api`, Axios client, CORS, `VITE_API_URL`, dev proxy.

| Excerpt from | File | What to show |
|--------------|------|--------------|
| All routes | `backend/app/main.py` | Route list (`/api/health` … `/api/notifications`) |
| CORS | `backend/app/main.py` | `CORSMiddleware` setup |
| Request/response shapes | `backend/app/schemas.py` | `LoginRequest`, `AuthResponse`, `SubmissionOut` |
| DB session | `backend/app/database.py` | `get_db` |
| Env config | `backend/app/config.py` | `cors_origins`, `jwt_secret`, `PG*` vars |
| HTTP client | `frontend/src/lib/api.ts` | Full file (baseURL, interceptors) |
| Data hook | `frontend/src/lib/useApi.ts` | `useApi` |
| Dev proxy | `frontend/vite.config.ts` | `/api` → `localhost:8080` |

**Production env (mention in text):**
- Vercel: `VITE_API_URL=https://YOUR-API.onrender.com/api`
- Render: `CORS_ORIGINS=https://your-app.vercel.app`, `PGDATABASE=e_supervision`

---

## Appendix C — Database schema

**Crucial because:** Core data model for the whole supervision lifecycle.

**What to describe:** 8 tables, relationships, one student → one project → many submissions.

| Excerpt from | File | What to show |
|--------------|------|--------------|
| ORM models | `backend/app/models.py` | `User`, `Project`, `Submission`, `TopicProposal` (all 8) |
| SQL DDL | `database/schema.sql` | `CREATE TABLE` blocks + FK comments at bottom |
| ERD + FK map | `DATABASE.md` | Mermaid diagram + foreign key table |
| Setup | `database/README.md` | pgAdmin + Neon steps |

**8 tables:** `users`, `projects`, `tasks`, `submissions`, `feedback`, `notifications`, `topic_proposals`, `supervisor_student_requests`

---

## Appendix D — Public topic proposal (`/apply`)

**Crucial because:** Entry point before student accounts exist.

**What to describe:** 3 topics, 2 supervisor choices, department routing, capacity check (max 8 per supervisor).

| Excerpt from | File | Function / section |
|--------------|------|-------------------|
| Create proposal | `backend/app/proposal_services.py` | `create_topic_proposal` |
| Public APIs | `backend/app/main.py` | `GET /api/public/programs`, `/public/supervisors`, `POST /public/topic-proposals` |
| Department map | `backend/app/departments.py` | `department_for_program` |
| Similarity score | `backend/app/similarity.py` | `score_proposal_topics` |
| Form UI | `frontend/src/pages/TopicProposalForm.tsx` | `submit` handler |
| Route | `frontend/src/App.tsx` | `/apply` route |

**Tables:** `topic_proposals`, `notifications`

---

## Appendix E — HOD administration

**Crucial because:** HOD approves topics, creates accounts, assigns supervisors.

**What to describe:** Proposal pipeline, “Assign & approve”, student roster, workload.

| Excerpt from | File | Function / section |
|--------------|------|-------------------|
| Approve proposal | `backend/app/proposal_services.py` | `approve_proposal` |
| Assign supervisor | `backend/app/proposal_services.py` | `hod_assign_student_supervisor` |
| Student list | `backend/app/services.py` | `hod_students_list`, `hod_dashboard` |
| HOD APIs | `backend/app/main.py` | All `/api/hod/*` routes |
| Proposals UI | `frontend/src/pages/hod/HodProposals.tsx` | Approve/reject modals |
| Students UI | `frontend/src/pages/hod/HodStudents.tsx` | Roster table + assign modal |
| Dashboard | `frontend/src/pages/hod/HodDashboard.tsx` | Charts + unassigned list |

**Tables:** `users`, `projects`, `topic_proposals`, `supervisor_student_requests`

---

## Appendix F — Supervisor review workflow

**Crucial because:** Main academic supervision — review, feedback, deadlines.

**What to describe:** 7-day review countdown, morning-first queue, open student documents.

| Excerpt from | File | Function / section |
|--------------|------|-------------------|
| Dashboard | `backend/app/services.py` | `supervisor_dashboard` |
| Review action | `backend/app/services.py` | `review_submission` |
| Countdown SLA | `backend/app/proposal_services.py` | `pending_review_out` (`REVIEW_DEADLINE_HOURS = 168`) |
| Priority sort | `backend/app/submission_policy.py` | `sort_submissions_by_priority` |
| APIs | `backend/app/main.py` | `/api/supervisor/dashboard`, `/reviews`, `/submissions/{id}/review` |
| Dashboard UI | `frontend/src/pages/supervisor/SupervisorDashboard.tsx` | Color-coded countdown cards |
| Reviews UI | `frontend/src/pages/supervisor/SupervisorReviews.tsx` | Open document + review modal |

**Tables:** `submissions`, `feedback`, `projects`, `notifications`

---

## Appendix G — Student submissions

**Crucial because:** Primary student interaction — upload work for supervisor review.

**What to describe:** PDF/Word only, 10 MB max, upload window 08:00–17:00 Kigali.

| Excerpt from | File | Function / section |
|--------------|------|-------------------|
| Upload API | `backend/app/main.py` | `POST /api/student/submissions` |
| Create record | `backend/app/services.py` | `create_submission` |
| Time window | `backend/app/submission_policy.py` | `validate_submission_window` |
| File rules | `backend/app/files.py` | `validate_upload`, `save_upload` |
| Upload UI | `frontend/src/pages/student/StudentSubmissions.tsx` | FormData submit |
| Window info API | `backend/app/main.py` | `GET /api/public/submission-window` |

**Tables:** `submissions`, `projects`

---

## Appendix H — Secure file handling

**Crucial because:** Thesis documents must not be publicly accessible.

**What to describe:** Only student, their supervisor, or department HOD can open a file.

| Excerpt from | File | Function / section |
|--------------|------|-------------------|
| Access check | `backend/app/file_access.py` | `user_can_access_submission_file` |
| Download API | `backend/app/main.py` | `GET /api/files/{filename}` |
| Upload storage | `backend/app/files.py` | `save_upload`, `ALLOWED_EXTENSIONS` |
| Open in browser | `frontend/src/lib/files.ts` | `openAuthenticatedFile` |

**Storage:** `backend/uploads/` (path stored in `submissions.file_url`)

---

## Appendix I — Notifications & email

**Crucial because:** Keeps all roles informed inside the portal and via Gmail.

| Excerpt from | File | Function / section |
|--------------|------|-------------------|
| Email send | `backend/app/email_service.py` | `send_email`, `notify_submission_reviewed` |
| Notification APIs | `backend/app/main.py` | `/api/notifications/*` |
| Alert UI | `frontend/src/pages/Alerts.tsx` | Mark read, deep links |
| Routing | `frontend/src/lib/notifications.ts` | `notificationTargetPath` |

**Table:** `notifications`

---

## Appendix J — Timezone & submission policy

**Crucial because:** Accurate Kigali time; fair supervisor queue (morning before afternoon).

| Excerpt from | File | Function / section |
|--------------|------|-------------------|
| UTC helpers | `backend/app/datetime_utils.py` | `utc_now`, `to_kigali` |
| Window + priority | `backend/app/submission_policy.py` | `validate_submission_window`, `priority_label` |
| Display | `frontend/src/lib/format.ts` | `parseApiDate`, `formatDateTime`, `timeAgo` |
| Config | `backend/app/config.py` | `submission_window_*`, `submission_timezone` |

---

## Appendix K — Demo data & testing

**Crucial because:** Repeatable demo for defense without manual setup.

| Excerpt from | File | What to show |
|--------------|------|--------------|
| Seed script | `backend/app/seed.py` | `seed_demo_data` |
| Reseed | `backend/reseed_db.py` | `main` |
| Reg format | `backend/app/demo_credentials.py` | `format_registration_number` |

**Run:** `cd backend && python reseed_db.py`

**Test accounts:** see Appendix A demo logins; unassigned students `202205000210`, `202205000215`

---

## Appendix L — Cloud deployment

**Crucial because:** Production architecture for defense demo.

| Excerpt from | File | What to show |
|--------------|------|--------------|
| Full guide | `DEPLOYMENT.md` | Neon + Render + Vercel steps |
| Render config | `render.yaml` | Service definition |
| Backend env | `backend/.env.example` | All variables |
| Build/start | `backend/build.sh`, `backend/start.sh` | Deploy scripts |

**Stack:** Neon (`e_supervision`) → Render (FastAPI) → Vercel (React)

**Health check:** `GET /api/health`

---

## API route quick reference

| Prefix | Who | Purpose |
|--------|-----|---------|
| `/api/public/*` | Anyone | Programs, supervisors, topic proposals, submission window |
| `/api/auth/*` | Login / logged-in | Login, current user |
| `/api/student/*` | Student | Dashboard, tasks, submissions, feedback |
| `/api/supervisor/*` | Supervisor | Dashboard, reviews, students |
| `/api/hod/*` | HOD | Proposals, students, faculty, requests |
| `/api/notifications/*` | Logged-in | Alerts |
| `/api/files/{name}` | Logged-in + ACL | Secure document download |

---

## File tree (crucial files only)

```
backend/app/
  auth.py                 → Appendix A
  auth_login.py           → Appendix A
  main.py                 → Appendices A, B, D–L (all routes)
  models.py               → Appendix C
  schemas.py              → Appendix B
  services.py             → Appendices E, F, G
  proposal_services.py    → Appendices D, E, F
  submission_policy.py    → Appendices F, G, J
  files.py                → Appendices G, H
  file_access.py          → Appendix H
  email_service.py        → Appendix I
  datetime_utils.py       → Appendix J
  seed.py                 → Appendix K

frontend/src/
  lib/api.ts              → Appendix B
  context/AuthContext.tsx → Appendix A
  App.tsx                 → Appendix A (routes)
  pages/Login.tsx         → Appendix A
  pages/TopicProposalForm.tsx      → Appendix D
  pages/hod/HodProposals.tsx       → Appendix E
  pages/hod/HodStudents.tsx        → Appendix E
  pages/supervisor/SupervisorDashboard.tsx → Appendix F
  pages/supervisor/SupervisorReviews.tsx   → Appendix F
  pages/student/StudentSubmissions.tsx     → Appendix G
  lib/files.ts            → Appendix H
  lib/format.ts           → Appendix J
  pages/Alerts.tsx        → Appendix I

database/
  schema.sql              → Appendix C
  DATABASE.md             → Appendix C (ERD)
  README.md               → Appendix C, K

DEPLOYMENT.md             → Appendix L
```

---

## Screenshot checklist (pair with appendices)

| Appendix | Screenshot page |
|----------|-----------------|
| A | `/login` portal picker |
| D | `/apply` topic form |
| E | `/hod/proposals`, `/hod/students` |
| F | `/supervisor` dashboard + reviews |
| G | `/student/submissions` |
| H | Supervisor “Open document” button |
| I | `/alerts` |
| L | Vercel + Render dashboard (optional) |
