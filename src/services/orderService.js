const { randomUUID } = require('crypto');
const menuRepository = require('../repositories/menuRepository');
const orderRepository = require('../repositories/orderRepository');
const waitCallRepository = require('../repositories/waitCallRepository');

/**
 * Converts input into a positive integer table number, or null when invalid.
 */
const parsePositiveTableNumber = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

/**
 * Resolves the identifier that should be inserted into orders.id.
 */
const resolveOrderIdForInsert = async () => {
  const metadata = await orderRepository.getOrderIdMetadata();

  if (!metadata) {
    return randomUUID();
  }

  const normalizedType = metadata.data_type ? metadata.data_type.toLowerCase() : '';

  if (normalizedType === 'uuid') {
    return randomUUID();
  }

  if (metadata.column_default && metadata.column_default.includes('nextval(')) {
    return null;
  }

  if (['integer', 'bigint', 'smallint'].includes(normalizedType)) {
    return orderRepository.getNextNumericOrderId();
  }

  return randomUUID();
};

/**
 * Validates and saves a new order.
 */
const createOrder = async ({ itemId, quantity, notes, price, total, table_number }) => {
  if (!itemId || !quantity || !price || !total) {
    const error = new Error('itemId, quantity, price, and total are required');
    error.statusCode = 400;
    throw error;
  }

  const orderId = await resolveOrderIdForInsert();

  return orderRepository.insertOrder({
    id: orderId,
    itemId,
    quantity,
    notes: notes || '-',
    price,
    total,
    tableNumber: table_number || 1,
  });
};

/**
 * Loads the open orders for one table or for the full venue.
 */
const listOrders = async (tableNumber) => {
  if (tableNumber !== null && tableNumber !== undefined) {
    return orderRepository.listOrders(tableNumber);
  }

  return orderRepository.listOrders();
};

/**
 * Removes every order from a table and returns how many rows were deleted.
 */
const deleteOrdersByTable = async (rawTableNumber) => {
  const tableNumber = parsePositiveTableNumber(rawTableNumber);
  if (!tableNumber) {
    const error = new Error('table_number must be a positive integer');
    error.statusCode = 400;
    throw error;
  }

  const deleted = await orderRepository.deleteOrdersByTable(tableNumber);
  return { deleted };
};

/**
 * Removes a single order by id.
 */
const deleteOrderById = async (id) => {
  const deletedOrder = await orderRepository.deleteOrderById(id);
  if (!deletedOrder) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  return { deleted: deletedOrder.id };
};

/**
 * Marks an order as done, updates the history table and creates the matching
 * kitchen waiter call entry.
 */
const markOrderDone = async (id) => {
  const order = await orderRepository.markOrderDone(id);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  await orderRepository.updateHistoryStatusByOrderId(order.id, 'done');
  await waitCallRepository.createWaitCall(order.table_number, 'kitchen');

  return order;
};

/**
 * Copies all orders from a table into the closed history table.
 */
const finalizeOrdersByTable = async (rawTableNumber) => {
  const tableNumber = parsePositiveTableNumber(rawTableNumber);
  if (!tableNumber) {
    const error = new Error('table_number must be a positive integer');
    error.statusCode = 400;
    throw error;
  }

  const orders = await orderRepository.listOrders(tableNumber);
  if (orders.length === 0) {
    const error = new Error('No orders found for this table');
    error.statusCode = 400;
    throw error;
  }

  const closedAt = new Date();

  for (const order of orders) {
    const itemName = await menuRepository.findItemNameById(order.item_id);
    await orderRepository.insertOrderHistory({
      orderId: order.id?.toString?.() ?? String(order.id),
      itemId: order.item_id?.toString?.() ?? String(order.item_id),
      itemName: itemName || order.item_id,
      quantity: order.quantity,
      notes: order.notes || '-',
      priceEach: order.price_each,
      totalPrice: order.total_price,
      tableNumber: order.table_number,
      createdAt: order.created_at || new Date(),
      closedAt,
    });
  }

  return { finalized: orders.length };
};

/**
 * Loads the closed order history used by the admin summary screen.
 */
const listOrderHistory = async () => orderRepository.listClosedOrderHistory();

/**
 * Deletes one closed summary session.
 */
const deleteOrderHistorySession = async (rawTableNumber, closedAt) => {
  const tableNumber = parsePositiveTableNumber(rawTableNumber);
  if (!tableNumber || !closedAt) {
    const error = new Error('table_number and closed_at are required');
    error.statusCode = 400;
    throw error;
  }

  const deleted = await orderRepository.deleteClosedOrderHistorySession(tableNumber, closedAt);
  if (!deleted) {
    const error = new Error('Summary bubble not found');
    error.statusCode = 404;
    throw error;
  }

  return { deleted };
};

/**
 * Deletes one closed summary session by its row ids.
 */
const deleteOrderHistorySessionByIds = async (rawIds) => {
  const ids = Array.isArray(rawIds)
    ? rawIds
    : String(rawIds || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

  const result = await orderRepository.deleteClosedOrderHistoryByIds(ids);
  if (!result.deleted) {
    const error = new Error('Summary bubble not found');
    error.statusCode = 404;
    throw error;
  }

  return result;
};

/**
 * Loads the pending kitchen orders used by the kitchen screen.
 */
const listKitchenOrders = async () => orderRepository.listKitchenOrders();

module.exports = {
  createOrder,
  listOrders,
  deleteOrdersByTable,
  deleteOrderById,
  markOrderDone,
  finalizeOrdersByTable,
  listOrderHistory,
  deleteOrderHistorySession,
  deleteOrderHistorySessionByIds,
  listKitchenOrders,
  parsePositiveTableNumber,
  resolveOrderIdForInsert,
};