import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { syncMealToCalendar, syncMealsToCalendar } from '../utils/googleCalendar';
import { useAutoSync } from '../hooks/useAutoSync';
import { isSetupComplete, markSetupComplete } from '../utils/calendarSelector';
import ImportModal from './ImportModal';
import SyncStatusIndicator from './SyncStatusIndicator';
import CalendarSelector from './CalendarSelector';
import CalendarSetupModal from './CalendarSetupModal';
import '../styles/Calendar.css';

function Calendar({ meals, recipes, onAddMeal, onUpdateMeal, onDeleteMeal }) {
  const navigate = useNavigate();
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const [showPersonSelector, setShowPersonSelector] = useState(false);
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);
  const [showMealOptions, setShowMealOptions] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [editingMeal, setEditingMeal] = useState(null);
  const [recipeSearchTerm, setRecipeSearchTerm] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    // Load auto-sync preference from localStorage
    const saved = localStorage.getItem('autoSyncEnabled');
    return saved === 'true';
  });
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Check if this is first time setup
  useEffect(() => {
    if (!isSetupComplete()) {
      // Show setup modal after a short delay to let the page load
      const timer = setTimeout(() => {
        setShowSetupModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSetupComplete = (selectedCalendarId) => {
    markSetupComplete();
    setShowSetupModal(false);
    console.log('Calendar setup complete. Selected:', selectedCalendarId);
  };

  // Set up automatic background sync
  const {
    isSyncing: isAutoSyncing,
    lastSyncTime,
    syncError,
    syncStats,
    triggerSync
  } = useAutoSync(autoSyncEnabled, 10, (results) => {
    // Show notification when meals are auto-imported
    if (results.created > 0) {
      console.log(`Auto-sync: ${results.created} new meal(s) imported from Google Calendar`);
    }
  });

  // Get Monday of the current week
  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  // Generate array of 7 days starting from Monday
  function getWeekDays(startDate) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  }

  const weekDays = getWeekDays(currentWeekStart);

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getMonday(new Date()));
  };

  const handleSlotClick = (date, mealType) => {
    // Check if there's already a meal in this slot
    const existingMeal = meals.find(m =>
      m.date === date.toISOString().split('T')[0] && m.mealType === mealType
    );

    if (existingMeal) {
      // Show options for existing meal
      setEditingMeal(existingMeal);
      setSelectedSlot({ date, mealType });
      setShowMealOptions(true);
    } else {
      // Add new meal
      setEditingMeal(null);
      setSelectedSlot({ date, mealType });
      setSelectedPeople([]);
      setShowPersonSelector(true);
    }
  };

  const handleEditMeal = () => {
    setShowMealOptions(false);
    setSelectedPeople(editingMeal.people);
    setShowPersonSelector(true);
  };

  const handleViewRecipe = () => {
    setShowMealOptions(false);
    // Navigate to recipes page with the recipe ID as state
    navigate('/recipes', { state: { openRecipeId: editingMeal.recipeId } });
  };

  const handleDeleteMeal = () => {
    if (window.confirm('Are you sure you want to delete this meal?')) {
      onDeleteMeal(editingMeal.id);
      setShowMealOptions(false);
      setEditingMeal(null);
    }
  };

  const handlePersonSelect = (person) => {
    if (selectedPeople.includes(person)) {
      setSelectedPeople(selectedPeople.filter(p => p !== person));
    } else {
      setSelectedPeople([...selectedPeople, person]);
    }
  };

  const handlePersonConfirm = () => {
    if (selectedPeople.length === 0) {
      alert('Please select at least one person');
      return;
    }
    setShowPersonSelector(false);
    setRecipeSearchTerm(''); // Reset search when opening
    setShowRecipeSelector(true);
  };

  const handleRecipeSelect = (recipe) => {
    if (editingMeal) {
      // Update existing meal
      const updatedMeal = {
        ...editingMeal,
        recipeId: recipe.id,
        people: selectedPeople
      };
      onUpdateMeal(editingMeal.id, updatedMeal);
      setEditingMeal(null);
    } else {
      // Add new meal
      const meal = {
        id: Date.now(),
        date: selectedSlot.date.toISOString().split('T')[0],
        mealType: selectedSlot.mealType,
        recipeId: recipe.id,
        people: selectedPeople
      };
      onAddMeal(meal);
    }
    setShowRecipeSelector(false);
    setSelectedSlot(null);
    setSelectedPeople([]);
  };

  const getMealForSlot = (date, mealType) => {
    const dateStr = date.toISOString().split('T')[0];
    const meal = meals.find(m => m.date === dateStr && m.mealType === mealType);
    if (meal) {
      const recipe = recipes.find(r => r.id === meal.recipeId);
      return { meal, recipe };
    }
    return null;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const formatWeekRange = () => {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 6);
    return `${currentWeekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const handleSyncToCalendar = async () => {
    if (!window.confirm('Sync this week\'s meals to Google Calendar?')) {
      return;
    }

    try {
      setSyncing(true);
      
      // Get meals for current week
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekMeals = meals.filter(meal => {
        const mealDate = new Date(meal.date);
        return mealDate >= currentWeekStart && mealDate <= weekEnd;
      });

      if (weekMeals.length === 0) {
        alert('No meals to sync for this week!');
        return;
      }

      const results = await syncMealsToCalendar(weekMeals, recipes);
      
      const successCount = results.success.length;
      const failedCount = results.failed.length;
      const skippedCount = results.success.filter(r => r.skipped).length;
      
      let message = `Synced ${successCount - skippedCount} meal(s) to Google Calendar!`;
      if (skippedCount > 0) {
        message += `\n${skippedCount} meal(s) were already synced.`;
      }
      if (failedCount > 0) {
        message += `\n${failedCount} meal(s) failed to sync.`;
      }
      
      alert(message);
    } catch (error) {
      console.error('Error syncing to calendar:', error);
      alert('Failed to sync to Google Calendar. Please make sure you\'re signed in and have granted calendar access.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncSingleMeal = async (meal) => {
    try {
      setSyncing(true);
      const recipe = recipes.find(r => r.id === meal.recipeId);
      
      if (!recipe) {
        alert('Recipe not found!');
        return;
      }

      await syncMealToCalendar(meal, recipe);
      alert('Meal synced to Google Calendar!');
    } catch (error) {
      console.error('Error syncing meal:', error);
      alert('Failed to sync meal. Please make sure you\'re signed in and have granted calendar access.');
    } finally {
      setSyncing(false);
    }
  };

  const handleImportFromCalendar = () => {
    setShowImportModal(true);
  };

  const toggleAutoSync = () => {
    const newValue = !autoSyncEnabled;
    setAutoSyncEnabled(newValue);
    // Save preference to localStorage
    localStorage.setItem('autoSyncEnabled', newValue.toString());
    console.log('Auto-sync', newValue ? 'enabled' : 'disabled');
  };

  const handleManualSync = () => {
    triggerSync();
  };

  const handleImportComplete = (results) => {
    setShowImportModal(false);
    
    let message = `Import complete!\n`;
    message += `✅ Created: ${results.created}\n`;
    if (results.skipped > 0) {
      message += `⏭️ Skipped: ${results.skipped} (already exist)\n`;
    }
    if (results.unmatched > 0) {
      message += `⚠️ Unmatched: ${results.unmatched} (saved for later)\n`;
    }
    if (results.failed > 0) {
      message += `❌ Failed: ${results.failed}`;
    }
    
    alert(message);
    
    // Real-time subscriptions in App.js will automatically update the meals
    // No need to reload the page
  };

  // Calculate date range for current week
  const getWeekDateRange = () => {
    const startDate = currentWeekStart.toISOString().split('T')[0];
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 6);
    return {
      startDate,
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-header-top">
          <h2>Weekly Meal Calendar</h2>
          <div className="calendar-sync-controls">
            <CalendarSelector onCalendarChange={() => {
              // Optionally trigger a refresh when calendar changes
              console.log('Calendar changed');
            }} />
            <button
              onClick={toggleAutoSync}
              className={`btn-auto-sync ${autoSyncEnabled ? 'active' : ''}`}
              title={autoSyncEnabled ? 'Disable auto-sync' : 'Enable auto-sync'}
            >
              {autoSyncEnabled ? '🔄 Auto-sync ON' : '⏸️ Auto-sync OFF'}
            </button>
            <button
              onClick={handleManualSync}
              className="btn-manual-sync"
              disabled={isAutoSyncing}
              title="Sync now"
            >
              {isAutoSyncing ? '⏳' : '🔄'}
            </button>
          </div>
        </div>

        <SyncStatusIndicator
          isSyncing={isAutoSyncing}
          lastSyncTime={lastSyncTime}
          syncError={syncError}
          syncStats={syncStats}
        />

        <div className="calendar-controls">
          <button onClick={goToPreviousWeek} className="btn-nav">← Previous</button>
          <button onClick={goToCurrentWeek} className="btn-today">Today</button>
          <button onClick={goToNextWeek} className="btn-nav">Next →</button>
          <button
            onClick={handleImportFromCalendar}
            className="btn-import"
            disabled={syncing}
          >
            📥 Import from Calendar
          </button>
          <button
            onClick={handleSyncToCalendar}
            className="btn-sync"
            disabled={syncing}
          >
            {syncing ? '⏳ Syncing...' : '📅 Sync to Calendar'}
          </button>
        </div>
        <p className="week-range">{formatWeekRange()}</p>
      </div>

      <div className="calendar-grid-wrapper">
        <div className="calendar-grid">
          <div className="calendar-row header-row">
          <div className="time-label"></div>
          {weekDays.map((day, index) => (
            <div key={index} className="day-header">
              {formatDate(day)}
            </div>
          ))}
        </div>

        {['Lunch', 'Dinner'].map(mealType => (
          <div key={mealType} className="calendar-row">
            <div className="time-label">{mealType}</div>
            {weekDays.map((day, index) => {
              const mealData = getMealForSlot(day, mealType);
              return (
                <div 
                  key={index} 
                  className={`calendar-cell ${mealData ? 'has-meal' : 'empty'}`}
                  onClick={() => handleSlotClick(day, mealType)}
                >
                  {mealData ? (
                    <div className="meal-info">
                      <div className="meal-title">{mealData.recipe?.title || 'Unknown Recipe'}</div>
                      <div className="meal-people">
                        {mealData.meal.people.join(', ')}
                      </div>
                    </div>
                  ) : (
                    <div className="empty-slot">+ Add Meal</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        </div>
      </div>

      {/* Person Selector Modal */}
      {showPersonSelector && (
        <div className="modal-overlay" onClick={() => setShowPersonSelector(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Who is having this meal?</h3>
            <div className="person-selector">
              <label className={`person-option ${selectedPeople.includes('Kit') ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={selectedPeople.includes('Kit')}
                  onChange={() => handlePersonSelect('Kit')}
                />
                Kit
              </label>
              <label className={`person-option ${selectedPeople.includes('Jess') ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={selectedPeople.includes('Jess')}
                  onChange={() => handlePersonSelect('Jess')}
                />
                Jess
              </label>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowPersonSelector(false)} className="btn-cancel">
                Cancel
              </button>
              <button onClick={handlePersonConfirm} className="btn-confirm">
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Selector Modal */}
      {showRecipeSelector && (
        <div className="modal-overlay" onClick={() => setShowRecipeSelector(false)}>
          <div className="modal-content recipe-selector" onClick={(e) => e.stopPropagation()}>
            <h3>Select a Recipe</h3>
            
            {/* Search Input */}
            <div className="recipe-search">
              <input
                type="text"
                placeholder="🔍 Search recipes by name, diet, cuisine, or tags..."
                value={recipeSearchTerm}
                onChange={(e) => setRecipeSearchTerm(e.target.value)}
                className="recipe-search-input"
                autoFocus
              />
              {recipeSearchTerm && (
                <button
                  onClick={() => setRecipeSearchTerm('')}
                  className="clear-search-btn"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="recipe-list">
              {recipes.length === 0 ? (
                <p>No recipes available. Add some recipes first!</p>
              ) : (
                (() => {
                  // Filter recipes based on search term
                  const filteredRecipes = recipes.filter(recipe => {
                    if (!recipeSearchTerm) return true;
                    
                    const searchLower = recipeSearchTerm.toLowerCase();
                    return (
                      recipe.title.toLowerCase().includes(searchLower) ||
                      recipe.diet.toLowerCase().includes(searchLower) ||
                      (recipe.cuisine && recipe.cuisine.toLowerCase().includes(searchLower)) ||
                      (recipe.tags && recipe.tags.some(tag => tag.toLowerCase().includes(searchLower)))
                    );
                  });

                  return filteredRecipes.length === 0 ? (
                    <p className="no-results">No recipes match "{recipeSearchTerm}"</p>
                  ) : (
                    filteredRecipes.map(recipe => (
                      <div
                        key={recipe.id}
                        className="recipe-item"
                        onClick={() => handleRecipeSelect(recipe)}
                      >
                        <h4>{recipe.title}</h4>
                        <p className="recipe-meta">
                          {recipe.diet} • {recipe.servings} servings • {recipe.prepTime + recipe.cookTime} mins
                          {recipe.cuisine && ` • ${recipe.cuisine}`}
                        </p>
                        {recipe.tags && recipe.tags.length > 0 && (
                          <p className="recipe-tags-preview">
                            {recipe.tags.slice(0, 3).map(tag => `#${tag}`).join(' ')}
                          </p>
                        )}
                      </div>
                    ))
                  );
                })()
              )}
            </div>
            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowRecipeSelector(false);
                  setRecipeSearchTerm('');
                  setShowPersonSelector(true);
                }}
                className="btn-cancel"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meal Options Modal (Edit/Delete/Sync) */}
      {showMealOptions && editingMeal && (
        <div className="modal-overlay" onClick={() => setShowMealOptions(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Meal Options</h3>
            <div className="meal-details">
              <p><strong>Recipe:</strong> {recipes.find(r => r.id === editingMeal.recipeId)?.title || 'Unknown'}</p>
              <p><strong>People:</strong> {editingMeal.people.join(', ')}</p>
              {editingMeal.calendarEventId && (
                <p className="synced-badge">✓ Synced to Calendar</p>
              )}
            </div>
            <div className="modal-actions" style={{ flexDirection: 'column', gap: '10px' }}>
              <button onClick={handleViewRecipe} className="btn-view-recipe" style={{ width: '100%' }}>
                📖 View Recipe
              </button>
              <button onClick={handleEditMeal} className="btn-edit" style={{ width: '100%' }}>
                Edit Meal
              </button>
              {!editingMeal.calendarEventId && (
                <button
                  onClick={() => handleSyncSingleMeal(editingMeal)}
                  className="btn-sync"
                  style={{ width: '100%' }}
                  disabled={syncing}
                >
                  {syncing ? '⏳ Syncing...' : '📅 Sync to Calendar'}
                </button>
              )}
              <button onClick={handleDeleteMeal} className="btn-delete" style={{ width: '100%' }}>
                Delete Meal
              </button>
              <button onClick={() => setShowMealOptions(false)} className="btn-cancel" style={{ width: '100%' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        startDate={getWeekDateRange().startDate}
        endDate={getWeekDateRange().endDate}
        onImportComplete={handleImportComplete}
      />

      {/* Calendar Setup Modal (First Time) */}
      <CalendarSetupModal
        isOpen={showSetupModal}
        onComplete={handleSetupComplete}
      />
    </div>
  );
}

export default Calendar;