const { Pool, types } = require('pg');
require('dotenv').config();

// Parse DATE columns as raw YYYY-MM-DD string to avoid timezone shifts
types.setTypeParser(1082, (val) => val);

let pool;

if (process.env.NODE_ENV === 'test') {
  // In test environment, use pg-mem for an isolated, self-contained PostgreSQL instance
  const { newDb } = require('pg-mem');
  const fs = require('fs');
  const path = require('path');

  const memDb = newDb();

  // Register CURRENT_TIMESTAMP / NOW functions
  memDb.public.registerFunction({
    name: 'current_timestamp',
    args: [],
    returns: memDb.public.getType('timestamp'),
    implementation: () => new Date()
  });

  // Register to_char function
  memDb.public.registerFunction({
    name: 'to_char',
    args: [memDb.public.getType('date'), memDb.public.getType('text')],
    returns: memDb.public.getType('text'),
    implementation: (val, fmt) => {
      if (!val) return null;
      if (typeof val === 'string') return val.slice(0, 10);
      const d = new Date(val);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  });

  // Register round(numeric, integer) function
  memDb.public.registerFunction({
    name: 'round',
    args: [memDb.public.getType('numeric'), memDb.public.getType('integer')],
    returns: memDb.public.getType('numeric'),
    implementation: (val, dp) => {
      if (val === null || val === undefined) return null;
      return parseFloat(Number(val).toFixed(dp));
    }
  });

  const schemaPath = path.join(__dirname, '../database/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  memDb.public.none(schemaSql);

  const adapter = memDb.adapters.createPg();
  pool = new adapter.Pool();
} else {
  // Production / Development environment uses standard PostgreSQL
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sweety_db';
  pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
}

// Simple query helper
const query = (text, params) => pool.query(text, params);

// Helper for transactions
const getClient = () => pool.connect();

module.exports = {
  pool,
  query,
  getClient
};
