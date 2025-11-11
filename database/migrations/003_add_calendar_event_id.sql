-- Migration: Add calendar_event_id column to meals table
-- Description: Adds the missing calendar_event_id column for tracking synced Google Calendar events
-- Date: 2025-11-11

-- Add calendar_event_id column to meals table
ALTER TABLE meals 
ADD COLUMN IF NOT EXISTS calendar_event_id TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_meals_calendar_event_id ON meals(calendar_event_id);

-- Add comment for documentation
COMMENT ON COLUMN meals.calendar_event_id IS 'Google Calendar event ID for synced events';

-- Verify the column was added
DO $$
BEGIN
  RAISE NOTICE 'Migration 003_add_calendar_event_id completed successfully';
  RAISE NOTICE 'Added column: meals.calendar_event_id';
END $$;