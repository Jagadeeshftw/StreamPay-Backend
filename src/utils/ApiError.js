'use strict';

/**
 * Error type carrying an HTTP status code. Thrown by services/controllers and
 * translated into a JSON response by the errorHandler middleware.
 */
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  static notFound(message) {
    return new ApiError(404, message || 'Resource not found');
  }

  static conflict(message) {
    return new ApiError(409, message || 'Conflict');
  }
}

module.exports = ApiError;
