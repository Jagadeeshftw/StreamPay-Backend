import { db } from "../db/index";
import { processedIndexerEvents } from "../db/schema";

export interface ProcessedIndexerEventStore {
  record(eventId: string): Promise<boolean>;
  reset(): Promise<void>;
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (error as { code?: unknown }).code === "23505";
}

export class ProcessedIndexerEventRepository implements ProcessedIndexerEventStore {
  async record(eventId: string): Promise<boolean> {
    try {
      await db.insert(processedIndexerEvents).values({ eventId });
      return true;
    } catch (error) {
      if (isUniqueViolation(error)) {
        return false;
      }
      throw error;
    }
  }

  async reset(): Promise<void> {
    await db.delete(processedIndexerEvents);
  }
}

export class InMemoryProcessedIndexerEventStore implements ProcessedIndexerEventStore {
  private readonly eventIds = new Set<string>();

  async record(eventId: string): Promise<boolean> {
    if (this.eventIds.has(eventId)) {
      return false;
    }
    this.eventIds.add(eventId);
    return true;
  }

  async reset(): Promise<void> {
    this.eventIds.clear();
  }
}
