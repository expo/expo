/**
 * @jest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';

import { useNativeState } from '../State';

describe('useNativeState', () => {
  it('reads and writes through get() and set() in sync with value', () => {
    const { result } = renderHook(() => useNativeState(0));
    const { get, set } = result.current;
    expect(get()).toBe(0);

    act(() => set(1));
    expect(result.current.value).toBe(1);

    act(() => {
      result.current.value = 2;
    });
    expect(get()).toBe(2);
  });

  it('re-renders the component that created the state on set()', () => {
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      return useNativeState(0);
    });
    const rendersBeforeSet = renders;

    act(() => result.current.set(1));

    expect(renders).toBeGreaterThan(rendersBeforeSet);
  });
});
