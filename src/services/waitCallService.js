const waitCallRepository = require('../repositories/waitCallRepository');

/**
 * Converts user input into a positive integer table number.
 */
const parsePositiveTableNumber = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

/**
 * Normalizes the waiter call type to the two supported values.
 */
const normalizeCallType = (callType) => (callType === 'kitchen' ? 'kitchen' : 'table');

/**
 * Normalizes the waiter call status to the two supported values.
 */
const normalizeCallStatus = (status) => (status === 'attended' ? 'attended' : 'waiting');

/**
 * Validates and stores a waiter call.
 */
const createWaitCall = async ({ table_number, call_type }) => {
  const tableNumber = parsePositiveTableNumber(table_number);
  if (!tableNumber) {
    const error = new Error('table_number must be a positive integer');
    error.statusCode = 400;
    throw error;
  }

  return waitCallRepository.createWaitCall(tableNumber, normalizeCallType(call_type));
};

/**
 * Validates and updates a waiter call.
 */
const updateWaitCallStatus = async (id, status) => {
  const updatedCall = await waitCallRepository.updateWaitCallStatus(id, normalizeCallStatus(status));
  if (!updatedCall) {
    const error = new Error('Wait call not found');
    error.statusCode = 404;
    throw error;
  }
  return updatedCall;
};

/**
 * Deletes a single waiter call.
 */
const deleteWaitCall = async (id) => {
  const deletedCall = await waitCallRepository.deleteWaitCall(id);
  if (!deletedCall) {
    const error = new Error('Wait call not found');
    error.statusCode = 404;
    throw error;
  }
  return deletedCall;
};

/**
 * Deletes all attended waiter calls.
 */
const deleteAttendedWaitCalls = async () => waitCallRepository.deleteAttendedWaitCalls();

/**
 * Loads the current waiter calls.
 */
const listWaitCalls = async () => waitCallRepository.listWaitCalls();

module.exports = {
  createWaitCall,
  updateWaitCallStatus,
  deleteWaitCall,
  deleteAttendedWaitCalls,
  listWaitCalls,
  parsePositiveTableNumber,
  normalizeCallType,
  normalizeCallStatus,
};