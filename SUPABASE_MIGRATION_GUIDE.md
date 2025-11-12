# Supabase Database Migration Guide

## Overview

This guide explains how to update your Supabase database to support the new recipe search and filter features.

## New Database Fields

The migration adds these columns to the `recipes` table:

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `cuisine` | VARCHAR(50) | 'Other' | Recipe cuisine type |
| `rating` | DECIMAL(2,1) | 0 | User rating (0-5 stars) |
| `tags` | TEXT[] | {} | Array of tags |
| `difficulty` | VARCHAR(20) | 'Medium' | Recipe difficulty level |

## Migration Methods

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration**
   - Copy the contents of `supabase/migrations/add_recipe_fields.sql`
   - Paste into the SQL editor
   - Click "Run" or press Cmd/Ctrl + Enter

4. **Verify the Migration**
   - Go to "Table Editor"
   - Select the `recipes` table
   - Verify the new columns appear

### Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
# Make sure you're in the project directory
cd /Users/kit/Desktop/meal-planner

# Link to your Supabase project (if not already linked)
supabase link --project-ref your-project-ref

# Run the migration
supabase db push

# Or apply the specific migration file
supabase migration up
```

### Option 3: Manual SQL Execution

If you prefer to run SQL manually:

```sql
-- 1. Add columns
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS cuisine VARCHAR(50) DEFAULT 'Other',
ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'Medium';

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine);
CREATE INDEX IF NOT EXISTS idx_recipes_rating ON recipes(rating DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN(tags);
```

## What the Migration Does

### 1. Adds New Columns
- Safely adds columns with `IF NOT EXISTS` to prevent errors
- Sets sensible defaults for all new fields
- Adds constraints (e.g., rating must be 0-5)

### 2. Creates Indexes
- **cuisine**: B-tree index for fast filtering
- **rating**: Descending index for sorting by rating
- **difficulty**: B-tree index for filtering
- **tags**: GIN index for array searching

### 3. Auto-Populates Data
- Detects cuisine from recipe titles
- Calculates difficulty from cooking times
- Generates tags based on recipe properties

## Verification

After running the migration, verify it worked:

```sql
-- Check table structure
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'recipes'
AND column_name IN ('cuisine', 'rating', 'tags', 'difficulty');

-- Check sample data
SELECT id, title, cuisine, rating, difficulty, tags
FROM recipes
LIMIT 5;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'recipes'
AND indexname LIKE 'idx_recipes_%';
```

## Rollback (If Needed)

If you need to undo the migration:

```sql
-- Remove indexes
DROP INDEX IF EXISTS idx_recipes_cuisine;
DROP INDEX IF EXISTS idx_recipes_rating;
DROP INDEX IF EXISTS idx_recipes_difficulty;
DROP INDEX IF EXISTS idx_recipes_tags;

-- Remove columns
ALTER TABLE recipes 
DROP COLUMN IF EXISTS cuisine,
DROP COLUMN IF EXISTS rating,
DROP COLUMN IF EXISTS tags,
DROP COLUMN IF EXISTS difficulty;
```

## Updating Existing Recipes

After migration, you can update existing recipes:

### Via SQL

```sql
-- Update a specific recipe
UPDATE recipes
SET 
  cuisine = 'Italian',
  rating = 4.5,
  difficulty = 'Medium',
  tags = ARRAY['quick', 'family-friendly', 'healthy']
WHERE id = 1;

-- Bulk update cuisines
UPDATE recipes
SET cuisine = 'Chinese'
WHERE title ILIKE '%stir fry%';
```

### Via Application

1. Open the meal planner app
2. Go to Recipe Menu
3. Click on a recipe
4. Click "Edit"
5. Update the new fields
6. Click "Update Recipe"

## Common Issues

### Issue: Migration fails with "column already exists"
**Solution**: The migration uses `IF NOT EXISTS`, so this shouldn't happen. If it does, the columns were already added.

### Issue: Tags not showing up
**Solution**: Tags are stored as PostgreSQL arrays. Make sure your Supabase client is configured to handle arrays properly.

### Issue: Rating validation error
**Solution**: Ensure ratings are between 0 and 5. The database has a CHECK constraint.

### Issue: Can't update recipes from the app
**Solution**: Check Row Level Security (RLS) policies. You may need to update them:

```sql
-- Allow authenticated users to update recipes
CREATE POLICY "Users can update recipes"
ON recipes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
```

## Performance Considerations

The migration creates indexes for:
- Fast filtering by cuisine, rating, difficulty
- Efficient tag searching using GIN index
- Quick sorting by rating

For large datasets (1000+ recipes):
- Indexes will significantly improve query performance
- Consider adding composite indexes if needed
- Monitor query performance in Supabase dashboard

## Security

### Row Level Security (RLS)

Ensure your RLS policies allow the new columns:

```sql
-- Example: Allow reading all recipe fields
CREATE POLICY "Anyone can read recipes"
ON recipes
FOR SELECT
TO anon, authenticated
USING (true);

-- Example: Allow authenticated users to update
CREATE POLICY "Authenticated users can update recipes"
ON recipes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
```

## Next Steps

After successful migration:

1. ✅ Test the search functionality
2. ✅ Test all filters
3. ✅ Update existing recipes with ratings
4. ✅ Add tags to your favorite recipes
5. ✅ Verify cuisine auto-detection worked correctly

## Support

If you encounter issues:

1. Check the Supabase logs in the dashboard
2. Verify your database connection
3. Ensure you have the necessary permissions
4. Review the error messages carefully

## Migration Checklist

- [ ] Backup your database (Supabase does this automatically)
- [ ] Run the migration SQL
- [ ] Verify new columns exist
- [ ] Check indexes were created
- [ ] Test updating a recipe from the app
- [ ] Verify search and filters work
- [ ] Update RLS policies if needed

---

**Migration File**: `supabase/migrations/add_recipe_fields.sql`
**Last Updated**: November 2025
**Version**: 1.0.0