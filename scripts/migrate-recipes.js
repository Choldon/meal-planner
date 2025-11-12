const fs = require('fs');
const path = require('path');

// Read current recipes
const recipesPath = path.join(__dirname, '../src/data/recipes.json');
const recipes = JSON.parse(fs.readFileSync(recipesPath, 'utf8'));

// Backup original file
const backupPath = path.join(__dirname, '../src/data/recipes.backup.json');
fs.writeFileSync(backupPath, JSON.stringify(recipes, null, 2));
console.log('✅ Backup created at:', backupPath);

// Cuisine mapping based on recipe names
const cuisineMap = {
  'lasagne': 'Italian',
  'pasta': 'Italian',
  'pizza': 'Italian',
  'stir fry': 'Chinese',
  'curry': 'Indian',
  'taco': 'Mexican',
  'burrito': 'Mexican',
  'fish and chips': 'British',
  'shepherd': 'British',
  'pad thai': 'Thai',
  'tom yum': 'Thai',
  'burger': 'American',
  'salad': 'Mediterranean'
};

// Difficulty based on cooking time
const getDifficulty = (prepTime, cookTime) => {
  const totalTime = prepTime + cookTime;
  if (totalTime < 30) return 'Easy';
  if (totalTime < 60) return 'Medium';
  return 'Hard';
};

// Auto-generate tags based on recipe properties
const generateTags = (recipe) => {
  const tags = [];
  const totalTime = recipe.prepTime + recipe.cookTime;
  
  // Time-based tags
  if (totalTime < 30) tags.push('quick');
  if (totalTime > 120) tags.push('slow-cooker');
  
  // Diet-based tags
  if (recipe.diet === 'Vegetarian' || recipe.diet === 'Vegan') {
    tags.push('healthy');
  }
  
  // Servings-based tags
  if (recipe.servings >= 4) tags.push('family-friendly');
  
  // Default tags
  tags.push('weeknight');
  
  return tags;
};

// Detect cuisine from title
const detectCuisine = (title) => {
  const lowerTitle = title.toLowerCase();
  for (const [keyword, cuisine] of Object.entries(cuisineMap)) {
    if (lowerTitle.includes(keyword)) {
      return cuisine;
    }
  }
  return 'Other';
};

// Migrate recipes
const migratedRecipes = recipes.map(recipe => ({
  ...recipe,
  cuisine: recipe.cuisine || detectCuisine(recipe.title),
  rating: recipe.rating || 0, // Default to 0 (unrated)
  tags: recipe.tags || generateTags(recipe),
  difficulty: recipe.difficulty || getDifficulty(recipe.prepTime, recipe.cookTime)
}));

// Write migrated recipes
fs.writeFileSync(recipesPath, JSON.stringify(migratedRecipes, null, 2));
console.log('✅ Migration complete!');
console.log(`   Migrated ${migratedRecipes.length} recipes`);
console.log('   New fields added: cuisine, rating, tags, difficulty');
console.log('\nSample migrated recipe:');
console.log(JSON.stringify(migratedRecipes[0], null, 2));