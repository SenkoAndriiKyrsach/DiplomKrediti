-- Migration 002: Auth, мультипродукти, штрафи, чорний список
-- Застосована: 2026-04
-- Можна запустити повторно — всі команди ідемпотентні

-- customer: пароль
ALTER TABLE customer ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- credit_product: нові поля
ALTER TABLE credit_product ADD COLUMN IF NOT EXISTS down_payment_pct NUMERIC(5,2) NOT NULL DEFAULT 0;
ALTER TABLE credit_product ADD COLUMN IF NOT EXISTS target_group VARCHAR(200);
ALTER TABLE credit_product ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- application: прив'язка до продукту + перший внесок
ALTER TABLE application ADD COLUMN IF NOT EXISTS product_id INT REFERENCES credit_product(product_id);
ALTER TABLE application ADD COLUMN IF NOT EXISTS down_payment_amount NUMERIC(12,2) NOT NULL DEFAULT 0;

-- payment_schedule: штрафи
ALTER TABLE payment_schedule ADD COLUMN IF NOT EXISTS penalty_amount NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE payment_schedule ADD COLUMN IF NOT EXISTS penalty_paid BOOLEAN NOT NULL DEFAULT FALSE;

-- blacklist: новa таблиця
CREATE TABLE IF NOT EXISTS blacklist (
    blacklist_id         SERIAL PRIMARY KEY,
    customer_id          INTEGER      NOT NULL REFERENCES customer(customer_id),
    reason               TEXT         NOT NULL,
    added_by_manager_id  INTEGER,
    added_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    removed_at           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_blacklist_active ON blacklist(customer_id)
    WHERE removed_at IS NULL;
