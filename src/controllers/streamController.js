'use strict';

const streamService = require('../services/streamService');

/**
 * POST /api/streams
 * Create a new payment stream. Body has been validated upstream and the
 * cleaned payload is available on req.validated.
 */
async function create(req, res) {
  const stream = await streamService.createStream(req.validated);
  res.status(201).json({ stream });
}

/**
 * GET /api/streams
 * List streams, optionally filtered by ?sender=, ?recipient= and/or ?status=,
 * with ?limit= and ?offset= pagination.
 */
function list(req, res) {
  const { sender, recipient, status, limit, offset } = req.query;
  const result = streamService.listStreams({ sender, recipient, status, limit, offset });
  res.json({
    count: result.streams.length,
    total: result.total,
    limit: result.limit,
    offset: result.offset,
    streams: result.streams,
  });
}

/**
 * GET /api/streams/:id
 * Fetch a single stream by id.
 */
function getById(req, res) {
  const stream = streamService.getStream(req.params.id);
  res.json({ stream });
}

/**
 * POST /api/streams/:id/withdraw
 * Release the amount streamed-so-far to the recipient.
 */
async function withdraw(req, res) {
  const amount = req.validated ? req.validated.amount : undefined;
  const result = await streamService.withdraw(req.params.id, amount);
  res.json(result);
}

/**
 * POST /api/streams/:id/cancel
 * Cancel a stream; the sender reclaims the unstreamed remainder.
 */
async function cancel(req, res) {
  const result = await streamService.cancel(req.params.id);
  res.json(result);
}

module.exports = { create, list, getById, withdraw, cancel };
