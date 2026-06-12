'use strict';

const createApp = require('./src/app');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const seed = require('./src/store/seed');

/**
 * Server bootstrap. Seeds sample data, builds the app and starts listening.
 */
function start() {
  seed();

  const app = createApp();
  const server = app.listen(config.port, () => {
    logger.info(`StreamPay backend listening on port ${config.port} (${config.env})`);
  });

  // Graceful shutdown.
  const shutdown = (signal) => {
    logger.info(`Received ${signal}, shutting down`);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
}

if (require.main === module) {
  start();
}

module.exports = start;
