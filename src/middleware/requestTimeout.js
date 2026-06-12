'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Fail slow requests with a 503 rather than letting a client hang. Arms a timer
 * for each request and forwards a SERVICE_UNAVAILABLE error if the response has
 * not started by the deadline. The timer is cleared once the response finishes.
 *
 * @param {number} timeoutMs Deadline in milliseconds.
 */
module.exports = function requestTimeout(timeoutMs) {
  return function requestTimeoutMiddleware(req, res, next) {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        next(ApiError.serviceUnavailable('Request timed out'));
      }
    }, timeoutMs);

    // Do not keep the event loop alive solely for this timer.
    if (typeof timer.unref === 'function') timer.unref();

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    next();
  };
};
