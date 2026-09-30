import { emit, unstable_navigationEvents } from '..';

const page = { pathname: '/', params: {}, segments: [], screenId: 'home' };

describe('navigation event delivery', () => {
  let warn: jest.SpyInstance;
  const cleanups: (() => void)[] = [];

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
    warn.mockRestore();
  });

  it('warns when an async listener rejects', async () => {
    const error = new Error('async failure');
    const rejected = Promise.reject(error);
    rejected.catch(() => {}); // Keep the base behavior measurable without an unhandled rejection.
    cleanups.push(unstable_navigationEvents.addListener('pageFocused', async () => rejected));
    emit('pageFocused', page);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('pageFocused'), error);
  });

  it('warns for a rejecting thenable without catch', () => {
    const error = new Error('thenable failure');
    const thenable = {
      then: (_onFulfilled: unknown, onRejected: (reason: unknown) => void) => onRejected(error),
    };
    cleanups.push(unstable_navigationEvents.addListener('pageFocused', () => thenable));
    emit('pageFocused', page);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('pageFocused'), error);
  });

  it('calls the next synchronous listener in registration order', () => {
    const order: number[] = [];
    cleanups.push(unstable_navigationEvents.addListener('pageFocused', () => order.push(1)));
    cleanups.push(unstable_navigationEvents.addListener('pageFocused', () => order.push(2)));
    emit('pageFocused', page);
    expect(order).toEqual([1, 2]);
  });
});
