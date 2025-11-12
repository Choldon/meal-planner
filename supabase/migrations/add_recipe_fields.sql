-- Migration: Add new fields to recipes table
-- Created: 2025-11-12
-- Description: Adds cuisine, rating, tags, and difficulty fields to support search and filtering

-- Add new columns to recipes table
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS cuisine VARCHAR(50) DEFAULT 'Other',
ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'Medium';

-- Add comments for documentation
COMMENT ON COLUMN recipes.cuisine IS 'Recipe cuisine type: Italian, Chinese, Indian, Mexican, British, Thai, Mediterranean, American, Other';
COMMENT ON COLUMN recipes.rating IS 'User rating from 0 to 5 stars (0.5 increments allowed)';
COMMENT ON COLUMN recipes.tags IS 'Array of tags for categorization (e.g., quick, healthy, family-friendly)';
COMMENT ON COLUMN recipes.difficulty IS 'Recipe difficulty level: Easy, Medium, Hard';

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine);
CREATE INDEX IF NOT EXISTS idx_recipes_rating ON recipes(rating DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN(tags);

-- Update existing recipes with default values based on their properties
-- Auto-detect cuisine from title (you can customize this based on your data)
UPDATE recipes 
SET cuisine = CASE
  WHEN LOWER(title) LIKE '%lasagne%' OR LOWER(title) LIKE '%pasta%' OR LOWER(title) LIKE '%pizza%' THEN 'Italian'
  WHEN LOWER(title) LIKE '%stir fry%' OR LOWER(title) LIKE '%wok%' THEN 'Chinese'
  WHEN LOWER(title) LIKE '%curry%' OR LOWER(title) LIKE '%tikka%' THEN 'Indian'
  WHEN LOWER(title) LIKE '%taco%' OR LOWER(title) LIKE '%burrito%' THEN 'Mexican'
  WHEN LOWER(title) LIKE '%fish and chips%' OR LOWER(title) LIKE '%shepherd%' THEN 'British'
  WHEN LOWER(title) LIKE '%pad thai%' OR LOWER(title) LIKE '%tom yum%' THEN 'Thai'
  WHEN LOWER(title) LIKE '%burger%' OR LOWER(title) LIKE '%bbq%' THEN 'American'
  WHEN LOWER(title) LIKE '%salad%' OR LOWER(title) LIKE '%hummus%' THEN 'Mediterranean'
  ELSE 'Other'
END
WHERE cuisine = 'Other';

-- Auto-calculate difficulty based on total cooking time
UPDATE recipes 
SET difficulty = CASE
  WHEN (prep_time + cook_time) < 30 THEN 'Easy'
  WHEN (prep_time + cook_time) < 60 THEN 'Medium'
  ELSE 'Hard'
END
WHERE difficulty = 'Medium';

-- Auto-generate tags based on recipe properties
UPDATE recipes 
SET tags = ARRAY(
  SELECT DISTINCT tag FROM (
    -- Time-based tags
    SELECT CASE WHEN (prep_time + cook_time) < 30 THEN 'quick' ELSE NULL END AS tag
    UNION ALL
    SELECT CASE WHEN (prep_time + cook_time) > 120 THEN 'slow-cooker' ELSE NULL END AS tag
    UNION ALL
    -- Diet-based tags
    SELECT CASE WHEN diet IN ('Vegetarian', 'Vegan') THEN 'healthy' ELSE NULL END AS tag
    UNION ALL
    -- Servings-based tags
    SELECT CASE WHEN servings >= 4 THEN 'family-friendly' ELSE NULL END AS tag
    UNION ALL
    -- Default tag
    SELECT 'weeknight' AS tag
  ) AS all_tags
  WHERE tag IS NOT NULL
)
WHERE tags = '{}';

-- Grant necessary permissions (adjust role names as needed)
-- GRANT SELECT, UPDATE ON recipes TO authenticated;
-- GRANT SELECT ON recipes TO anon;

-- Verification query (optional - comment out in production)
-- SELECT 
--   id, 
--   title, 
--   cuisine, 
--   rating, 
--   difficulty, 
--   tags,
--   prep_time + cook_time as total_time
-- FROM recipes
-- ORDER BY id
-- LIMIT 10;