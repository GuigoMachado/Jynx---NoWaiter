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
 * Loads the database metadata for orders.id so the service can choose the
 * correct insert strategy for integer, serial, or uuid schemas.
 */
const getOrderIdMetadata = async () => {
  const pool = requirePool();
  const result = await pool.query(
    `SELECT data_type, column_default
     FROM information_schema.columns
     WHERE table_name = 'orders' AND column_name = 'id'
     LIMIT 1`
  );
  return result.rows[0] || null;
};

/**
 * Returns the next integer id for schemas that do not auto-generate order ids.
 */
const getNextNumericOrderId = async () => {
  const pool = requirePool();
  const result = await pool.query('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM orders');
  return result.rows[0]?.next_id || 1;
};

/**
 * Inserts a new order row and returns the created record.
 */
const insertOrder = async (order) => {
  const pool = requirePool();
  const columns = ['item_id', 'quantity', 'notes', 'price_each', 'total_price', 'table_number'];
  const values = [order.itemId, order.quantity, order.notes, order.price, order.total, order.tableNumber];

  if (order.id !== null && order.id !== undefined) {
    columns.unshift('id');
    values.unshift(order.id);
  }

  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  const result = await pool.query(
    `INSERT INTO orders (${columns.join(', ')})
     VALUES (${placeholders})
     RETURNING id, item_id, quantity, notes, price_each, total_price, table_number, order_status, created_at`,
    values
  );

  return result.rows[0];
};

/**
 * Lists the current open orders, optionally filtered by table number.
 */
const listOrders = async (tableNumber) => {
  const pool = requirePool();
  const whereClause = tableNumber ? 'WHERE o.table_number = $1' : '';
  const params = tableNumber ? [tableNumber] : [];

  const result = await pool.query(
    `SELECT o.id, o.item_id, m.name AS item_name, o.quantity, o.notes,
            o.price_each::float AS price_each, o.total_price::float AS total_price,
            o.table_number, o.created_at
     FROM orders o
     LEFT JOIN menu_items m ON m.id = o.item_id
     ${whereClause}
     ORDER BY o.created_at ASC`,
    params
  );

  return result.rows;
};

/**
 * Removes every order from a table.
 */
const deleteOrdersByTable = async (tableNumber) => {
  const pool = requirePool();
  const result = await pool.query('DELETE FROM orders WHERE table_number = $1', [tableNumber]);
  return result.rowCount;
};

/**
 * Removes a single order by id.
 */
const deleteOrderById = async (orderId) => {
  const pool = requirePool();
  const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING id', [orderId]);
  return result.rows[0] || null;
};

/**
 * Marks an order as done and returns the updated record.
 */
const markOrderDone = async (orderId) => {
  const pool = requirePool();
  const result = await pool.query(
    `UPDATE orders
     SET order_status = 'done'
     WHERE id = $1
     RETURNING id, item_id, quantity, notes, price_each, total_price, table_number, order_status, created_at`,
    [orderId]
  );
  return result.rows[0] || null;
};

/**
 * Updates the matching history rows after an order changes status.
 */
const updateHistoryStatusByOrderId = async (orderId, status) => {
  const pool = requirePool();
  await pool.query(
    `UPDATE order_history
     SET order_status = $1
     WHERE order_id = $2 OR order_id = $2::text`,
    [status, orderId]
  );
};

/**
 * Stores a finalized order in the history table.
 */
const insertOrderHistory = async (historyRow) => {
  const pool = requirePool();
  const result = await pool.query(
    `INSERT INTO order_history (
      order_id, item_id, item_name, quantity, notes, price_each, total_price, table_number, order_status, created_at, closed_at
    )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'closed', $9, $10)`,
    [
      historyRow.orderId,
      historyRow.itemId,
      historyRow.itemName,
      historyRow.quantity,
      historyRow.notes,
      historyRow.priceEach,
      historyRow.totalPrice,
      historyRow.tableNumber,
      historyRow.createdAt,
      historyRow.closedAt,
    ]
  );
  return result.rowCount;
};

/**
 * Lists closed orders from the history table.
 */
const listClosedOrderHistory = async () => {
  const pool = requirePool();
  const result = await pool.query(
    `SELECT id, order_id, item_id, item_name, quantity, notes,
            price_each::float AS price_each, total_price::float AS total_price,
            table_number, order_status, created_at, closed_at
     FROM order_history
     WHERE order_status = 'closed'
     ORDER BY closed_at DESC, id DESC`
  );
  return result.rows;
};

/**
 * Deletes one closed session from the history table.
 */
const deleteClosedOrderHistorySession = async (tableNumber, closedAt) => {
  const pool = requirePool();
  const result = await pool.query(
    `DELETE FROM order_history
     WHERE order_status = 'closed'
       AND table_number = $1
       AND closed_at = $2`,
    [tableNumber, closedAt]
  );
  return result.rowCount;
};

/**
 * Deletes one or more closed history rows by their ids.
 */
const deleteClosedOrderHistoryByIds = async (ids) => {
  const pool = requirePool();
  const normalizedIds = ids
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isInteger(value) && value > 0);

  if (normalizedIds.length === 0) {
    return 0;
  }

  const placeholders = normalizedIds.map((_, index) => `$${index + 1}`).join(', ');
  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM order_history
     WHERE id IN (${placeholders})`,
    normalizedIds
  );

  const matched = countResult.rows[0]?.count || 0;
  if (!matched) {
    return { deleted: 0, ids: normalizedIds, matched: 0 };
  }

  const result = await pool.query(
    `DELETE FROM order_history
     WHERE id IN (${placeholders})`,
    normalizedIds
  );
  return { deleted: result.rowCount, ids: normalizedIds, matched };
};

/**
 * Returns all orders that are still relevant for the kitchen screen.
 */
const listKitchenOrders = async () => {
  const pool = requirePool();
  const result = await pool.query(
    `SELECT o.id, o.item_id, m.name AS item_name, o.quantity, o.notes,
            o.price_each::float AS price_each, o.total_price::float AS total_price,
            o.table_number, o.order_status, o.created_at
     FROM orders o
     LEFT JOIN menu_items m ON m.id = o.item_id
     WHERE o.order_status <> 'done'
     ORDER BY o.created_at ASC`
  );
  return result.rows;
};

module.exports = {
  getOrderIdMetadata,
  getNextNumericOrderId,
  insertOrder,
  listOrders,
  deleteOrdersByTable,
  deleteOrderById,
  markOrderDone,
  updateHistoryStatusByOrderId,
  insertOrderHistory,
  listClosedOrderHistory,
  deleteClosedOrderHistorySession,
  deleteClosedOrderHistoryByIds,
  listKitchenOrders,
};