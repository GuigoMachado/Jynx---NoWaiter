const { getPool } = require('../config/database');

/**
 * Returns the active pool or throws a clear error when the database is missing.
 */
const requirePool = () => {
  const pool = getPool();
  if (!pool) {
    throw new Error('Database connection not configured');
  }
  return pool;
};

/**
 * Stores a new waiter call.
 */
const createWaitCall = async (tableNumber, callType) => {
  const pool = requirePool();
  const result = await pool.query(
    `INSERT INTO wait_calls (table_number, call_type)
     VALUES ($1, $2)
     RETURNING id, table_number, status, call_type, created_at`,
    [tableNumber, callType]
  );
  return result.rows[0];
};

/**
 * Updates the status of a waiter call.
 */
const updateWaitCallStatus = async (id, status) => {
  const pool = requirePool();
  const result = await pool.query(
    'UPDATE wait_calls SET status = $1 WHERE id = $2 RETURNING id, table_number, status, call_type, created_at',
    [status, id]
  );
  return result.rows[0] || null;
};

/**
 * Deletes a waiter call by id.
 */
const deleteWaitCall = async (id) => {
  const pool = requirePool();
  const result = await pool.query('DELETE FROM wait_calls WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

/**
 * Deletes every attended waiter call.
 */
const deleteAttendedWaitCalls = async () => {
  const pool = requirePool();
  const result = await pool.query("DELETE FROM wait_calls WHERE status = 'attended'");
  return result.rowCount;
};

/**
 * Returns every waiter call ordered by creation time.
 */
const listWaitCalls = async () => {
  const pool = requirePool();
  const result = await pool.query('SELECT id, table_number, status, call_type, created_at FROM wait_calls ORDER BY created_at ASC');
  return result.rows;
};

module.exports = {
  createWaitCall,
  updateWaitCallStatus,
  deleteWaitCall,
  deleteAttendedWaitCalls,
  listWaitCalls,
};