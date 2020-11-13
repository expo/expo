const INITIAL_DELAY = 500; // 500 ms
const MAXIMUM_DELAY = 2 * 60 * 1000; // 2 minutes
const EXPONENTIAL_FACTOR = 2;

/**
 * Function generator allowing iterating
 * over an asynchronous function being retried
 * at will. It implements simple exponential backoff
 * algorithm for calculating consecutive delays.
 *
 * It is used in `updatePushTokenAsync` to generate retries
 * of network request updating the push token on server.
 * If we were to use a regular asynchronous we wouldn't
 * be able to interrupt the execution between retries
 * (we would only be able to await the whole retry call).
 *
 * @param func The function to generate the retries of.
 * Receives a function as a single argument which it is expected
 * to call if it would like to be retried.
 * @param options Backoff customization options
 */
export default async function* generateRetries<T>(
  func: (retry: () => void) => Promise<T>,
  options?: {
    initialDelay?: number;
    maximumDelay?: number;
    exponentialFactor?: number;
  }
): AsyncGenerator<T | undefined, T | undefined, T | undefined> {
  const initialDelay = options?.initialDelay ?? INITIAL_DELAY;
  const maximumDelay = options?.maximumDelay ?? MAXIMUM_DELAY;
  const exponentialFactor = options?.exponentialFactor ?? EXPONENTIAL_FACTOR;

  let delay = initialDelay;
  let shouldTry = true;
  function retry() {
    shouldTry = true;
  }
  while (shouldTry) {
    // If func doesn't call retry we won't retry.
    shouldTry = false;
    const result = yield await func(retry);
    if (shouldTry) {
      yield await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(maximumDelay, delay * exponentialFactor);
    } else {
      return result;
    }
  }
  // Unreachable code, appease TypeScript
  return;
}
