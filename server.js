require('dotenv').config();
const { createApp } = require('./src/app');
const { initializeDatabase } = require('./src/config/database');

const port = process.env.PORT || 3000;
const app = createApp();

/**
 * Starts the HTTP server after the database bootstrap finishes.
 */
const startServer = async () => {
  await initializeDatabase();

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
};

startServer().catch((error) => {
  console.error('Server bootstrap failed:', error);
  process.exitCode = 1;
});
