/**
 * A custom error class that is used to surface a `process.exit` event to a higher
 * level where it can be tracked through telemetry asynchronously, before exiting.
 */
export class ExitError extends Error {
  constructor(public cause: string | Error, public code: number) {
    super(cause instanceof Error ? cause.message : cause);
  }
}
