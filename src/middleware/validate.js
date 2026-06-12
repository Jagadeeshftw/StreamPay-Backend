'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Generic validation middleware factory.
 *
 * Accepts a validator function that receives the request body and returns
 * either `{ value }` (the cleaned payload) or `{ error }` (a message string or
 * array of messages). On success the cleaned value is attached to
 * `req.validated`; on failure a 400 ApiError is forwarded.
 */
module.exports = function validate(validator) {
  return function validationMiddleware(req, res, next) {
    const result = validator(req.body || {});
    if (result && result.error) {
      return next(ApiError.badRequest('Validation failed', result.error));
    }
    req.validated = result ? result.value : req.body;
    next();
  };
};
