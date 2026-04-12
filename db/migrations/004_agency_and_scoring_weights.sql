-- Migration 004: Назва агенції та ваги характеристик скорингу
-- Застосована: 2026-04

-- Загальні налаштування
INSERT INTO system_settings (key, value, label, description, category) VALUES
('agency.name', 'КредитБюро', 'Назва кредитної агенції', 'Відображається у заголовку системи', 'general')
ON CONFLICT DO NOTHING;

-- Ваги характеристик скорингу (множники штрафів, 1.0 = стандарт)
INSERT INTO system_settings (key, value, label, description, category) VALUES
('scoring.weight_income',     '1.0', 'Вага характеристики: Дохід',           'Множник для штрафу за низький дохід (1.0 = без зміни)', 'scoring'),
('scoring.weight_bki',        '1.0', 'Вага характеристики: КІ (БКІ)',         'Множник для штрафів за прострочки у БКІ (1.0 = без зміни)', 'scoring'),
('scoring.weight_employment', '1.0', 'Вага характеристики: Зайнятість/стаж', 'Резервний множник для майбутніх штрафів за стаж (1.0 = без зміни)', 'scoring')
ON CONFLICT DO NOTHING;
