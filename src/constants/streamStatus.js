'use strict';

/**
 * Canonical stream lifecycle states.
 *
 *  active    -> funds are streaming
 *  completed -> the full total has been withdrawn
 *  cancelled -> the sender reclaimed the remainder
 */
const STREAM_STATUS = Object.freeze({
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

const ALL_STATUSES = Object.freeze(Object.values(STREAM_STATUS));

module.exports = { STREAM_STATUS, ALL_STATUSES };
