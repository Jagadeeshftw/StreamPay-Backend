'use strict';

const money = require('../utils/money');
const stellarService = require('../services/stellarService');
const { nowSeconds } = require('../utils/time');
const { BATCH } = require('../constants/batch');

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

/**
 * Validate a batch-update payload: `{ updates: [{ id, action, amount? }] }`.
 * `action` must be "withdraw" (optional `amount` for a partial withdraw) or
 * "cancel". Rejects an empty or oversized batch, malformed items, and
 * duplicate ids within the same batch up front so a single request cannot
 * apply the same id's action twice.
 */
function validateBatchUpdate(body) {
  const errors = [];
  const updates = body.updates;

  if (!Array.isArray(updates) || updates.length === 0) {
    return { error: ['updates must be a non-empty array'] };
  }
  if (updates.length > BATCH.MAX_ITEMS) {
    return { error: [`updates must not exceed ${BATCH.MAX_ITEMS} items`] };
  }

  const seenIds = new Set();
  const cleaned = [];

  updates.forEach((item, index) => {
    const prefix = `updates[${index}]`;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`${prefix} must be an object`);
      return;
    }

    const id = typeof item.id === 'string' ? item.id.trim() : '';
    let idValid = true;
    if (!id) {
      errors.push(`${prefix}.id is required`);
      idValid = false;
    } else if (!id.startsWith('stream_')) {
      errors.push(`${prefix}.id is not a valid stream id`);
      idValid = false;
    } else if (seenIds.has(id)) {
      errors.push(`${prefix}.id "${id}" is duplicated in this batch`);
      idValid = false;
    } else {
      seenIds.add(id);
    }

    const action = item.action;
    const actionValid = BATCH.ACTIONS.includes(action);
    if (!actionValid) {
      errors.push(`${prefix}.action must be one of ${BATCH.ACTIONS.join(', ')}`);
    }

    let amount;
    if (actionValid && action === 'withdraw' && item.amount !== undefined && item.amount !== null) {
      amount = money.parseAmount(item.amount);
      if (amount === null) {
        errors.push(`${prefix}.amount must be a positive number when provided`);
      }
    } else if (actionValid && action === 'cancel' && item.amount !== undefined) {
      errors.push(`${prefix}.amount is not applicable to a cancel action`);
    }

    if (idValid && actionValid) {
      cleaned.push({ id, action, amount });
    }
  });

  if (errors.length) return { error: errors };

  return { value: { updates: cleaned } };
}

module.exports = { validateCreateStream, validateWithdraw, validateBatchUpdate };
