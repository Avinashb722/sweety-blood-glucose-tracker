import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ReadingForm from '../components/ReadingForm';
import ReadingList from '../components/ReadingList';
import ReportCard from '../components/ReportCard';
import { readingService, reportService } from '../services/api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getYesterdayString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format YYYY-MM-DD into "10 Oct" for chart axis
const formatChartDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length < 3) return dateStr;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = parseInt(parts[2], 10);
  const mIndex = parseInt(parts[1], 10) - 1;
  return `${day} ${monthNames[mIndex] || ''}`;
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'reports'
  const [readings, setReadings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingReading, setEditingReading] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Reports state
  const [selectedReportDate, setSelectedReportDate] = useState(getTodayString());
  const [reportFilter, setReportFilter] = useState('all'); // 'all', 'daily', 'mtd', 'monthly'
  const [dailyReport, setDailyReport] = useState(null);
  const [mtdReport, setMtdReport] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [isReportLoading, setIsReportLoading] = useState(false);

  const userJson = localStorage.getItem('sweety_user');
  const user = userJson ? JSON.parse(userJson) : { name: 'User' };

  // Fetch all user readings
  const fetchReadings = async () => {
    try {
      setIsLoading(true);
      const res = await readingService.getAll();
      if (res.success && Array.isArray(res.data)) {
        setReadings(res.data);
      }
    } catch (err) {
      console.error('Failed to load readings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch report data for selected date
  const fetchReports = async (date) => {
    try {
      setIsReportLoading(true);
      const [dailyRes, mtdRes, monthlyRes] = await Promise.all([
        reportService.getDaily(date),
        reportService.getMonthToDate(date),
        reportService.getMonthly(date)
      ]);

      if (dailyRes.success) setDailyReport(dailyRes.data);
      if (mtdRes.success) setMtdReport(mtdRes.data);
      if (monthlyRes.success) setMonthlyReport(monthlyRes.data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setIsReportLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, []);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports(selectedReportDate);
    }
  }, [activeTab, selectedReportDate]);

  // Calculate Today's Summary Metrics
  const todayStr = getTodayString();
  const todayReadings = readings.filter((r) => r.reading_date === todayStr);
  const todayCount = todayReadings.length;
  const todayValues = todayReadings.map((r) => r.glucose_value);
  const todayHighest = todayCount > 0 ? Math.max(...todayValues) : '--';
  const todayLowest = todayCount > 0 ? Math.min(...todayValues) : '--';
  const todayAverage =
    todayCount > 0
      ? (todayValues.reduce((acc, curr) => acc + curr, 0) / todayCount).toFixed(1)
      : '--';

  // Handle Save (Add or Update)
  const handleSaveReading = async (readingData) => {
    if (editingReading) {
      // Update
      const res = await readingService.update(editingReading.id, readingData);
      if (res.success) {
        setEditingReading(null);
        setFeedbackMessage({ type: 'success', text: 'Reading updated successfully.' });
        await fetchReadings();
        if (activeTab === 'reports') fetchReports(selectedReportDate);
      }
    } else {
      // Create
      const res = await readingService.create(readingData);
      if (res.success) {
        setFeedbackMessage({ type: 'success', text: 'Reading added successfully.' });
        await fetchReadings();
        if (activeTab === 'reports') fetchReports(selectedReportDate);
      }
    }

    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // Handle Delete
  const handleDeleteReading = async (id) => {
    try {
      const res = await readingService.delete(id);
      if (res.success) {
        setFeedbackMessage({ type: 'success', text: 'Reading deleted successfully.' });
        await fetchReadings();
        if (activeTab === 'reports') fetchReports(selectedReportDate);
      }
    } catch (err) {
      setFeedbackMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Failed to delete reading.'
      });
    }

    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // Handle Edit initiation
  const handleEditClick = (reading) => {
    setEditingReading(reading);
    setActiveTab('dashboard');
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingReading(null);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="container page-content" style={{ flex: 1 }}>
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Welcome back, {user.name}! 👋</h1>
          <p className="page-subtitle">Track your daily blood glucose readings.</p>
        </div>

        {/* Global Feedback Alert */}
        {feedbackMessage && (
          <div className={`alert alert-${feedbackMessage.type}`} role="alert">
            <span>{feedbackMessage.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <>
            {/* Today's Summary Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Today's Readings</span>
                <span className="stat-value">{todayCount} / 4</span>
                <span className="stat-unit">slots completed today</span>
              </div>

              <div className="stat-card purple">
                <span className="stat-label">Highest Reading</span>
                <span className="stat-value" style={{ color: '#7c3aed' }}>
                  {todayHighest}
                </span>
                <span className="stat-unit">mg/dl (today)</span>
              </div>

              <div className="stat-card green">
                <span className="stat-label">Lowest Reading</span>
                <span className="stat-value" style={{ color: '#059669' }}>
                  {todayLowest}
                </span>
                <span className="stat-unit">mg/dl (today)</span>
              </div>

              <div className="stat-card amber">
                <span className="stat-label">Average Reading</span>
                <span className="stat-value" style={{ color: '#d97706' }}>
                  {todayAverage}
                </span>
                <span className="stat-unit">mg/dl (today)</span>
              </div>
            </div>

            {/* Dashboard 2-column Grid: Form + List */}
            <div className="dashboard-grid">
              <aside>
                <ReadingForm
                  onSave={handleSaveReading}
                  editingReading={editingReading}
                  onCancelEdit={handleCancelEdit}
                  existingReadings={readings}
                />
              </aside>

              <section>
                <ReadingList
                  readings={readings}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteReading}
                  isLoading={isLoading}
                />
              </section>
            </div>
          </>
        )}

        {/* REPORTS TAB - ALL IN ONE HIGH-VISIBILITY COLUMN */}
        {activeTab === 'reports' && (
          <section className="reports-container">
            {/* Date Selector Bar */}
            <div className="date-selector-bar">
              <div className="date-selector-group">
                <label htmlFor="report-date-picker">Select Report Date:</label>
                <input
                  id="report-date-picker"
                  type="date"
                  value={selectedReportDate}
                  max={getTodayString()}
                  onChange={(e) => setSelectedReportDate(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSelectedReportDate(getTodayString())}
                >
                  📅 Set to Today
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSelectedReportDate(getYesterdayString())}
                >
                  ⏮️ Yesterday
                </button>
              </div>
            </div>

            {/* High-Visibility Report Filter Pills */}
            <div className="report-filter-bar">
              <button
                type="button"
                className={`report-filter-pill ${reportFilter === 'all' ? 'active' : ''}`}
                onClick={() => setReportFilter('all')}
              >
                📄 All Reports (1 Column View)
              </button>
              <button
                type="button"
                className={`report-filter-pill ${reportFilter === 'daily' ? 'active' : ''}`}
                onClick={() => setReportFilter('daily')}
              >
                📅 1. Daily Report
              </button>
              <button
                type="button"
                className={`report-filter-pill ${reportFilter === 'mtd' ? 'active' : ''}`}
                onClick={() => setReportFilter('mtd')}
              >
                📈 2. Month-to-Date
              </button>
              <button
                type="button"
                className={`report-filter-pill ${reportFilter === 'monthly' ? 'active' : ''}`}
                onClick={() => setReportFilter('monthly')}
              >
                🗓️ 3. Monthly & Trend Chart
              </button>
            </div>

            {isReportLoading ? (
              <div className="empty-state">
                <p className="empty-subtitle">Calculating glucose reports...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {/* 1. Daily Report */}
                {(reportFilter === 'all' || reportFilter === 'daily') && (
                  <div className="report-block">
                    <div className="report-section-header">
                      <h2 className="report-section-title">
                        📅 1. Daily Report
                      </h2>
                    </div>

                    <ReportCard
                      title="Daily Report Summary"
                      dateRange={`Selected Date: ${dailyReport?.formatted_date || selectedReportDate}`}
                      stats={dailyReport}
                      emptyMessage="No glucose readings found for this date."
                    />

                    {/* Daily Report list of readings with slot */}
                    {dailyReport && dailyReport.readings && dailyReport.readings.length > 0 && (
                      <div className="card" style={{ marginTop: '-12px' }}>
                        <div className="card-title">
                          <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                            Detailed Readings for {dailyReport.formatted_date}
                          </span>
                        </div>
                        <div className="table-responsive">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Time Slot</th>
                                <th>Glucose Value</th>
                                <th>Clinical Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dailyReport.readings.map((r) => (
                                <tr key={r.id}>
                                  <td>
                                    <span className="slot-tag">{r.time_slot}</span>
                                  </td>
                                  <td>
                                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                                      {r.glucose_value}
                                    </span>{' '}
                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>mg/dl</span>
                                  </td>
                                  <td>
                                    <span className={`glucose-pill ${r.glucose_value < 70 ? 'low' : r.glucose_value > 140 ? 'high' : 'normal'}`}>
                                      {r.glucose_value < 70 ? '⚠️ Low' : r.glucose_value > 140 ? '⚠️ High' : '✓ Normal'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Month-to-date Report */}
                {(reportFilter === 'all' || reportFilter === 'mtd') && (
                  <div className="report-block">
                    <div className="report-section-header">
                      <h2 className="report-section-title">
                        📈 2. Month-to-Date Report
                      </h2>
                    </div>

                    <ReportCard
                      title="Month-to-Date Summary"
                      dateRange={`Date range: ${mtdReport?.date_range_display || ''}`}
                      stats={mtdReport}
                      emptyMessage="No glucose readings found for this period."
                    />
                  </div>
                )}

                {/* 3. Monthly Report (Whole previous month) & Trend Chart */}
                {(reportFilter === 'all' || reportFilter === 'monthly') && (
                  <div className="report-block">
                    <div className="report-section-header">
                      <h2 className="report-section-title">
                        🗓️ 3. Monthly Report (Whole Previous Month)
                      </h2>
                    </div>

                    <ReportCard
                      title="Previous Month Summary"
                      dateRange={`Date range: ${monthlyReport?.date_range_display || ''}`}
                      stats={monthlyReport}
                      emptyMessage="No glucose readings found for this period."
                    />

                    {/* High Visibility Monthly Trend Chart using Recharts */}
                    {monthlyReport && monthlyReport.trend && monthlyReport.trend.length > 0 && (
                      <div className="card" style={{ marginTop: '16px' }}>
                        <div className="card-title">
                          <div>
                            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                              📊 Previous Month Daily Average Trend
                            </span>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                              Blood glucose averages plotted across dates in {monthlyReport.date_range_display}
                            </div>
                          </div>
                        </div>

                        {/* Chart Area */}
                        <div style={{ width: '100%', height: 320, marginTop: '16px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={monthlyReport.trend}
                              margin={{ top: 15, right: 25, left: 0, bottom: 25 }}
                            >
                              <defs>
                                <linearGradient id="glucoseGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#db2777" stopOpacity={0.25} />
                                  <stop offset="95%" stopColor="#db2777" stopOpacity={0.0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                              <XAxis
                                dataKey="date"
                                stroke="#64748b"
                                fontSize={12}
                                tickFormatter={formatChartDate}
                                tickLine={false}
                                dy={10}
                              />
                              <YAxis
                                stroke="#64748b"
                                fontSize={12}
                                domain={[40, 'auto']}
                                unit=" mg"
                                tickLine={false}
                              />
                              <Tooltip
                                formatter={(value) => [`${value} mg/dl`, 'Daily Average']}
                                labelFormatter={(label) => `Date: ${formatChartDate(label)} (${label})`}
                                contentStyle={{
                                  backgroundColor: '#ffffff',
                                  borderRadius: '8px',
                                  border: '1px solid #e2e8f0',
                                  boxShadow: '0 4px 10px rgba(0,0,0,0.08)'
                                }}
                              />
                              <ReferenceLine
                                y={140}
                                stroke="#ef4444"
                                strokeDasharray="4 4"
                                label={{ value: 'Target Max (140 mg/dl)', fill: '#ef4444', fontSize: 11, position: 'top' }}
                              />
                              <ReferenceLine
                                y={70}
                                stroke="#f59e0b"
                                strokeDasharray="4 4"
                                label={{ value: 'Target Min (70 mg/dl)', fill: '#d97706', fontSize: 11, position: 'bottom' }}
                              />
                              <Area
                                type="monotone"
                                dataKey="avg"
                                stroke="#db2777"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#glucoseGradient)"
                                dot={{ r: 5, fill: '#db2777', stroke: '#ffffff', strokeWidth: 2 }}
                                activeDot={{ r: 7, fill: '#db2777', stroke: '#ffffff', strokeWidth: 2 }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Daily Breakdown Table for the Chart */}
                        <div style={{ marginTop: '24px' }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>
                            Daily Statistics Breakdown:
                          </h4>
                          <div className="table-responsive">
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Readings Logged</th>
                                  <th>Lowest Value</th>
                                  <th>Highest Value</th>
                                  <th>Average Glucose</th>
                                </tr>
                              </thead>
                              <tbody>
                                {monthlyReport.trend.map((day) => (
                                  <tr key={day.date}>
                                    <td style={{ fontWeight: 600 }}>{formatChartDate(day.date)}</td>
                                    <td>{day.count} {day.count === 1 ? 'reading' : 'readings'}</td>
                                    <td style={{ color: '#059669', fontWeight: 600 }}>{day.min} mg/dl</td>
                                    <td style={{ color: '#7c3aed', fontWeight: 600 }}>{day.max} mg/dl</td>
                                    <td>
                                      <span style={{ fontWeight: 700, color: '#db2777' }}>{day.avg} mg/dl</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
