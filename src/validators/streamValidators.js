'use strict';

const money = require('../utils/money');
const stellarService = require('../services/stellarService');
const { nowSeconds } = require('../utils/time');

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

  const now = nowSeconds();
  let startTime = body.startTime === undefined ? now : Number(body.startTime);
  if (!Number.isFinite(startTime)) {
    errors.push('startTime must be a unix timestamp in seconds');
    startTime = now;
  }

  const endTime = Number(body.endTime);
  if (!Number.isFinite(endTime)) {
    errors.push('endTime is required and must be a unix timestamp in seconds');
  } else if (endTime <= startTime) {
    errors.push('endTime must be after startTime');
  }

  if (errors.length) return { error: errors };

  return {
    value: { sender, recipient, total, startTime, endTime },
  };
}

module.exports = { validateCreateStream };
