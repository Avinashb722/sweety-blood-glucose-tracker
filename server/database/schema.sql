-- Sweety – Blood Glucose Tracker Database Schema

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create readings table
CREATE TABLE IF NOT EXISTS readings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reading_date DATE NOT NULL,
    time_slot VARCHAR(30) NOT NULL,
    glucose_value INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_glucose_range CHECK (glucose_value >= 40 AND glucose_value <= 600),
    CONSTRAINT check_valid_time_slot CHECK (time_slot IN (
        'Morning (fasting)',
        'After breakfast',
        'After lunch',
        'After dinner'
    )),
    CONSTRAINT unique_user_date_slot UNIQUE (user_id, reading_date, time_slot)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_readings_user_date ON readings(user_id, reading_date);
CREATE INDEX IF NOT EXISTS idx_readings_user_date_slot ON readings(user_id, reading_date, time_slot);

