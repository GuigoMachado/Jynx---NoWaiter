const { Pool } = require('pg');
require('dotenv').config();

/**
 * Removes connection-string query parameters that can trigger pg warnings.
 * This keeps the DATABASE_URL compatible with the pg client without changing
 * the actual host, user, password, or database name.
 */
const sanitizeConnectionString = (rawConnectionString) => {
  try {
    const url = new URL(rawConnectionString);
    url.searchParams.delete('sslmode');
    url.searchParams.delete('channel_binding');
    url.searchParams.delete('uselibpqcompat');
    return url.toString();
  } catch (error) {
    return rawConnectionString;
  }
};

const databaseUrl = process.env.DATABASE_URL;

const pool = databaseUrl
  ? new Pool({
      connectionString: sanitizeConnectionString(databaseUrl),
      ssl: { rejectUnauthorized: false },
    })
  : null;

/**
 * Returns the shared PostgreSQL pool, or null when the app is running without
 * a database connection configured.
 */
const getPool = () => pool;

/**
 * Verifies the database connection and applies the schema adjustments the app
 * depends on. This keeps startup behavior compatible with the previous monolith.
 */
const initializeDatabase = async () => {
  if (!pool) {
    return null;
  }

  try {
    await pool.query('SELECT 1');
    console.log('Database connection OK');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return null;
  }

  try {
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_number INTEGER DEFAULT 1");
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_status VARCHAR(32) NOT NULL DEFAULT 'pending'");

    await pool.query(`CREATE TABLE IF NOT EXISTS order_history (
      id BIGSERIAL PRIMARY KEY,
      order_id TEXT,
      item_id TEXT,
      item_name TEXT,
      quantity INTEGER NOT NULL,
      notes TEXT,
      price_each NUMERIC(12,2) NOT NULL,
      total_price NUMERIC(12,2) NOT NULL,
      table_number INTEGER NOT NULL,
      order_status VARCHAR(32) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      closed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    await pool.query("ALTER TABLE order_history ADD COLUMN IF NOT EXISTS order_id TEXT");
    await pool.query("ALTER TABLE order_history ADD COLUMN IF NOT EXISTS item_id TEXT");
    await pool.query("ALTER TABLE order_history ADD COLUMN IF NOT EXISTS item_name TEXT");
    await pool.query("ALTER TABLE order_history ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1");
    await pool.query("ALTER TABLE order_history ADD COLUMN IF NOT EXISTS notes TEXT");
    await pool.query("ALTER TABLE order_history ADD COLUMN IF NOT EXISTS price_each NUMERIC(12,2) NOT NULL DEFAULT 0");
    await pool.query("ALTER TABLE order_history ADD COLUMN IF NOT EXISTS total_price NUMERIC(12,2) NOT NULL DEFAULT 0");
    await pool.query("ALTER TABLE order_history ADD COLUMN IF NOT EXISTS table_number INTEGER NOT NULL DEFAULT 1");
    await pool.query("ALTER TABLE order_history ADD COLUMN IF NOT EXISTS order_status VARCHAR(32) NOT NULL DEFAULT 'pending'");
    await pool.query("ALTER TABLE order_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
    await pool.query("ALTER TABLE order_history ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");

    await pool.query(`CREATE TABLE IF NOT EXISTS wait_calls (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      table_number INTEGER NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'waiting',
      call_type VARCHAR(32) NOT NULL DEFAULT 'table',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await pool.query("ALTER TABLE wait_calls ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'waiting'");
    await pool.query("ALTER TABLE wait_calls ADD COLUMN IF NOT EXISTS call_type VARCHAR(32) NOT NULL DEFAULT 'table'");

    console.log('Orders, order_history and wait_calls schema checked/updated');
  } catch (error) {
    console.error('Schema migration warning:', error.message);
  }

  return pool;
};

module.exports = {
  getPool,
  initializeDatabase,
  sanitizeConnectionString,
};