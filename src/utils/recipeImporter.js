/**
 * Recipe Importer Service
 * Handles communication with Supabase Edge Function for recipe import
 */

import { supabase } from './supabaseClient';

/**
 * Import a recipe from a URL using OpenAI
 * 
 * @param {string} url - The recipe webpage URL
 * @returns {Promise<Object>} Imported recipe data
 */
export async function importRecipeFromUrl(url) {
  try {
    // Validate URL format
    try {
      new URL(url);
    } catch {
      throw new Error('Please enter a valid URL');
    }

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('import-recipe', {
      body: { url }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to import recipe');
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to extract recipe data');
    }

    return {
      recipe: data.recipe,
      metadata: data.metadata
    };

  } catch (error) {
    console.error('Recipe import error:', error);
    throw error;
  }
}

/**
 * Match ingredient names to existing ingredients in database
 * 
 * @param {Array} extractedIngredients - Ingredients from OpenAI [{quantity, unit, name}]
 * @param {Array} dbIngredients - Existing ingredients from database
 * @returns {Array} Matched ingredients with ingredientId
 */
export function matchIngredients(extractedIngredients, dbIngredients) {
  return extractedIngredients.map(extracted => {
    // Try to find exact match first
    let match = dbIngredients.find(db => 
      db.name.toLowerCase() === extracted.name.toLowerCase()
    );

    // Try partial match if no exact match
    if (!match) {
      match = dbIngredients.find(db => 
        db.name.toLowerCase().includes(extracted.name.toLowerCase()) ||
        extracted.name.toLowerCase().includes(db.name.toLowerCase())
      );
    }

    return {
      ingredientId: match ? match.id : null,
      ingredientName: extracted.name, // Store original name for new ingredients
      quantity: extracted.quantity,
      unit: extracted.unit,
      matched: !!match
    };
  });
}

/**
 * Create new ingredients that don't exist in database
 * 
 * @param {Array} unmatchedIngredients - Ingredients without ingredientId
 * @returns {Promise<Array>} Created ingredient IDs
 */
export async function createMissingIngredients(unmatchedIngredients) {
  const newIngredients = [];

  for (const ing of unmatchedIngredients) {
    if (!ing.matched && ing.ingredientName) {
      try {
        const { data, error } = await supabase
          .from('ingredients')
          .insert([{ 
            id: Date.now() + Math.random(), // Temporary ID
            name: ing.ingredientName,
            category: 'Other' // Default category
          }])
          .select()
          .single();

        if (error) {
          console.error('Error creating ingredient:', error);
          continue;
        }

        newIngredients.push({
          ...ing,
          ingredientId: data.id,
          matched: true
        });
      } catch (error) {
        console.error('Failed to create ingredient:', ing.ingredientName, error);
      }
    }
  }

  return newIngredients;
}

/**
 * Validate imported recipe data
 * 
 * @param {Object} recipe - Recipe data to validate
 * @returns {Object} Validation result {valid: boolean, errors: Array}
 */
export function validateRecipe(recipe) {
  const errors = [];

  if (!recipe.title || recipe.title.trim() === '') {
    errors.push('Recipe title is required');
  }

  if (!recipe.servings || recipe.servings < 1) {
    errors.push('Servings must be at least 1');
  }

  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    errors.push('At least one ingredient is required');
  }

  if (!recipe.method || recipe.method.length === 0) {
    errors.push('At least one method step is required');
  }

  if (recipe.prepTime < 0 || recipe.cookTime < 0) {
    errors.push('Prep and cook times must be positive numbers');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Format recipe for database insertion
 * 
 * @param {Object} recipe - Imported recipe data
 * @param {Array} matchedIngredients - Ingredients with ingredientId
 * @returns {Object} Formatted recipe ready for database
 */
export function formatRecipeForDatabase(recipe, matchedIngredients) {
  return {
    title: recipe.title,
    diet: recipe.diet || 'Vegetarian',
    cuisine: recipe.cuisine || 'Other',
    rating: recipe.rating || 0,
    difficulty: recipe.difficulty || 'Medium',
    tags: recipe.tags || [],
    servings: parseInt(recipe.servings) || 2,
    prepTime: parseInt(recipe.prepTime) || 0,
    cookTime: parseInt(recipe.cookTime) || 0,
    ingredients: matchedIngredients
      .filter(ing => ing.ingredientId) // Only include matched ingredients
      .map(ing => ({
        ingredientId: ing.ingredientId,
        quantity: parseFloat(ing.quantity) || 0,
        unit: ing.unit || ''
      })),
    method: recipe.method.filter(step => step && step.trim() !== ''),
    sourceUrl: recipe.sourceUrl,
    importedAt: recipe.importedAt
  };
}

/**
 * Get supported recipe websites
 * 
 * @returns {Array} List of supported websites
 */
export function getSupportedWebsites() {
  return [
    { name: 'BBC Good Food', url: 'bbcgoodfood.com', icon: '🇬🇧' },
    { name: 'AllRecipes', url: 'allrecipes.com', icon: '🍳' },
    { name: 'Food Network', url: 'foodnetwork.com', icon: '📺' },
    { name: 'Serious Eats', url: 'seriouseats.com', icon: '🔬' },
    { name: 'Bon Appétit', url: 'bonappetit.com', icon: '📖' },
    { name: 'NYT Cooking', url: 'cooking.nytimes.com', icon: '📰' },
    { name: 'Jamie Oliver', url: 'jamieoliver.com', icon: '👨‍🍳' },
    { name: 'Delish', url: 'delish.com', icon: '😋' },
    { name: 'Epicurious', url: 'epicurious.com', icon: '🌟' },
    { name: 'Simply Recipes', url: 'simplyrecipes.com', icon: '🏠' }
  ];
}