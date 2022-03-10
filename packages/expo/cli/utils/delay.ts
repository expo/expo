import { CommandError } from './errors';

/** Await for a given duration of milliseconds. */
export function delayAsync(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  fn: () => Promise<T>,
  {
    timeout,
    errorMessage = 'Timeout',
  }: {
    timeout: number;
    errorMessage?: string;
  }
): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new CommandError('TIMEOUT', errorMessage));
    }, timeout);
    fn().then(resolve, reject);
  });
}
