-- =============================================================================
-- Step 1: Create database and user (run as PostgreSQL superuser in pgAdmin)
-- =============================================================================
-- pgAdmin: connect as "postgres" → Query Tool on "postgres" database → Execute
--
-- Terminal:
--   sudo -u postgres psql -f database/01_create_database.sql
-- =============================================================================

CREATE USER uok WITH PASSWORD 'uok';

CREATE DATABASE uok_esupervision OWNER uok;

GRANT ALL PRIVILEGES ON DATABASE uok_esupervision TO uok;

-- Next: connect to "uok_esupervision" in pgAdmin and run database/schema.sql
