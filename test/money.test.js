'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const money = require('../src/utils/money');

test('round respects Stellar 7-decimal precision', () => {
  assert.equal(money.round(1.123456789), 1.1234568);
});

test('parseAmount rejects non-positive and non-finite values', () => {
  assert.equal(money.parseAmount(0), null);
  assert.equal(money.parseAmount(-1), null);
  assert.equal(money.parseAmount('abc'), null);
  assert.equal(money.parseAmount('12.5'), 12.5);
});

test('subtract never returns a negative amount', () => {
  assert.equal(money.subtract(5, 8), 0);
  assert.equal(money.subtract(8, 5), 3);
});

test('sum rounds once at the end', () => {
  assert.equal(money.sum([0.1, 0.2]), 0.3);
  assert.equal(money.sum([]), 0);
});

test('percent computes a two-decimal percentage and guards zero total', () => {
  assert.equal(money.percent(50, 200), 25);
  assert.equal(money.percent(1, 3), 33.33);
  assert.equal(money.percent(5, 0), 0);
});
