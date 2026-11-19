/**
 * @jest-environment jsdom
 */

import { act, render, renderHook } from '@testing-library/react';
import { createElement, useMemo } from 'react';

import { type ObservableState, useNativeState } from '../State';

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

  it('re-renders a memoized element that reads the state on set()', () => {
    const Reader = ({ state }: { state: ObservableState<string> }) => state.value;
    let state: ObservableState<string> | undefined;
    const Creator = () => {
      const text = useNativeState('before');
      state = text;
      // The React Compiler memoizes the element on its props in the same way.
      return useMemo(() => createElement(Reader, { state: text }), [text]);
    };
    const { container } = render(createElement(Creator));

    act(() => state!.set('after'));

    expect(container.textContent).toBe('after');
  });
});
