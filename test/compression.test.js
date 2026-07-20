'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const createApp = require('../src/app');
const seed = require('../src/store/seed');

test('compression middleware compresses response when Accept-Encoding includes gzip and response is large', async () => {
  // Seed the store so we have enough data to exceed the 1kb compression threshold
  seed();

  const app = createApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const { port } = server.address();

  try {
    const res = await fetch(`http://localhost:${port}/api/streams`, {
      headers: {
        'Accept-Encoding': 'gzip',
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-encoding'), 'gzip');
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
});

test('compression middleware does not compress response when Accept-Encoding does not allow gzip', async () => {
  // Seed the store so we have enough data to exceed the 1kb compression threshold
  seed();

  const app = createApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const { port } = server.address();

  try {
    const res = await fetch(`http://localhost:${port}/api/streams`, {
      headers: {
        'Accept-Encoding': 'identity',
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-encoding'), null);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
});

test('compression middleware does not compress response when response is below threshold (1kb)', async () => {
  const app = createApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const { port } = server.address();

  try {
    const res = await fetch(`http://localhost:${port}/api/health/live`, {
      headers: {
        'Accept-Encoding': 'gzip',
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-encoding'), null);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
});
