'use strict';

/**
 * Money helpers. Amounts are handled as numbers representing whole asset units
 * (e.g. XLM). For a real ledger you would use integer stroops / BigInt; here we
 * keep it simple and round to 7 decimal places, the Stellar standard.
 */
const DECIMALS = 7;
const FACTOR = Math.pow(10, DECIMALS);

/**
 * Round an amount to Stellar's 7-decimal precision.
 */
function round(amount) {
  return Math.round(amount * FACTOR) / FACTOR;
}

/**
 * Parse and validate an incoming amount. Returns a finite positive number or
 * null when the input cannot be interpreted as a valid amount.
 */
function parseAmount(value) {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) {
    return null;
  }
  return round(n);
}

/**
 * Non-negative subtraction guarding against floating point drift.
 */
function subtract(a, b) {
  return round(Math.max(0, a - b));
}

/**
 * Sum a list of amounts, rounding once at the end to avoid accumulated drift.
 */
function sum(amounts) {
  let total = 0;
  for (const amount of amounts) total += amount;
  return round(total);
}

/**
 * What fraction of `total` is `part`, expressed as a percentage rounded to two
 * decimals. A zero total yields 0 to avoid division by zero.
 */
function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 10000) / 100;
}

module.exports = { DECIMALS, round, parseAmount, subtract, sum, percent };
