-- =============================================================================
--  Credit Bureau — повна схема БД
--  PostgreSQL 14+
--  Остання зміна: 2026-04
-- =============================================================================


-- =============================================================================
--  ДОВІДНИКИ
-- =============================================================================

CREATE TABLE IF NOT EXISTS application_status (
    status_id   SERIAL PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS citizenship_dict (
    citizenship_id   SERIAL PRIMARY KEY,
    citizenship_name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS employment_type_dict (
    employment_type_id   SERIAL PRIMARY KEY,
    employment_type_name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS risk_level_dict (
    risk_level_id   SERIAL PRIMARY KEY,
    risk_level_name VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_status (
    status_id   SERIAL PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL
);


-- =============================================================================
--  КРЕДИТНИЙ ПРОДУКТ
-- =============================================================================

CREATE TABLE IF NOT EXISTS credit_product (
    product_id        SERIAL PRIMARY KEY,
    product_name      TEXT          NOT NULL,
    description       TEXT,
    interest_rate     NUMERIC       NOT NULL,  -- річна відсоткова ставка (%)
    min_term_months   INTEGER       NOT NULL,
    max_term_months   INTEGER       NOT NULL,
    min_amount        INTEGER       NOT NULL,
    max_amount        INTEGER       NOT NULL,
    down_payment_pct  NUMERIC(5,2)  NOT NULL DEFAULT 0,   -- мін. перший внесок (%)
    target_group      VARCHAR(200),                        -- цільова аудиторія
    is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP     DEFAULT NOW(),
    updated_at        TIMESTAMP,
    deleted_at        TIMESTAMP                            -- soft delete
);


-- =============================================================================
--  КЛІЄНТ / ПОЗИЧАЛЬНИК
-- =============================================================================

CREATE TABLE IF NOT EXISTS customer (
    customer_id            SERIAL PRIMARY KEY,
    login                  VARCHAR(100) NOT NULL UNIQUE DEFAULT 'temp',
    password_hash          VARCHAR(255),                  -- bcrypt hash; NULL = старий акаунт без пароля
    full_name              VARCHAR(200) NOT NULL,
    birth_date             DATE         NOT NULL,
    citizenship            INTEGER      REFERENCES citizenship_dict(citizenship_id),
    monthly_income         NUMERIC      NOT NULL,
    employment_type_id     INTEGER      REFERENCES employment_type_dict(employment_type_id),
    employment_term_months INTEGER,
    created_at             TIMESTAMP    DEFAULT NOW()
);


-- =============================================================================
--  ЧОРНИЙ СПИСОК
-- =============================================================================

CREATE TABLE IF NOT EXISTS blacklist (
    blacklist_id         SERIAL PRIMARY KEY,
    customer_id          INTEGER      NOT NULL REFERENCES customer(customer_id),
    reason               TEXT         NOT NULL,
    added_by_manager_id  INTEGER,
    added_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    removed_at           TIMESTAMPTZ            -- NULL = активний запис
);

CREATE INDEX IF NOT EXISTS idx_blacklist_active ON blacklist(customer_id)
    WHERE removed_at IS NULL;


-- =============================================================================
--  ЗАЯВКА НА КРЕДИТ
-- =============================================================================

CREATE TABLE IF NOT EXISTS application (
    application_id       SERIAL PRIMARY KEY,
    customer_id          INTEGER  REFERENCES customer(customer_id),
    product_id           INTEGER  REFERENCES credit_product(product_id),
    amount_requested     NUMERIC  NOT NULL,
    down_payment_amount  NUMERIC  NOT NULL DEFAULT 0,  -- сума першого внеску
    term_months          INTEGER  NOT NULL,
    purpose              TEXT,
    status_id            INTEGER  REFERENCES application_status(status_id),
    created_at           TIMESTAMP DEFAULT NOW()
);

-- Статуси:
--   1 = new           (щойно створено)
--   2 = auto_rejected (автоматично відхилено: ризик = HIGH або порушення правил)
--   3 = recommended   (рекомендовано менеджеру)
--   4 = in_review     (менеджер переглядає)
--   5 = approved      (схвалено)
--   6 = rejected      (відхилено менеджером)


-- =============================================================================
--  СКОРИНГ
-- =============================================================================

CREATE TABLE IF NOT EXISTS scoring_result (
    scoring_id      SERIAL PRIMARY KEY,
    application_id  INTEGER  REFERENCES application(application_id),
    scoring_score   NUMERIC,
    risk_level_id   INTEGER  REFERENCES risk_level_dict(risk_level_id),
    model_version   VARCHAR(20)
);

-- Рівні ризику: 1=low (≥550), 2=medium (500–549), 3=high (<500)


-- =============================================================================
--  ПЕРЕВІРКА БІЗНЕС-ПРАВИЛ
-- =============================================================================

CREATE TABLE IF NOT EXISTS business_rules_check (
    check_id              SERIAL PRIMARY KEY,
    application_id        INTEGER  REFERENCES application(application_id),
    income_ok             BOOLEAN,   -- дохід ≥ 8 000 грн
    dti_ok                BOOLEAN,   -- DTI < 40% (amount/term < income*0.4)
    employment_ok         BOOLEAN,   -- стаж ≥ 6 місяців
    employment_type_ok    BOOLEAN,   -- тип зайнятості ≠ 4 (безробітний)
    overall_result        BOOLEAN
);


-- =============================================================================
--  РІШЕННЯ МЕНЕДЖЕРА
-- =============================================================================

CREATE TABLE IF NOT EXISTS manager_decision (
    decision_id       SERIAL PRIMARY KEY,
    application_id    INTEGER      REFERENCES application(application_id),
    manager_id        INTEGER,
    final_decision    VARCHAR(20),  -- 'approved' | 'rejected'
    comment           TEXT,
    corrected_amount  NUMERIC,      -- якщо менеджер скоригував суму
    corrected_term    INTEGER,      -- якщо менеджер скоригував термін
    decision_date     TIMESTAMP    DEFAULT NOW()
);


-- =============================================================================
--  КРЕДИТ (видається після схвалення)
-- =============================================================================

CREATE TABLE IF NOT EXISTS credit (
    credit_id        SERIAL PRIMARY KEY,
    application_id   INTEGER  REFERENCES application(application_id),
    amount_approved  NUMERIC,   -- сума після вирахування першого внеску
    interest_rate    NUMERIC,
    monthly_payment  NUMERIC,
    start_date       DATE,
    end_date         DATE
);


-- =============================================================================
--  ГРАФІК ПЛАТЕЖІВ
-- =============================================================================

CREATE TABLE IF NOT EXISTS payment_schedule (
    payment_id      SERIAL PRIMARY KEY,
    credit_id       INTEGER      REFERENCES credit(credit_id),
    payment_date    DATE         NOT NULL,
    payment_amount  NUMERIC      NOT NULL,
    is_paid         BOOLEAN      DEFAULT FALSE,
    paid_date       DATE,
    penalty_amount  NUMERIC      NOT NULL DEFAULT 0,   -- нараховано автоматично (0.1%/день)
    penalty_paid    BOOLEAN      NOT NULL DEFAULT FALSE
);


-- =============================================================================
--  ЖУРНАЛ ПЛАТЕЖІВ
-- =============================================================================

CREATE TABLE IF NOT EXISTS payment (
    payment_id    SERIAL PRIMARY KEY,
    credit_id     INTEGER  REFERENCES credit(credit_id),
    payment_date  DATE     NOT NULL,
    amount        NUMERIC,
    status_id     INTEGER  REFERENCES payment_status(status_id)
);

-- Статуси: 1=planned, 2=paid, 3=overdue


-- =============================================================================
--  БКІ — КРЕДИТНА ІСТОРІЯ (зовнішній звіт)
-- =============================================================================

CREATE TABLE IF NOT EXISTS credit_history_report (
    report_id        SERIAL PRIMARY KEY,
    customer_id      INTEGER  REFERENCES customer(customer_id),
    report_date      DATE,
    total_loans      INTEGER,
    overdue_loans    INTEGER,
    max_overdue_days INTEGER,
    external_score   INTEGER
);


-- =============================================================================
--  SEED — ДОВІДНИКИ
-- =============================================================================

INSERT INTO application_status (status_id, status_name) VALUES
    (1, 'new'),
    (2, 'auto_rejected'),
    (3, 'recommended'),
    (4, 'in_review'),
    (5, 'approved'),
    (6, 'rejected')
ON CONFLICT (status_id) DO NOTHING;

INSERT INTO citizenship_dict (citizenship_id, citizenship_name) VALUES
    (1, 'Україна'),
    (2, 'Країни ЄС'),
    (3, 'Велика Британія'),
    (4, 'Канада'),
    (5, 'США')
ON CONFLICT (citizenship_id) DO NOTHING;

INSERT INTO employment_type_dict (employment_type_id, employment_type_name) VALUES
    (1, 'Офіційно працевлаштований'),
    (2, 'Підприємець'),
    (3, 'Самозайнятий'),
    (4, 'Безробітний')
ON CONFLICT (employment_type_id) DO NOTHING;

INSERT INTO risk_level_dict (risk_level_id, risk_level_name) VALUES
    (1, 'low'),
    (2, 'medium'),
    (3, 'high')
ON CONFLICT (risk_level_id) DO NOTHING;

INSERT INTO payment_status (status_id, status_name) VALUES
    (1, 'planned'),
    (2, 'paid'),
    (3, 'overdue')
ON CONFLICT (status_id) DO NOTHING;


-- =============================================================================
--  SEED — ПОЧАТКОВИЙ КРЕДИТНИЙ ПРОДУКТ
-- =============================================================================

INSERT INTO credit_product
    (product_name, description, interest_rate, min_term_months, max_term_months,
     min_amount, max_amount, down_payment_pct, target_group, is_active)
VALUES
    ('Кредит готівкою',
     'Універсальний споживчий кредит готівкою на будь-які потреби.',
     7.5, 6, 60, 10000, 500000, 0, 'Всі клієнти', TRUE)
ON CONFLICT DO NOTHING;
