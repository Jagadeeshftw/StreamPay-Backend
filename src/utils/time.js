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

/**
 * Non-negative number of seconds between two unix timestamps. Order-independent.
 */
function secondsBetween(a, b) {
  return Math.abs(b - a);
}

/**
 * Format a duration in seconds as a compact human-readable string such as
 * "1h 2m 3s". A zero (or negative) duration renders as "0s".
 */
function formatDuration(seconds) {
  let remaining = Math.max(0, Math.floor(seconds));
  if (remaining === 0) return '0s';

  const units = [
    ['d', 86400],
    ['h', 3600],
    ['m', 60],
    ['s', 1],
  ];

  const parts = [];
  for (const [label, size] of units) {
    if (remaining >= size) {
      const value = Math.floor(remaining / size);
      remaining -= value * size;
      parts.push(`${value}${label}`);
    }
  }
  return parts.join(' ');
}

module.exports = { nowSeconds, clamp, addSeconds, secondsBetween, formatDuration };
