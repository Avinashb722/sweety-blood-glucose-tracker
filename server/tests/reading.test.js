process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../server');

describe('Readings & Reports API Tests', () => {
  let user1Token;
  let user2Token;
  let readingId;

  // Use a fixed valid past date
  const testDate = '2026-05-10';

  beforeAll(async () => {
    // Register User 1
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Reader',
        email: 'alice@example.com',
        password: 'Password123'
      });
    user1Token = res1.body.data.token;

    // Register User 2
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob Reader',
        email: 'bob@example.com',
        password: 'Password123'
      });
    user2Token = res2.body.data.token;
  });

  describe('Validation & CRUD Rules', () => {
    test('Successfully add a reading', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: testDate,
          time_slot: 'Morning (fasting)',
          glucose_value: 95
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.glucose_value).toBe(95);
      expect(res.body.data.time_slot).toBe('Morning (fasting)');
      readingId = res.body.data.id;
    });

    test('Reject an empty glucose value', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: testDate,
          time_slot: 'After breakfast',
          glucose_value: ''
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Please enter a glucose value.');
    });

    test('Reject values below 40', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: testDate,
          time_slot: 'After breakfast',
          glucose_value: 39
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Value must be between 40 and 600 mg/dl.');
    });

    test('Reject values above 600', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: testDate,
          time_slot: 'After breakfast',
          glucose_value: 601
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Value must be between 40 and 600 mg/dl.');
    });

    test('Reject decimal values', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: testDate,
          time_slot: 'After breakfast',
          glucose_value: 120.5
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Value must be between 40 and 600 mg/dl.');
    });

    test('Reject duplicate slots for the same date', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: testDate,
          time_slot: 'Morning (fasting)',
          glucose_value: 105
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('You already have a Morning (fasting) reading for this date.');
    });

    test('Reject future dates', async () => {
      const futureDate = '2099-12-31';
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: futureDate,
          time_slot: 'After breakfast',
          glucose_value: 110
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Date cannot be in the future.');
    });

    test('Reject more than four readings per day', async () => {
      // Slot 1 (Morning) was added above. Add slots 2, 3, 4:
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ reading_date: testDate, time_slot: 'After breakfast', glucose_value: 130 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ reading_date: testDate, time_slot: 'After lunch', glucose_value: 140 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ reading_date: testDate, time_slot: 'After dinner', glucose_value: 120 });

      // Now date has 4 readings. Try adding a 5th:
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: testDate,
          time_slot: 'After lunch',
          glucose_value: 150
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('You can add only 4 readings per day.');
    });

    test('Prevent one user from accessing another user readings', async () => {
      // User 2 tries to GET User 1's reading
      const getRes = await request(app)
        .get(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(getRes.statusCode).toBe(404);

      // User 2 tries to UPDATE User 1's reading
      const putRes = await request(app)
        .put(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          reading_date: testDate,
          time_slot: 'Morning (fasting)',
          glucose_value: 115
        });

      expect(putRes.statusCode).toBe(404);

      // User 2 tries to DELETE User 1's reading
      const delRes = await request(app)
        .delete(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(delRes.statusCode).toBe(404);
    });

    test('Allow user to update their own reading without false self-duplicate error', async () => {
      const updateRes = await request(app)
        .put(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reading_date: testDate,
          time_slot: 'Morning (fasting)',
          glucose_value: 108
        });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.glucose_value).toBe(108);
    });

    test('Allow user to delete their own reading after confirmation', async () => {
      const delRes = await request(app)
        .delete(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(delRes.statusCode).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Verify it no longer exists
      const getRes = await request(app)
        .get(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(getRes.statusCode).toBe(404);
    });
  });

  describe('Report Calculations', () => {
    const reportDate = '2026-06-15';

    beforeAll(async () => {
      // Add 3 readings for User 2 on reportDate:
      // Values: 100, 150, 200 -> Highest: 200, Lowest: 100, Average: 150.0, Count: 3
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ reading_date: reportDate, time_slot: 'Morning (fasting)', glucose_value: 100 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ reading_date: reportDate, time_slot: 'After lunch', glucose_value: 150 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ reading_date: reportDate, time_slot: 'After dinner', glucose_value: 200 });
    });

    test('Correct highest, lowest, average, and reading count in daily report', async () => {
      const res = await request(app)
        .get(`/api/reports/daily?date=${reportDate}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.highest_reading).toBe(200);
      expect(res.body.data.lowest_reading).toBe(100);
      expect(res.body.data.average_reading).toBe(150.0);
      expect(res.body.data.number_of_readings).toBe(3);
      expect(res.body.data.readings).toHaveLength(3);
    });

    test('Empty report response for a date with no records', async () => {
      const emptyDate = '2026-01-01';
      const res = await request(app)
        .get(`/api/reports/daily?date=${emptyDate}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.highest_reading).toBeNull();
      expect(res.body.data.lowest_reading).toBeNull();
      expect(res.body.data.average_reading).toBeNull();
      expect(res.body.data.number_of_readings).toBe(0);
      expect(res.body.data.readings).toHaveLength(0);
      expect(res.body.message).toBe('No glucose readings found for this date.');
    });

    test('Month-to-date report reflects accurate statistics', async () => {
      const res = await request(app)
        .get(`/api/reports/month-to-date?date=${reportDate}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.highest_reading).toBe(200);
      expect(res.body.data.lowest_reading).toBe(100);
      expect(res.body.data.average_reading).toBe(150.0);
      expect(res.body.data.number_of_readings).toBe(3);
    });

    test('Monthly report for previous month returns clean response', async () => {
      // For selected date June 2026, previous month is May 2026.
      // User 2 has 0 readings in May 2026.
      const res = await request(app)
        .get(`/api/reports/monthly?date=${reportDate}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.number_of_readings).toBe(0);
      expect(res.body.message).toBe('No glucose readings found for this period.');
    });
  });
});
