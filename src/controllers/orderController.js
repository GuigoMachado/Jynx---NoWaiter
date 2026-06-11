const orderService = require('../services/orderService');

/**
 * Reads the shared database error pattern and turns it into a response.
 */
const handleError = (error, res, fallbackMessage, logMessage) => {
  const statusCode = error.statusCode || 500;
  if (statusCode === 500 && logMessage) {
    console.error(logMessage, error);
  }
  return res.status(statusCode).json({
    error: error.message || fallbackMessage,
    detail: statusCode === 500 ? error.message : undefined,
  });
};

/**
 * Returns orders for the requested table, or for every table when no filter is
 * provided.
 */
const listOrders = async (req, res) => {
  try {
    const rawTableNumber = req.query.table_number;
    const tableNumber = rawTableNumber !== undefined ? parseInt(rawTableNumber, 10) : null;

    if (rawTableNumber !== undefined && (!Number.isInteger(tableNumber) || tableNumber <= 0)) {
      return res.status(400).json({ error: 'table_number must be a positive integer' });
    }

    const rows = await orderService.listOrders(tableNumber);
    return res.json(rows);
  } catch (error) {
    return handleError(error, res, 'Failed to load orders', 'Error loading orders:');
  }
};

/**
 * Creates a new order.
 */
const createOrder = async (req, res) => {
  try {
    const row = await orderService.createOrder(req.body);
    return res.status(201).json(row);
  } catch (error) {
    return handleError(error, res, 'Failed to save order', 'Error saving order:');
  }
};

/**
 * Deletes all orders for a table using the query-string contract the frontend
 * already depends on.
 */
const deleteOrdersByTable = async (req, res) => {
  try {
    const result = await orderService.deleteOrdersByTable(req.query.table_number);
    return res.json(result);
  } catch (error) {
    return handleError(error, res, 'Failed to clear orders', 'Error clearing orders:');
  }
};

/**
 * Deletes one order by id.
 */
const deleteOrderById = async (req, res) => {
  try {
    const result = await orderService.deleteOrderById(req.params.id);
    return res.json(result);
  } catch (error) {
    return handleError(error, res, 'Failed to delete order', 'Error deleting order:');
  }
};

/**
 * Marks an order as done and updates the dependent tables.
 */
const markOrderDone = async (req, res) => {
  try {
    const order = await orderService.markOrderDone(req.params.id);
    return res.json(order);
  } catch (error) {
    return handleError(error, res, 'Failed to mark order done', 'Error marking order done:');
  }
};

/**
 * Copies all orders from one table into the closed history table.
 */
const finalizeOrders = async (req, res) => {
  try {
    const result = await orderService.finalizeOrdersByTable(req.params.table_number);
    return res.json(result);
  } catch (error) {
    return handleError(error, res, 'Failed to finalize orders', 'Error finalizing orders:');
  }
};

/**
 * Returns the closed order history used by the admin dashboard summary.
 */
const listOrderHistory = async (req, res) => {
  try {
    const rows = await orderService.listOrderHistory();
    return res.json(rows);
  } catch (error) {
    return handleError(error, res, 'Failed to load order history', 'Error loading order history:');
  }
};

/**
 * Deletes one closed summary session.
 */
const deleteOrderHistorySession = async (req, res) => {
  try {
    const rawIds = req.body?.ids || req.body?.historyIds || req.query.ids || req.query.historyIds;
    if (rawIds) {
      const result = await orderService.deleteOrderHistorySessionByIds(rawIds);
      return res.json(result);
    }

    const result = await orderService.deleteOrderHistorySession(req.query.table_number, req.query.closed_at);
    return res.json(result);
  } catch (error) {
    return handleError(error, res, 'Failed to delete order history session', 'Error deleting order history session:');
  }
};

/**
 * Returns the open orders shown on the kitchen screen.
 */
const listKitchenOrders = async (req, res) => {
  try {
    const rows = await orderService.listKitchenOrders();
    return res.json(rows);
  } catch (error) {
    return handleError(error, res, 'Failed to load kitchen orders', 'Error loading kitchen orders:');
  }
};

module.exports = {
  listOrders,
  createOrder,
  deleteOrdersByTable,
  deleteOrderById,
  markOrderDone,
  finalizeOrders,
  listOrderHistory,
  deleteOrderHistorySession,
  listKitchenOrders,
};