/**
 * Event Parser Utility
 * Parses Google Calendar event titles to extract meal information
 */

/**
 * Regular expression pattern to match meal event titles
 * Matches formats:
 * - "* Lunch: Recipe Name"
 * - "Lunch: Recipe Name"
 * - "Dinner: Recipe Name"
 * - "Breakfast: Recipe Name"
 */
const MEAL_PATTERN = /^(\*\s*)?(Lunch|Dinner|Breakfast):\s*(.+)$/i;

/**
 * Valid meal types
 */
const VALID_MEAL_TYPES = ['Lunch', 'Dinner', 'Breakfast'];

/**
 * Parse a Google Calendar event title to extract meal information
 * 
 * @param {string} eventTitle - The event title from Google Calendar
 * @returns {Object|null} Parsed meal info or null if not a valid meal event
 * @returns {string} return.mealType - The meal type (Lunch, Dinner, Breakfast)
 * @returns {string} return.recipeName - The extracted recipe name
 * @returns {boolean} return.hasAsterisk - Whether the title had an asterisk prefix
 * 
 * @example
 * parseEventTitle("* Lunch: Spaghetti Carbonara")
 * // Returns: { mealType: "Lunch", recipeName: "Spaghetti Carbonara", hasAsterisk: true }
 * 
 * parseEventTitle("Dinner: Thai Green Curry")
 * // Returns: { mealType: "Dinner", recipeName: "Thai Green Curry", hasAsterisk: false }
 * 
 * parseEventTitle("Meeting with John")
 * // Returns: null
 */
export function parseEventTitle(eventTitle) {
  if (!eventTitle || typeof eventTitle !== 'string') {
    return null;
  }

  const trimmedTitle = eventTitle.trim();
  const match = trimmedTitle.match(MEAL_PATTERN);

  if (!match) {
    return null;
  }

  const [, asterisk, mealType, recipeName] = match;

  // Validate meal type
  const normalizedMealType = mealType.charAt(0).toUpperCase() + mealType.slice(1).toLowerCase();
  if (!VALID_MEAL_TYPES.includes(normalizedMealType)) {
    return null;
  }

  return {
    mealType: normalizedMealType,
    recipeName: recipeName.trim(),
    hasAsterisk: Boolean(asterisk)
  };
}

/**
 * Check if an event title is a valid meal event
 * 
 * @param {string} eventTitle - The event title to check
 * @returns {boolean} True if the title matches meal event pattern
 * 
 * @example
 * isMealEvent("Lunch: Pizza")  // Returns: true
 * isMealEvent("Team Meeting")  // Returns: false
 */
export function isMealEvent(eventTitle) {
  return parseEventTitle(eventTitle) !== null;
}

/**
 * Format a meal event title for Google Calendar
 * 
 * @param {string} mealType - The meal type (Lunch, Dinner, Breakfast)
 * @param {string} recipeName - The recipe name
 * @param {boolean} addAsterisk - Whether to add asterisk prefix (for Lunch)
 * @returns {string} Formatted event title
 * 
 * @example
 * formatEventTitle("Lunch", "Pasta", true)
 * // Returns: "* Lunch: Pasta"
 * 
 * formatEventTitle("Dinner", "Steak", false)
 * // Returns: "Dinner: Steak"
 */
export function formatEventTitle(mealType, recipeName, addAsterisk = false) {
  const prefix = addAsterisk ? '* ' : '';
  return `${prefix}${mealType}: ${recipeName}`;
}

/**
 * Extract all meal events from a list of Google Calendar events
 * 
 * @param {Array} events - Array of Google Calendar event objects
 * @returns {Array} Array of parsed meal events with additional event data
 * 
 * @example
 * const events = [
 *   { id: '1', summary: 'Lunch: Pizza', start: { date: '2025-11-11' } },
 *   { id: '2', summary: 'Team Meeting', start: { date: '2025-11-11' } },
 *   { id: '3', summary: 'Dinner: Pasta', start: { date: '2025-11-11' } }
 * ];
 * 
 * extractMealEvents(events)
 * // Returns: [
 * //   { eventId: '1', mealType: 'Lunch', recipeName: 'Pizza', date: '2025-11-11', ... },
 * //   { eventId: '3', mealType: 'Dinner', recipeName: 'Pasta', date: '2025-11-11', ... }
 * // ]
 */
export function extractMealEvents(events) {
  if (!Array.isArray(events)) {
    return [];
  }

  return events
    .map(event => {
      const parsed = parseEventTitle(event.summary);
      if (!parsed) {
        return null;
      }

      return {
        eventId: event.id,
        mealType: parsed.mealType,
        recipeName: parsed.recipeName,
        hasAsterisk: parsed.hasAsterisk,
        date: event.start?.date || event.start?.dateTime?.split('T')[0],
        originalTitle: event.summary,
        description: event.description,
        htmlLink: event.htmlLink,
        updated: event.updated
      };
    })
    .filter(Boolean); // Remove null entries
}

/**
 * Validate meal event data
 * 
 * @param {Object} mealEvent - The meal event object to validate
 * @returns {Object} Validation result
 * @returns {boolean} return.valid - Whether the event is valid
 * @returns {Array<string>} return.errors - Array of validation error messages
 * 
 * @example
 * validateMealEvent({ mealType: 'Lunch', recipeName: 'Pizza', date: '2025-11-11' })
 * // Returns: { valid: true, errors: [] }
 * 
 * validateMealEvent({ mealType: 'Snack', recipeName: '', date: 'invalid' })
 * // Returns: { valid: false, errors: ['Invalid meal type', 'Recipe name is required', 'Invalid date format'] }
 */
export function validateMealEvent(mealEvent) {
  const errors = [];

  // Validate meal type
  if (!mealEvent.mealType || !VALID_MEAL_TYPES.includes(mealEvent.mealType)) {
    errors.push('Invalid meal type. Must be Lunch, Dinner, or Breakfast');
  }

  // Validate recipe name
  if (!mealEvent.recipeName || mealEvent.recipeName.trim().length === 0) {
    errors.push('Recipe name is required');
  }

  // Validate date
  if (!mealEvent.date) {
    errors.push('Date is required');
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(mealEvent.date)) {
      errors.push('Invalid date format. Expected YYYY-MM-DD');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Normalize recipe name for matching
 * Removes extra whitespace, converts to lowercase, removes special characters
 * 
 * @param {string} recipeName - The recipe name to normalize
 * @returns {string} Normalized recipe name
 * 
 * @example
 * normalizeRecipeName("  Spaghetti  Carbonara!  ")
 * // Returns: "spaghetti carbonara"
 */
export function normalizeRecipeName(recipeName) {
  if (!recipeName || typeof recipeName !== 'string') {
    return '';
  }

  return recipeName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}