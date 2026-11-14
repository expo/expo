/**
 * The error `fetch()` rejects with when a request fails.
 *
 * Extends `TypeError` because that is what the Fetch Standard requires for a network error, and
 * what browsers, undici and the React Native `fetch` this replaces all produce. Retry and
 * error-classification libraries branch on `instanceof TypeError`, so a plain `Error` reads to
 * them as a non-retryable application error.
 */
export class FetchError extends TypeError {
  constructor(message: string, { cause, stack }: { cause?: unknown; stack?: string } = {}) {
    super(`fetch failed: ${message}`);
    this.cause = cause;
    this.stack = stack;
  }

  static createFromError(error: Error): FetchError {
    // Keep the rejection itself as the cause, the way undici does. The native error is the only
    // carrier of the `code` that tells a cancel (`ERR_FETCH_REQUEST_CANCELED`) from a transport
    // failure, and its own `cause` is undefined on every path that reaches here.
    return new FetchError(error.message, { cause: error, stack: error.stack });
  }
}
