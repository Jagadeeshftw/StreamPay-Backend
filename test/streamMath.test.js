'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const streamMath = require('../src/services/streamMath');

// A linear 1000-unit stream over [100, 200] with nothing withdrawn yet.
function sampleStream(overrides = {}) {
  return {
    total: 1000,
    startTime: 100,
    endTime: 200,
    withdrawn: 0,
    status: 'active',
    ...overrides,
  };
}

test('streamedAmount is zero before the window opens', () => {
  assert.equal(streamMath.streamedAmount(sampleStream(), 50), 0);
});

test('streamedAmount is the full total after the window closes', () => {
  assert.equal(streamMath.streamedAmount(sampleStream(), 300), 1000);
});

test('streamedAmount is linear at the midpoint', () => {
  assert.equal(streamMath.streamedAmount(sampleStream(), 150), 500);
});

test('withdrawableAmount subtracts what was already withdrawn', () => {
  const stream = sampleStream({ withdrawn: 200 });
  assert.equal(streamMath.withdrawableAmount(stream, 150), 300);
});

test('lockedAmount is zero once a stream is cancelled', () => {
  const stream = sampleStream({ status: 'cancelled' });
  assert.equal(streamMath.lockedAmount(stream, 150), 0);
});

test('progress is a fraction in [0, 1]', () => {
  assert.equal(streamMath.progress(sampleStream(), 150), 0.5);
  assert.equal(streamMath.progress(sampleStream(), 50), 0);
  assert.equal(streamMath.progress(sampleStream(), 300), 1);
});

test('remainingSeconds counts down to zero', () => {
  assert.equal(streamMath.remainingSeconds(sampleStream(), 150), 50);
  assert.equal(streamMath.remainingSeconds(sampleStream(), 250), 0);
});
