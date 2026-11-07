import React, { useState, useEffect } from 'react';

const TIME_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

// Helper: Today's date YYYY-MM-DD
const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ReadingForm = ({ onSave, editingReading, onCancelEdit, existingReadings = [] }) => {
  const [readingDate, setReadingDate] = useState(getTodayString());
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [glucoseValue, setGlucoseValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When editingReading changes, populate the form
  useEffect(() => {
    if (editingReading) {
      setReadingDate(editingReading.reading_date || getTodayString());
      setTimeSlot(editingReading.time_slot || TIME_SLOTS[0]);
      setGlucoseValue(String(editingReading.glucose_value || ''));
      setErrorMessage('');
    } else {
      setReadingDate(getTodayString());
      setTimeSlot(TIME_SLOTS[0]);
      setGlucoseValue('');
      setErrorMessage('');
    }
  }, [editingReading]);

  // Frontend client-side validation
  const validateForm = () => {
    // Rule: Value is required
    if (glucoseValue === '' || glucoseValue === null || glucoseValue === undefined) {
      return 'Please enter a glucose value.';
    }

    const valStr = String(glucoseValue).trim();
    if (valStr === '') {
      return 'Please enter a glucose value.';
    }

    // Reject decimal values, negative values, non-numbers
    if (valStr.includes('.') || isNaN(valStr)) {
      return 'Value must be between 40 and 600 mg/dl.';
    }

    const num = Number(valStr);
    // Rule: Whole number between 40 and 600
    if (!Number.isInteger(num) || num < 40 || num > 600) {
      return 'Value must be between 40 and 600 mg/dl.';
    }

    // Rule: Date cannot be in the future
    const today = getTodayString();
    if (readingDate > today) {
      return 'Date cannot be in the future.';
    }

    // Rule: Maximum 4 readings per day & Only one reading per slot per day
    const dayReadings = existingReadings.filter((r) => {
      // Exclude currently edited reading
      if (editingReading && r.id === editingReading.id) return false;
      return r.reading_date === readingDate;
    });

    if (dayReadings.length >= 4) {
      return 'You can add only 4 readings per day.';
    }

    const hasSlot = dayReadings.some((r) => r.time_slot === timeSlot);
    if (hasSlot) {
      const article = timeSlot.toLowerCase().startsWith('a') ? 'an' : 'a';
      return `You already have ${article} ${timeSlot} reading for this date.`;
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        reading_date: readingDate,
        time_slot: timeSlot,
        glucose_value: parseInt(glucoseValue, 10)
      });

      // Clear input on successful add
      if (!editingReading) {
        setGlucoseValue('');
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message || 'Failed to save reading.';
      setErrorMessage(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title">
        <span>{editingReading ? '✏️ Edit Reading' : '➕ Add Reading'}</span>
      </div>

      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Date Input */}
        <div className="form-group">
          <label className="form-label" htmlFor="reading_date">
            Date
          </label>
          <input
            id="reading_date"
            type="date"
            className="form-input"
            value={readingDate}
            max={getTodayString()}
            onChange={(e) => setReadingDate(e.target.value)}
            required
          />
        </div>

        {/* Time Slot Dropdown */}
        <div className="form-group">
          <label className="form-label" htmlFor="time_slot">
            Time Slot
          </label>
          <select
            id="time_slot"
            className="form-select"
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
            required
          >
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>

        {/* Glucose Value Input */}
        <div className="form-group">
          <label className="form-label" htmlFor="glucose_value">
            Glucose Value (mg/dl)
          </label>
          <input
            id="glucose_value"
            type="number"
            className="form-input"
            placeholder="e.g. 110"
            value={glucoseValue}
            min="40"
            max="600"
            step="1"
            onChange={(e) => setGlucoseValue(e.target.value)}
            required
          />
          <div className="form-hint">Valid range: 40 – 600 mg/dl (whole numbers only)</div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : editingReading ? 'Update Reading' : 'Save Reading'}
          </button>

          {editingReading && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancelEdit}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ReadingForm;

