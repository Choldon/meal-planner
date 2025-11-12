/**
 * useAutoSync Hook
 * Automatically syncs Google Calendar events in the background while the app is open
 * Performs bidirectional sync: imports FROM and exports TO Google Calendar
 */

import { useEffect, useRef, useState } from 'react';
import {
  importFromGoogleCalendar,
  createMealsFromEvents,
  storeUnmatchedEvents
} from '../utils/syncEngine';
import { syncMealToCalendar } from '../utils/googleCalendar';
import { supabase } from '../utils/supabaseClient';

/**
 * Custom hook for automatic background sync with Google Calendar
 * 
 * @param {boolean} enabled - Whether auto-sync is enabled
 * @param {number} intervalMinutes - How often to sync (in minutes)
 * @param {function} onSyncComplete - Callback when sync completes
 * @returns {Object} Sync status and controls
 */
export function useAutoSync(enabled = true, intervalMinutes = 10, onSyncComplete = null) {
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [syncStats, setSyncStats] = useState({
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    mealsImported: 0,
    mealsExported: 0,
    unmatchedEvents: 0
  });
  
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  /**
   * Export unsynced meals to Google Calendar
   */
  const exportUnsyncedMeals = async (startDateStr, endDateStr) => {
    try {
      // Fetch all recipes for reference
      const { data: recipes, error: recipesError } = await supabase
        .from('recipes')
        .select('*');
      
      if (recipesError) {
        throw new Error(`Failed to fetch recipes: ${recipesError.message}`);
      }

      // Fetch meals in date range that haven't been synced to calendar
      const { data: unsyncedMeals, error: mealsError } = await supabase
        .from('meals')
        .select('*')
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .is('calendar_event_id', null);
      
      if (mealsError) {
        throw new Error(`Failed to fetch meals: ${mealsError.message}`);
      }

      if (!unsyncedMeals || unsyncedMeals.length === 0) {
        return { exported: 0, failed: 0 };
      }

      let exported = 0;
      let failed = 0;

      // Sync each unsynced meal to Google Calendar
      for (const meal of unsyncedMeals) {
        try {
          const recipe = recipes.find(r => r.id === meal.recipe_id);
          if (!recipe) {
            console.warn(`Recipe not found for meal ${meal.id}`);
            failed++;
            continue;
          }

          // Convert snake_case to camelCase for syncMealToCalendar
          const mealForSync = {
            id: meal.id,
            date: meal.date,
            mealType: meal.meal_type,
            recipeId: meal.recipe_id,
            people: meal.people
          };

          await syncMealToCalendar(mealForSync, recipe);
          exported++;
        } catch (error) {
          console.error(`Failed to sync meal ${meal.id}:`, error);
          failed++;
        }
      }

      return { exported, failed };
    } catch (error) {
      console.error('Error exporting unsynced meals:', error);
      throw error;
    }
  };

  /**
   * Perform automatic bidirectional sync
   */
  const performSync = async () => {
    // Don't sync if already syncing or disabled
    if (isSyncing || !enabled) {
      return;
    }

    try {
      setIsSyncing(true);
      setSyncError(null);

      // Calculate date range (current week + next week for better coverage)
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 7); // Include last week
      
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 14); // Include next 2 weeks

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      let mealsImportedCount = 0;
      let mealsExportedCount = 0;

      // STEP 1: Import events FROM Google Calendar
      const importResults = await importFromGoogleCalendar(startDateStr, endDateStr);

      // Only proceed if there are matched events
      if (importResults.matched.length > 0) {
        // Automatically import all matched events
        const createResults = await createMealsFromEvents(importResults.matched);
        mealsImportedCount = createResults.created.length;
        
        // Store unmatched events for later resolution
        if (importResults.unmatched.length > 0) {
          await storeUnmatchedEvents(importResults.unmatched);
        }
      }

      // STEP 2: Export unsynced meals TO Google Calendar
      const exportResults = await exportUnsyncedMeals(startDateStr, endDateStr);
      mealsExportedCount = exportResults.exported;

      // Update stats
      if (isMountedRef.current) {
        setSyncStats(prev => ({
          totalSyncs: prev.totalSyncs + 1,
          successfulSyncs: prev.successfulSyncs + 1,
          failedSyncs: prev.failedSyncs,
          mealsImported: prev.mealsImported + mealsImportedCount,
          mealsExported: prev.mealsExported + mealsExportedCount,
          unmatchedEvents: prev.unmatchedEvents + (importResults.unmatched?.length || 0)
        }));

        // Call callback if provided
        if (onSyncComplete && (mealsImportedCount > 0 || mealsExportedCount > 0)) {
          onSyncComplete({
            created: mealsImportedCount,
            exported: mealsExportedCount,
            skipped: 0,
            unmatched: importResults.unmatched?.length || 0
          });
        }
      }

      // Update last sync time
      if (isMountedRef.current) {
        setLastSyncTime(new Date());
      }

    } catch (error) {
      console.error('Auto-sync error:', error);
      
      if (isMountedRef.current) {
        setSyncError(error.message);
        setSyncStats(prev => ({
          ...prev,
          totalSyncs: prev.totalSyncs + 1,
          failedSyncs: prev.failedSyncs + 1
        }));
      }
    } finally {
      if (isMountedRef.current) {
        setIsSyncing(false);
      }
    }
  };

  /**
   * Manually trigger a sync
   */
  const triggerSync = () => {
    performSync();
  };

  /**
   * Reset sync stats
   */
  const resetStats = () => {
    setSyncStats({
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      mealsImported: 0,
      mealsExported: 0,
      unmatchedEvents: 0
    });
  };

  // Set up automatic sync interval
  useEffect(() => {
    isMountedRef.current = true;

    if (enabled) {
      // Perform initial sync after a short delay
      const initialTimeout = setTimeout(() => {
        performSync();
      }, 5000); // 5 seconds after mount

      // Set up recurring sync
      intervalRef.current = setInterval(() => {
        performSync();
      }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds

      return () => {
        clearTimeout(initialTimeout);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        isMountedRef.current = false;
      };
    }

    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMinutes]);

  return {
    isSyncing,
    lastSyncTime,
    syncError,
    syncStats,
    triggerSync,
    resetStats
  };
}