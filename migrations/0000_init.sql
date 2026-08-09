-- D1 Migration: 0000_init.sql
-- Description: Create records table for FSOS D1 authoritative persistence

CREATE TABLE IF NOT EXISTS records (
  key TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  data TEXT,
  updated_at TEXT NOT NULL,
  device_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  is_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_records_updated_at ON records(updated_at);
CREATE INDEX IF NOT EXISTS idx_records_table_name ON records(table_name);
