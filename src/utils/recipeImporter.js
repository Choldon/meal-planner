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
 * Import a recipe from one or more images using OpenAI Vision
 *
 * @param {string|Array} imageData - Base64 encoded image data (string) or array of image objects
 * @returns {Promise<Object>} Imported recipe data
 */
export async function importRecipeFromImage(imageData) {
  try {
    // Handle both single image (string) and multiple images (array)
    let images;
    if (typeof imageData === 'string') {
      // Single image - backward compatibility
      images = [{ data: imageData, type: 'image/jpeg', name: 'image' }];
    } else if (Array.isArray(imageData)) {
      // Multiple images
      images = imageData;
    } else {
      throw new Error('Invalid image data format');
    }

    // Validate all images
    for (const img of images) {
      if (!img.data || typeof img.data !== 'string') {
        throw new Error('Invalid image data');
      }
    }

    console.log(`Calling import-recipe-from-image Edge Function with ${images.length} image(s)...`);

    // Call the Supabase Edge Function with all images
    const { data, error } = await supabase.functions.invoke('import-recipe-from-image', {
      body: { images }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to import recipe from image(s)');
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to extract recipe data from image(s)');
    }

    console.log('Recipe imported successfully from image(s):', data.recipe.title);
    console.log('Total cost:', data.metadata.estimatedCost);

    return {
      recipe: data.recipe,
      metadata: data.metadata
    };

  } catch (error) {
    console.error('Recipe image import error:', error);
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
        // Double-check for duplicates before creating (case-insensitive)
        const { data: existingIngredients, error: fetchError } = await supabase
          .from('ingredients')
          .select('*');

        if (fetchError) {
          console.error('Error fetching ingredients:', fetchError);
          continue;
        }

        const ingredientNameLower = ing.ingredientName.toLowerCase().trim();
        const duplicate = existingIngredients.find(
          existing => existing.name.toLowerCase().trim() === ingredientNameLower
        );

        if (duplicate) {
          console.log(`Ingredient "${ing.ingredientName}" already exists, using existing ID`);
          newIngredients.push({
            ...ing,
            ingredientId: duplicate.id,
            matched: true
          });
          continue;
        }

        // Use AI to categorize the ingredient
        let category = 'Other'; // Default fallback
        try {
          const { data: categoryData, error: categoryError } = await supabase.functions.invoke('categorize-ingredient', {
            body: { ingredientName: ing.ingredientName }
          });

          if (!categoryError && categoryData.success) {
            category = categoryData.category;
            console.log(`AI categorized "${ing.ingredientName}" as "${category}" (cost: $${categoryData.metadata.estimatedCost.toFixed(6)})`);
          } else {
            console.warn(`Failed to categorize "${ing.ingredientName}", using default category "Other"`);
          }
        } catch (categoryError) {
          console.warn(`Error categorizing "${ing.ingredientName}":`, categoryError);
        }

        // Create new ingredient if no duplicate found
        const newId = Date.now() + Math.floor(Math.random() * 1000);
        const { data, error } = await supabase
          .from('ingredients')
          .insert([{
            id: newId,
            name: ing.ingredientName,
            category: category
          }])
          .select()
          .single();

        if (error) {
          console.error('Error creating ingredient:', ing.ingredientName, error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          continue;
        }

        console.log(`Successfully created ingredient: "${data.name}" in category "${data.category}" with ID: ${data.id}`);

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