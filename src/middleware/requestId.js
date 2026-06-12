'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Attach a request id to every request. Honours an incoming `X-Request-Id`
 * header when present (useful for tracing across services) and otherwise
 * generates a new one. The id is exposed on `req.id` and echoed back in the
 * response so clients can correlate logs.
 */
module.exports = function requestId(req, res, next) {
  const incoming = req.headers['x-request-id'];
  const id = typeof incoming === 'string' && incoming.trim() ? incoming.trim() : uuidv4();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
};
