export class FetchError extends Error {
  constructor(message: string, { cause, stack }: { cause?: unknown; stack?: string } = {}) {
    super(`fetch failed: ${message}`);
    this.cause = cause;
    this.stack = stack;
  }

  static createFromError(error: Error): FetchError {
    return new FetchError(error.message, { cause: error.cause, stack: error.stack });
  }
}
