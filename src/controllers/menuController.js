const menuService = require('../services/menuService');

/**
 * Handles the category-items endpoint and returns visible menu items.
 */
const getCategoryItems = async (req, res) => {
  try {
    const rows = await menuService.getCategoryItems(req.query.category);
    return res.json(rows);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode === 500) {
      console.error('Error loading category items:', error);
    }
    return res.status(statusCode).json({
      error: error.message || 'Failed to load category items',
    });
  }
};

module.exports = {
  getCategoryItems,
};