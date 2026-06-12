'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { PAGINATION } = require('../src/constants/pagination');

test('pagination bounds are coherent', () => {
  assert.ok(PAGINATION.MIN_LIMIT >= 1);
  assert.ok(PAGINATION.DEFAULT_LIMIT >= PAGINATION.MIN_LIMIT);
  assert.ok(PAGINATION.MAX_LIMIT >= PAGINATION.DEFAULT_LIMIT);
});

test('PAGINATION is frozen', () => {
  assert.ok(Object.isFrozen(PAGINATION));
});
