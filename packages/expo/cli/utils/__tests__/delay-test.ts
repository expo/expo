import { delayAsync, waitForActionAsync } from '../delay';

describe(delayAsync, () => {
  it(`await for a given duration of milliseconds`, async () => {
    const start = Date.now();
    await delayAsync(100);
    expect(Date.now() - start).toBeGreaterThanOrEqual(99);
  }, 1000);
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
