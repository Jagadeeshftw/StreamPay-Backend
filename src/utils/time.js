'use strict';

/**
 * Current time in unix seconds. Streams operate on second-granularity
 * timestamps to mirror typical on-chain ledger time.
 */
function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Clamp a value into the inclusive range [min, max].
 */
function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Convenience helper to add seconds to a unix timestamp.
 */
function addSeconds(timestamp, seconds) {
  return timestamp + seconds;
}

module.exports = { nowSeconds, clamp, addSeconds };
