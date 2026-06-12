'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique stream id. Prefixed so ids are self-describing in logs
 * and API responses.
 */
function newStreamId() {
  return `stream_${uuidv4()}`;
}

/**
 * Generate a mock on-chain transaction hash. Stands in for a real Stellar
 * transaction hash returned by the (mocked) network layer.
 */
function newTxHash() {
  return `tx_${uuidv4().replace(/-/g, '')}`;
}

module.exports = { newStreamId, newTxHash };
