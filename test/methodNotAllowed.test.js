'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const createApp = require('../src/app');
const methodNotAllowed = require('../src/middleware/methodNotAllowed');
const ApiError = require('../src/utils/ApiError');

test('methodNotAllowed middleware calls next with a 405 ApiError', () => {
  const req = {
    method: 'POST',
    originalUrl: '/api/health'
  };
  let errorArg = null;
  const next = (err) => {
    errorArg = err;
  };

  methodNotAllowed(req, {}, next);

  assert.ok(errorArg instanceof ApiError);
  assert.equal(errorArg.statusCode, 405);
  assert.equal(errorArg.code, 'METHOD_NOT_ALLOWED');
  assert.equal(errorArg.message, 'Method POST not allowed on /api/health');
});

test('Integration: app returns 405 Method Not Allowed for unsupported methods', async (t) => {
  const app = createApp();
  let server;
  let port;

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      port = server.address().port;
      resolve();
    });
  });

  t.after(() => {
    if (server) {
      server.close();
    }
  });

  // 1. Test POST on /api/health (should be 405)
  const res1 = await fetch(`http://localhost:${port}/api/health`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  assert.equal(res1.status, 405);
  const body1 = await res1.json();
  assert.deepEqual(body1, {
    error: {
      message: 'Method POST not allowed on /api/health',
      status: 405,
      code: 'METHOD_NOT_ALLOWED'
    }
  });

  // 2. Test PUT on /api/streams (should be 405)
  const res2 = await fetch(`http://localhost:${port}/api/streams`, {
    method: 'PUT'
  });
  assert.equal(res2.status, 405);
  const body2 = await res2.json();
  assert.deepEqual(body2, {
    error: {
      message: 'Method PUT not allowed on /api/streams',
      status: 405,
      code: 'METHOD_NOT_ALLOWED'
    }
  });

  // 3. Test DELETE on root / (should be 405)
  const res3 = await fetch(`http://localhost:${port}/`, {
    method: 'DELETE'
  });
  assert.equal(res3.status, 405);
  const body3 = await res3.json();
  assert.deepEqual(body3, {
    error: {
      message: 'Method DELETE not allowed on /',
      status: 405,
      code: 'METHOD_NOT_ALLOWED'
    }
  });

  // 4. Test normal GET on /api/health (should be 200)
  const res4 = await fetch(`http://localhost:${port}/api/health`);
  assert.equal(res4.status, 200);

  // 5. Test normal GET on root / (should be 200)
  const res5 = await fetch(`http://localhost:${port}/`);
  assert.equal(res5.status, 200);
});
