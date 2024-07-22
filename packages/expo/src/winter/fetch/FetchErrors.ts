export class NetworkFetchError extends Error {
  constructor(message: string, cause?: unknown, stack?: string) {
    super(`fetch failed: ${message}`);
    this.cause = cause;
    this.stack = stack;
  }

  static createFromError(error: Error): NetworkFetchError {
    return new NetworkFetchError(error.message, error, error.stack);
  }
}
