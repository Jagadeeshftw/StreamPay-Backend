'use strict';

const config = require('../config');
const store = require('../store');

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

module.exports = { health };
