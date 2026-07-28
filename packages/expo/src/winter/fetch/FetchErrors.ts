import { DOMException } from '../DOMException';

export class FetchError extends Error {
  constructor(message: string, { cause, stack }: { cause?: unknown; stack?: string } = {}) {
    super(`fetch failed: ${message}`);
    this.name = 'FetchError';
    this.cause = cause;
    this.stack = stack;
  }

  static createFromError(error: Error): FetchError {
    return new FetchError(error.message, { cause: error.cause, stack: error.stack });
  }
}

/**
 * Returns the value an aborted request rejects with. The spec rejects with the signal's own
 * reason, so `AbortSignal.timeout()` surfaces as a `TimeoutError` rather than an `AbortError`.
 * React Native's `AbortController` polyfill has no `reason`, hence the fallback.
 */
export function createAbortError(signal?: AbortSignal | null): unknown {
  const reason = signal != null && 'reason' in signal ? signal.reason : undefined;
  return reason ?? new DOMException('The operation was aborted.', 'AbortError');
}
