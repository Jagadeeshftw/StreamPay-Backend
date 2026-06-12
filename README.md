# StreamPay Backend

StreamPay is a real-time payment-streaming application built on top of the
Stellar / Soroban network. This repository contains the backend REST API.

A payment stream locks a `total` amount from a sender and releases it linearly
to a recipient over a time window (`startTime` to `endTime`). The recipient can
withdraw whatever has streamed so far at any moment, and the sender can cancel
to reclaim the unstreamed remainder.

> Note: the Stellar / Soroban layer is mocked in this project. No real on-chain
> transactions are submitted. The streaming math, balances and analytics are
> computed in-memory.

## Stack

- Node.js + Express
- In-memory store (no database)
- `cors`, `dotenv`, `morgan`, `uuid`

## Getting started

```bash
npm install
cp .env.example .env
npm start
```

The server listens on `PORT` (default `4000`).

## API

All endpoints are mounted under `/api`.

### Health

`GET /api/health` — liveness probe with runtime context.

`GET /api/version` — service name, version and Node runtime, for deploy checks.

### Streams

`POST /api/streams` — create a stream.

```json
{
  "sender": "GALICE...",
  "recipient": "GBOB...",
  "total": 1000,
  "startTime": 1700000000,
  "endTime": 1700003600
}
```

`startTime` is optional (defaults to now). `endTime` is required and must be
after `startTime`. `total` must be a positive number.

`GET /api/streams` — list streams. Optional query filters: `sender`,
`recipient`, `status` (`active` | `completed` | `cancelled`). Paginated via
`limit` (default 50, max 200) and `offset` (default 0); the response includes
`count` (this page), `total` (all matches), `limit` and `offset`.

`GET /api/streams/:id` — fetch a single stream.

`POST /api/streams/:id/withdraw` — release streamed-so-far to the recipient.
Optional body `{ "amount": 100 }` for a partial withdrawal; omitting it
withdraws the full available balance.

`POST /api/streams/:id/cancel` — sender cancels and reclaims the remainder.

### Balances & analytics

`GET /api/balances?user=GBOB...` — total withdrawable for a user across streams.

`GET /api/analytics` — protocol-wide totals: total streamed, active streams,
total locked.

## Errors

Errors use a consistent JSON envelope:

```json
{
  "error": {
    "message": "Stream stream_x not found",
    "status": 404,
    "code": "NOT_FOUND"
  }
}
```

`code` is a stable, machine-readable identifier (`BAD_REQUEST`, `NOT_FOUND`,
`CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`) that clients can switch on
independently of the human-readable `message`. Every response also carries an
`X-Request-Id` header (echoed from the request when supplied) for log
correlation.

## Configuration

All settings are read from environment variables (see `.env.example`):

- `PORT`, `NODE_ENV`, `LOG_LEVEL` — server basics.
- `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` — fixed-window rate limit applied to
  `/api` per client IP (defaults: 60s / 120 requests). Responses include
  `X-RateLimit-*` headers; exceeding the limit returns `429 RATE_LIMITED`.
- `CORS_ORIGINS` — comma-separated list of allowed origins, or `*` for any.
- `STELLAR_*` / `NATIVE_ASSET` — mock Stellar / Soroban settings.

## Tests

Unit tests use the built-in Node test runner (no extra dependencies):

```bash
npm test
```

## License

MIT
