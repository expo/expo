export class NetworkFetchError extends Error {
  constructor(message: string, { cause, stack }: { cause?: unknown; stack?: string } = {}) {
    super(`fetch failed: ${message}`);
    this.cause = cause;
    this.stack = stack;
  }

  static createFromError(error: Error): NetworkFetchError {
    return new NetworkFetchError(error.message, { cause: error.cause, stack: error.stack });
  }
}
