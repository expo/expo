import { delayAsync } from '../../../../utils/delay';

export class TimeoutError extends Error {}

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
    complete = await action();

    await delayAsync(interval);
    if (Date.now() - start > maxWaitTime) {
      break;
    }
  } while (!complete);

  return complete;
}
