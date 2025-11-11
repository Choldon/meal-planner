# Database Migrations

This directory contains SQL migration scripts for the Meal Planner database schema.

## Migration Files

### 002_two_way_sync_schema.sql
**Purpose:** Adds database schema for two-way Google Calendar synchronization

**Changes:**
- Adds `last_synced_at` and `sync_source` columns to `meals` table
- Creates `sync_log` table for tracking all sync operations
- Creates `unmatched_events` table for Google Calendar events without matching recipes
- Creates helper functions for sync operations
- Creates views for easier querying of sync data
- Enables Row Level Security (RLS) on new tables

## How to Apply Migrations

### Using Supabase Dashboard (Recommended)

1. **Navigate to SQL Editor:**
   - Go to your Supabase project dashboard
   - Click on "SQL Editor" in the left sidebar

2. **Create New Query:**
   - Click "New query" button
   - Copy the entire contents of the migration file
   - Paste into the SQL editor

3. **Execute Migration:**
   - Click "Run" button to execute the migration
   - Check for any errors in the output panel
   - Verify success message appears

4. **Verify Changes:**
   - Go to "Table Editor" in the left sidebar
   - Check that new columns appear in `meals` table
   - Check that new tables `sync_log` and `unmatched_events` exist
   - Go to "Database" → "Functions" to verify helper functions were created
   - Go to "Database" → "Views" to verify views were created

### Using Supabase CLI (Alternative)

If you have the Supabase CLI installed:

```bash
# Navigate to project directory
cd meal-planner

# Apply migration
supabase db push --file database/migrations/002_two_way_sync_schema.sql
```

## Rollback (If Needed)

If you need to rollback this migration, run the following SQL:

```sql
-- Drop views
DROP VIEW IF EXISTS recent_sync_activity;
DROP VIEW IF EXISTS pending_unmatched_events;

-- Drop functions
DROP FUNCTION IF EXISTS get_unmatched_events_count();
DROP FUNCTION IF EXISTS log_sync_operation(TEXT, BIGINT, TEXT, TEXT, TEXT, JSONB);

-- Drop tables
DROP TABLE IF EXISTS unmatched_events;
DROP TABLE IF EXISTS sync_log;

-- Remove columns from meals table
ALTER TABLE meals DROP COLUMN IF EXISTS last_synced_at;
ALTER TABLE meals DROP COLUMN IF EXISTS sync_source;
```

## Testing the Migration

After applying the migration, you can test it with these queries:

```sql
-- Check meals table columns
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'meals' 
  AND column_name IN ('last_synced_at', 'sync_source');

-- Check sync_log table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sync_log';

-- Check unmatched_events table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'unmatched_events';

-- Test helper function
SELECT get_unmatched_events_count();

-- View recent sync activity (should be empty initially)
SELECT * FROM recent_sync_activity;

-- View pending unmatched events (should be empty initially)
SELECT * FROM pending_unmatched_events;
```

## Migration History

| Migration | Date | Description |
|-----------|------|-------------|
| 001_initial_schema.sql | 2025-11-XX | Initial database schema (meals, recipes, ingredients, etc.) |
| 002_two_way_sync_schema.sql | 2025-11-11 | Two-way Google Calendar sync schema |

## Notes

- All migrations include `IF NOT EXISTS` clauses to prevent errors if run multiple times
- Row Level Security (RLS) is enabled on new tables with allow-all policies (since it's just Kit & Jess)
- Indexes are created for optimal query performance
- Comments are added to tables, columns, and functions for documentation
- Helper functions simplify common sync operations
- Views provide convenient access to sync data