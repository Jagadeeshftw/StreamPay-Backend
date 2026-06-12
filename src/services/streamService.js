'use strict';

const store = require('../store');
const stellarService = require('./stellarService');
const streamMath = require('./streamMath');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { newStreamId } = require('../utils/ids');
const { nowSeconds } = require('../utils/time');
const money = require('../utils/money');
const { STREAM_STATUS } = require('../constants/streamStatus');

/**
 * Build the public-facing view of a stream, enriching the stored record with
 * computed amounts at the given time.
 */
function toView(stream, atTime) {
  const at = atTime || nowSeconds();
  return {
    id: stream.id,
    sender: stream.sender,
    recipient: stream.recipient,
    total: stream.total,
    asset: stream.asset,
    startTime: stream.startTime,
    endTime: stream.endTime,
    status: stream.status,
    withdrawn: stream.withdrawn,
    streamed: streamMath.streamedAmount(stream, at),
    withdrawable: streamMath.withdrawableAmount(stream, at),
    locked: streamMath.lockedAmount(stream, at),
    progress: streamMath.progress(stream, at),
    remainingSeconds: streamMath.remainingSeconds(stream, at),
    createdAt: stream.createdAt,
    updatedAt: stream.updatedAt,
    txHashes: stream.txHashes,
  };
}

/**
 * Create and persist a new stream, locking the sender's funds on-chain (mock).
 */
async function createStream(input) {
  const now = nowSeconds();
  const startTime = input.startTime || now;
  const endTime = input.endTime;

  const lock = await stellarService.lockFunds({
    sender: input.sender,
    amount: input.total,
  });

  const stream = {
    id: newStreamId(),
    sender: input.sender,
    recipient: input.recipient,
    total: money.round(input.total),
    asset: lock.asset,
    startTime,
    endTime,
    status: STREAM_STATUS.ACTIVE,
    withdrawn: 0,
    createdAt: now,
    updatedAt: now,
    txHashes: { lock: lock.txHash },
  };

  store.insertStream(stream);
  logger.info('stream created', { id: stream.id, sender: stream.sender });
  return toView(stream, now);
}

/**
 * Fetch a single stream view by id or throw 404.
 */
function getStream(id) {
  const stream = store.getStream(id);
  if (!stream) throw ApiError.notFound(`Stream ${id} not found`);
  return toView(stream);
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * List streams, optionally filtered by sender, recipient and/or status, with
 * `limit`/`offset` pagination. Returns the page of stream views together with
 * the total number of matches so callers can build pagination controls.
 */
function listStreams(filter = {}) {
  const at = nowSeconds();
  const matched = store
    .listStreams()
    .filter((s) => (filter.sender ? s.sender === filter.sender : true))
    .filter((s) => (filter.recipient ? s.recipient === filter.recipient : true))
    .filter((s) => (filter.status ? s.status === filter.status : true))
    .sort((a, b) => b.createdAt - a.createdAt);

  const limit = clampLimit(filter.limit);
  const offset = clampOffset(filter.offset);
  const page = matched.slice(offset, offset + limit).map((s) => toView(s, at));

  return { total: matched.length, limit, offset, streams: page };
}

/**
 * Normalize a requested page size into [1, MAX_LIMIT], defaulting when absent.
 */
function clampLimit(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(n), MAX_LIMIT);
}

/**
 * Normalize a requested offset into a non-negative integer.
 */
function clampOffset(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

/**
 * Release the streamed-so-far amount to the recipient.
 */
async function withdraw(id, requestedAmount) {
  const stream = store.getStream(id);
  if (!stream) throw ApiError.notFound(`Stream ${id} not found`);

  const now = nowSeconds();
  const available = streamMath.withdrawableAmount(stream, now);
  if (available <= 0) {
    throw ApiError.badRequest('Nothing available to withdraw');
  }

  // Allow partial withdrawals; default to the full available amount.
  const amount = requestedAmount ? money.round(requestedAmount) : available;
  if (amount > available) {
    throw ApiError.badRequest(
      `Requested ${amount} exceeds withdrawable ${available}`
    );
  }

  const release = await stellarService.releaseFunds({
    recipient: stream.recipient,
    amount,
  });

  stream.withdrawn = money.round(stream.withdrawn + amount);
  stream.updatedAt = now;
  stream.txHashes = { ...stream.txHashes, lastWithdraw: release.txHash };
  if (stream.withdrawn >= stream.total && stream.status === STREAM_STATUS.ACTIVE) {
    stream.status = STREAM_STATUS.COMPLETED;
  }
  store.updateStream(stream);

  logger.info('stream withdraw', { id: stream.id, amount });
  return { stream: toView(stream, now), amount, txHash: release.txHash };
}

/**
 * Cancel a stream: recipient keeps what streamed, sender reclaims the rest.
 */
async function cancel(id) {
  const stream = store.getStream(id);
  if (!stream) throw ApiError.notFound(`Stream ${id} not found`);
  if (stream.status === STREAM_STATUS.CANCELLED) {
    throw ApiError.conflict('Stream already cancelled');
  }
  if (stream.status === STREAM_STATUS.COMPLETED) {
    throw ApiError.conflict('Stream already completed');
  }

  const now = nowSeconds();
  const refund = streamMath.lockedAmount(stream, now);

  const refundTx = await stellarService.refundFunds({
    sender: stream.sender,
    amount: refund,
  });

  stream.status = STREAM_STATUS.CANCELLED;
  stream.updatedAt = now;
  stream.txHashes = { ...stream.txHashes, refund: refundTx.txHash };
  store.updateStream(stream);

  logger.info('stream cancelled', { id: stream.id, refund });
  return { stream: toView(stream, now), refunded: refund, txHash: refundTx.txHash };
}

module.exports = {
  toView,
  createStream,
  getStream,
  listStreams,
  withdraw,
  cancel,
};
