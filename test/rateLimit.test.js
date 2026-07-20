'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const createRateLimiter = require('../src/middleware/rateLimit');

/**
 * Build a minimal mock Express request/response pair for middleware testing.
 */
function mockReqRes(overrides = {}) {
  const req = {
    ip: '127.0.0.1',
    path: '/api/streams',
    ...overrides,
  };
  const res = {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
  return { req, res };
}

/**
 * Helper: invoke the middleware and collect what was passed to next().
 */
function run(middleware, req, res) {
  return new Promise((resolve) => {
    middleware(req, res, (err) => resolve({ err }));
  });
}

test('rate limiter sets X-RateLimit headers and lets request through', async () => {
  const limiter = createRateLimiter({ windowMs: 60000, max: 5 });
  const { req, res } = mockReqRes();

  const result = await run(limiter, req, res);

  assert.equal(result.err, undefined);
  assert.equal(res.headers['X-RateLimit-Limit'], 5);
  assert.equal(res.headers['X-RateLimit-Remaining'], 4);
  assert.ok(typeof res.headers['X-RateLimit-Reset'] === 'number');
});

test('rate limiter blocks requests that exceed the max', async () => {
  const limiter = createRateLimiter({ windowMs: 60000, max: 2 });
  const { req, res } = mockReqRes();

  // Fire 2 successful requests (count hits 2, max 2 → 0 remaining)
  await run(limiter, req, res);
  await run(limiter, req, res);

  // Third request from same IP should be rejected.
  const result = await run(limiter, req, res);

  assert.ok(result.err, 'expected an error for exceeded limit');
  assert.equal(result.err.statusCode, 429);
  assert.equal(result.err.code, 'RATE_LIMITED');
  assert.equal(res.headers['X-RateLimit-Remaining'], 0);
  assert.ok(typeof res.headers['Retry-After'] === 'number');
});

test('skip option bypasses rate limiting for matching requests', async () => {
  const skip = (req) => req.path === '/api/health';
  const limiter = createRateLimiter({ windowMs: 60000, max: 1, skip });

  // Exhaust the bucket with a normal request.
  const normal = mockReqRes({ path: '/api/streams' });
  await run(limiter, normal.req, normal.res);

  // A second normal request should be blocked.
  const blocked = await run(limiter, normal.req, normal.res);
  assert.ok(blocked.err, 'expected normal request to be blocked');
  assert.equal(blocked.err.code, 'RATE_LIMITED');

  // A health request should pass through even though the bucket is full.
  const health = mockReqRes({ path: '/api/health' });
  const result = await run(limiter, health.req, health.res);

  assert.equal(result.err, undefined, 'health check should be exempt');
});

test('skip option does not affect rate limit counters for skipped paths', async () => {
  const skip = (req) => req.path === '/api/health' || req.path === '/api/version';
  const limiter = createRateLimiter({ windowMs: 60000, max: 2, skip });

  const normal = mockReqRes({ path: '/api/streams' });
  const health = mockReqRes({ path: '/api/health' });
  const version = mockReqRes({ path: '/api/version' });

  // Fire several health/version requests first — they must not consume quota.
  await run(limiter, health.req, health.res);
  await run(limiter, health.req, health.res);
  await run(limiter, version.req, version.res);

  // Two normal requests should still succeed (bucket not touched by skips).
  const r1 = await run(limiter, normal.req, normal.res);
  assert.equal(r1.err, undefined, 'first normal request should pass');
  const r2 = await run(limiter, normal.req, normal.res);
  assert.equal(r2.err, undefined, 'second normal request should pass');

  // Third should be blocked.
  const r3 = await run(limiter, normal.req, normal.res);
  assert.ok(r3.err, 'third normal request should be blocked');
  assert.equal(r3.err.code, 'RATE_LIMITED');
});

test('rate limiter uses config defaults when options are omitted', async () => {
  const limiter = createRateLimiter();
  const { req, res } = mockReqRes();

  const result = await run(limiter, req, res);

  assert.equal(result.err, undefined);
  assert.ok(res.headers['X-RateLimit-Limit'] > 0);
});

test('rate limiter resets the counter after the window expires', async () => {
  // Use a very short window so we can test the reset.
  const limiter = createRateLimiter({ windowMs: 50, max: 1 });
  const { req, res } = mockReqRes();

  // Exhaust the bucket.
  await run(limiter, req, res);

  const blocked = await run(limiter, req, res);
  assert.ok(blocked.err, 'should be blocked after exhausting bucket');

  // Wait for the window to expire.
  await new Promise((r) => setTimeout(r, 60));

  // Should be allowed again.
  const fresh = mockReqRes({ ip: '127.0.0.1' });
  const allowed = await run(limiter, fresh.req, fresh.res);
  assert.equal(allowed.err, undefined, 'should be allowed after window reset');
});
