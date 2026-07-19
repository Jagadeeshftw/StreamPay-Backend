'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { validateBatchUpdate } = require('../src/validators/streamValidators');

test('rejects a missing or empty updates array', () => {
  assert.ok(validateBatchUpdate({}).error);
  assert.ok(validateBatchUpdate({ updates: [] }).error);
  assert.ok(validateBatchUpdate({ updates: 'nope' }).error);
});

test('rejects a batch larger than the max size', () => {
  const updates = Array.from({ length: 26 }, (_, i) => ({
    id: `stream_${i}`,
    action: 'cancel',
  }));
  const result = validateBatchUpdate({ updates });
  assert.ok(result.error);
  assert.match(result.error[0], /must not exceed/);
});

test('rejects an item with a malformed id', () => {
  const result = validateBatchUpdate({
    updates: [{ id: 'not-a-stream-id', action: 'cancel' }],
  });
  assert.ok(result.error);
  assert.match(result.error[0], /not a valid stream id/);
});

test('rejects an item with an unknown action', () => {
  const result = validateBatchUpdate({
    updates: [{ id: 'stream_1', action: 'delete' }],
  });
  assert.ok(result.error);
  assert.match(result.error[0], /action must be one of/);
});

test('rejects duplicate ids within the same batch', () => {
  const result = validateBatchUpdate({
    updates: [
      { id: 'stream_1', action: 'cancel' },
      { id: 'stream_1', action: 'withdraw' },
    ],
  });
  assert.ok(result.error);
  assert.match(result.error[0], /duplicated in this batch/);
});

test('rejects a non-positive amount on a withdraw item', () => {
  const result = validateBatchUpdate({
    updates: [{ id: 'stream_1', action: 'withdraw', amount: -5 }],
  });
  assert.ok(result.error);
  assert.match(result.error[0], /amount must be a positive number/);
});

test('rejects an amount supplied on a cancel item', () => {
  const result = validateBatchUpdate({
    updates: [{ id: 'stream_1', action: 'cancel', amount: 10 }],
  });
  assert.ok(result.error);
  assert.match(result.error[0], /not applicable to a cancel/);
});

test('accepts a well-formed batch and normalizes each item', () => {
  const result = validateBatchUpdate({
    updates: [
      { id: ' stream_1 ', action: 'withdraw', amount: '25.5' },
      { id: 'stream_2', action: 'cancel' },
    ],
  });
  assert.deepEqual(result.value.updates, [
    { id: 'stream_1', action: 'withdraw', amount: 25.5 },
    { id: 'stream_2', action: 'cancel', amount: undefined },
  ]);
});

test('accumulates multiple errors across items instead of stopping at the first', () => {
  const result = validateBatchUpdate({
    updates: [
      { id: '', action: 'cancel' },
      { id: 'stream_1', action: 'nope' },
    ],
  });
  assert.equal(result.error.length, 2);
});
