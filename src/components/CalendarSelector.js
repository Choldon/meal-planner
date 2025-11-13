import React, { useState, useEffect } from 'react';
import { fetchUserCalendars, getSelectedCalendarId, setSelectedCalendarId } from '../utils/calendarSelector';
import '../styles/CalendarSelector.css';

function CalendarSelector({ onCalendarChange }) {
  const [calendars, setCalendars] = useState([]);
  const [selectedId, setSelectedId] = useState(getSelectedCalendarId());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadCalendars();
  }, []);

  // Poll for changes to selected calendar (in case it's updated elsewhere, like in setup modal)
  useEffect(() => {
    const checkForUpdates = () => {
      const currentSelected = getSelectedCalendarId();
      if (currentSelected !== selectedId) {
        console.log('Calendar selection updated externally:', currentSelected);
        setSelectedId(currentSelected);
      }
    };

    // Check immediately and then every second
    checkForUpdates();
    const interval = setInterval(checkForUpdates, 1000);

    return () => clearInterval(interval);
  }, [selectedId]);

  const loadCalendars = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const cals = await fetchUserCalendars();
      setCalendars(cals);
    } catch (err) {
      setError(err.message);
      console.error('Error loading calendars:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCalendar = (calendarId) => {
    setSelectedId(calendarId);
    setSelectedCalendarId(calendarId);
    setIsOpen(false);
    
    if (onCalendarChange) {
      onCalendarChange(calendarId);
    }
  };

  const getDisplayName = () => {
    if (selectedId === 'primary') {
      const primaryCal = calendars.find(cal => cal.primary);
      return primaryCal ? `${primaryCal.summary} (Primary)` : 'Primary Calendar';
    }
    
    const calendar = calendars.find(cal => cal.id === selectedId);
    return calendar ? calendar.summary : 'Select Calendar';
  };

  if (loading && calendars.length === 0) {
    return (
      <div className="calendar-selector loading">
        <span>Loading calendars...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendar-selector error">
        <span>⚠️ {error}</span>
        <button onClick={loadCalendars} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="calendar-selector">
      <button 
        className="calendar-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Select Google Calendar"
      >
        <span className="calendar-icon">📅</span>
        <span className="calendar-name">{getDisplayName()}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <>
          <div className="calendar-selector-overlay" onClick={() => setIsOpen(false)} />
          <div className="calendar-selector-dropdown">
            <div className="dropdown-header">
              <h4>Select Calendar</h4>
              <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
            </div>
            <div className="calendar-list">
              {calendars.map(calendar => (
                <button
                  key={calendar.id}
                  className={`calendar-item ${selectedId === calendar.id ? 'selected' : ''}`}
                  onClick={() => handleSelectCalendar(calendar.id)}
                >
                  <div 
                    className="calendar-color" 
                    style={{ backgroundColor: calendar.backgroundColor || '#4285f4' }}
                  />
                  <div className="calendar-info">
                    <div className="calendar-title">
                      {calendar.summary}
                      {calendar.primary && <span className="primary-badge">Primary</span>}
                    </div>
                    {calendar.description && (
                      <div className="calendar-description">{calendar.description}</div>
                    )}
                  </div>
                  {selectedId === calendar.id && (
                    <span className="check-icon">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CalendarSelector;