import React, { useState, useEffect } from 'react';
import '../styles/ImportModal.css';
import { 
  importFromGoogleCalendar, 
  createMealsFromEvents,
  storeUnmatchedEvents 
} from '../utils/syncEngine';

function ImportModal({ isOpen, onClose, startDate, endDate, onImportComplete }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('preview'); // 'preview', 'importing', 'complete'
  const [importResults, setImportResults] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [error, setError] = useState(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await importFromGoogleCalendar(startDate, endDate);
      setImportResults(results);
      
      // Pre-select all matched events
      setSelectedEvents(results.matched.map((_, index) => index));
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    } else {
      // Reset state when modal closes
      setStep('preview');
      setImportResults(null);
      setSelectedEvents([]);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, startDate, endDate]);

  const toggleEventSelection = (index) => {
    setSelectedEvents(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const handleImport = async () => {
    setStep('importing');
    setLoading(true);
    setError(null);

    try {
      // Get selected matched events
      const eventsToImport = selectedEvents.map(index => importResults.matched[index]);
      
      // Create meals from selected events
      const createResults = await createMealsFromEvents(eventsToImport);
      
      // Store unmatched events for later resolution
      if (importResults.unmatched.length > 0) {
        await storeUnmatchedEvents(importResults.unmatched);
      }
      
      setStep('complete');
      
      // Notify parent component
      if (onImportComplete) {
        onImportComplete({
          created: createResults.created.length,
          skipped: createResults.skipped.length,
          failed: createResults.failed.length,
          unmatched: importResults.unmatched.length
        });
      }
      
    } catch (err) {
      setError(err.message);
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  const getConfidenceBadge = (confidence) => {
    const badges = {
      high: { text: 'High Match', className: 'confidence-high' },
      medium: { text: 'Medium Match', className: 'confidence-medium' },
      low: { text: 'Low Match', className: 'confidence-low' }
    };
    return badges[confidence] || badges.low;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📥 Import from Google Calendar</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          {loading && step === 'preview' && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Fetching events from Google Calendar...</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>❌ {error}</p>
              <button onClick={fetchEvents} className="retry-button">
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && importResults && step === 'preview' && (
            <>
              <div className="import-summary">
                <div className="summary-stat">
                  <span className="stat-number">{importResults.summary.total}</span>
                  <span className="stat-label">Total Events</span>
                </div>
                <div className="summary-stat success">
                  <span className="stat-number">{importResults.summary.matched}</span>
                  <span className="stat-label">Matched</span>
                </div>
                <div className="summary-stat warning">
                  <span className="stat-number">{importResults.summary.unmatched}</span>
                  <span className="stat-label">Unmatched</span>
                </div>
                {importResults.summary.errors > 0 && (
                  <div className="summary-stat error">
                    <span className="stat-number">{importResults.summary.errors}</span>
                    <span className="stat-label">Errors</span>
                  </div>
                )}
              </div>

              {importResults.summary.total === 0 && (
                <div className="empty-state">
                  <p>No meal events found in Google Calendar for this date range.</p>
                  <p className="hint">
                    Events should be formatted as: "Lunch: Recipe Name" or "Dinner: Recipe Name"
                  </p>
                </div>
              )}

              {importResults.matched.length > 0 && (
                <div className="events-section">
                  <h3>✅ Matched Events ({importResults.matched.length})</h3>
                  <p className="section-description">
                    These events were successfully matched to recipes in your database.
                  </p>
                  
                  <div className="events-list">
                    {importResults.matched.map((item, index) => {
                      const badge = getConfidenceBadge(item.confidence);
                      const isSelected = selectedEvents.includes(index);
                      
                      return (
                        <div 
                          key={index} 
                          className={`event-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleEventSelection(index)}
                        >
                          <div className="event-checkbox">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => toggleEventSelection(index)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="event-details">
                            <div className="event-header">
                              <span className="event-date">{formatDate(item.event.date)}</span>
                              <span className="event-meal-type">{item.event.mealType}</span>
                              <span className={`confidence-badge ${badge.className}`}>
                                {badge.text}
                              </span>
                            </div>
                            <div className="event-recipe">
                              <span className="original-name">{item.event.recipeName}</span>
                              {item.matchType !== 'exact' && (
                                <>
                                  <span className="arrow">→</span>
                                  <span className="matched-name">{item.recipe.title}</span>
                                </>
                              )}
                            </div>
                            {item.matchType !== 'exact' && (
                              <div className="match-info">
                                {item.matchType === 'fuzzy' && (
                                  <span className="match-type">
                                    Fuzzy match ({Math.round(item.matchScore * 100)}% similar)
                                  </span>
                                )}
                                {item.matchType === 'partial' && (
                                  <span className="match-type">Partial match</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {importResults.unmatched.length > 0 && (
                <div className="events-section unmatched-section">
                  <h3>⚠️ Unmatched Events ({importResults.unmatched.length})</h3>
                  <p className="section-description">
                    These events couldn't be matched to existing recipes. They will be saved for you to resolve later.
                  </p>
                  
                  <div className="events-list">
                    {importResults.unmatched.map((item, index) => (
                      <div key={index} className="event-item unmatched">
                        <div className="event-details">
                          <div className="event-header">
                            <span className="event-date">{formatDate(item.event.date)}</span>
                            <span className="event-meal-type">{item.event.mealType}</span>
                          </div>
                          <div className="event-recipe">
                            <span className="original-name">{item.event.recipeName}</span>
                          </div>
                          <div className="match-info">
                            <span className="reason">{item.reason}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importResults.errors.length > 0 && (
                <div className="events-section errors-section">
                  <h3>❌ Errors ({importResults.errors.length})</h3>
                  <div className="events-list">
                    {importResults.errors.map((item, index) => (
                      <div key={index} className="event-item error">
                        <div className="event-details">
                          <div className="event-recipe">
                            <span className="original-name">{item.event.originalTitle}</span>
                          </div>
                          <div className="error-details">
                            {item.errors.map((err, i) => (
                              <span key={i} className="error-text">{err}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {step === 'importing' && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Importing selected events...</p>
            </div>
          )}

          {step === 'complete' && (
            <div className="success-state">
              <div className="success-icon">✅</div>
              <h3>Import Complete!</h3>
              <p>Your meals have been successfully imported from Google Calendar.</p>
              <button className="primary-button" onClick={handleClose}>
                Done
              </button>
            </div>
          )}
        </div>

        {!loading && !error && importResults && step === 'preview' && importResults.matched.length > 0 && (
          <div className="modal-footer">
            <button className="secondary-button" onClick={handleClose}>
              Cancel
            </button>
            <button 
              className="primary-button" 
              onClick={handleImport}
              disabled={selectedEvents.length === 0}
            >
              Import {selectedEvents.length} Event{selectedEvents.length !== 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImportModal;