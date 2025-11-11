import React from 'react';
import '../styles/SyncStatusIndicator.css';

function SyncStatusIndicator({ isSyncing, lastSyncTime, syncError, syncStats }) {
  const formatLastSync = (date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="sync-status-indicator">
      <div className="sync-status-main">
        {isSyncing ? (
          <>
            <span className="sync-icon syncing">🔄</span>
            <span className="sync-text">Syncing...</span>
          </>
        ) : syncError ? (
          <>
            <span className="sync-icon error">⚠️</span>
            <span className="sync-text error">Sync error</span>
          </>
        ) : (
          <>
            <span className="sync-icon success">✓</span>
            <span className="sync-text">Auto-sync active</span>
          </>
        )}
      </div>
      
      <div className="sync-status-details">
        <span className="sync-detail">Last: {formatLastSync(lastSyncTime)}</span>
        {syncStats && syncStats.mealsImported > 0 && (
          <span className="sync-detail imported">
            {syncStats.mealsImported} meal{syncStats.mealsImported !== 1 ? 's' : ''} imported
          </span>
        )}
        {syncStats && syncStats.unmatchedEvents > 0 && (
          <span className="sync-detail unmatched">
            {syncStats.unmatchedEvents} unmatched
          </span>
        )}
      </div>
      
      {syncError && (
        <div className="sync-error-message">
          {syncError}
        </div>
      )}
    </div>
  );
}

export default SyncStatusIndicator;