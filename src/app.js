'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const config = require('./config');
const routes = require('./routes');
const requestLogger = require('./middleware/requestLogger');
const securityHeaders = require('./middleware/securityHeaders');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

/**
 * Build and configure the Express application. Kept separate from the server
 * bootstrap so it can be imported by tests without binding a port.
 */
function createApp() {
  const app = express();

  app.use(cors());
  app.use(securityHeaders);
  app.use(express.json({ limit: '100kb' }));
  app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
  app.use(requestLogger);

  // Friendly root response.
  app.get('/', (req, res) => {
    res.json({ name: 'streampay-backend', docs: '/api/health' });
  });

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
