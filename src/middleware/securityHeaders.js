'use strict';

/**
 * Apply a minimal set of security headers. Kept dependency-free; for a real
 * deployment prefer the `helmet` package.
 */
module.exports = function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
};
