import crypto from "crypto";

import { EventIngestionService } from "../eventIngestionService";
import type { ProcessedIndexerEventStore } from "../../repositories/processedIndexerEventRepository";

const secret = "test-indexer-secret";

const payload = {
  eventId: "evt_persistent_123",
  eventType: "settled",
  streamId: "stream_456",
  occurredAt: "2026-03-23T10:00:00.000Z",
};

class FakeProcessedIndexerEventStore implements ProcessedIndexerEventStore {
  readonly eventIds = new Set<string>();
  readonly calls: string[] = [];
  failRecord = false;

  async record(eventId: string): Promise<boolean> {
    this.calls.push(eventId);
    if (this.failRecord) {
      throw new Error("database unavailable");
    }
    if (this.eventIds.has(eventId)) {
      return false;
    }
    this.eventIds.add(eventId);
    return true;
  }

  async reset(): Promise<void> {
    this.eventIds.clear();
    this.calls.length = 0;
  }
}

function sign(body: string): string {
  const digest = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return `sha256=${digest}`;
}

describe("EventIngestionService", () => {
  beforeEach(() => {
    process.env.INDEXER_WEBHOOK_SECRET = secret;
  });

  afterEach(() => {
    delete process.env.INDEXER_WEBHOOK_SECRET;
  });

  it("uses the injected event store so duplicates survive fresh service instances", async () => {
    const store = new FakeProcessedIndexerEventStore();
    const body = Buffer.from(JSON.stringify(payload));
    const signature = sign(body.toString("utf8"));

    const firstService = new EventIngestionService(store);
    const first = await firstService.ingest(body, signature);

    const restartedService = new EventIngestionService(store);
    const replay = await restartedService.ingest(body, signature);

    expect(first).toMatchObject({ accepted: true, duplicate: false });
    expect(replay).toMatchObject({ accepted: true, duplicate: true });
    expect(store.calls).toEqual([payload.eventId, payload.eventId]);
  });

  it("validates signatures and payloads before recording idempotency", async () => {
    const store = new FakeProcessedIndexerEventStore();
    const service = new EventIngestionService(store);
    const body = Buffer.from(JSON.stringify(payload));

    const result = await service.ingest(body, "sha256=deadbeef");

    expect(result).toMatchObject({ accepted: false, code: "invalid_signature" });
    expect(store.calls).toEqual([]);
  });

  it("fails closed when the persistent replay store is unavailable", async () => {
    const store = new FakeProcessedIndexerEventStore();
    store.failRecord = true;

    const service = new EventIngestionService(store);
    const body = Buffer.from(JSON.stringify(payload));
    const result = await service.ingest(body, sign(body.toString("utf8")));

    expect(result).toEqual({
      accepted: false,
      code: "idempotency_unavailable",
      message: "Webhook replay protection is unavailable.",
    });
  });
});
