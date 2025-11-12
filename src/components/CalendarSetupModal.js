import React, { useState, useEffect } from 'react';
import { fetchUserCalendars, setSelectedCalendarId } from '../utils/calendarSelector';
import '../styles/CalendarSetupModal.css';

function CalendarSetupModal({ isOpen, onComplete }) {
  const [calendars, setCalendars] = useState([]);
  const [selectedId, setSelectedId] = useState('primary');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadCalendars();
    }
  }, [isOpen]);

  const loadCalendars = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const cals = await fetchUserCalendars();
      setCalendars(cals);
      
      // Pre-select primary calendar
      const primaryCal = cals.find(cal => cal.primary);
      if (primaryCal) {
        setSelectedId(primaryCal.id);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading calendars:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    setSelectedCalendarId(selectedId);
    onComplete(selectedId);
  };

  const handleSkip = () => {
    // Use primary calendar by default
    setSelectedCalendarId('primary');
    onComplete('primary');
  };

  if (!isOpen) return null;

  return (
    <div className="calendar-setup-overlay">
      <div className="calendar-setup-modal">
        <div className="setup-header">
          <h2>🎉 Welcome to Meal Planner!</h2>
          <p>Let's set up your Google Calendar integration</p>
        </div>

        <div className="setup-body">
          {loading ? (
            <div className="setup-loading">
              <div className="spinner"></div>
              <p>Loading your calendars...</p>
            </div>
          ) : error ? (
            <div className="setup-error">
              <p>⚠️ {error}</p>
              <button onClick={loadCalendars} className="retry-btn">
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="setup-instruction">
                <p>Select which Google Calendar you'd like to sync your meals with:</p>
              </div>

              <div className="calendar-options">
                {calendars.map(calendar => (
                  <label
                    key={calendar.id}
                    className={`calendar-option ${selectedId === calendar.id ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="calendar"
                      value={calendar.id}
                      checked={selectedId === calendar.id}
                      onChange={(e) => setSelectedId(e.target.value)}
                    />
                    <div 
                      className="calendar-color-dot" 
                      style={{ backgroundColor: calendar.backgroundColor || '#4285f4' }}
                    />
                    <div className="calendar-info">
                      <div className="calendar-name">
                        {calendar.summary}
                        {calendar.primary && <span className="primary-badge">Primary</span>}
                      </div>
                      {calendar.description && (
                        <div className="calendar-desc">{calendar.description}</div>
                      )}
                    </div>
                    {selectedId === calendar.id && (
                      <span className="check-mark">✓</span>
                    )}
                  </label>
                ))}
              </div>

              <div className="setup-info">
                <p>💡 <strong>Tip:</strong> You can change this later from the calendar page.</p>
              </div>
            </>
          )}
        </div>

        {!loading && !error && (
          <div className="setup-footer">
            <button onClick={handleSkip} className="btn-skip">
              Skip for Now
            </button>
            <button onClick={handleConfirm} className="btn-confirm">
              Continue with Selected Calendar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarSetupModal;