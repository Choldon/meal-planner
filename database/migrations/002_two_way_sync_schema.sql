-- Migration: Two-Way Google Calendar Sync Schema
-- Description: Adds tables and columns needed for bidirectional sync between Meal Planner and Google Calendar
-- Date: 2025-11-11

-- ============================================================================
-- 1. Update meals table with sync tracking columns
-- ============================================================================

-- Add last_synced_at to track when meal was last synced
ALTER TABLE meals 
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

-- Add sync_source to track where the meal originated
ALTER TABLE meals 
ADD COLUMN IF NOT EXISTS sync_source TEXT DEFAULT 'meal_planner';

-- Add comment for documentation
COMMENT ON COLUMN meals.last_synced_at IS 'Timestamp of last successful sync with Google Calendar';
COMMENT ON COLUMN meals.sync_source IS 'Source of meal creation: meal_planner or google_calendar';

-- ============================================================================
-- 2. Create sync_log table for tracking all sync operations
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_log (
  id BIGSERIAL PRIMARY KEY,
  event_id TEXT NOT NULL,
  meal_id BIGINT REFERENCES meals(id) ON DELETE CASCADE,
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('to_google', 'from_google', 'bidirectional')),
  sync_status TEXT NOT NULL CHECK (sync_status IN ('success', 'failed', 'conflict')),
  sync_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sync_log_event_id ON sync_log(event_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_meal_id ON sync_log(meal_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_sync_time ON sync_log(sync_time DESC);
CREATE INDEX IF NOT EXISTS idx_sync_log_sync_status ON sync_log(sync_status);

-- Add comments
COMMENT ON TABLE sync_log IS 'Tracks all synchronization operations between Meal Planner and Google Calendar';
COMMENT ON COLUMN sync_log.event_id IS 'Google Calendar event ID';
COMMENT ON COLUMN sync_log.meal_id IS 'Reference to meals table';
COMMENT ON COLUMN sync_log.sync_direction IS 'Direction of sync: to_google, from_google, or bidirectional';
COMMENT ON COLUMN sync_log.sync_status IS 'Status of sync operation: success, failed, or conflict';
COMMENT ON COLUMN sync_log.metadata IS 'Additional sync metadata in JSON format';

-- ============================================================================
-- 3. Create unmatched_events table for Google Calendar events without recipes
-- ============================================================================

CREATE TABLE IF NOT EXISTS unmatched_events (
  id BIGSERIAL PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_title TEXT NOT NULL,
  event_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('Lunch', 'Dinner', 'Breakfast')),
  recipe_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'ignored')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_recipe_id BIGINT REFERENCES recipes(id) ON DELETE SET NULL,
  notes TEXT
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_unmatched_events_event_id ON unmatched_events(event_id);
CREATE INDEX IF NOT EXISTS idx_unmatched_events_status ON unmatched_events(status);
CREATE INDEX IF NOT EXISTS idx_unmatched_events_event_date ON unmatched_events(event_date);

-- Add comments
COMMENT ON TABLE unmatched_events IS 'Stores Google Calendar events that could not be matched to existing recipes';
COMMENT ON COLUMN unmatched_events.event_id IS 'Google Calendar event ID';
COMMENT ON COLUMN unmatched_events.event_title IS 'Original event title from Google Calendar';
COMMENT ON COLUMN unmatched_events.recipe_name IS 'Extracted recipe name from event title';
COMMENT ON COLUMN unmatched_events.status IS 'Status: pending (awaiting user action), matched (linked to recipe), or ignored (user chose to skip)';
COMMENT ON COLUMN unmatched_events.resolved_recipe_id IS 'Recipe ID if user matched or created a recipe';

-- ============================================================================
-- 4. Enable Row Level Security (RLS) on new tables
-- ============================================================================

ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE unmatched_events ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since it's just Kit & Jess)
CREATE POLICY "Enable all for sync_log" ON sync_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for unmatched_events" ON unmatched_events FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 5. Create helper functions
-- ============================================================================

-- Function to get unmatched events count
CREATE OR REPLACE FUNCTION get_unmatched_events_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM unmatched_events WHERE status = 'pending');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_unmatched_events_count() IS 'Returns count of pending unmatched events';

-- Function to log sync operation
CREATE OR REPLACE FUNCTION log_sync_operation(
  p_event_id TEXT,
  p_meal_id BIGINT,
  p_direction TEXT,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  v_log_id BIGINT;
BEGIN
  INSERT INTO sync_log (event_id, meal_id, sync_direction, sync_status, error_message, metadata)
  VALUES (p_event_id, p_meal_id, p_direction, p_status, p_error_message, p_metadata)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_sync_operation IS 'Helper function to log sync operations';

-- ============================================================================
-- 6. Create views for easier querying
-- ============================================================================

-- View for recent sync activity
CREATE OR REPLACE VIEW recent_sync_activity AS
SELECT 
  sl.id,
  sl.event_id,
  sl.meal_id,
  m.date AS meal_date,
  r.title AS recipe_title,
  sl.sync_direction,
  sl.sync_status,
  sl.sync_time,
  sl.error_message
FROM sync_log sl
LEFT JOIN meals m ON sl.meal_id = m.id
LEFT JOIN recipes r ON m.recipe_id = r.id
ORDER BY sl.sync_time DESC
LIMIT 100;

COMMENT ON VIEW recent_sync_activity IS 'Shows recent sync activity with meal and recipe details';

-- View for pending unmatched events
CREATE OR REPLACE VIEW pending_unmatched_events AS
SELECT 
  id,
  event_id,
  event_title,
  event_date,
  meal_type,
  recipe_name,
  created_at,
  EXTRACT(DAY FROM NOW() - created_at) AS days_pending
FROM unmatched_events
WHERE status = 'pending'
ORDER BY event_date DESC;

COMMENT ON VIEW pending_unmatched_events IS 'Shows all pending unmatched events with days pending';

-- ============================================================================
-- 7. Grant permissions (if needed for specific users)
-- ============================================================================

-- Since we're using RLS with allow-all policies, no additional grants needed
-- But documenting for future reference:
-- GRANT ALL ON sync_log TO authenticated;
-- GRANT ALL ON unmatched_events TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 002_two_way_sync_schema completed successfully';
  RAISE NOTICE 'Added columns: meals.last_synced_at, meals.sync_source';
  RAISE NOTICE 'Created tables: sync_log, unmatched_events';
  RAISE NOTICE 'Created functions: get_unmatched_events_count, log_sync_operation';
  RAISE NOTICE 'Created views: recent_sync_activity, pending_unmatched_events';
END $$;