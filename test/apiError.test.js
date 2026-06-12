'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const ApiError = require('../src/utils/ApiError');

test('codeFor maps known status codes', () => {
  assert.equal(ApiError.codeFor(400), 'BAD_REQUEST');
  assert.equal(ApiError.codeFor(403), 'FORBIDDEN');
  assert.equal(ApiError.codeFor(404), 'NOT_FOUND');
  assert.equal(ApiError.codeFor(409), 'CONFLICT');
  assert.equal(ApiError.codeFor(422), 'UNPROCESSABLE_ENTITY');
  assert.equal(ApiError.codeFor(429), 'RATE_LIMITED');
  assert.equal(ApiError.codeFor(503), 'SERVICE_UNAVAILABLE');
});

test('codeFor falls back by class of status', () => {
  assert.equal(ApiError.codeFor(500), 'INTERNAL_ERROR');
  assert.equal(ApiError.codeFor(418), 'ERROR');
});

test('factory helpers carry the right status and code', () => {
  assert.equal(ApiError.forbidden().statusCode, 403);
  assert.equal(ApiError.unprocessable().statusCode, 422);
  assert.equal(ApiError.serviceUnavailable().code, 'SERVICE_UNAVAILABLE');
});

test('details and explicit code are preserved', () => {
  const err = ApiError.badRequest('bad', ['field x']);
  assert.deepEqual(err.details, ['field x']);
  assert.equal(err.code, 'BAD_REQUEST');
});
