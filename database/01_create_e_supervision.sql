-- =============================================================================
-- Optional: create e_supervision database (if you have not already in pgAdmin)
-- =============================================================================
-- pgAdmin: connect as your superuser (often "postgres") → Query Tool on
-- "postgres" database → Execute this file.
--
-- If you already created "e_supervision" in pgAdmin, skip this file and run
-- schema.sql on that database instead.
-- =============================================================================

-- Uncomment and adjust if you want a dedicated app user instead of postgres:
-- CREATE USER esupervision WITH PASSWORD 'choose_a_strong_password';
-- CREATE DATABASE e_supervision OWNER esupervision;
-- GRANT ALL PRIVILEGES ON DATABASE e_supervision TO esupervision;

-- Or use the default postgres superuser (simplest for local pgAdmin):
CREATE DATABASE e_supervision;

-- Next: connect to "e_supervision" in pgAdmin and run database/schema.sql
-- Then set backend/.env:
--   DATABASE_URL=postgresql://postgres:YOUR_PGADMIN_PASSWORD@localhost:5432/e_supervision
