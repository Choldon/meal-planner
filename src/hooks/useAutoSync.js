/**
 * useAutoSync Hook
 * Automatically syncs Google Calendar events in the background while the app is open
 */

import { useEffect, useRef, useState } from 'react';
import { 
  importFromGoogleCalendar, 
  createMealsFromEvents,
  storeUnmatchedEvents 
} from '../utils/syncEngine';

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
    unmatchedEvents: 0
  });
  
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  /**
   * Perform automatic sync
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

      // Import events from Google Calendar
      const importResults = await importFromGoogleCalendar(startDateStr, endDateStr);

      // Only proceed if there are matched events
      if (importResults.matched.length > 0) {
        // Automatically import all matched events
        const createResults = await createMealsFromEvents(importResults.matched);
        
        // Store unmatched events for later resolution
        if (importResults.unmatched.length > 0) {
          await storeUnmatchedEvents(importResults.unmatched);
        }

        // Update stats
        if (isMountedRef.current) {
          setSyncStats(prev => ({
            totalSyncs: prev.totalSyncs + 1,
            successfulSyncs: prev.successfulSyncs + 1,
            failedSyncs: prev.failedSyncs,
            mealsImported: prev.mealsImported + createResults.created.length,
            unmatchedEvents: prev.unmatchedEvents + importResults.unmatched.length
          }));

          // Call callback if provided
          if (onSyncComplete && createResults.created.length > 0) {
            onSyncComplete({
              created: createResults.created.length,
              skipped: createResults.skipped.length,
              unmatched: importResults.unmatched.length
            });
          }
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