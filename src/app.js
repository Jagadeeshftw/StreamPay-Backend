'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const config = require('./config');
const routes = require('./routes');
const requestId = require('./middleware/requestId');
const requestTimeout = require('./middleware/requestTimeout');
const requestLogger = require('./middleware/requestLogger');
const createRateLimiter = require('./middleware/rateLimit');
const securityHeaders = require('./middleware/securityHeaders');
const jsonBodyGuard = require('./middleware/jsonBodyGuard');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

/**
 * Resolve CORS options from config. An origins list of `*` keeps CORS fully
 * open; otherwise only the explicitly allowed origins are permitted.
 */
function corsOptions() {
  const origins = config.corsOrigins;
  if (origins.length === 1 && origins[0] === '*') {
    return {};
  }
  return { origin: origins };
}

/**
 * Build and configure the Express application. Kept separate from the server
 * bootstrap so it can be imported by tests without binding a port.
 */
function createApp() {
  const app = express();

  app.use(cors(corsOptions()));
  app.use(securityHeaders);
  app.use(requestId);
  app.use(requestTimeout(config.requestTimeoutMs));
  app.use(express.json({ limit: '100kb' }));
  app.use(jsonBodyGuard);
  app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
  app.use(requestLogger);

  // Friendly root response.
  app.get('/', (req, res) => {
    res.json({ name: 'streampay-backend', docs: '/api/health' });
  });

  app.use('/api', createRateLimiter(), routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
