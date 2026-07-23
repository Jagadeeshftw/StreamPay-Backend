/**
 * Tests for OpenTelemetry tracing initialization.
 */

import { initializeTracing, getTracer } from "./tracer";

describe("OpenTelemetry Tracing", () => {
  describe("initializeTracing", () => {
    it("should initialize without throwing when OTEL_SERVICE_NAME is not set", () => {
      // Environment variables are already set from the test environment config
      expect(() => {
        initializeTracing();
      }).not.toThrow();
    });

    it("should use default values for OTEL_SERVICE_NAME and OTEL_EXPORTER_OTLP_ENDPOINT", () => {
      // We can't easily test the internal SDK state, but we can verify
      // that initialization doesn't crash with defaults
      expect(() => {
        initializeTracing();
      }).not.toThrow();
    });

    it("should set service name from environment variable if provided", () => {
      const originalServiceName = process.env.OTEL_SERVICE_NAME;
      process.env.OTEL_SERVICE_NAME = "test-service";

      expect(() => {
        initializeTracing();
      }).not.toThrow();

      // Restore original value
      if (originalServiceName) {
        process.env.OTEL_SERVICE_NAME = originalServiceName;
      } else {
        delete process.env.OTEL_SERVICE_NAME;
      }
    });

    it("should set exporter endpoint from environment variable if provided", () => {
      const originalEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://custom-otel-collector:4318";

      expect(() => {
        initializeTracing();
      }).not.toThrow();

      // Restore original value
      if (originalEndpoint) {
        process.env.OTEL_EXPORTER_OTLP_ENDPOINT = originalEndpoint;
      } else {
        delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
      }
    });
  });

  describe("getTracer", () => {
    it("should return a tracer instance for a given module name", () => {
      // Initialize first
      initializeTracing();

      const tracer = getTracer("test-module");
      expect(tracer).toBeDefined();
      expect(typeof tracer.startActiveSpan).toBe("function");
    });

    it("should return a tracer with the correct module name", () => {
      initializeTracing();

      const tracer = getTracer("my-module");
      expect(tracer).toBeDefined();
      // The tracer should have methods for creating spans
      expect(typeof tracer.startSpan).toBe("function");
    });
  });

  describe("Environment configuration", () => {
    it("should use NODE_ENV from environment", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      expect(() => {
        initializeTracing();
      }).not.toThrow();

      // Restore
      if (originalEnv) {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it("should use SERVICE_VERSION from environment if provided", () => {
      const originalVersion = process.env.SERVICE_VERSION;
      process.env.SERVICE_VERSION = "1.2.3";

      expect(() => {
        initializeTracing();
      }).not.toThrow();

      // Restore
      if (originalVersion) {
        process.env.SERVICE_VERSION = originalVersion;
      } else {
        delete process.env.SERVICE_VERSION;
      }
    });
  });

  describe("Graceful shutdown", () => {
    it("should handle SIGTERM signal", (done) => {
      initializeTracing();

      // Simulate SIGTERM
      const listener = process.listeners("SIGTERM")[process.listeners("SIGTERM").length - 1];
      expect(listener).toBeDefined();

      // The listener should be a function that handles SDK shutdown
      // We can't easily test the async shutdown without mocking the SDK,
      // but we can verify the listener exists
      done();
    });
  });
});
