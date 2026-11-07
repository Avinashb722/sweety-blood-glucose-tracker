const db = require('../config/db');

// Helper: Get today's date in YYYY-MM-DD
const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: Format date for display like "15 Oct 2026"
const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const mIndex = parseInt(month, 10) - 1;
  const dayNum = parseInt(day, 10);
  return `${dayNum} ${monthNames[mIndex]} ${year}`;
};

// Helper: Parse and validate YYYY-MM-DD date string
const parseDate = (dateParam) => {
  const dateStr = dateParam ? String(dateParam).trim() : getTodayString();
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) {
    return null;
  }
  return dateStr;
};

// Daily Report
// GET /api/reports/daily?date=2026-10-15
const getDailyReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const dateStr = parseDate(req.query.date);

    if (!dateStr) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Expected YYYY-MM-DD.'
      });
    }

    // Aggregate statistics
    const statsResult = await db.query(
      `SELECT
         MAX(glucose_value) AS highest_reading,
         MIN(glucose_value) AS lowest_reading,
         AVG(glucose_value) AS average_reading,
         COUNT(*)::int AS number_of_readings
       FROM readings
       WHERE user_id = $1 AND reading_date = $2`,
      [userId, dateStr]
    );

    const stats = statsResult.rows[0];
    const count = parseInt(stats.number_of_readings || 0, 10);

    // List of readings for this day
    const readingsResult = await db.query(
      `SELECT id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
              time_slot, glucose_value
       FROM readings
       WHERE user_id = $1 AND reading_date = $2
       ORDER BY CASE time_slot
         WHEN 'Morning (fasting)' THEN 1
         WHEN 'After breakfast' THEN 2
         WHEN 'After lunch' THEN 3
         WHEN 'After dinner' THEN 4
         ELSE 5
       END ASC, id ASC`,
      [userId, dateStr]
    );

    const highest = stats.highest_reading !== null ? Number(stats.highest_reading) : null;
    const lowest = stats.lowest_reading !== null ? Number(stats.lowest_reading) : null;
    const average = stats.average_reading !== null ? parseFloat(Number(stats.average_reading).toFixed(1)) : null;

    return res.status(200).json({
      success: true,
      message: count > 0 ? 'Daily report generated successfully' : 'No glucose readings found for this date.',
      data: {
        date: dateStr,
        formatted_date: formatDateDisplay(dateStr),
        highest_reading: highest,
        lowest_reading: lowest,
        average_reading: average,
        number_of_readings: count,
        readings: readingsResult.rows
      }
    });
  } catch (error) {
    console.error('Daily report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error generating daily report.'
    });
  }
};

// Month-to-date Report
// GET /api/reports/month-to-date?date=2026-10-15
// Date range: 1st of current month to selected date
const getMonthToDateReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const dateStr = parseDate(req.query.date);

    if (!dateStr) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Expected YYYY-MM-DD.'
      });
    }

    const [year, month] = dateStr.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = dateStr;

    const statsResult = await db.query(
      `SELECT
         MAX(glucose_value) AS highest_reading,
         MIN(glucose_value) AS lowest_reading,
         AVG(glucose_value) AS average_reading,
         COUNT(*)::int AS number_of_readings
       FROM readings
       WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3`,
      [userId, startDate, endDate]
    );

    const stats = statsResult.rows[0];
    const count = parseInt(stats.number_of_readings || 0, 10);
    const highest = stats.highest_reading !== null ? Number(stats.highest_reading) : null;
    const lowest = stats.lowest_reading !== null ? Number(stats.lowest_reading) : null;
    const average = stats.average_reading !== null ? parseFloat(Number(stats.average_reading).toFixed(1)) : null;

    const formattedStart = formatDateDisplay(startDate);
    const formattedEnd = formatDateDisplay(endDate);

    return res.status(200).json({
      success: true,
      message: count > 0 ? 'Month-to-date report generated successfully' : 'No glucose readings found for this period.',
      data: {
        start_date: startDate,
        end_date: endDate,
        date_range_display: `${formattedStart} – ${formattedEnd}`,
        highest_reading: highest,
        lowest_reading: lowest,
        average_reading: average,
        number_of_readings: count
      }
    });
  } catch (error) {
    console.error('Month-to-date report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error generating month-to-date report.'
    });
  }
};

// Monthly Report (Whole previous month)
// GET /api/reports/monthly?date=2026-10-15
// If selected date is Oct 2026, whole previous month is 1 Sep 2026 - 30 Sep 2026
const getMonthlyReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const dateStr = parseDate(req.query.date);

    if (!dateStr) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Expected YYYY-MM-DD.'
      });
    }

    const [yearNum, monthNum] = dateStr.split('-').map(n => parseInt(n, 10));

    // Handle month and year rollover for previous month
    let prevYear = yearNum;
    let prevMonth = monthNum - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = yearNum - 1;
    }

    // Number of days in previous month
    const lastDayNum = new Date(prevYear, prevMonth, 0).getDate();

    const startMonthStr = String(prevMonth).padStart(2, '0');
    const startDate = `${prevYear}-${startMonthStr}-01`;
    const endDate = `${prevYear}-${startMonthStr}-${String(lastDayNum).padStart(2, '0')}`;

    const statsResult = await db.query(
      `SELECT
         MAX(glucose_value) AS highest_reading,
         MIN(glucose_value) AS lowest_reading,
         AVG(glucose_value) AS average_reading,
         COUNT(*)::int AS number_of_readings
       FROM readings
       WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3`,
      [userId, startDate, endDate]
    );

    const stats = statsResult.rows[0];
    const count = parseInt(stats.number_of_readings || 0, 10);
    const highest = stats.highest_reading !== null ? Number(stats.highest_reading) : null;
    const lowest = stats.lowest_reading !== null ? Number(stats.lowest_reading) : null;
    const average = stats.average_reading !== null ? parseFloat(Number(stats.average_reading).toFixed(1)) : null;

    const formattedStart = formatDateDisplay(startDate);
    const formattedEnd = formatDateDisplay(endDate);

    // Also get daily readings of previous month for optional trend chart
    const trendResult = await db.query(
      `SELECT TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
              ROUND(AVG(glucose_value), 1) as avg_glucose,
              MAX(glucose_value) as max_glucose,
              MIN(glucose_value) as min_glucose,
              COUNT(*)::int as count
       FROM readings
       WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3
       GROUP BY reading_date
       ORDER BY reading_date ASC`,
      [userId, startDate, endDate]
    );

    return res.status(200).json({
      success: true,
      message: count > 0 ? 'Monthly report generated successfully' : 'No glucose readings found for this period.',
      data: {
        start_date: startDate,
        end_date: endDate,
        date_range_display: `${formattedStart} – ${formattedEnd}`,
        highest_reading: highest,
        lowest_reading: lowest,
        average_reading: average,
        number_of_readings: count,
        trend: trendResult.rows.map(r => ({
          date: r.reading_date,
          avg: parseFloat(Number(r.avg_glucose).toFixed(1)),
          max: Number(r.max_glucose),
          min: Number(r.min_glucose),
          count: r.count
        }))
      }
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error generating monthly report.'
    });
  }
};

module.exports = {
  getDailyReport,
  getMonthToDateReport,
  getMonthlyReport
};

