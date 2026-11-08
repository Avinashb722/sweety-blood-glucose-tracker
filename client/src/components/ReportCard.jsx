import React from 'react';

const ReportCard = ({ title, dateRange, stats, emptyMessage = 'No glucose readings found for this date.' }) => {
  const hasReadings = stats && stats.number_of_readings > 0;

  return (
    <div className="card report-section-card" style={{ marginBottom: '24px' }}>
      <div className="card-title" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '18px' }}>
        <div>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>{title}</span>
          {dateRange && (
            <div style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 500, marginTop: '4px' }}>
              🗓️ {dateRange}
            </div>
          )}
        </div>
        {hasReadings && (
          <span className="glucose-pill normal" style={{ fontSize: '0.85rem', padding: '4px 12px' }}>
            ✓ {stats.number_of_readings} {stats.number_of_readings === 1 ? 'Reading' : 'Readings'}
          </span>
        )}
      </div>

      {!hasReadings ? (
        <div className="empty-state" style={{ padding: '30px 16px' }}>
          <div className="empty-icon">📊</div>
          <p className="empty-title">{emptyMessage}</p>
          <p className="empty-subtitle">No readings were logged for this date range.</p>
        </div>
      ) : (
        <div className="stats-grid" style={{ marginBottom: 0 }}>
          <div className="stat-card" style={{ background: '#fdf2f8', borderColor: '#fbcfe8' }}>
            <span className="stat-label" style={{ color: '#be185d' }}>Total Readings</span>
            <span className="stat-value" style={{ color: '#9d174d' }}>{stats.number_of_readings}</span>
            <span className="stat-unit">records logged</span>
          </div>

          <div className="stat-card green" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
            <span className="stat-label" style={{ color: '#15803d' }}>Lowest Reading</span>
            <span className="stat-value" style={{ color: '#166534' }}>
              {stats.lowest_reading ?? '--'}
            </span>
            <span className="stat-unit">mg/dl</span>
          </div>

          <div className="stat-card purple" style={{ background: '#faf5ff', borderColor: '#e9d5ff' }}>
            <span className="stat-label" style={{ color: '#7e22ce' }}>Highest Reading</span>
            <span className="stat-value" style={{ color: '#6b21a8' }}>
              {stats.highest_reading ?? '--'}
            </span>
            <span className="stat-unit">mg/dl</span>
          </div>

          <div className="stat-card amber" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
            <span className="stat-label" style={{ color: '#b45309' }}>Average Reading</span>
            <span className="stat-value" style={{ color: '#92400e' }}>
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
