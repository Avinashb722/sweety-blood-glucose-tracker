const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Helper: Format date to YYYY-MM-DD
const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

async function seed() {
  console.log('--- Starting Sweety Database Seeding ---');

  try {
    const demoEmail = 'demo@sweety.com';
    const demoName = 'Demo User';
    const plainPassword = 'Demo@123';

    // 1. Check or insert Demo User
    let userId;
    const existingUser = await db.query(
      'SELECT id FROM users WHERE LOWER(email) = $1',
      [demoEmail.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      console.log(`Demo user already exists with ID: ${userId}`);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);

      const userRes = await db.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
        [demoName, demoEmail.toLowerCase(), hashedPassword]
      );
      userId = userRes.rows[0].id;
      console.log(`Created new Demo user with ID: ${userId}`);
    }

    // 2. Generate sample readings for multiple dates
    // - Today
    // - Yesterday
    // - 5 days ago (current month)
    // - 15 days ago (current month)
    // - Previous month dates (for previous month report testing)
    const now = new Date();
    
    // Dates in current month
    const today = new Date(now);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const fiveDaysAgo = new Date(now);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    // Dates in previous month
    const prevMonthDate1 = new Date(now.getFullYear(), now.getMonth() - 1, 10);
    const prevMonthDate2 = new Date(now.getFullYear(), now.getMonth() - 1, 18);
    const prevMonthDate3 = new Date(now.getFullYear(), now.getMonth() - 1, 25);

    const sampleData = [
      // Today (3 readings)
      { date: formatDate(today), slot: 'Morning (fasting)', value: 95 },
      { date: formatDate(today), slot: 'After breakfast', value: 135 },
      { date: formatDate(today), slot: 'After lunch', value: 122 },

      // Yesterday (4 readings - full day)
      { date: formatDate(yesterday), slot: 'Morning (fasting)', value: 92 },
      { date: formatDate(yesterday), slot: 'After breakfast', value: 140 },
      { date: formatDate(yesterday), slot: 'After lunch', value: 128 },
      { date: formatDate(yesterday), slot: 'After dinner', value: 110 },

      // Five days ago (2 readings)
      { date: formatDate(fiveDaysAgo), slot: 'Morning (fasting)', value: 98 },
      { date: formatDate(fiveDaysAgo), slot: 'After lunch', value: 130 },

      // Previous month sample readings
      { date: formatDate(prevMonthDate1), slot: 'Morning (fasting)', value: 90 },
      { date: formatDate(prevMonthDate1), slot: 'After breakfast', value: 142 },
      { date: formatDate(prevMonthDate1), slot: 'After dinner', value: 118 },

      { date: formatDate(prevMonthDate2), slot: 'Morning (fasting)', value: 104 },
      { date: formatDate(prevMonthDate2), slot: 'After lunch', value: 138 },

      { date: formatDate(prevMonthDate3), slot: 'Morning (fasting)', value: 88 },
      { date: formatDate(prevMonthDate3), slot: 'After breakfast', value: 125 },
      { date: formatDate(prevMonthDate3), slot: 'After dinner', value: 109 }
    ];

    let insertedCount = 0;
    for (const item of sampleData) {
      const res = await db.query(
        `INSERT INTO readings (user_id, reading_date, time_slot, glucose_value)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, reading_date, time_slot) DO NOTHING
         RETURNING id`,
        [userId, item.date, item.slot, item.value]
      );
      if (res.rows.length > 0) {
        insertedCount++;
      }
    }

    console.log(`Successfully seeded ${insertedCount} new readings (skipped duplicates).`);
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    if (process.env.NODE_ENV !== 'test') {
      await db.pool.end();
    }
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
