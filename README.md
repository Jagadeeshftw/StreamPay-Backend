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

## License

MIT
