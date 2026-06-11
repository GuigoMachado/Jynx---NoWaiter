const menuRepository = require('../repositories/menuRepository');

/**
 * Validates the category input and loads the corresponding visible menu items.
 */
const getCategoryItems = async (category) => {
  if (!category) {
    const error = new Error('category query parameter is required');
    error.statusCode = 400;
    throw error;
  }

  return menuRepository.listAvailableItemsByCategory(category);
};

module.exports = {
  getCategoryItems,
};