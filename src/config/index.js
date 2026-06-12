'use strict';

require('dotenv').config();

/**
 * Centralized application configuration. Values are read from environment
 * variables with sensible defaults so the app boots without a .env file.
 */
const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,
  logLevel: process.env.LOG_LEVEL || 'info',

  stellar: {
    network: process.env.STELLAR_NETWORK || 'testnet',
    horizonUrl:
      process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
    sorobanRpcUrl:
      process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
    streamContractId:
      process.env.STREAM_CONTRACT_ID ||
      'CMOCKSTREAMCONTRACT000000000000000000000000000000000000',
    nativeAsset: process.env.NATIVE_ASSET || 'XLM',
  },
};

/**
 * Validate critical config values at load time. Throws early with a clear
 * message rather than failing mysteriously later.
 */
function validate(cfg) {
  if (!Number.isInteger(cfg.port) || cfg.port <= 0 || cfg.port > 65535) {
    throw new Error(`Invalid PORT: ${cfg.port}`);
  }
  return cfg;
}

module.exports = validate(config);
