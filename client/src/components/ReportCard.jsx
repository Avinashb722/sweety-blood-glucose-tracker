import React from 'react';

const ReportCard = ({ title, dateRange, stats, emptyMessage = 'No glucose readings found for this date.' }) => {
  const hasReadings = stats && stats.number_of_readings > 0;

  return (
    <div className="card">
      <div className="card-title">
        <div>
          <span>{title}</span>
          {dateRange && (
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'normal', marginTop: '2px' }}>
              {dateRange}
            </div>
          )}
        </div>
      </div>

      {!hasReadings ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p className="empty-title">{emptyMessage}</p>
          <p className="empty-subtitle">Add readings to generate your blood glucose summary.</p>
        </div>
      ) : (
        <div className="stats-grid" style={{ marginBottom: 0 }}>
          <div className="stat-card">
            <span className="stat-label">Total Readings</span>
            <span className="stat-value">{stats.number_of_readings}</span>
            <span className="stat-unit">records logged</span>
          </div>

          <div className="stat-card green">
            <span className="stat-label">Lowest Reading</span>
            <span className="stat-value" style={{ color: '#059669' }}>
              {stats.lowest_reading ?? '--'}
            </span>
            <span className="stat-unit">mg/dl</span>
          </div>

          <div className="stat-card purple">
            <span className="stat-label">Highest Reading</span>
            <span className="stat-value" style={{ color: '#7c3aed' }}>
              {stats.highest_reading ?? '--'}
            </span>
            <span className="stat-unit">mg/dl</span>
          </div>

          <div className="stat-card amber">
            <span className="stat-label">Average Reading</span>
            <span className="stat-value" style={{ color: '#d97706' }}>
              {stats.average_reading !== null ? Number(stats.average_reading).toFixed(1) : '--'}
            </span>
            <span className="stat-unit">mg/dl</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportCard;

