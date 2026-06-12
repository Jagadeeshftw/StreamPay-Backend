'use strict';

const config = require('../config');
const store = require('../store');
const pkg = require('../../package.json');

/**
 * GET /api/health
 * Basic liveness/readiness probe with a little runtime context.
 */
function health(req, res) {
  res.json({
    status: 'ok',
    service: 'streampay-backend',
    env: config.env,
    network: config.stellar.network,
    streams: store.size(),
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}

/**
 * GET /api/version
 * Report the running service version and a little build context. Handy for
 * deploy verification and client-side compatibility checks.
 */
function version(req, res) {
  res.json({
    service: pkg.name,
    version: pkg.version,
    node: process.version,
    env: config.env,
  });
}

module.exports = { health, version };
