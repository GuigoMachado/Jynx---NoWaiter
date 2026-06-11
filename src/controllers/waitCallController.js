const waitCallService = require('../services/waitCallService');

/**
 * Uses the shared database error pattern and keeps responses consistent.
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
 * Creates a new waiter call.
 */
const createWaitCall = async (req, res) => {
  try {
    const row = await waitCallService.createWaitCall(req.body);
    return res.status(201).json(row);
  } catch (error) {
    return handleError(error, res, 'Failed to record waiter call', 'Error inserting wait call:');
  }
};

/**
 * Updates a waiter call status.
 */
const updateWaitCallStatus = async (req, res) => {
  try {
    const row = await waitCallService.updateWaitCallStatus(req.params.id, req.body.status);
    return res.json(row);
  } catch (error) {
    return handleError(error, res, 'Failed to update waiter call status', 'Error updating wait call status:');
  }
};

/**
 * Deletes a waiter call by id.
 */
const deleteWaitCall = async (req, res) => {
  try {
    const result = await waitCallService.deleteWaitCall(req.params.id);
    return res.json({ deleted: result.id });
  } catch (error) {
    return handleError(error, res, 'Failed to delete waiter call', 'Error deleting wait call:');
  }
};

/**
 * Deletes all calls that are already attended.
 */
const deleteAttendedWaitCalls = async (req, res) => {
  try {
    const deleted = await waitCallService.deleteAttendedWaitCalls();
    return res.json({ deleted });
  } catch (error) {
    return handleError(error, res, 'Failed to clear attended waiter calls', 'Error deleting attended wait calls:');
  }
};

/**
 * Returns every waiter call in chronological order.
 */
const listWaitCalls = async (req, res) => {
  try {
    const rows = await waitCallService.listWaitCalls();
    return res.json(rows);
  } catch (error) {
    return handleError(error, res, 'Failed to load wait calls', 'Error loading wait calls:');
  }
};

module.exports = {
  createWaitCall,
  updateWaitCallStatus,
  deleteWaitCall,
  deleteAttendedWaitCalls,
  listWaitCalls,
};