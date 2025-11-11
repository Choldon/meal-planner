/**
 * Sync Engine
 * Orchestrates bidirectional synchronization between Meal Planner and Google Calendar
 */

import { supabase } from './supabaseClient';
import { extractMealEvents, validateMealEvent } from './eventParser';
import { findBestMatch } from './recipeMatcher';

/**
 * Get the user's Google Calendar access token from Supabase session
 */
const getAccessToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.provider_token) {
    throw new Error('No Google access token found. Please sign in again.');
  }
  
  return session.provider_token;
};

/**
 * Fetch events from Google Calendar for a date range
 * 
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of Google Calendar events
 */
export async function fetchGoogleCalendarEvents(startDate, endDate) {
  try {
    const accessToken = await getAccessToken();
    
    // Convert dates to RFC3339 format for Google Calendar API
    const timeMin = `${startDate}T00:00:00Z`;
    const timeMax = `${endDate}T23:59:59Z`;
    
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.append('timeMin', timeMin);
    url.searchParams.append('timeMax', timeMax);
    url.searchParams.append('singleEvents', 'true');
    url.searchParams.append('orderBy', 'startTime');
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch calendar events');
    }
    
    const data = await response.json();
    return data.items || [];
    
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    throw error;
  }
}

/**
 * Import events from Google Calendar into the meal planner
 * 
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Object>} Import results with matched and unmatched events
 */
export async function importFromGoogleCalendar(startDate, endDate) {
  try {
    // Fetch events from Google Calendar
    const events = await fetchGoogleCalendarEvents(startDate, endDate);
    
    // Extract meal events
    const mealEvents = extractMealEvents(events);
    
    if (mealEvents.length === 0) {
      return {
        matched: [],
        unmatched: [],
        errors: [],
        summary: {
          total: 0,
          matched: 0,
          unmatched: 0,
          errors: 0
        }
      };
    }
    
    // Fetch all recipes from database
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*');
    
    if (recipesError) {
      throw new Error(`Failed to fetch recipes: ${recipesError.message}`);
    }
    
    // Match events to recipes
    const matched = [];
    const unmatched = [];
    const errors = [];
    
    for (const mealEvent of mealEvents) {
      // Validate event data
      const validation = validateMealEvent(mealEvent);
      if (!validation.valid) {
        errors.push({
          event: mealEvent,
          errors: validation.errors
        });
        continue;
      }
      
      // Try to match recipe
      const match = findBestMatch(mealEvent.recipeName, recipes, 0.85);
      
      if (match) {
        matched.push({
          event: mealEvent,
          recipe: match.recipe,
          matchScore: match.score,
          matchType: match.matchType,
          confidence: match.confidence
        });
      } else {
        unmatched.push({
          event: mealEvent,
          reason: 'No matching recipe found'
        });
      }
    }
    
    return {
      matched,
      unmatched,
      errors,
      summary: {
        total: mealEvents.length,
        matched: matched.length,
        unmatched: unmatched.length,
        errors: errors.length
      }
    };
    
  } catch (error) {
    console.error('Error importing from Google Calendar:', error);
    throw error;
  }
}

/**
 * Add recipe ingredients to shopping list for an imported meal
 *
 * @param {Object} meal - The meal object
 * @param {Object} recipe - The recipe object with ingredients
 * @returns {Promise<void>}
 */
async function addIngredientsToShoppingList(meal, recipe) {
  try {
    // Calculate servings multiplier based on number of people
    // Default to 2 people if not specified
    const numPeople = meal.people ? meal.people.length : 2;
    const servingsMultiplier = numPeople / recipe.servings;
    
    const shoppingItems = [];
    
    for (const ing of recipe.ingredients) {
      const newQuantity = ing.quantity * servingsMultiplier;
      
      // Check if ingredient already exists in shopping list
      const { data: existing } = await supabase
        .from('shopping_list')
        .select('*')
        .eq('ingredient_id', ing.ingredientId)
        .eq('unit', ing.unit)
        .maybeSingle();
      
      if (existing) {
        // Update existing item - add to quantity and append recipe name
        await supabase
          .from('shopping_list')
          .update({
            quantity: existing.quantity + newQuantity,
            recipe_name: existing.recipe_name
              ? `${existing.recipe_name}, ${recipe.title}`
              : recipe.title,
            is_recipe_item: true
          })
          .eq('id', existing.id);
      } else {
        // Add new item
        shoppingItems.push({
          ingredient_id: ing.ingredientId,
          quantity: newQuantity,
          unit: ing.unit,
          checked: false,
          meal_id: meal.id,
          recipe_id: recipe.id,
          recipe_name: recipe.title,
          is_recipe_item: true
        });
      }
    }
    
    // Insert new shopping items if any
    if (shoppingItems.length > 0) {
      const { error: insertError } = await supabase
        .from('shopping_list')
        .insert(shoppingItems);
      
      if (insertError) {
        console.error('Error inserting shopping items:', insertError);
        throw insertError;
      }
    }
  } catch (error) {
    console.error('Error adding ingredients to shopping list:', error);
    throw error;
  }
}

/**
 * Create meals in database from matched Google Calendar events
 *
 * @param {Array} matchedEvents - Array of matched events from importFromGoogleCalendar
 * @param {boolean} addToShoppingList - Whether to add recipe ingredients to shopping list (default: true)
 * @returns {Promise<Object>} Results of meal creation
 */
export async function createMealsFromEvents(matchedEvents, addToShoppingList = true) {
  const results = {
    created: [],
    failed: [],
    skipped: []
  };
  
  try {
    for (const { event, recipe } of matchedEvents) {
      // Check if meal already exists for this date and meal type
      // Note: Calendar component expects capitalized meal types (Lunch, Dinner)
      const { data: existingMeals, error: checkError } = await supabase
        .from('meals')
        .select('*')
        .eq('date', event.date)
        .eq('meal_type', event.mealType); // Keep capitalized
      
      if (checkError) {
        results.failed.push({
          event,
          recipe,
          error: `Failed to check existing meals: ${checkError.message}`
        });
        continue;
      }
      
      // Skip if meal already exists
      if (existingMeals && existingMeals.length > 0) {
        results.skipped.push({
          event,
          recipe,
          reason: 'Meal already exists for this date and meal type'
        });
        continue;
      }
      
      // Create meal
      // Note: Database uses snake_case column names
      // people column is JSONB, so we need to provide an array (default to both Kit and Jess)
      // meal_type must be capitalized (Lunch, Dinner) to match Calendar component expectations
      const { data: newMeal, error: createError } = await supabase
        .from('meals')
        .insert({
          date: event.date,
          meal_type: event.mealType, // Keep capitalized (Lunch, Dinner)
          recipe_id: recipe.id,
          people: ['Kit', 'Jess'], // Default to both people for imported meals
          calendar_event_id: event.eventId,
          sync_source: 'google_calendar',
          last_synced_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        results.failed.push({
          event,
          recipe,
          error: `Failed to create meal: ${createError.message}`
        });
        continue;
      }
      
      // Log sync operation
      await logSyncOperation(
        event.eventId,
        newMeal.id,
        'from_google',
        'success'
      );
      
      // Add recipe ingredients to shopping list if enabled
      if (addToShoppingList && recipe.ingredients && recipe.ingredients.length > 0) {
        try {
          await addIngredientsToShoppingList(newMeal, recipe);
        } catch (shoppingError) {
          console.error('Error adding ingredients to shopping list:', shoppingError);
          // Don't fail the whole import if shopping list fails
        }
      }
      
      results.created.push({
        event,
        recipe,
        meal: newMeal
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('Error creating meals from events:', error);
    throw error;
  }
}

/**
 * Store unmatched events in database for later resolution
 * 
 * @param {Array} unmatchedEvents - Array of unmatched events
 * @returns {Promise<Object>} Results of storing unmatched events
 */
export async function storeUnmatchedEvents(unmatchedEvents) {
  const results = {
    stored: [],
    failed: []
  };
  
  try {
    for (const { event } of unmatchedEvents) {
      // Check if already stored
      const { data: existing } = await supabase
        .from('unmatched_events')
        .select('*')
        .eq('event_id', event.eventId)
        .single();
      
      if (existing) {
        results.stored.push({
          event,
          unmatchedEvent: existing,
          alreadyExists: true
        });
        continue;
      }
      
      // Store unmatched event
      const { data: unmatchedEvent, error } = await supabase
        .from('unmatched_events')
        .insert({
          event_id: event.eventId,
          event_title: event.originalTitle,
          event_date: event.date,
          meal_type: event.mealType,
          recipe_name: event.recipeName,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) {
        results.failed.push({
          event,
          error: error.message
        });
        continue;
      }
      
      results.stored.push({
        event,
        unmatchedEvent
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('Error storing unmatched events:', error);
    throw error;
  }
}

/**
 * Log a sync operation to the sync_log table
 * 
 * @param {string} eventId - Google Calendar event ID
 * @param {number} mealId - Meal ID from database
 * @param {string} direction - Sync direction: 'to_google', 'from_google', 'bidirectional'
 * @param {string} status - Sync status: 'success', 'failed', 'conflict'
 * @param {string} errorMessage - Error message if failed
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Created sync log entry
 */
export async function logSyncOperation(
  eventId,
  mealId,
  direction,
  status,
  errorMessage = null,
  metadata = null
) {
  try {
    const { data, error } = await supabase
      .from('sync_log')
      .insert({
        event_id: eventId,
        meal_id: mealId,
        sync_direction: direction,
        sync_status: status,
        error_message: errorMessage,
        metadata: metadata
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error logging sync operation:', error);
      return null;
    }
    
    return data;
    
  } catch (error) {
    console.error('Error logging sync operation:', error);
    return null;
  }
}

/**
 * Get recent sync activity
 * 
 * @param {number} limit - Maximum number of records to return (default: 50)
 * @returns {Promise<Array>} Array of recent sync operations
 */
export async function getRecentSyncActivity(limit = 50) {
  try {
    const { data, error } = await supabase
      .from('recent_sync_activity')
      .select('*')
      .limit(limit);
    
    if (error) {
      throw new Error(`Failed to fetch sync activity: ${error.message}`);
    }
    
    return data || [];
    
  } catch (error) {
    console.error('Error fetching sync activity:', error);
    throw error;
  }
}

/**
 * Get pending unmatched events
 * 
 * @returns {Promise<Array>} Array of pending unmatched events
 */
export async function getPendingUnmatchedEvents() {
  try {
    const { data, error } = await supabase
      .from('pending_unmatched_events')
      .select('*');
    
    if (error) {
      throw new Error(`Failed to fetch unmatched events: ${error.message}`);
    }
    
    return data || [];
    
  } catch (error) {
    console.error('Error fetching unmatched events:', error);
    throw error;
  }
}

/**
 * Resolve an unmatched event by linking it to a recipe
 * 
 * @param {number} unmatchedEventId - ID of the unmatched event
 * @param {number} recipeId - ID of the recipe to link
 * @returns {Promise<Object>} Created meal and updated unmatched event
 */
export async function resolveUnmatchedEvent(unmatchedEventId, recipeId) {
  try {
    // Get the unmatched event
    const { data: unmatchedEvent, error: fetchError } = await supabase
      .from('unmatched_events')
      .select('*')
      .eq('id', unmatchedEventId)
      .single();
    
    if (fetchError) {
      throw new Error(`Failed to fetch unmatched event: ${fetchError.message}`);
    }
    
    // Create meal
    // Note: Database uses snake_case column names
    // people column is JSONB, so we need to provide an array (default to both Kit and Jess)
    // meal_type must be capitalized (Lunch, Dinner) to match Calendar component expectations
    const { data: meal, error: createError } = await supabase
      .from('meals')
      .insert({
        date: unmatchedEvent.event_date,
        meal_type: unmatchedEvent.meal_type, // Keep capitalized (Lunch, Dinner)
        recipe_id: recipeId,
        people: ['Kit', 'Jess'], // Default to both people for imported meals
        calendar_event_id: unmatchedEvent.event_id,
        sync_source: 'google_calendar',
        last_synced_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      throw new Error(`Failed to create meal: ${createError.message}`);
    }
    
    // Update unmatched event status
    const { error: updateError } = await supabase
      .from('unmatched_events')
      .update({
        status: 'matched',
        resolved_at: new Date().toISOString(),
        resolved_recipe_id: recipeId
      })
      .eq('id', unmatchedEventId);
    
    if (updateError) {
      console.error('Error updating unmatched event:', updateError);
    }
    
    // Log sync operation
    await logSyncOperation(
      unmatchedEvent.event_id,
      meal.id,
      'from_google',
      'success',
      null,
      { resolved_from_unmatched: true }
    );
    
    return { meal, unmatchedEvent };
    
  } catch (error) {
    console.error('Error resolving unmatched event:', error);
    throw error;
  }
}

/**
 * Ignore an unmatched event
 * 
 * @param {number} unmatchedEventId - ID of the unmatched event
 * @param {string} notes - Optional notes about why it was ignored
 * @returns {Promise<Object>} Updated unmatched event
 */
export async function ignoreUnmatchedEvent(unmatchedEventId, notes = null) {
  try {
    const { data, error } = await supabase
      .from('unmatched_events')
      .update({
        status: 'ignored',
        resolved_at: new Date().toISOString(),
        notes: notes
      })
      .eq('id', unmatchedEventId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to ignore unmatched event: ${error.message}`);
    }
    
    return data;
    
  } catch (error) {
    console.error('Error ignoring unmatched event:', error);
    throw error;
  }
}

/**
 * Get count of pending unmatched events
 * 
 * @returns {Promise<number>} Count of pending unmatched events
 */
export async function getUnmatchedEventsCount() {
  try {
    const { data, error } = await supabase
      .rpc('get_unmatched_events_count');
    
    if (error) {
      throw new Error(`Failed to get unmatched events count: ${error.message}`);
    }
    
    return data || 0;
    
  } catch (error) {
    console.error('Error getting unmatched events count:', error);
    return 0;
  }

}