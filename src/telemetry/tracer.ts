/**
 * OpenTelemetry configuration and initialization for distributed tracing.
 * 
 * This module sets up:
 * - Node SDK with trace exporter
 * - Automatic instrumentation for Express, HTTP, PostgreSQL, and Redis
 * - Resource metadata (service name, version, environment)
 */

import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { PgInstrumentation } from "@opentelemetry/instrumentation-pg";
import { RedisInstrumentation } from "@opentelemetry/instrumentation-redis-4";

let sdkInitialized = false;

/**
 * Initialize OpenTelemetry tracing with OTLP HTTP exporter.
 * 
 * This should be called at the very start of the application, before any
 * other modules are imported. Typically called from the entry point.
 * 
 * In test environments, this is a no-op unless OTEL_ENABLED=true.
 */
export function initializeTracing(): void {
  // Skip initialization in test environment unless explicitly enabled
  if (process.env.NODE_ENV === "test" && process.env.OTEL_ENABLED !== "true") {
    return;
  }

  // Prevent double-initialization
  if (sdkInitialized) {
    return;
  }

  try {
    const serviceName = process.env.OTEL_SERVICE_NAME || "streampay-backend";
    const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318";
    const environment = process.env.NODE_ENV || "development";

    // Dynamically require Resource to handle module resolution issues
    const ResourceModule = require("@opentelemetry/resources");
    const Resource = ResourceModule.Resource;

    const resource = Resource.default().merge(
      new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.SERVICE_VERSION || "0.1.0",
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
      }),
    );

    const sdk = new NodeSDK({
      resource,
      traceExporter: new OTLPTraceExporter({
        url: `${otlpEndpoint}/v1/traces`,
      }),
      instrumentations: [
        // Core HTTP instrumentation
        new HttpInstrumentation({
          // Skip health check endpoints to reduce trace volume
          requestHook: (span, request) => {
            const url = "url" in request && typeof request.url === "string" ? request.url : "";
            if (url.includes("/health")) {
              span.end();
            }
          },
        }),
        // Express-specific instrumentation
        new ExpressInstrumentation(),
        // Database instrumentation
        new PgInstrumentation({
          // Capture full query text
        }),
        // Redis cache instrumentation
        new RedisInstrumentation({
          // Capture redis command names and arguments
        }),
      ],
    });

    sdk.start();
    sdkInitialized = true;

    console.log(`OpenTelemetry tracing initialized (service: ${serviceName}, exporter: ${otlpEndpoint})`);

    // Graceful shutdown
    process.on("SIGTERM", () => {
      sdk.shutdown()
        .then(() => console.log("OpenTelemetry SDK shut down successfully"))
        .catch((error) => console.error("Error shutting down OpenTelemetry SDK:", error));
    });
  } catch (error) {
    console.error("Failed to initialize OpenTelemetry tracing:", error);
    // Don't throw - allow the application to continue even if tracing fails to initialize
  }
}

/**
 * Get the global tracer instance for creating custom spans.
 * Use this to instrument custom operations beyond automatic instrumentation.
 */
export function getTracer(moduleName: string) {
  // This will be called after initializeTracing(), so the SDK is active
  const { trace } = require("@opentelemetry/api");
  return trace.getTracer(moduleName);
}
