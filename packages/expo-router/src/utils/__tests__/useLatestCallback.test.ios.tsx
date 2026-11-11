import { renderHook } from '@testing-library/react-native';

import useLatestCallback from '../useLatestCallback';

describe('useLatestCallback', () => {
  it('returns a stable reference across re-renders', async () => {
    const cb1 = jest.fn(() => {});
    const cb2 = jest.fn(() => {});

    const { result, rerender } = await renderHook(
      ({ fn }: { fn: () => void }) => useLatestCallback(fn),
      {
        initialProps: { fn: cb1 },
      }
    );

    const firstRef = result.current;

    await rerender({ fn: cb2 });

    expect(result.current).toBe(firstRef);
  });

  it('calls the latest callback', async () => {
    const cb1 = jest.fn(() => 'first');
    const cb2 = jest.fn(() => 'second');

    const { result, rerender } = await renderHook(
      ({ fn }: { fn: () => string }) => useLatestCallback(fn),
      {
        initialProps: { fn: cb1 },
      }
    );

    await rerender({ fn: cb2 });

    const returnValue = result.current();

    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).toHaveBeenCalledTimes(1);
    expect(returnValue).toBe('second');
  });

  it('forwards arguments to the callback', async () => {
    const cb = jest.fn((a: number, b: string) => `${a}-${b}`);

    const { result } = await renderHook(() => useLatestCallback(cb));

    const returnValue = result.current(42, 'hello');

    expect(cb).toHaveBeenCalledWith(42, 'hello');
    expect(returnValue).toBe('42-hello');
  });

  it('preserves `this` context', async () => {
    const cb = jest.fn(function (this: { value: number }) {
      return this.value;
    });

    const { result } = await renderHook(() => useLatestCallback(cb));

    const context = { value: 99 };
    const returnValue = result.current.call(context);

    expect(returnValue).toBe(99);
  });

  it('calls the initial callback before any re-render', async () => {
    const cb = jest.fn(() => 'initial');

    const { result } = await renderHook(() => useLatestCallback(cb));

    expect(result.current()).toBe('initial');
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
