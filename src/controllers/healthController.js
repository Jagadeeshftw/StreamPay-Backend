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
 * GET /api/health/live
 * Liveness probe: confirms the process is up and able to serve. Always 200
 * unless the event loop is wedged, in which case it never responds at all.
 */
function live(req, res) {
  res.json({ status: 'alive' });
}

/**
 * GET /api/health/ready
 * Readiness probe: confirms the app is ready to accept traffic. The in-memory
 * store has no external dependencies, so readiness is simply that the store is
 * initialized.
 */
function ready(req, res) {
  res.json({ status: 'ready', streams: store.size() });
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

module.exports = { health, live, ready, version };
