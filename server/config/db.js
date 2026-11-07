const { Pool, types } = require('pg');
require('dotenv').config();

// Parse DATE columns as raw YYYY-MM-DD string to avoid timezone shifts
types.setTypeParser(1082, (val) => val);

function createMemPool() {
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
  return new adapter.Pool();
}

let activePool;
let isUsingMemDb = false;

if (process.env.NODE_ENV === 'test') {
  activePool = createMemPool();
  isUsingMemDb = true;
} else {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sweety_db';
  const realPool = new Pool({
    connectionString,
    connectionTimeoutMillis: 2000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  // Check connectivity to real PostgreSQL
  realPool.connect((err, client, release) => {
    if (err) {
      console.warn('⚠️  PostgreSQL connection unavailable on localhost:5432.');
      console.log('🔄  Seamlessly initialized in-memory PostgreSQL engine for local run & demo.');
      activePool = createMemPool();
      isUsingMemDb = true;

      // Seed the in-memory database automatically
      const seed = require('../database/seed');
      seed().catch((seedErr) => console.error('Auto-seed error:', seedErr));
    } else {
      console.log('✅ Connected to PostgreSQL database.');
      release();
    }
  });

  activePool = realPool;
}

// Proxy-safe query wrapper
const query = (text, params) => {
  return activePool.query(text, params);
};

// Proxy-safe client wrapper
const getClient = () => {
  return activePool.connect();
};

module.exports = {
  get pool() {
    return activePool;
  },
  query,
  getClient
};
