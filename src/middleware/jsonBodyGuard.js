'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Reject request bodies that are present but not plain JSON objects. The body
 * parser happily accepts arrays, strings and numbers as top-level JSON, which
 * then slip past object-shaped validators as `undefined` fields. This guard
 * normalizes those into a clear 400 before validation runs. An empty body is
 * allowed so routes without a payload are unaffected.
 */
module.exports = function jsonBodyGuard(req, res, next) {
  const { body } = req;

  // No body parsed (e.g. GET, or empty POST) — nothing to guard.
  if (body === undefined || body === null) return next();

  // express.json() yields {} for an empty body; that is fine.
  const isPlainObject =
    typeof body === 'object' && !Array.isArray(body);

  if (!isPlainObject) {
    return next(ApiError.badRequest('Request body must be a JSON object'));
  }
  next();
};
