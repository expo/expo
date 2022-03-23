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
    const fn = jest.fn(() => '');
    const result = await waitForActionAsync({
      action: fn,
      interval: 80,
      maxWaitTime: 100,
    });
    expect(result).toEqual('');
    expect(fn).toHaveBeenCalledTimes(2);
  }, 500);
});

describe(resolveWithTimeout, () => {
  it(`times out`, async () => {
    jest.useFakeTimers();
    // Create a function that never resolves.
    const fn = jest.fn(() => new Promise(() => {}));

    const promise = resolveWithTimeout(fn, { timeout: 50, errorMessage: 'Timeout' });
    jest.advanceTimersByTime(50);
    await expect(promise).rejects.toThrowError('Timeout');

    // Ensure the function was called.
    expect(fn).toBeCalled();
  });
  it(`resolves in time`, async () => {
    jest.useFakeTimers();
    // Create a function that never resolves.
    const fn = jest.fn(async () => 'foobar');

    const promise = resolveWithTimeout(fn, { timeout: 50 });
    jest.advanceTimersByTime(49);
    await expect(promise).resolves.toEqual('foobar');
    // Ensure the function was called.
    expect(fn).toBeCalled();
  });
});
