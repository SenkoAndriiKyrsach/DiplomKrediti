-- Migration 006: Таблиця менеджерів + нова система скорингу

-- ══════════════════════════════════════════════════════════
-- 1. МЕНЕДЖЕРИ
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS manager_user (
  id                    SERIAL PRIMARY KEY,
  login                 VARCHAR(50)  UNIQUE NOT NULL,
  password_hash         VARCHAR(255) NOT NULL,
  full_name             VARCHAR(200),
  is_active             BOOLEAN      NOT NULL DEFAULT TRUE,
  must_change_password  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Перенести існуючого менеджера (пароль 1234, вже відомий → must_change=false)
INSERT INTO manager_user (login, password_hash, full_name, must_change_password)
VALUES (
  'manager',
  '$2b$12$DF.iM7rswe/FpdxBnkfG1.wh47gI06QqLp1HlEnzXo/YsgQdm1bqi',
  'Менеджер (за замовчуванням)',
  FALSE
) ON CONFLICT (login) DO NOTHING;

-- ══════════════════════════════════════════════════════════
-- 2. СКОРИНГ — ХАРАКТЕРИСТИКИ І ДІАПАЗОНИ
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS scoring_criterion (
  id          SERIAL       PRIMARY KEY,
  key         VARCHAR(50)  UNIQUE NOT NULL,
  name        VARCHAR(100) NOT NULL,
  weight      DECIMAL(5,3) NOT NULL DEFAULT 1.0,
  sort_order  INT          NOT NULL DEFAULT 0,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS scoring_range (
  id            SERIAL        PRIMARY KEY,
  criterion_id  INT           NOT NULL REFERENCES scoring_criterion(id) ON DELETE CASCADE,
  label         VARCHAR(100)  NOT NULL,
  range_min     DECIMAL,       -- NULL = -∞
  range_max     DECIMAL,       -- NULL = +∞
  score_value   DECIMAL(10,2) NOT NULL DEFAULT 0
);

-- Прохідний % зберігаємо в system_settings
INSERT INTO system_settings (key, value, label, description, category) VALUES
('scoring.pass_percentage', '80', 'Прохідний відсоток (%)',
 'Мінімальний % від максимально можливого балу для схвалення заявки', 'scoring')
ON CONFLICT DO NOTHING;

-- ── Критерії за замовчуванням ───────────────────────────
INSERT INTO scoring_criterion (key, name, weight, sort_order) VALUES
  ('age',        'Вік',                        0.2, 1),
  ('income',     'Заробітна плата',            0.5, 2),
  ('employment', 'Стаж роботи (міс)',          0.2, 3),
  ('bki',        'Кредитна історія (БКІ)',     0.1, 4)
ON CONFLICT (key) DO NOTHING;

-- ── Діапазони: Вік ──────────────────────────────────────
INSERT INTO scoring_range (criterion_id, label, range_min, range_max, score_value)
SELECT id, '<18',    NULL,  18,   0   FROM scoring_criterion WHERE key = 'age'
UNION ALL
SELECT id, '18-65',  18,   65,   300  FROM scoring_criterion WHERE key = 'age'
UNION ALL
SELECT id, '>65',    65,   NULL, 100  FROM scoring_criterion WHERE key = 'age';

-- ── Діапазони: Заробітна плата ──────────────────────────
INSERT INTO scoring_range (criterion_id, label, range_min, range_max, score_value)
SELECT id, '<5000',        NULL,  5000,  0    FROM scoring_criterion WHERE key = 'income'
UNION ALL
SELECT id, '5000-15000',   5000,  15000, 400  FROM scoring_criterion WHERE key = 'income'
UNION ALL
SELECT id, '15000-50000',  15000, 50000, 1000 FROM scoring_criterion WHERE key = 'income'
UNION ALL
SELECT id, '>50000',       50000, NULL,  200  FROM scoring_criterion WHERE key = 'income';

-- ── Діапазони: Стаж роботи ──────────────────────────────
INSERT INTO scoring_range (criterion_id, label, range_min, range_max, score_value)
SELECT id, '<6 міс',     NULL, 6,    0   FROM scoring_criterion WHERE key = 'employment'
UNION ALL
SELECT id, '6-24 міс',   6,   24,   200  FROM scoring_criterion WHERE key = 'employment'
UNION ALL
SELECT id, '>24 міс',    24,  NULL, 400  FROM scoring_criterion WHERE key = 'employment';

-- ── Діапазони: Кредитна історія ─────────────────────────
INSERT INTO scoring_range (criterion_id, label, range_min, range_max, score_value)
SELECT id, '0 прострочень',   0,   1,    500 FROM scoring_criterion WHERE key = 'bki'
UNION ALL
SELECT id, '1-2 прострочення', 1,   3,    200 FROM scoring_criterion WHERE key = 'bki'
UNION ALL
SELECT id, '>2 прострочень',   3,   NULL, 0   FROM scoring_criterion WHERE key = 'bki';

-- ══════════════════════════════════════════════════════════
-- 3. ШТРАФ — перевести у відсотки
--    Старе: 0.001 (десятковий) → Нове: 0.1 (відсоток)
-- ══════════════════════════════════════════════════════════
UPDATE system_settings
   SET value = '0.1', label = 'Ставка штрафу на день (%)'
 WHERE key = 'penalty.daily_rate';
