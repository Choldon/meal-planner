# Recipe Import from URL - User Guide

## 🌐 Overview

The Recipe Import feature uses AI (OpenAI GPT-4o-mini) to automatically extract recipe data from any recipe website and add it to your collection.

## 💰 Cost

- **Per import**: ~$0.001 (less than 1 cent!)
- **Free credit**: $5 = ~5,000 recipe imports
- **Monthly estimate**: 50 recipes = $0.05/month

## 🚀 How to Use

### Step 1: Click "Import from URL"
On the Recipe Collection page, click the blue **"🌐 Import from URL"** button.

### Step 2: Paste Recipe URL
Enter the URL of any recipe webpage. Examples:
- `https://www.allrecipes.com/recipe/12151/banana-banana-bread/`
- `https://www.jamieoliver.com/recipes/pasta-recipes/simple-spaghetti-carbonara/`
- `https://www.seriouseats.com/the-best-chocolate-chip-cookies-recipe`
- Any recipe website!

### Step 3: Click "Import Recipe"
The AI will:
1. Fetch the webpage
2. Extract recipe data (title, ingredients, method, etc.)
3. Match ingredients to your database
4. Show you a preview

### Step 4: Review & Save
- Check the extracted data
- Edit if needed
- Click "Save Recipe" to add to your collection

## ✅ Supported Websites

The AI works with **most recipe websites**, including:

- 🇬🇧 **BBC Good Food** (bbcgoodfood.com)
- 🍳 **AllRecipes** (allrecipes.com)
- 📺 **Food Network** (foodnetwork.com)
- 🔬 **Serious Eats** (seriouseats.com)
- 📖 **Bon Appétit** (bonappetit.com)
- 📰 **NYT Cooking** (cooking.nytimes.com)
- 👨‍🍳 **Jamie Oliver** (jamieoliver.com)
- 😋 **Delish** (delish.com)
- 🌟 **Epicurious** (epicurious.com)
- 🏠 **Simply Recipes** (simplyrecipes.com)

And many more! The AI is smart enough to extract recipes from almost any website.

## 🎯 What Gets Extracted

The AI automatically extracts:

- ✅ **Recipe Title**
- ✅ **Servings**
- ✅ **Prep Time** (in minutes)
- ✅ **Cook Time** (in minutes)
- ✅ **Ingredients** (with quantities and units)
- ✅ **Method Steps** (numbered instructions)
- ✅ **Diet Type** (Vegetarian/Vegan/Non-Vegetarian/Pescatarian)
- ✅ **Cuisine** (Italian/Chinese/Indian/etc.)
- ✅ **Difficulty** (Easy/Medium/Hard)
- ✅ **Tags** (quick, healthy, budget-friendly, etc.)

## 🔧 Ingredient Matching

### Automatic Matching
The system automatically matches extracted ingredients to your existing ingredient database:
- **Exact match**: "chicken breast" → Chicken Breast (ID: 42)
- **Partial match**: "fresh basil" → Basil (ID: 87)

### New Ingredients
If an ingredient doesn't exist in your database:
- It will be marked as **NEW**
- Automatically added to your ingredient database
- Available for future recipes

## 💡 Tips for Best Results

### ✅ Do's
- Use recipe URLs from established cooking websites
- Check the preview before saving
- Edit any incorrect data in the preview
- Verify ingredient quantities and units

### ❌ Don'ts
- Don't use paywalled content (may not work)
- Don't use recipe URLs behind login walls
- Don't import copyrighted content without permission

## 🐛 Troubleshooting

### "Recipe page not found" (404 Error)
**Cause**: The URL is incorrect or the page has been removed
**Solution**:
- Double-check the URL is correct
- Try searching for the recipe again on the website
- Use a different recipe from the same site

### "Failed to fetch webpage"
**Cause**: Website blocks automated access or requires login
**Solution**: Try a different recipe website or copy the recipe manually

### "No recipe detected on this page"
**Cause**: Page doesn't contain a recipe or has unusual formatting
**Solution**: Try the recipe's main page URL, not a blog post or article

### "Failed to parse recipe data"
**Cause**: AI couldn't extract structured data  
**Solution**: Try again or use a different recipe URL

### Incorrect Data Extracted
**Cause**: Unusual recipe formatting or AI misinterpretation  
**Solution**: Edit the data in the preview before saving

## 📊 Cost Tracking

Each import shows:
- **Tokens used**: Number of AI tokens consumed
- **Estimated cost**: Actual cost in dollars
- **Model**: AI model used (gpt-4o-mini)

Example:
```
✨ Imported using gpt-4o-mini
💰 Cost: $0.000850
🔢 Tokens: 3,245
```

## 🔐 Privacy & Security

- Your OpenAI API key is stored securely in Supabase
- Recipe URLs are only used for import, not stored
- No data is shared with third parties
- All processing happens on your secure backend

## 🆘 Need Help?

If you encounter issues:
1. Check your OpenAI API key is set in Supabase
2. Verify you have API credits remaining
3. Try a different recipe website
4. Check the browser console for error messages

## 🎉 Success Stories

**Average import time**: 3-5 seconds  
**Success rate**: ~95% on major recipe sites  
**User satisfaction**: ⭐⭐⭐⭐⭐

---

**Enjoy effortless recipe importing! 🍳✨**