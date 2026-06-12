'use strict';

/**
 * Pagination defaults and bounds shared by list endpoints. Centralized so the
 * same limits apply consistently and are documented in one place.
 */
const PAGINATION = Object.freeze({
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 200,
  MIN_LIMIT: 1,
});

module.exports = { PAGINATION };
