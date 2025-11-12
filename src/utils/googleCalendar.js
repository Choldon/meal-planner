import { supabase } from './supabaseClient';
import { getSelectedCalendarId } from './calendarSelector';

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
 * Create a calendar event for a meal
 */
export const createCalendarEvent = async (meal, recipe) => {
  try {
    const accessToken = await getAccessToken();
    
    // Format the date for all-day event (YYYY-MM-DD)
    const dateStr = meal.date;
    
    // Create simple event description with who it's for and link to recipe
    let description = '';
    
    if (meal.people && meal.people.length > 0) {
      description += `For: ${meal.people.join(', ')}\n\n`;
    }
    
    // Add link to meal planner (users can view full recipe details there)
    const appUrl = window.location.origin;
    description += `View recipe in meal planner:\n${appUrl}/recipes`;
    
    // Add "*" prefix to lunch events so they appear first in Google Calendar
    const mealTypeLabel = meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1);
    const titlePrefix = meal.mealType.toLowerCase() === 'lunch' ? '* ' : '';
    
    // Create the event as all-day event
    const event = {
      summary: `${titlePrefix}${mealTypeLabel}: ${recipe.title}`,
      description: description,
      start: {
        date: dateStr  // All-day event uses 'date' instead of 'dateTime'
      },
      end: {
        date: dateStr  // All-day event uses 'date' instead of 'dateTime'
      }
    };
    
    const calendarId = getSelectedCalendarId();
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create calendar event');
    }
    
    const createdEvent = await response.json();
    return createdEvent;
    
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
};

/**
 * Sync a meal to Google Calendar
 */
export const syncMealToCalendar = async (meal, recipe) => {
  try {
    const event = await createCalendarEvent(meal, recipe);
    
    // Store the calendar event ID in the meal record
    const { error } = await supabase
      .from('meals')
      .update({ calendar_event_id: event.id })
      .eq('id', meal.id);
    
    if (error) {
      console.error('Error updating meal with calendar event ID:', error);
    }
    
    return event;
  } catch (error) {
    console.error('Error syncing meal to calendar:', error);
    throw error;
  }
};

/**
 * Delete a calendar event
 */
export const deleteCalendarEvent = async (eventId) => {
  try {
    const accessToken = await getAccessToken();
    
    const calendarId = getSelectedCalendarId();
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!response.ok && response.status !== 404) {
      // 404 means event already deleted, which is fine
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to delete calendar event');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
};

/**
 * Update a calendar event
 */
export const updateCalendarEvent = async (eventId, meal, recipe) => {
  try {
    // Delete old event and create new one (simpler than updating)
    await deleteCalendarEvent(eventId);
    return await createCalendarEvent(meal, recipe);
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
};

/**
 * Sync all meals for a date range to Google Calendar
 */
export const syncMealsToCalendar = async (meals, recipes) => {
  const results = {
    success: [],
    failed: []
  };
  
  for (const meal of meals) {
    try {
      const recipe = recipes.find(r => r.id === meal.recipeId);
      if (!recipe) {
        results.failed.push({ meal, error: 'Recipe not found' });
        continue;
      }
      
      // Skip if already synced
      if (meal.calendarEventId) {
        results.success.push({ meal, event: null, skipped: true });
        continue;
      }
      
      const event = await syncMealToCalendar(meal, recipe);
      results.success.push({ meal, event });
    } catch (error) {
      results.failed.push({ meal, error: error.message });
    }
  }
  
  return results;
};

/**
 * Check if user has granted calendar access
 */
export const hasCalendarAccess = async () => {
  try {
    const accessToken = await getAccessToken();
    
    // Try to fetch calendar list to verify access
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
};