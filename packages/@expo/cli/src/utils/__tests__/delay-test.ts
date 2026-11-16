import { delayAsync, resolveWithTimeout, waitForActionAsync } from '../delay';

afterEach(() => {
  jest.useRealTimers();
});

describe(delayAsync, () => {
  it(`await for a given duration of milliseconds`, async () => {
    jest.useFakeTimers();
    const promise = delayAsync(100);
    jest.advanceTimersByTime(100);
    await promise;
  });
});

describe(waitForActionAsync, () => {
  it(`wait for a given action to return a truthy value`, async () => {
    const fn = jest.fn(() => 'd');
    const result = await waitForActionAsync({
      action: fn,
      interval: 100,
      maxWaitTime: 1000,
    });
    expect(result).toEqual('d');
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it(`times out waiting for a given action to return a truthy value`, async () => {
    // Fake timers keep the number of polls deterministic. On real timers the
    // action runs twice only while two 80ms intervals still fit in the 100ms
    // max wait time. A busy machine can delay the first interval past 100ms,
    // and then the action runs once.
    jest.useFakeTimers();
    const fn = jest.fn(() => '');

    const promise = waitForActionAsync({
      action: fn,
      interval: 80,
      maxWaitTime: 100,
    });
    // First interval: 80ms elapsed, still inside the max wait time.
    await jest.advanceTimersByTimeAsync(80);
    // Second interval: 160ms elapsed, so the loop stops.
    await jest.advanceTimersByTimeAsync(80);

    await expect(promise).resolves.toEqual('');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe(resolveWithTimeout, () => {
  it(`times out`, async () => {
    jest.useFakeTimers();
    // Create a function that never resolves.
    const fn = jest.fn(() => new Promise(() => {}));

    const promise = resolveWithTimeout(fn, { timeout: 50, errorMessage: 'Timeout' });
    jest.advanceTimersByTime(50);
    await expect(promise).rejects.toThrow('Timeout');

    // Ensure the function was called.
    expect(fn).toHaveBeenCalled();
  });
  it(`resolves in time`, async () => {
    jest.useFakeTimers();
    // Create a function that never resolves.
    const fn = jest.fn(async () => 'foobar');

    const promise = resolveWithTimeout(fn, { timeout: 50 });
    jest.advanceTimersByTime(49);
    await expect(promise).resolves.toEqual('foobar');
    // Ensure the function was called.
    expect(fn).toHaveBeenCalled();
  });
});
