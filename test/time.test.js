'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const time = require('../src/utils/time');

test('clamp keeps values inside the range', () => {
  assert.equal(time.clamp(5, 0, 10), 5);
  assert.equal(time.clamp(-1, 0, 10), 0);
  assert.equal(time.clamp(11, 0, 10), 10);
});

test('addSeconds shifts a timestamp forward', () => {
  assert.equal(time.addSeconds(1000, 60), 1060);
});

test('secondsBetween is order-independent and non-negative', () => {
  assert.equal(time.secondsBetween(100, 250), 150);
  assert.equal(time.secondsBetween(250, 100), 150);
});

test('formatDuration renders compact units', () => {
  assert.equal(time.formatDuration(0), '0s');
  assert.equal(time.formatDuration(-5), '0s');
  assert.equal(time.formatDuration(59), '59s');
  assert.equal(time.formatDuration(3661), '1h 1m 1s');
  assert.equal(time.formatDuration(90061), '1d 1h 1m 1s');
});
