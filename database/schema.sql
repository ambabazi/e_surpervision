-- =============================================================================
-- UoK Capstone E-Supervision Portal — PostgreSQL schema
-- =============================================================================
-- Run this in pgAdmin (Query Tool) AFTER creating the database and user.
-- See database/01_create_database.sql for database/user setup.
--
-- Alternative: skip this file and start the Python backend once — it creates
-- the same tables automatically via SQLAlchemy (see README).
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Enum-like constraints (using VARCHAR + CHECK for pgAdmin-friendly setup)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    full_name       VARCHAR NOT NULL,
    email           VARCHAR NOT NULL UNIQUE,
    password        VARCHAR NOT NULL,
    role            VARCHAR NOT NULL CHECK (role IN ('STUDENT', 'SUPERVISOR', 'HOD')),
    department      VARCHAR,                          -- IT | LAW | BUSINESS | EDUCATION
    title           VARCHAR,
    program         VARCHAR,
    phone           VARCHAR,
    avatar_url      VARCHAR,
    bio             TEXT,
    active          BOOLEAN DEFAULT TRUE,
    registration_number VARCHAR UNIQUE,
    created_at      TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);
CREATE INDEX IF NOT EXISTS ix_users_registration_number ON users (registration_number);

COMMENT ON TABLE users IS 'Students, supervisors, and heads of department';
COMMENT ON COLUMN users.registration_number IS 'Student login ID (unique)';
COMMENT ON COLUMN users.department IS 'IT, LAW, BUSINESS, or EDUCATION';

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS projects (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR NOT NULL,
    description     TEXT,
    current_phase   VARCHAR,
    status          VARCHAR NOT NULL CHECK (status IN (
                        'PROPOSAL', 'IN_PROGRESS', 'UNDER_REVIEW',
                        'REVISION', 'COMPLETED', 'ON_HOLD'
                    )),
    progress        INTEGER DEFAULT 0,
    start_date      DATE,
    due_date        DATE,
    student_id      INTEGER REFERENCES users (id) ON DELETE SET NULL,
    supervisor_id   INTEGER REFERENCES users (id) ON DELETE SET NULL
);

COMMENT ON TABLE projects IS 'One capstone project per assigned student';

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tasks (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR NOT NULL,
    description     TEXT,
    category        VARCHAR,
    status          VARCHAR NOT NULL CHECK (status IN (
                        'UPCOMING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'
                    )),
    priority        VARCHAR CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    progress        INTEGER DEFAULT 0,
    due_date        DATE,
    milestone       BOOLEAN DEFAULT FALSE,
    project_id      INTEGER REFERENCES projects (id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS submissions (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR NOT NULL,
    notes           TEXT,
    file_url        VARCHAR,
    file_name       VARCHAR,
    status          VARCHAR NOT NULL CHECK (status IN (
                        'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'NEEDS_REVISION'
                    )),
    submitted_at    TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'utc'),
    project_id      INTEGER REFERENCES projects (id) ON DELETE CASCADE,
    task_id         INTEGER REFERENCES tasks (id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS feedback (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR,
    content         TEXT NOT NULL,
    created_at      TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'utc'),
    project_id      INTEGER REFERENCES projects (id) ON DELETE CASCADE,
    author_id       INTEGER REFERENCES users (id) ON DELETE SET NULL,
    submission_id   INTEGER REFERENCES submissions (id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notifications (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR NOT NULL,
    message         TEXT,
    type            VARCHAR NOT NULL CHECK (type IN (
                        'DEADLINE', 'FEEDBACK', 'ASSIGNMENT', 'SYSTEM', 'APPROVAL'
                    )),
    severity        VARCHAR CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
    read            BOOLEAN DEFAULT FALSE,
    action_path     VARCHAR,
    created_at      TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'utc'),
    user_id         INTEGER REFERENCES users (id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS topic_proposals (
    id                      SERIAL PRIMARY KEY,
    full_name               VARCHAR NOT NULL,
    email                   VARCHAR NOT NULL,
    registration_number     VARCHAR NOT NULL,
    phone                   VARCHAR,
    program                 VARCHAR NOT NULL,
    department                VARCHAR NOT NULL,       -- routes to department HOD
    topic_1                 VARCHAR NOT NULL,
    abstract_1              TEXT NOT NULL,
    topic_2                 VARCHAR NOT NULL,
    abstract_2              TEXT NOT NULL,
    topic_3                 VARCHAR NOT NULL,
    abstract_3              TEXT NOT NULL,
    supervisor_choice_1_id  INTEGER REFERENCES users (id) ON DELETE SET NULL,
    supervisor_choice_2_id  INTEGER REFERENCES users (id) ON DELETE SET NULL,
    status                  VARCHAR DEFAULT 'PENDING' CHECK (status IN (
                                'PENDING', 'APPROVED', 'REJECTED'
                            )),
    selected_topic_index    INTEGER,
    rejection_reason        TEXT,
    assigned_supervisor_id  INTEGER REFERENCES users (id) ON DELETE SET NULL,
    student_user_id         INTEGER REFERENCES users (id) ON DELETE SET NULL,
    created_at              TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS ix_topic_proposals_registration_number ON topic_proposals (registration_number);
CREATE INDEX IF NOT EXISTS ix_topic_proposals_department ON topic_proposals (department);

COMMENT ON TABLE topic_proposals IS 'Public topic applications before student accounts exist';

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS supervisor_student_requests (
    id              SERIAL PRIMARY KEY,
    supervisor_id   INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    message         TEXT NOT NULL,
    status          VARCHAR DEFAULT 'PENDING' CHECK (status IN (
                        'PENDING', 'APPROVED', 'REJECTED'
                    )),
    hod_response    TEXT,
    created_at      TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'utc')
);

COMMIT;

-- =============================================================================
-- Relationship summary
-- =============================================================================
-- users 1──* projects          (as student_id or supervisor_id)
-- projects 1──* tasks
-- projects 1──* submissions
-- projects 1──* feedback
-- users 1──* notifications
-- users 1──* topic_proposals   (supervisor choices, assigned supervisor, student)
-- users 1──* supervisor_student_requests
-- submissions 1──* feedback  (optional link)
-- tasks 0──1 submissions     (optional link)
