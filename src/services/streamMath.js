'use strict';

const { clamp } = require('../utils/time');
const money = require('../utils/money');
const { STREAM_STATUS } = require('../constants/streamStatus');

/**
 * Core streaming math.
 *
 * A stream linearly releases `total` over the window [startTime, endTime].
 * Given the current time we compute how much has streamed so far.
 *
 *   streamed(t) = total * (clamp(t, start, end) - start) / (end - start)
 *
 * Before startTime nothing has streamed; after endTime the full total has.
 */
function streamedAmount(stream, atTime) {
  const { startTime, endTime, total } = stream;

  if (endTime <= startTime) {
    // Degenerate window: treat as fully streamed once started.
    return atTime >= startTime ? money.round(total) : 0;
  }

  const elapsed = clamp(atTime, startTime, endTime) - startTime;
  const duration = endTime - startTime;
  const fraction = elapsed / duration;
  return money.round(total * fraction);
}

/**
 * Amount currently available for the recipient to withdraw: everything that
 * has streamed minus whatever has already been withdrawn. Cancelled streams
 * release nothing further beyond what was already settled.
 */
function withdrawableAmount(stream, atTime) {
  const streamed = streamedAmount(stream, atTime);
  return money.subtract(streamed, stream.withdrawn);
}

/**
 * Amount still locked for the sender (not yet streamed). Once a stream is
 * cancelled this becomes zero because the remainder was refunded.
 */
function lockedAmount(stream, atTime) {
  if (stream.status === STREAM_STATUS.CANCELLED) return 0;
  const streamed = streamedAmount(stream, atTime);
  return money.subtract(stream.total, streamed);
}

/**
 * Progress of a stream as a fraction in [0, 1] of total time elapsed.
 */
function progress(stream, atTime) {
  const { startTime, endTime } = stream;
  if (endTime <= startTime) return atTime >= startTime ? 1 : 0;
  const elapsed = clamp(atTime, startTime, endTime) - startTime;
  return Math.round((elapsed / (endTime - startTime)) * 10000) / 10000;
}

/**
 * Whole seconds remaining until the stream is fully streamed. Zero once the
 * window has closed (or for a degenerate window once it has started).
 */
function remainingSeconds(stream, atTime) {
  const { endTime } = stream;
  return Math.max(0, endTime - atTime);
}

module.exports = {
  streamedAmount,
  withdrawableAmount,
  lockedAmount,
  progress,
  remainingSeconds,
};
