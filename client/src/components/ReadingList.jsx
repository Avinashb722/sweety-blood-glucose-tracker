import React from 'react';

const ReadingList = ({ readings = [], onEdit, onDelete, isLoading = false }) => {
  const getPillClass = (val) => {
    if (val < 70) return 'glucose-pill low';
    if (val > 140) return 'glucose-pill high';
    return 'glucose-pill normal';
  };

  const getPillLabel = (val) => {
    if (val < 70) return 'Low';
    if (val > 140) return 'High';
    return 'Normal';
  };

  const handleDeleteClick = (reading) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete the reading for "${reading.reading_date} (${reading.time_slot})"?`
    );
    if (isConfirmed) {
      onDelete(reading.id);
    }
  };

  return (
    <div className="card">
      <div className="card-title">
        <span>📋 Reading History</span>
        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
          {readings.length} {readings.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {isLoading ? (
        <div className="empty-state">
          <p className="empty-subtitle">Loading your readings...</p>
        </div>
      ) : readings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🩸</div>
          <p className="empty-title">No glucose readings recorded yet.</p>
          <p className="empty-subtitle">Use the form to record your first blood glucose reading.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time Slot</th>
                <th>Glucose Value</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {readings.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>
                    {item.reading_date}
                  </td>
                  <td>
                    <span className="slot-tag">{item.time_slot}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                      {item.glucose_value}
                    </span>{' '}
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>mg/dl</span>
                  </td>
                  <td>
                    <span className={getPillClass(item.glucose_value)}>
                      {getPillLabel(item.glucose_value)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => onEdit(item)}
                        title="Edit reading"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        className="btn-icon delete"
                        onClick={() => handleDeleteClick(item)}
                        title="Delete reading"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReadingList;

