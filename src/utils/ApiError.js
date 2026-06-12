'use strict';

/**
 * Error type carrying an HTTP status code. Thrown by services/controllers and
 * translated into a JSON response by the errorHandler middleware.
 */
class ApiError extends Error {
  constructor(statusCode, message, details, code) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    // Stable, machine-readable error code clients can switch on regardless of
    // the human-readable message.
    this.code = code || ApiError.codeFor(statusCode);
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Map an HTTP status code to a default machine-readable error code.
   */
  static codeFor(statusCode) {
    switch (statusCode) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 429:
        return 'RATE_LIMITED';
      default:
        return statusCode >= 500 ? 'INTERNAL_ERROR' : 'ERROR';
    }
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
