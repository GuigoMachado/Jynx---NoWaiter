const menuRepository = require('../repositories/menuRepository');

/**
 * Returns quick menu diagnostics for developers.
 */
const listMenuDebugData = async (req, res) => {
  try {
    const [counts, sample] = await Promise.all([
      menuRepository.listCategoryCounts(),
      menuRepository.listRecentMenuItems(),
    ]);

    return res.json({ counts, sample });
  } catch (error) {
    console.error('Debug items error:', error);
    return res.status(500).json({ error: 'Debug query failed', detail: error.message });
  }
};

module.exports = {
  listMenuDebugData,
};