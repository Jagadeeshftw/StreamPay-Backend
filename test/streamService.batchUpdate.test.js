'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const store = require('../src/store');
const streamService = require('../src/services/streamService');
const { STREAM_STATUS } = require('../src/constants/streamStatus');

// A linear 1000-unit stream fully open (window in the past, fully vested).
function seedStream(overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  const stream = {
    id: `stream_${Math.random().toString(16).slice(2)}`,
    sender: 'GALICE0000000000000000000000000000000000000000000000',
    recipient: 'GBOB00000000000000000000000000000000000000000000000',
    total: 1000,
    asset: 'XLM',
    startTime: now - 200,
    endTime: now - 100,
    status: STREAM_STATUS.ACTIVE,
    withdrawn: 0,
    createdAt: now - 200,
    updatedAt: now - 200,
    txHashes: { lock: 'tx_seed' },
    ...overrides,
  };
  store.insertStream(stream);
  return stream;
}

test('applies a mixed batch, reporting each item outcome independently', async (t) => {
  t.after(() => store.clear());

  const a = seedStream();
  const b = seedStream();

  const result = await streamService.batchUpdate([
    { id: a.id, action: 'withdraw' },
    { id: b.id, action: 'cancel' },
  ]);

  assert.equal(result.count, 2);
  assert.equal(result.succeeded, 2);
  assert.equal(result.failed, 0);

  const withdrawResult = result.results.find((r) => r.id === a.id);
  assert.equal(withdrawResult.ok, true);
  assert.equal(withdrawResult.stream.status, STREAM_STATUS.COMPLETED);

  const cancelResult = result.results.find((r) => r.id === b.id);
  assert.equal(cancelResult.ok, true);
  assert.equal(cancelResult.stream.status, STREAM_STATUS.CANCELLED);
});

test('one item failing does not stop the rest of the batch from applying', async (t) => {
  t.after(() => store.clear());

  const ok = seedStream();

  const result = await streamService.batchUpdate([
    { id: 'stream_does_not_exist', action: 'cancel' },
    { id: ok.id, action: 'cancel' },
  ]);

  assert.equal(result.succeeded, 1);
  assert.equal(result.failed, 1);

  const missing = result.results.find((r) => r.id === 'stream_does_not_exist');
  assert.equal(missing.ok, false);
  assert.equal(missing.error.statusCode, 404);
  assert.equal(missing.error.code, 'NOT_FOUND');

  const applied = result.results.find((r) => r.id === ok.id);
  assert.equal(applied.ok, true);
  assert.equal(store.getStream(ok.id).status, STREAM_STATUS.CANCELLED);
});

test('cancelling an already-cancelled stream in a batch fails that item only', async (t) => {
  t.after(() => store.clear());

  const stream = seedStream({ status: STREAM_STATUS.CANCELLED });

  const result = await streamService.batchUpdate([{ id: stream.id, action: 'cancel' }]);

  assert.equal(result.failed, 1);
  assert.equal(result.results[0].error.statusCode, 409);
  assert.equal(result.results[0].error.code, 'CONFLICT');
});

test('supports a partial withdraw amount within a batch', async (t) => {
  t.after(() => store.clear());

  const stream = seedStream();

  const result = await streamService.batchUpdate([
    { id: stream.id, action: 'withdraw', amount: 100 },
  ]);

  assert.equal(result.results[0].ok, true);
  assert.equal(result.results[0].amount, 100);
  assert.equal(store.getStream(stream.id).withdrawn, 100);
});
