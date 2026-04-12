-- Migration 005: Google OAuth підтримка
-- google_id — унікальний ідентифікатор Google акаунту (subject)
-- email     — email з Google профілю
-- password_hash стає необов'язковим (Google-юзери не мають пароля)

ALTER TABLE customer
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS email     VARCHAR(255);

ALTER TABLE customer
  ALTER COLUMN password_hash DROP NOT NULL;
