const express = require('express');
const path = require('path');
const cors = require('cors');
const apiRoutes = require('./routes/apiRoutes');

/**
 * Creates the express application with the shared middleware and route mount.
 */
const createApp = () => {
  const app = express();
  const projectRoot = path.join(__dirname, '..');

  app.use(cors());
  app.use(express.json());
  app.use(express.static(projectRoot));
  app.use('/api', apiRoutes);

  app.get('*', (req, res) => {
    res.sendFile(path.join(projectRoot, 'index.html'));
  });

  return app;
};

module.exports = {
  createApp,
};