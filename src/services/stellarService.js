'use strict';

const config = require('../config');
const logger = require('../utils/logger');
const { newTxHash } = require('../utils/ids');

/**
 * Mock Stellar / Soroban service.
 *
 * In a production build these functions would submit transactions to the
 * Soroban stream contract via the RPC server and return real ledger results.
 * Here every call resolves immediately with a fabricated transaction hash so
 * the rest of the app can be exercised end-to-end without a network.
 */

function basicAddressCheck(address) {
  // Stellar public keys are 56 chars and start with 'G'. We keep the check
  // loose because addresses in this mock are arbitrary user identifiers.
  return typeof address === 'string' && address.length >= 3;
}

async function lockFunds({ sender, amount }) {
  logger.debug('stellarService.lockFunds', { sender, amount, contract: config.stellar.streamContractId });
  return {
    txHash: newTxHash(),
    network: config.stellar.network,
    asset: config.stellar.nativeAsset,
  };
}

async function releaseFunds({ recipient, amount }) {
  logger.debug('stellarService.releaseFunds', { recipient, amount });
  return {
    txHash: newTxHash(),
    network: config.stellar.network,
    asset: config.stellar.nativeAsset,
  };
}

async function refundFunds({ sender, amount }) {
  logger.debug('stellarService.refundFunds', { sender, amount });
  return {
    txHash: newTxHash(),
    network: config.stellar.network,
    asset: config.stellar.nativeAsset,
  };
}

module.exports = {
  basicAddressCheck,
  lockFunds,
  releaseFunds,
  refundFunds,
};
