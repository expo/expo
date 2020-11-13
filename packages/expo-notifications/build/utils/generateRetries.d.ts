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
export default function generateRetries<T>(func: (retry: () => void) => Promise<T>, options?: {
    initialDelay?: number;
    maximumDelay?: number;
    exponentialFactor?: number;
}): AsyncGenerator<T | undefined, T | undefined, T | undefined>;
