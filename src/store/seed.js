'use strict';

const store = require('./index');
const logger = require('../utils/logger');
const config = require('../config');
const { newStreamId, newTxHash } = require('../utils/ids');
const { nowSeconds } = require('../utils/time');
const money = require('../utils/money');

const HOUR = 3600;
const DAY = 24 * HOUR;

/**
 * Populate the in-memory store with a few illustrative streams so the API is
 * useful immediately after boot. Idempotent: clears any existing data first.
 */
function seed() {
  store.clear();
  const now = nowSeconds();
  const asset = config.stellar.nativeAsset;

  const samples = [
    // Active stream, halfway through.
    {
      sender: 'GALICE000000000000000000000000000000000000000000000000000',
      recipient: 'GBOB00000000000000000000000000000000000000000000000000000',
      total: 1000,
      startTime: now - HOUR,
      endTime: now + HOUR,
      status: 'active',
      withdrawn: 0,
    },
    // Active stream just started.
    {
      sender: 'GCAROL0000000000000000000000000000000000000000000000000000',
      recipient: 'GBOB00000000000000000000000000000000000000000000000000000',
      total: 500,
      startTime: now,
      endTime: now + DAY,
      status: 'active',
      withdrawn: 0,
    },
    // Stream with a prior partial withdrawal.
    {
      sender: 'GALICE000000000000000000000000000000000000000000000000000',
      recipient: 'GDAVE00000000000000000000000000000000000000000000000000000',
      total: 2000,
      startTime: now - 2 * HOUR,
      endTime: now + 2 * HOUR,
      status: 'active',
      withdrawn: 250,
    },
  ];

  for (const s of samples) {
    const id = newStreamId();
    store.insertStream({
      id,
      sender: s.sender,
      recipient: s.recipient,
      total: money.round(s.total),
      asset,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.status,
      withdrawn: money.round(s.withdrawn),
      createdAt: now,
      updatedAt: now,
      txHashes: { lock: newTxHash() },
    });
  }

  logger.info(`Seeded ${store.size()} streams`);
}

module.exports = seed;
