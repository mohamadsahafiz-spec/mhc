-- D1 Migration: 0001_add_indexes.sql
-- Description: Add performance indexes on updated_at and table_name columns for FSOS records

CREATE INDEX IF NOT EXISTS idx_records_updated_at ON records(updated_at);
CREATE INDEX IF NOT EXISTS idx_records_table_name ON records(table_name);
