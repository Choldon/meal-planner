# Collaboration Guide for Kit & Jess's Meal Planner

This guide explains how to use the meal planner app collaboratively using shared JSON database files.

## 📁 Database Files

All your data is stored in JSON files located in `src/data/`:

- **`recipes.json`** - All your recipes
- **`ingredients.json`** - Complete ingredients database (96 items)
- **`meals.json`** - Planned meals on the calendar
- **shoppingList.json`** - Current shopping list items

## 🔄 How Collaboration Works

### Current Setup (Development Mode)

**Important:** In the current setup, changes are **NOT automatically saved** to the JSON files. Changes exist only in memory and will be lost when you refresh the page.

This is because React apps run in the browser and cannot directly write to files for security reasons.

### Options for 2-Person Collaboration

#### **Option 1: Manual File Sharing (Simplest)**

1. **Make changes in the app** (add recipes, plan meals, etc.)
2. **Export your data:**
   - Open browser console (Cmd+Option+J)
   - Type: `localStorage.getItem('recipes')` to see recipes
   - Copy the data
3. **Manually update the JSON files** in `src/data/`
4. **Share via cloud storage:**
   - Put the `meal-planner` folder in Dropbox, Google Drive, or iCloud
   - Both of you work from the same folder
   - Commit changes to the JSON files when done

#### **Option 2: Git Version Control (Recommended)**

1. **Initialize Git repository:**
   ```bash
   cd meal-planner
   git init
   git add .
   git commit -m "Initial meal planner setup"
   ```

2. **Create a private GitHub repository:**
   - Go to github.com
   - Create a new private repository
   - Follow instructions to push your code

3. **Collaboration workflow:**
   - **Kit makes changes:**
     - Edit JSON files directly in `src/data/`
     - Commit: `git add . && git commit -m "Added new recipes"`
     - Push: `git push`
   
   - **Jess gets changes:**
     - Pull: `git pull`
     - Restart app: `npm start`

#### **Option 3: Simple Backend API (Advanced)**

For automatic saving, you'll need a backend server. Here's a simple approach:

1. **Use a free backend service:**
   - **Supabase** (recommended) - Free PostgreSQL database
   - **Firebase** - Free real-time database
   - **MongoDB Atlas** - Free cloud database

2. **Benefits:**
   - Changes save automatically
   - Both can use the app simultaneously
   - No manual file management
   - Works from any device

## 📝 Editing JSON Files Directly

You can edit the database files directly in a text editor:

### Adding a Recipe

Edit `src/data/recipes.json`:

```json
{
  "id": 3,
  "title": "Spaghetti Bolognese",
  "diet": "Non-Vegetarian",
  "servings": 4,
  "prepTime": 15,
  "cookTime": 30,
  "ingredients": [
    { "ingredientId": 38, "quantity": 500, "unit": "g" },
    { "ingredientId": 46, "quantity": 400, "unit": "g" },
    { "ingredientId": 4, "quantity": 400, "unit": "g" }
  ],
  "method": [
    "Brown the mince in a large pan.",
    "Add chopped tomatoes and simmer for 20 minutes.",
    "Cook pasta according to package instructions.",
    "Serve bolognese over pasta."
  ]
}
```

### Adding an Ingredient

Edit `src/data/ingredients.json`:

```json
{ "id": 97, "name": "Basil", "category": "Fruit & Veg" }
```

**Important:** Always use unique IDs and maintain valid JSON format (commas, brackets, etc.)

## 🔧 Recommended Workflow for Kit & Jess

### Weekly Planning Session

1. **Both sit together** (or video call)
2. **Plan meals for the week** using the calendar
3. **Add any new recipes** needed
4. **Review shopping basket**
5. **One person commits the changes:**
   ```bash
   git add src/data/
   git commit -m "Week of [date] meal plan"
   git push
   ```

### Adding Recipes Separately

1. **Kit adds a recipe:**
   - Edit `recipes.json` directly
   - Commit and push changes
   
2. **Jess pulls changes:**
   - Run `git pull`
   - Restart the app to see new recipes

### Shopping

1. **Generate shopping list** from planned meals
2. **Add extra items** as needed
3. **One person takes a screenshot** or prints the list
4. **Check off items** while shopping
5. **Clear checked items** when done

## 🚀 Future Upgrade: Real-Time Collaboration

If you want automatic syncing without manual steps:

### Using Supabase (Free & Easy)

1. **Create free Supabase account** at supabase.com
2. **Create a new project**
3. **Create tables** for recipes, ingredients, meals, shopping list
4. **Update the app** to use Supabase client
5. **Both can use the app** from any device with automatic syncing

**Benefits:**
- ✅ Changes sync automatically
- ✅ Use from phone, tablet, or computer
- ✅ No manual file management
- ✅ Real-time updates
- ✅ Free tier is generous

Would you like help setting this up? Let me know!

## 📱 Mobile Access

### Current Setup
- App works on mobile browsers
- Data doesn't sync between devices

### With Backend (Supabase/Firebase)
- Access from any device
- All data syncs automatically
- Can add recipes from phone while shopping

## 🔒 Data Backup

**Important:** Always backup your JSON files!

### Automatic Backups
- If using Git: Every commit is a backup
- If using cloud storage: Automatic versioning

### Manual Backups
1. Copy the entire `src/data/` folder
2. Save to a backup location
3. Do this weekly or after major changes

## 💡 Tips

1. **Communicate:** Let each other know when making changes
2. **Pull before editing:** Always `git pull` before making changes
3. **Commit often:** Small, frequent commits are better
4. **Use descriptive messages:** "Added 3 new vegetarian recipes"
5. **Test after pulling:** Run `npm start` to verify changes work

## 🆘 Troubleshooting

**App won't start after pulling changes:**
- Check JSON files for syntax errors
- Use a JSON validator: jsonlint.com
- Restore from previous commit if needed

**Changes not showing:**
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Clear browser cache
- Restart the development server

**Merge conflicts (Git):**
- Happens if both edit same file simultaneously
- Resolve by choosing which version to keep
- Or manually merge the changes

## 📞 Need Help?

If you want to upgrade to automatic syncing with a backend, I can help you set that up! It's easier than it sounds and makes collaboration much smoother.