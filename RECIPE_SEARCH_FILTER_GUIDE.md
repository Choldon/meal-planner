# Recipe Search & Filter System Guide

## Overview

The meal planner now includes a comprehensive search and filtering system for recipes, making it easy to find exactly what you're looking for.

## New Recipe Fields

Each recipe now includes these additional fields:

- **Cuisine**: Italian, Chinese, Indian, Mexican, British, Thai, Mediterranean, American, Other
- **Rating**: 0-5 stars (0.5 increments)
- **Tags**: Flexible categorization (e.g., quick, healthy, family-friendly)
- **Difficulty**: Easy, Medium, Hard

## Features

### 🔍 Search Bar
- **Search by**: Recipe title, ingredients, tags, or cuisine
- **Real-time filtering**: Results update as you type
- **Case-insensitive**: Searches work regardless of capitalization

### 🎯 Filters

#### Diet Filter
- All Diets
- Vegetarian
- Vegan
- Non-Vegetarian
- Pescatarian

#### Cuisine Filter
- All Cuisines
- Italian, Chinese, Indian, Mexican, British, Thai, Mediterranean, American, Other

#### Rating Filter
- All Ratings
- 4★ and above
- 3★ and above
- 2★ and above
- 1★ and above

#### Time Filter
- Any Time
- Under 30 mins
- Under 1 hour
- Under 2 hours
- Over 2 hours

#### Difficulty Filter
- All Difficulties
- Easy
- Medium
- Hard

### 🏷️ Tag Filtering
- Click tags to filter recipes
- Multiple tags can be selected
- Tags are auto-generated based on recipe properties

## Using the System

### Adding a New Recipe

1. Click **"+ Add New Recipe"**
2. Fill in the basic information:
   - Title (required)
   - Diet Type
   - Cuisine
   - Difficulty
   - Rating (0-5)
3. Add timing:
   - Servings
   - Prep Time
   - Cook Time
4. Add tags (comma-separated):
   - Example: `quick, healthy, budget-friendly`
5. Add ingredients and method steps
6. Click **"Add Recipe"**

### Searching for Recipes

1. Type in the search bar at the top
2. Search works across:
   - Recipe titles
   - Ingredient names
   - Tags
   - Cuisine types

### Filtering Recipes

1. Click the **"▶ Filters"** button to expand filters
2. Select your criteria from the dropdowns
3. Click tags to include/exclude them
4. The recipe count updates automatically
5. Click **"Clear All Filters"** to reset

### Viewing Recipe Details

1. Click any recipe card
2. View:
   - Star rating
   - Full metadata (diet, cuisine, difficulty, servings, times)
   - Tags
   - Ingredients list
   - Step-by-step method

## Database Migration

### Automatic Migration

The migration script has already been run and:
- ✅ Created a backup at `src/data/recipes.backup.json`
- ✅ Added new fields to all existing recipes
- ✅ Auto-detected cuisines from recipe titles
- ✅ Generated tags based on recipe properties
- ✅ Calculated difficulty from cooking times

### Manual Migration (if needed)

If you need to re-run the migration:

```bash
node scripts/migrate-recipes.js
```

This will:
1. Backup your current recipes
2. Add missing fields with sensible defaults
3. Preserve all existing data

## Suggested Tags

Use these tag categories for consistency:

**Meal Type**: breakfast, lunch, dinner, snack, dessert

**Speed**: quick (< 30 mins), make-ahead, slow-cooker

**Health**: healthy, low-carb, high-protein, gluten-free

**Budget**: budget-friendly, expensive

**Occasion**: weeknight, weekend, party, date-night

**Family**: kid-friendly, family-friendly

**Style**: comfort-food, light, hearty

## Mobile Experience

The search and filter system is fully mobile-responsive:

- **Search bar**: Full-width, touch-friendly
- **Filters**: Collapsible panel to save space
- **Tags**: Horizontal scrollable chips
- **Recipe cards**: Single column layout
- **All inputs**: 16px font size to prevent iOS zoom

## Tips for Best Results

1. **Use specific searches**: "chicken" finds all chicken recipes
2. **Combine filters**: Search + filters work together
3. **Tag consistently**: Use the same tags across recipes
4. **Rate your recipes**: Helps find favorites quickly
5. **Update cuisines**: Ensure accurate cuisine classification

## Updating Existing Recipes

To add new fields to existing recipes:

1. Click a recipe card
2. Click **"Edit"**
3. Update the new fields:
   - Cuisine
   - Rating
   - Difficulty
   - Tags
4. Click **"Update Recipe"**

## Future Enhancements

Potential additions:
- Sort by rating, time, or name
- Save favorite recipes
- Recipe collections/meal plans
- Nutritional information
- Photo uploads
- Print-friendly recipe cards

## Troubleshooting

### Recipes not showing up?
- Check if filters are too restrictive
- Click "Clear All Filters"
- Ensure recipes have the required fields

### Search not working?
- Check spelling
- Try broader search terms
- Use tags instead of full phrases

### Tags not appearing?
- Edit the recipe and add tags
- Use comma-separated format
- Tags are case-sensitive in display

## Technical Details

### Search Algorithm
- Searches across: title, tags, cuisine, ingredient names
- Case-insensitive matching
- Partial word matching supported

### Filter Logic
- All filters use AND logic (must match all selected criteria)
- Tags use AND logic (recipe must have all selected tags)
- Empty filters are ignored

### Performance
- Filters use React useMemo for optimization
- Search is debounced for better performance
- Supports hundreds of recipes efficiently

## Support

For issues or questions:
1. Check this guide first
2. Review the backup file if data seems wrong
3. Re-run migration script if needed
4. Check browser console for errors

---

**Last Updated**: November 2025
**Version**: 1.0.0