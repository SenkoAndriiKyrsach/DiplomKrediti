-- ════════════════════════════════════════════════════════════
-- Migration 007: Clean up all test application/loan data
-- Keeps: customers, credit products, system settings, scoring config
-- Deletes: applications, credits, payments, decisions, scoring results
-- ════════════════════════════════════════════════════════════

-- 1. Payment schedules (depends on credit)
TRUNCATE TABLE payment_schedule CASCADE;

-- 2. Payments
TRUNCATE TABLE payment CASCADE;

-- 3. Credits (depends on application)
TRUNCATE TABLE credit CASCADE;

-- 4. Business rules checks
TRUNCATE TABLE business_rules_check CASCADE;

-- 5. Scoring results
TRUNCATE TABLE scoring_result CASCADE;

-- 6. Manager decisions (depends on application)
TRUNCATE TABLE manager_decision CASCADE;

-- 7. Credit history reports (БКІ)
TRUNCATE TABLE credit_history_report CASCADE;

-- 8. Applications
TRUNCATE TABLE application CASCADE;

-- Verify
SELECT 'applications'      AS tbl, COUNT(*) AS cnt FROM application
UNION ALL
SELECT 'credits',                  COUNT(*) FROM credit
UNION ALL
SELECT 'payment_schedule',         COUNT(*) FROM payment_schedule
UNION ALL
SELECT 'manager_decision',         COUNT(*) FROM manager_decision
UNION ALL
SELECT 'scoring_result',           COUNT(*) FROM scoring_result
UNION ALL
SELECT 'customers_kept',           COUNT(*) FROM customer;
