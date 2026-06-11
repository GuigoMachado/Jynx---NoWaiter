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
 * Loads the available menu items for a category.
 */
const listAvailableItemsByCategory = async (category) => {
  const pool = requirePool();
  const result = await pool.query(
    `SELECT id, name, description, price::float AS price, image_url
     FROM menu_items
     WHERE category = $1 AND available = true
     ORDER BY lower(name)`,
    [category]
  );
  return result.rows;
};

/**
 * Returns the display name for a menu item id.
 */
const findItemNameById = async (itemId) => {
  const pool = requirePool();
  const result = await pool.query('SELECT name FROM menu_items WHERE id = $1 LIMIT 1', [itemId]);
  return result.rows[0]?.name || null;
};

/**
 * Returns category counts for the debug endpoint.
 */
const listCategoryCounts = async () => {
  const pool = requirePool();
  const result = await pool.query('SELECT category, COUNT(*) AS cnt FROM menu_items GROUP BY category');
  return result.rows;
};

/**
 * Returns a small sample of menu rows for the debug endpoint.
 */
const listRecentMenuItems = async () => {
  const pool = requirePool();
  const result = await pool.query('SELECT id, category, name, price, available FROM menu_items ORDER BY id DESC LIMIT 10');
  return result.rows;
};

module.exports = {
  listAvailableItemsByCategory,
  findItemNameById,
  listCategoryCounts,
  listRecentMenuItems,
};