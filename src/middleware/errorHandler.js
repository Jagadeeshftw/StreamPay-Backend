'use strict';

const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const config = require('../config');

/* eslint-disable no-unused-vars */
/**
 * Central error handler. Translates ApiError (and unexpected errors) into a
 * consistent JSON error envelope. Must be registered last.
 */
module.exports = function errorHandler(err, req, res, next) {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;

  if (statusCode >= 500) {
    logger.error('Unhandled error', err.message, err.stack);
  } else {
    logger.warn('Request error', err.message);
  }

  const body = {
    error: {
      message: err.message || 'Internal Server Error',
      status: statusCode,
    },
  };

  if (isApiError && err.details) {
    body.error.details = err.details;
  }
  if (config.env === 'development' && statusCode >= 500) {
    body.error.stack = err.stack;
  }

  res.status(statusCode).json(body);
};
