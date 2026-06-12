'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Catch-all for unmatched routes. Forwards a 404 ApiError to the error handler.
 */
module.exports = function notFound(req, res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};
