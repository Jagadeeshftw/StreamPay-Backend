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
`recipient`, `status` (`active` | `completed` | `cancelled`).

`GET /api/streams/:id` — fetch a single stream.

`POST /api/streams/:id/withdraw` — release streamed-so-far to the recipient.
Optional body `{ "amount": 100 }` for a partial withdrawal; omitting it
withdraws the full available balance.

`POST /api/streams/:id/cancel` — sender cancels and reclaims the remainder.

### Balances & analytics

`GET /api/balances?user=GBOB...` — total withdrawable for a user across streams.

`GET /api/analytics` — protocol-wide totals: total streamed, active streams,
total locked.

## License

MIT
