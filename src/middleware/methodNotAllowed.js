'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Handler for unsupported HTTP methods on matched routes.
 * Forwards a 405 ApiError to the error handler.
 */
module.exports = function methodNotAllowed(req, res, next) {
  next(ApiError.methodNotAllowed(`Method ${req.method} not allowed on ${req.originalUrl || req.path}`));
};
