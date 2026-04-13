-- ════════════════════════════════════════════════════════════
-- Migration 008: System activity log table
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system_log (
    log_id      SERIAL PRIMARY KEY,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action_type VARCHAR(30)  NOT NULL,   -- 'application' | 'status_change' | 'admin'
    actor       VARCHAR(100),            -- хто зробив: логін або 'система'
    description TEXT         NOT NULL,   -- що зробилось (читабельно)
    entity_id   INTEGER                  -- прив'язаний id (application_id тощо)
);

CREATE INDEX IF NOT EXISTS idx_system_log_created  ON system_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_log_type     ON system_log (action_type);
