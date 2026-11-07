import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ReadingForm from '../components/ReadingForm';
import ReadingList from '../components/ReadingList';
import ReportCard from '../components/ReportCard';
import { readingService, reportService } from '../services/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
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

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'reports'
  const [readings, setReadings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingReading, setEditingReading] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Reports state
  const [selectedReportDate, setSelectedReportDate] = useState(getTodayString());
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

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <section>
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

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSelectedReportDate(getTodayString())}
                >
                  Set to Today
                </button>
              </div>
            </div>

            {isReportLoading ? (
              <div className="empty-state">
                <p className="empty-subtitle">Calculating glucose reports...</p>
              </div>
            ) : (
              <>
                {/* 1. Daily Report */}
                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                    📅 1. Daily Report
                  </h2>
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
                        <span style={{ fontSize: '1rem' }}>Readings on {dailyReport.formatted_date}</span>
                      </div>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Time Slot</th>
                            <th>Glucose Value</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyReport.readings.map((r) => (
                            <tr key={r.id}>
                              <td><span className="slot-tag">{r.time_slot}</span></td>
                              <td style={{ fontWeight: 700 }}>{r.glucose_value} mg/dl</td>
                              <td>
                                <span className={`glucose-pill ${r.glucose_value < 70 ? 'low' : r.glucose_value > 140 ? 'high' : 'normal'}`}>
                                  {r.glucose_value < 70 ? 'Low' : r.glucose_value > 140 ? 'High' : 'Normal'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 2. Month-to-date Report */}
                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                    📈 2. Month-to-Date Report
                  </h2>
                  <ReportCard
                    title="Month-to-Date Summary"
                    dateRange={`Date range: ${mtdReport?.date_range_display || ''}`}
                    stats={mtdReport}
                    emptyMessage="No glucose readings found for this period."
                  />
                </div>

                {/* 3. Monthly Report (Whole previous month) */}
                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                    🗓️ 3. Monthly Report (Whole Previous Month)
                  </h2>
                  <ReportCard
                    title="Previous Month Summary"
                    dateRange={`Date range: ${monthlyReport?.date_range_display || ''}`}
                    stats={monthlyReport}
                    emptyMessage="No glucose readings found for this period."
                  />

                  {/* Bonus Task: Monthly Trend Chart using Recharts */}
                  {monthlyReport && monthlyReport.trend && monthlyReport.trend.length > 0 && (
                    <div className="card" style={{ marginTop: '16px' }}>
                      <div className="card-title">
                        <span>📊 Previous Month Daily Average Trend</span>
                      </div>
                      <div style={{ width: '100%', height: 280, marginTop: '16px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={monthlyReport.trend}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis
                              dataKey="date"
                              stroke="#64748b"
                              fontSize={12}
                              tickFormatter={(str) => str.slice(5)} // Show MM-DD
                            />
                            <YAxis
                              stroke="#64748b"
                              fontSize={12}
                              domain={[40, 'auto']}
                              unit=" mg"
                            />
                            <Tooltip
                              formatter={(value) => [`${value} mg/dl`, 'Avg Glucose']}
                              labelFormatter={(label) => `Date: ${label}`}
                              contentStyle={{
                                backgroundColor: '#ffffff',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                              }}
                            />
                            <ReferenceLine y={140} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Target Max (140)', fill: '#f43f5e', fontSize: 11 }} />
                            <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Target Min (70)', fill: '#f59e0b', fontSize: 11 }} />
                            <Line
                              type="monotone"
                              dataKey="avg"
                              stroke="#db2777"
                              strokeWidth={3}
                              dot={{ r: 4, fill: '#db2777' }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default Dashboard;

