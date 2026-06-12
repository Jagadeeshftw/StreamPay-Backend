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

module.exports = { DECIMALS, round, parseAmount, subtract };
