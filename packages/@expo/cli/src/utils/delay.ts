import { CommandError } from './errors';

/** Await for a given duration of milliseconds. */
export function delayAsync(timeout: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

/** Wait for a given action to return a truthy value. */
export async function waitForActionAsync<T>({
  action,
  interval = 100,
  maxWaitTime = 20000,
}: {
  action: () => T | Promise<T>;
  interval?: number;
  maxWaitTime?: number;
}): Promise<T> {
  let complete: T;
  const start = Date.now();
  do {
    const actionStartTime = Date.now();
    complete = await action();

    const actionTimeElapsed = Date.now() - actionStartTime;
    const remainingDelayInterval = interval - actionTimeElapsed;
    if (remainingDelayInterval > 0) {
      await delayAsync(remainingDelayInterval);
    }
    if (Date.now() - start > maxWaitTime) {
      break;
    }
  } while (!complete);

  return complete;
}

/** Resolves a given function or rejects if the provided timeout is passed. */
export function resolveWithTimeout<T>(
  action: () => Promise<T>,
  {
    timeout,
    errorMessage,
  }: {
    /** Duration in milliseconds to wait before asserting a timeout. */
    timeout: number;
    /** Optional error message to use in the assertion. */
    errorMessage?: string;
  }
): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new CommandError('TIMEOUT', errorMessage));
    }, timeout);
    action().then(resolve, reject);
  });
}
