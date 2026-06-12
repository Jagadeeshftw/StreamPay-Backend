'use strict';

/**
 * Mark API responses as non-cacheable. Stream amounts, balances and analytics
 * are time-sensitive and must never be served from a shared or browser cache,
 * so we set a strict no-store policy on every /api response.
 */
module.exports = function noCache(req, res, next) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  next();
};
