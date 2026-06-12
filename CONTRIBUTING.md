# Contributing

Thanks for your interest in improving StreamPay's backend. This project keeps a
small, dependency-light footprint, so the bar for new dependencies is high.

## Getting set up

```bash
npm install
cp .env.example .env
npm start   # or: npm run dev
```

## Project layout

```
src/
  app.js            Express app wiring (middleware order matters)
  config/           Environment-driven configuration, validated at load time
  constants/        Frozen enums and shared limits
  controllers/      Thin HTTP handlers; no business logic
  middleware/       Cross-cutting request handling
  routes/           Route tables mounted under /api
  services/         Business logic (streaming math, analytics, mock Stellar)
  store/            In-memory data store and seed data
  utils/            Small reusable helpers
test/               node:test suites (no extra runner)
```

## Conventions

- `'use strict';` at the top of every module.
- Controllers stay thin: validate input, call a service, shape the response.
- Throw `ApiError` for client-facing failures so the error envelope stays
  consistent. Prefer the named factory helpers (`ApiError.badRequest`, etc.).
- Money flows through `src/utils/money` so rounding stays consistent (Stellar's
  7-decimal precision).
- Keep new dependencies to a minimum; reach for the standard library first.

## Tests

Unit tests use the built-in Node test runner:

```bash
npm test
```

Add a focused test alongside any new util or service helper. Pure helpers that
do not pull in configuration are easiest to test in isolation.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`,
`fix:`, `docs:`, `refactor:`, `test:`, `chore:`) with a clear scope, e.g.
`feat(streams): add schedule endpoint`. Keep each commit a single coherent
change.
