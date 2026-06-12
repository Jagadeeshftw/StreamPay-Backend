'use strict';

const config = require('../config');
const ApiError = require('../utils/ApiError');

/**
 * Minimal in-memory fixed-window rate limiter. Dependency-free and suited to a
 * single-process deployment; for a real cluster prefer a shared store (Redis)
 * via `express-rate-limit`. Requests are bucketed per client IP and reset at
 * the end of each window.
 */
function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || config.rateLimit.windowMs;
  const max = options.max || config.rateLimit.max;
  const hits = new Map();

  return function rateLimit(req, res, next) {
    const key = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();

    let entry = hits.get(key);
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    const remaining = Math.max(0, max - entry.count);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return next(ApiError.tooManyRequests('Rate limit exceeded'));
    }
    next();
  };
}

module.exports = createRateLimiter;
