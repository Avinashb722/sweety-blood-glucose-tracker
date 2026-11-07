const db = require('../config/db');

const VALID_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

// Helper: Get today's date in YYYY-MM-DD using local time
const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Common validation logic for glucose value, slot, and date
const validateReadingInput = (reading_date, time_slot, glucose_value) => {
  // Rule 1: Value is required
  if (
    glucose_value === undefined ||
    glucose_value === null ||
    glucose_value === '' ||
    String(glucose_value).trim() === ''
  ) {
    return { isValid: false, status: 400, message: 'Please enter a glucose value.' };
  }

  // Check for decimals or non-numeric
  const strVal = String(glucose_value).trim();
  if (strVal.includes('.') || isNaN(strVal)) {
    return { isValid: false, status: 400, message: 'Value must be between 40 and 600 mg/dl.' };
  }

  const numVal = Number(strVal);
  // Rule 2: Value must be a whole number between 40 and 600
  if (!Number.isInteger(numVal) || numVal < 40 || numVal > 600) {
    return { isValid: false, status: 400, message: 'Value must be between 40 and 600 mg/dl.' };
  }

  // Slot validation
  if (!time_slot || !VALID_SLOTS.includes(time_slot)) {
    return {
      isValid: false,
      status: 400,
      message: 'Invalid time slot. Must be Morning (fasting), After breakfast, After lunch, or After dinner.'
    };
  }

  // Date validation
  if (!reading_date) {
    return { isValid: false, status: 400, message: 'Date is required.' };
  }

  // Rule 5: Date cannot be in the future
  const today = getTodayString();
  const inputDate = String(reading_date).slice(0, 10);
  if (inputDate > today) {
    return { isValid: false, status: 400, message: 'Date cannot be in the future.' };
  }

  return { isValid: true, numVal, cleanDate: inputDate };
};

// Add a new glucose reading
const addReading = async (req, res) => {
  const userId = req.user.id;
  const { reading_date, time_slot, glucose_value } = req.body;

  const validation = validateReadingInput(reading_date, time_slot, glucose_value);
  if (!validation.isValid) {
    return res.status(validation.status).json({
      success: false,
      message: validation.message
    });
  }

  const { numVal, cleanDate } = validation;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Rule 4: Maximum 4 readings per day
    const countQuery = await client.query(
      'SELECT COUNT(*)::int AS count FROM readings WHERE user_id = $1 AND reading_date = $2',
      [userId, cleanDate]
    );
    const dayCount = parseInt(countQuery.rows[0].count, 10);

    if (dayCount >= 4) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'You can add only 4 readings per day.'
      });
    }

    // Rule 3: Only one reading per slot per day
    const duplicateQuery = await client.query(
      'SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3',
      [userId, cleanDate, time_slot]
    );

    if (duplicateQuery.rows.length > 0) {
      await client.query('ROLLBACK');
      const article = time_slot.toLowerCase().startsWith('a') ? 'an' : 'a';
      return res.status(409).json({
        success: false,
        message: `You already have ${article} ${time_slot} reading for this date.`
      });
    }

    // Insert reading
    const insertQuery = await client.query(
      `INSERT INTO readings (user_id, reading_date, time_slot, glucose_value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, time_slot, glucose_value, created_at, updated_at`,
      [userId, cleanDate, time_slot, numVal]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Reading added successfully',
      data: insertQuery.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add reading error:', error);

    // Check unique constraint violation if race condition occurred
    if (error.code === '23505') {
      const article = time_slot.toLowerCase().startsWith('a') ? 'an' : 'a';
      return res.status(409).json({
        success: false,
        message: `You already have ${article} ${time_slot} reading for this date.`
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error adding reading.'
    });
  } finally {
    client.release();
  }
};

// Get all readings for current user (with optional pagination support)
const getReadings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit } = req.query;

    let sql = `
      SELECT id, user_id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
             time_slot, glucose_value, created_at, updated_at
      FROM readings
      WHERE user_id = $1
      ORDER BY reading_date DESC,
        CASE time_slot
          WHEN 'Morning (fasting)' THEN 1
          WHEN 'After breakfast' THEN 2
          WHEN 'After lunch' THEN 3
          WHEN 'After dinner' THEN 4
          ELSE 5
        END ASC,
        id DESC
    `;

    const params = [userId];

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.max(1, parseInt(limit, 10));
      const offset = (pageNum - 1) * limitNum;

      const totalResult = await db.query(
        'SELECT COUNT(*)::int AS total FROM readings WHERE user_id = $1',
        [userId]
      );
      const total = totalResult.rows[0].total;

      sql += ` LIMIT $2 OFFSET $3`;
      params.push(limitNum, offset);

      const result = await db.query(sql, params);
      return res.status(200).json({
        success: true,
        message: 'Readings fetched successfully',
        data: result.rows,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    }

    const result = await db.query(sql, params);

    return res.status(200).json({
      success: true,
      message: 'Readings fetched successfully',
      data: result.rows
    });
  } catch (error) {
    console.error('Get readings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error fetching readings.'
    });
  }
};

// Get single reading
const getReadingById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      `SELECT id, user_id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
              time_slot, glucose_value, created_at, updated_at
       FROM readings
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reading not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Reading retrieved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get single reading error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error retrieving reading.'
    });
  }
};

// Update existing reading
const updateReading = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { reading_date, time_slot, glucose_value } = req.body;

  const validation = validateReadingInput(reading_date, time_slot, glucose_value);
  if (!validation.isValid) {
    return res.status(validation.status).json({
      success: false,
      message: validation.message
    });
  }

  const { numVal, cleanDate } = validation;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Check reading exists and belongs to user
    const existing = await client.query(
      'SELECT id, reading_date, time_slot FROM readings WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Reading not found.'
      });
    }

    // Check if target date already has 4 readings (excluding current reading)
    const countCheck = await client.query(
      'SELECT COUNT(*)::int AS count FROM readings WHERE user_id = $1 AND reading_date = $2 AND id != $3',
      [userId, cleanDate, id]
    );
    if (parseInt(countCheck.rows[0].count, 10) >= 4) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'You can add only 4 readings per day.'
      });
    }

    // Check duplicate slot for target date (excluding current reading)
    const slotCheck = await client.query(
      'SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3 AND id != $4',
      [userId, cleanDate, time_slot, id]
    );

    if (slotCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      const article = time_slot.toLowerCase().startsWith('a') ? 'an' : 'a';
      return res.status(409).json({
        success: false,
        message: `You already have ${article} ${time_slot} reading for this date.`
      });
    }

    // Perform update
    const updateQuery = await client.query(
      `UPDATE readings
       SET reading_date = $1, time_slot = $2, glucose_value = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING id, user_id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, time_slot, glucose_value, created_at, updated_at`,
      [cleanDate, time_slot, numVal, id, userId]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Reading updated successfully',
      data: updateQuery.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update reading error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error updating reading.'
    });
  } finally {
    client.release();
  }
};

// Delete a reading
const deleteReading = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reading not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Reading deleted successfully',
      data: { id: result.rows[0].id }
    });
  } catch (error) {
    console.error('Delete reading error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error deleting reading.'
    });
  }
};

module.exports = {
  addReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading
};

