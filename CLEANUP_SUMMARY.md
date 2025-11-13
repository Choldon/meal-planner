# Project Cleanup Summary

## Files to Delete

### Obsolete Components (Replaced)
- ✅ `src/components/RecipeImageImportModal.js` - Replaced by unified RecipeImportModal
- ✅ `src/styles/RecipeImageImportModal.css` - Associated styles no longer needed

### Old Data Files (Now using Supabase)
- ✅ `src/data/ingredients.json` - Migrated to Supabase database
- ✅ `src/data/meals.json` - Migrated to Supabase database
- ✅ `src/data/recipes.json` - Migrated to Supabase database
- ✅ `src/data/recipes.backup.json` - Old backup, no longer needed
- ✅ `src/data/shoppingList.json` - Migrated to Supabase database
- ✅ `src/data/` - Empty folder after cleanup

### Obsolete Utilities
- ✅ `src/utils/storage.js` - Old localStorage utility, replaced by Supabase client

### Test/Development Files
- ✅ `supabase/functions/import-recipe-test/` - Test Edge Function, not needed in production

### Duplicate Migrations
- ✅ `database/` - Duplicate of `supabase/migrations/`, keep supabase version

## Cleanup Commands

```bash
# Remove obsolete components
rm src/components/RecipeImageImportModal.js
rm src/styles/RecipeImageImportModal.css

# Remove old data files
rm -rf src/data/

# Remove obsolete utilities
rm src/utils/storage.js

# Remove test Edge Function
rm -rf supabase/functions/import-recipe-test/

# Remove duplicate database folder
rm -rf database/
```

## Files to Keep

### Active Components
- All other components in `src/components/`
- All other styles in `src/styles/`

### Active Utilities
- `src/utils/calendarSelector.js`
- `src/utils/eventParser.js`
- `src/utils/googleCalendar.js`
- `src/utils/recipeImporter.js`
- `src/utils/recipeMatcher.js`
- `src/utils/supabaseClient.js`
- `src/utils/syncEngine.js`

### Documentation (All useful)
- All `.md` files in root (guides and documentation)

### Edge Functions (Production)
- `supabase/functions/categorize-ingredient/`
- `supabase/functions/import-recipe/`
- `supabase/functions/import-recipe-from-image/`

### Migrations
- `supabase/migrations/` - Keep this version

## Space Saved
Approximately 50-100 KB (mostly from old JSON data files)

## Next Steps
1. Review this list
2. Run cleanup commands
3. Test application to ensure nothing breaks
4. Commit cleanup with message: "chore: Remove obsolete files and old data storage"