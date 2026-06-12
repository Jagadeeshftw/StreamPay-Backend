'use strict';

const store = require('../store');
const streamMath = require('./streamMath');
const money = require('../utils/money');
const { nowSeconds } = require('../utils/time');
const { STREAM_STATUS } = require('../constants/streamStatus');

/**
 * Aggregate withdrawable balance for a single user across every stream where
 * they are the recipient.
 */
function withdrawableForUser(user) {
  const at = nowSeconds();
  const streams = store.listStreams().filter((s) => s.recipient === user);

  let total = 0;
  const details = streams.map((s) => {
    const amount = streamMath.withdrawableAmount(s, at);
    total = money.round(total + amount);
    return { streamId: s.id, withdrawable: amount, status: s.status };
  });

  return { user, totalWithdrawable: total, streams: details };
}

/**
 * Protocol-wide analytics: total streamed across all streams, count of active
 * streams, and the total amount still locked.
 */
function overview() {
  const at = nowSeconds();
  const streams = store.listStreams();

  let totalStreamed = 0;
  let totalLocked = 0;
  let totalWithdrawn = 0;
  let active = 0;
  let cancelled = 0;
  let completed = 0;

  for (const s of streams) {
    totalStreamed = money.round(totalStreamed + streamMath.streamedAmount(s, at));
    totalLocked = money.round(totalLocked + streamMath.lockedAmount(s, at));
    totalWithdrawn = money.round(totalWithdrawn + s.withdrawn);
    if (s.status === STREAM_STATUS.ACTIVE) active += 1;
    if (s.status === STREAM_STATUS.CANCELLED) cancelled += 1;
    if (s.status === STREAM_STATUS.COMPLETED) completed += 1;
  }

  return {
    streams: streams.length,
    activeStreams: active,
    cancelledStreams: cancelled,
    completedStreams: completed,
    totalStreamed,
    totalLocked,
    totalWithdrawn,
  };
}

module.exports = { withdrawableForUser, overview };
