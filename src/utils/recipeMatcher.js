/**
 * Recipe Matcher Utility
 * Matches recipe names from Google Calendar events to existing recipes in the database
 * Uses fuzzy matching to handle variations in naming
 */

import { normalizeRecipeName } from './eventParser';

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching of recipe names
 * 
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} The Levenshtein distance
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings (0-1)
 * 1 = identical, 0 = completely different
 * 
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score between 0 and 1
 */
function calculateSimilarity(str1, str2) {
  const normalized1 = normalizeRecipeName(str1);
  const normalized2 = normalizeRecipeName(str2);

  if (normalized1 === normalized2) {
    return 1.0;
  }

  const maxLength = Math.max(normalized1.length, normalized2.length);
  if (maxLength === 0) {
    return 0;
  }

  const distance = levenshteinDistance(normalized1, normalized2);
  return 1 - (distance / maxLength);
}

/**
 * Match a recipe name to existing recipes
 * 
 * @param {string} recipeName - The recipe name to match
 * @param {Array} recipes - Array of recipe objects from database
 * @param {number} threshold - Minimum similarity score (0-1) for a match (default: 0.8)
 * @returns {Object} Match result
 * @returns {Object|null} return.exactMatch - Exact match recipe or null
 * @returns {Array} return.fuzzyMatches - Array of fuzzy matches sorted by similarity
 * @returns {Array} return.partialMatches - Array of partial matches (contains substring)
 * 
 * @example
 * const recipes = [
 *   { id: 1, title: 'Spaghetti Carbonara' },
 *   { id: 2, title: 'Thai Green Curry' },
 *   { id: 3, title: 'Spaghetti Bolognese' }
 * ];
 * 
 * matchRecipe('spaghetti carbonara', recipes)
 * // Returns: { exactMatch: { id: 1, ... }, fuzzyMatches: [], partialMatches: [] }
 * 
 * matchRecipe('Spaghetti Carbona', recipes, 0.8)
 * // Returns: { exactMatch: null, fuzzyMatches: [{ recipe: { id: 1, ... }, score: 0.95 }], ... }
 */
export function matchRecipe(recipeName, recipes, threshold = 0.8) {
  if (!recipeName || !Array.isArray(recipes) || recipes.length === 0) {
    return {
      exactMatch: null,
      fuzzyMatches: [],
      partialMatches: []
    };
  }

  const normalizedSearchName = normalizeRecipeName(recipeName);
  const fuzzyMatches = [];
  const partialMatches = [];
  let exactMatch = null;

  for (const recipe of recipes) {
    const normalizedRecipeTitle = normalizeRecipeName(recipe.title);

    // Check for exact match
    if (normalizedSearchName === normalizedRecipeTitle) {
      exactMatch = recipe;
      continue;
    }

    // Calculate similarity score
    const similarity = calculateSimilarity(recipeName, recipe.title);

    // Check for fuzzy match
    if (similarity >= threshold) {
      fuzzyMatches.push({
        recipe,
        score: similarity,
        confidence: similarity >= 0.9 ? 'high' : similarity >= 0.8 ? 'medium' : 'low'
      });
    }

    // Check for partial match (substring)
    if (normalizedRecipeTitle.includes(normalizedSearchName) || 
        normalizedSearchName.includes(normalizedRecipeTitle)) {
      partialMatches.push({
        recipe,
        matchType: normalizedRecipeTitle.includes(normalizedSearchName) ? 'contains' : 'contained_in'
      });
    }
  }

  // Sort fuzzy matches by score (highest first)
  fuzzyMatches.sort((a, b) => b.score - a.score);

  return {
    exactMatch,
    fuzzyMatches,
    partialMatches
  };
}

/**
 * Find the best match for a recipe name
 * Returns the single best match or null if no good match found
 * 
 * @param {string} recipeName - The recipe name to match
 * @param {Array} recipes - Array of recipe objects
 * @param {number} threshold - Minimum similarity score (default: 0.85)
 * @returns {Object|null} Best matching recipe or null
 * @returns {Object} return.recipe - The matched recipe object
 * @returns {number} return.score - The similarity score
 * @returns {string} return.matchType - Type of match: 'exact', 'fuzzy', or 'partial'
 * 
 * @example
 * findBestMatch('Spaghetti Carbonara', recipes)
 * // Returns: { recipe: { id: 1, title: 'Spaghetti Carbonara' }, score: 1.0, matchType: 'exact' }
 */
export function findBestMatch(recipeName, recipes, threshold = 0.85) {
  const matches = matchRecipe(recipeName, recipes, threshold);

  // Return exact match if found
  if (matches.exactMatch) {
    return {
      recipe: matches.exactMatch,
      score: 1.0,
      matchType: 'exact'
    };
  }

  // Return best fuzzy match if available
  if (matches.fuzzyMatches.length > 0) {
    const best = matches.fuzzyMatches[0];
    return {
      recipe: best.recipe,
      score: best.score,
      matchType: 'fuzzy',
      confidence: best.confidence
    };
  }

  // Return best partial match if available
  if (matches.partialMatches.length > 0) {
    const best = matches.partialMatches[0];
    return {
      recipe: best.recipe,
      score: 0.7, // Arbitrary score for partial matches
      matchType: 'partial',
      partialMatchType: best.matchType
    };
  }

  return null;
}

/**
 * Batch match multiple recipe names to existing recipes
 * 
 * @param {Array<string>} recipeNames - Array of recipe names to match
 * @param {Array} recipes - Array of recipe objects
 * @param {number} threshold - Minimum similarity score (default: 0.8)
 * @returns {Array} Array of match results
 * 
 * @example
 * batchMatchRecipes(['Pasta', 'Curry', 'Unknown Recipe'], recipes)
 * // Returns: [
 * //   { recipeName: 'Pasta', match: { recipe: {...}, score: 0.9, matchType: 'fuzzy' } },
 * //   { recipeName: 'Curry', match: { recipe: {...}, score: 1.0, matchType: 'exact' } },
 * //   { recipeName: 'Unknown Recipe', match: null }
 * // ]
 */
export function batchMatchRecipes(recipeNames, recipes, threshold = 0.8) {
  if (!Array.isArray(recipeNames) || !Array.isArray(recipes)) {
    return [];
  }

  return recipeNames.map(recipeName => ({
    recipeName,
    match: findBestMatch(recipeName, recipes, threshold)
  }));
}

/**
 * Get suggestions for unmatched recipe names
 * Returns top N similar recipes that might be what the user meant
 * 
 * @param {string} recipeName - The unmatched recipe name
 * @param {Array} recipes - Array of recipe objects
 * @param {number} maxSuggestions - Maximum number of suggestions (default: 5)
 * @param {number} minScore - Minimum similarity score for suggestions (default: 0.5)
 * @returns {Array} Array of suggested recipes with scores
 * 
 * @example
 * getSuggestions('Spagetti', recipes, 3)
 * // Returns: [
 * //   { recipe: { id: 1, title: 'Spaghetti Carbonara' }, score: 0.85 },
 * //   { recipe: { id: 3, title: 'Spaghetti Bolognese' }, score: 0.82 }
 * // ]
 */
export function getSuggestions(recipeName, recipes, maxSuggestions = 5, minScore = 0.5) {
  if (!recipeName || !Array.isArray(recipes)) {
    return [];
  }

  const suggestions = recipes
    .map(recipe => ({
      recipe,
      score: calculateSimilarity(recipeName, recipe.title)
    }))
    .filter(item => item.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions);

  return suggestions;
}

/**
 * Check if a recipe name is likely a typo or variation of an existing recipe
 * 
 * @param {string} recipeName - The recipe name to check
 * @param {Array} recipes - Array of recipe objects
 * @returns {Object} Analysis result
 * @returns {boolean} return.isLikelyTypo - Whether this is likely a typo
 * @returns {Object|null} return.suggestedRecipe - The most likely intended recipe
 * @returns {number} return.confidence - Confidence score (0-1)
 * 
 * @example
 * isLikelyTypo('Spagetti Carbonara', recipes)
 * // Returns: { 
 * //   isLikelyTypo: true, 
 * //   suggestedRecipe: { id: 1, title: 'Spaghetti Carbonara' },
 * //   confidence: 0.92
 * // }
 */
export function isLikelyTypo(recipeName, recipes) {
  const bestMatch = findBestMatch(recipeName, recipes, 0.7);

  if (!bestMatch) {
    return {
      isLikelyTypo: false,
      suggestedRecipe: null,
      confidence: 0
    };
  }

  // Consider it a likely typo if:
  // - Fuzzy match with high score (>0.85)
  // - Or exact match with different casing/spacing
  const isLikelyTypo = bestMatch.score >= 0.85 && bestMatch.matchType !== 'exact';

  return {
    isLikelyTypo,
    suggestedRecipe: isLikelyTypo ? bestMatch.recipe : null,
    confidence: bestMatch.score
  };
}