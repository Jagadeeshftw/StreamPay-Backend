'use strict';

const money = require('../utils/money');
const stellarService = require('../services/stellarService');
const { nowSeconds } = require('../utils/time');

// Reject streams whose window is absurdly long; a decade is well beyond any
// realistic payroll/vesting schedule and likely indicates a unit mistake
// (e.g. milliseconds passed where seconds were expected).
const MAX_DURATION_SECONDS = 10 * 365 * 24 * 3600;

// Require a minimum window so a stream cannot release its entire total in a
// single second, which makes the linear math meaningless.
const MIN_DURATION_SECONDS = 60;

// Guard against fat-finger amounts far larger than any realistic stream. Mainly
// a sanity bound for this mock; a real ledger would enforce balance instead.
const MAX_TOTAL = 1e12;

/**
 * Validate the payload for creating a stream. Returns either { value } with a
 * cleaned record or { error } with a list of human-readable messages.
 */
function validateCreateStream(body) {
  const errors = [];

  const sender = typeof body.sender === 'string' ? body.sender.trim() : '';
  const recipient = typeof body.recipient === 'string' ? body.recipient.trim() : '';

  if (!sender) errors.push('sender is required');
  else if (!stellarService.basicAddressCheck(sender)) errors.push('sender is not a valid address');

  if (!recipient) errors.push('recipient is required');
  else if (!stellarService.basicAddressCheck(recipient)) errors.push('recipient is not a valid address');

  if (sender && recipient && sender === recipient) {
    errors.push('sender and recipient must differ');
  }

  const total = money.parseAmount(body.total);
  if (total === null) errors.push('total must be a positive number');
  else if (total > MAX_TOTAL) errors.push(`total must not exceed ${MAX_TOTAL}`);

  const now = nowSeconds();
  let startTime = body.startTime === undefined ? now : Number(body.startTime);
  if (!Number.isFinite(startTime)) {
    errors.push('startTime must be a unix timestamp in seconds');
    startTime = now;
  } else if (startTime < 0) {
    errors.push('startTime must not be negative');
  }

  const endTime = Number(body.endTime);
  if (!Number.isFinite(endTime)) {
    errors.push('endTime is required and must be a unix timestamp in seconds');
  } else if (endTime <= startTime) {
    errors.push('endTime must be after startTime');
  } else if (endTime - startTime < MIN_DURATION_SECONDS) {
    errors.push('stream duration must be at least 60 seconds');
  } else if (endTime - startTime > MAX_DURATION_SECONDS) {
    errors.push('stream duration must not exceed 10 years');
  }

  if (errors.length) return { error: errors };

  return {
    value: { sender, recipient, total, startTime, endTime },
  };
}

/**
 * Validate an optional partial-withdraw payload. When `amount` is omitted the
 * full withdrawable balance is released. When present it must be a positive
 * number.
 */
function validateWithdraw(body) {
  if (body.amount === undefined || body.amount === null) {
    return { value: {} };
  }
  const amount = money.parseAmount(body.amount);
  if (amount === null) {
    return { error: ['amount must be a positive number when provided'] };
  }
  return { value: { amount } };
}

module.exports = { validateCreateStream, validateWithdraw };
