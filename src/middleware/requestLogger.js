'use strict';

const logger = require('../utils/logger');

/**
 * Lightweight request logger. morgan handles the standard access log; this
 * middleware adds a debug-level entry with timing for our own logger so the
 * two can be correlated.
 */
module.exports = function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    logger.debug(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`);
  });
  next();
};
