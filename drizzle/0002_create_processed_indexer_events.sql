CREATE TABLE IF NOT EXISTS "processed_indexer_events" (
  "event_id" varchar(255) PRIMARY KEY NOT NULL,
  "received_at" timestamp DEFAULT now() NOT NULL
);
