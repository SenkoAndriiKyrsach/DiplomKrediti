-- Migration 001: Initial schema (виконується один раз при розгортанні)
-- Запускайте: psql $DATABASE_URL -f db/migrations/001_initial.sql
-- Або: python3 backend/migrate.py

\i db/schema.sql
