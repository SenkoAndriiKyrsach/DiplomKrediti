-- Migration 003: Таблиця системних налаштувань для адмін-панелі
-- Застосована: 2026-04

CREATE TABLE IF NOT EXISTS system_settings (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT         NOT NULL,
    label       VARCHAR(200),
    description TEXT,
    category    VARCHAR(50)  NOT NULL DEFAULT 'general',
    updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Штрафи
INSERT INTO system_settings (key, value, label, description, category) VALUES
('penalty.daily_rate', '0.001', 'Ставка штрафу на день',   '0.001 = 0.1% від суми платежу за кожен день прострочки', 'penalty'),
('penalty.grace_days', '0',     'Пільговий період (днів)',  'Кількість днів після дати платежу до початку нарахування', 'penalty')
ON CONFLICT DO NOTHING;

-- Скоринг
INSERT INTO system_settings (key, value, label, description, category) VALUES
('scoring.base_score',              '600',  'Базовий скоринговий бал',                   'Початковий бал до застосування знижок', 'scoring'),
('scoring.income_threshold',      '10000',  'Поріг доходу (грн)',                        'Дохід нижче якого знижується бал', 'scoring'),
('scoring.income_penalty',          '100',  'Штраф за низький дохід',                    'Зниження балу при доході нижче порогу', 'scoring'),
('scoring.overdue_penalty_per_loan', '20',  'Штраф за прострочений кредит (за одиницю)', 'Зниження балу за кожен прострочений кредит у БКІ', 'scoring'),
('scoring.max_delay_threshold',      '30',  'Поріг великої прострочки (днів)',           'Прострочка вище якої нараховується штраф', 'scoring'),
('scoring.max_delay_penalty',        '50',  'Штраф за велику прострочку',                'Зниження балу при прострочці вище порогу', 'scoring'),
('scoring.risk_medium_threshold',   '550',  'Поріг середнього ризику',                   'Бал нижче якого ризик = середній', 'scoring'),
('scoring.risk_high_threshold',     '500',  'Поріг високого ризику',                     'Бал нижче якого ризик = високий → авто-відмова', 'scoring')
ON CONFLICT DO NOTHING;

-- Бізнес-правила
INSERT INTO system_settings (key, value, label, description, category) VALUES
('rules.min_income',              '8000', 'Мінімальний дохід (грн)',         'Мінімальний місячний дохід клієнта', 'rules'),
('rules.dti_max',                  '0.4', 'Максимальний DTI',                'Максимальне відношення платежу до доходу', 'rules'),
('rules.min_employment_months',      '6', 'Мінімальний стаж (міс)',          'Мінімальний термін роботи на поточному місці', 'rules'),
('rules.forbidden_employment_type',  '4', 'Заборонений тип зайнятості (ID)', 'ID типу зайнятості для авто-відмови', 'rules')
ON CONFLICT DO NOTHING;

-- БКІ
INSERT INTO system_settings (key, value, label, description, category) VALUES
('bki.enabled',                    'true', 'БКІ перевірка активна',           'Враховувати дані БКІ при скорингу', 'bki'),
('bki.auto_reject_overdue_count',     '5', 'Авто-відмова: к-ть прострочених', 'Якщо прострочених кредитів >= N — авто-відмова', 'bki'),
('bki.auto_reject_max_days',         '90', 'Авто-відмова: макс. прострочка',  'Якщо макс. прострочка >= N днів — авто-відмова', 'bki')
ON CONFLICT DO NOTHING;
