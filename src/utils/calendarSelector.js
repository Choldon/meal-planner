/**
 * Calendar Selector Utility
 * Manages user's Google Calendar selection
 */

import { supabase } from './supabaseClient';

const STORAGE_KEY = 'selected_calendar_id';

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
 * Fetch list of user's Google Calendars
 * 
 * @returns {Promise<Array>} Array of calendar objects
 */
export async function fetchUserCalendars() {
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch calendars');
    }
    
    const data = await response.json();
    
    // Return calendars with relevant info
    return (data.items || []).map(cal => ({
      id: cal.id,
      summary: cal.summary,
      description: cal.description,
      primary: cal.primary || false,
      backgroundColor: cal.backgroundColor,
      accessRole: cal.accessRole
    }));
    
  } catch (error) {
    console.error('Error fetching user calendars:', error);
    throw error;
  }
}

/**
 * Get the currently selected calendar ID
 * Returns 'primary' if no selection has been made
 * 
 * @returns {string} Calendar ID
 */
export function getSelectedCalendarId() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored || 'primary';
}

/**
 * Set the selected calendar ID
 * 
 * @param {string} calendarId - Calendar ID to select
 */
export function setSelectedCalendarId(calendarId) {
  localStorage.setItem(STORAGE_KEY, calendarId);
}

/**
 * Clear the selected calendar (revert to primary)
 */
export function clearSelectedCalendar() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get calendar display name
 * 
 * @param {Array} calendars - Array of calendar objects
 * @param {string} calendarId - Calendar ID to find
 * @returns {string} Calendar display name
 */
export function getCalendarDisplayName(calendars, calendarId) {
  if (calendarId === 'primary') {
    const primaryCal = calendars.find(cal => cal.primary);
    return primaryCal ? `${primaryCal.summary} (Primary)` : 'Primary Calendar';
  }
  
  const calendar = calendars.find(cal => cal.id === calendarId);
  return calendar ? calendar.summary : 'Unknown Calendar';
}