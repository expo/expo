import { act, render, renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { RecyclingList, indexForSlot, useRecyclingWindow } from '..';
import { opacity } from '../../modifiers';

const mockNativeViewFn = jest.fn();

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({})),
  requireNativeView: jest.fn((moduleName, viewName) => {
    if (moduleName !== 'ExpoUI' || viewName !== 'RecyclingListView') {
      throw new Error(`Unexpected native view requested: ${moduleName} ${viewName}`);
    }
    const { View } = require('react-native');
    const { createElement } = require('react');
    return (props: any) => {
      mockNativeViewFn(props);
      return createElement(View, props);
    };
  }),
}));

beforeEach(() => {
  mockNativeViewFn.mockClear();
  jest.spyOn(Platform, 'Version', 'get').mockReturnValue('18.0');
});

afterEach(() => {
  jest.restoreAllMocks();
});

function nativeProps() {
  return mockNativeViewFn.mock.calls.at(-1)![0];
}

function expectWindow(
  value: ReturnType<typeof useRecyclingWindow>,
  itemCount: number,
  windowSize: number,
  first: number
) {
  const size = Math.min(itemCount, windowSize);
  expect(value.first).toBe(first);
  expect(value.slots).toHaveLength(size);
  expect(new Set(value.slots).size).toBe(size);
  expect([...value.slots].sort((a, b) => a - b)).toEqual(
    Array.from({ length: size }, (_, index) => first + index)
  );
  value.slots.forEach((index, slot) => {
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(itemCount);
    expect(index % size).toBe(slot);
  });
}

describe('indexForSlot', () => {
  it('keeps each slot congruent to its item index across ring boundaries', () => {
    for (const size of [1, 2, 7, 18]) {
      for (let first = 0; first < 100; first++) {
        const indices = Array.from({ length: size }, (_, slot) => indexForSlot(slot, first, size));
        expect([...indices].sort((a, b) => a - b)).toEqual(
          Array.from({ length: size }, (_, offset) => first + offset)
        );
        indices.forEach((index, slot) => expect(index % size).toBe(slot));
      }
    }
  });
});

describe('useRecyclingWindow', () => {
  it.each([0, 1, 3, 8])('handles %i items with an eight-slot pool', (itemCount) => {
    const { result } = renderHook(() => useRecyclingWindow(itemCount, 8));
    expectWindow(result.current, itemCount, 8, 0);
    act(() => result.current.onFirstVisibleIndexChange(100));
    expectWindow(result.current, itemCount, 8, 0);
  });

  it('covers forward and reverse motion, retaining a buffer behind the visible row', () => {
    const { result } = renderHook(() => useRecyclingWindow(100, 8, 2));
    const forward = Array.from({ length: 106 }, (_, index) => index - 3);
    for (const visible of [...forward, ...forward.reverse()]) {
      act(() => result.current.onFirstVisibleIndexChange(visible));
      expectWindow(result.current, 100, 8, Math.max(0, Math.min(visible - 2, 92)));
    }
  });

  it('reassigns exactly one slot for each one-row move in either direction', () => {
    const { result } = renderHook(() => useRecyclingWindow(100, 8));
    const forward = Array.from({ length: 80 }, (_, index) => index + 1);
    const reverse = Array.from({ length: 80 }, (_, index) => 79 - index);
    for (const visible of [...forward, ...reverse]) {
      const previous = result.current.slots;
      act(() => result.current.onFirstVisibleIndexChange(visible));
      expect(result.current.slots.filter((index, slot) => index !== previous[slot])).toHaveLength(
        1
      );
    }
  });

  it('recalculates when count, window size, or overscan changes without another scroll event', () => {
    const { result, rerender } = renderHook(
      ({ count, size, overscan }: { count: number; size: number; overscan: number }) =>
        useRecyclingWindow(count, size, overscan),
      { initialProps: { count: 100, size: 8, overscan: 2 } }
    );
    act(() => result.current.onFirstVisibleIndexChange(70));
    expectWindow(result.current, 100, 8, 68);

    rerender({ count: 100, size: 8, overscan: 4 });
    expectWindow(result.current, 100, 8, 66);
    rerender({ count: 100, size: 40, overscan: 4 });
    expectWindow(result.current, 100, 40, 60);
    rerender({ count: 10, size: 8, overscan: 2 });
    expectWindow(result.current, 10, 8, 2);
    rerender({ count: 3, size: 8, overscan: 2 });
    expectWindow(result.current, 3, 8, 0);
    rerender({ count: 0, size: 8, overscan: 2 });
    expectWindow(result.current, 0, 8, 0);
    rerender({ count: 100, size: 8, overscan: 2 });
    expectWindow(result.current, 100, 8, 0);
  });

  it('does not jump back to a removed visible row when the data grows again', () => {
    const { result, rerender } = renderHook(
      ({ count }: { count: number }) => useRecyclingWindow(count, 8, 2),
      {
        initialProps: { count: 100 },
      }
    );
    act(() => result.current.onFirstVisibleIndexChange(70));
    rerender({ count: 10 });
    expectWindow(result.current, 10, 8, 2);
    rerender({ count: 100 });
    expectWindow(result.current, 100, 8, 7);
  });

  it('reflects a newer visible index after count shrinks', () => {
    const { result, rerender } = renderHook(
      ({ count }: { count: number }) => useRecyclingWindow(count, 8, 2),
      {
        initialProps: { count: 100 },
      }
    );
    act(() => result.current.onFirstVisibleIndexChange(70));
    rerender({ count: 10 });
    act(() => result.current.onFirstVisibleIndexChange(1));
    rerender({ count: 100 });
    expectWindow(result.current, 100, 8, 0);
  });

  it.each([
    [-1, 8, 0],
    [1.5, 8, 0],
    [NaN, 8, 0],
    [Infinity, 8, 0],
    [Number.MAX_SAFE_INTEGER + 1, 8, 0],
    [10, 0, 0],
    [10, -1, 0],
    [10, 1.5, 0],
    [10, Infinity, 0],
    [10, NaN, 0],
    [10, Number.MAX_SAFE_INTEGER + 1, 0],
    [10, 8, -1],
    [10, 8, 1.5],
    [10, 8, 8],
    [10, 8, NaN],
    [10, 8, Infinity],
  ])('rejects invalid count/window/overscan (%s, %s, %s)', (count, size, overscan) => {
    expect(() => renderHook(() => useRecyclingWindow(count, size, overscan))).toThrow(RangeError);
  });
});

describe('RecyclingList', () => {
  it('forwards slot order, an initial scroll target, animation options, and modifiers', () => {
    const onFirstVisibleIndexChange = jest.fn();
    render(
      <RecyclingList
        itemCount={100}
        itemSize={64}
        slotIndices={[4, 5, 2, 3]}
        scrollToIndex={30}
        scrollAnimationDuration={0.5}
        scrollAnimationCurve="easeOut"
        modifiers={[opacity(0.5)]}
        onFirstVisibleIndexChange={onFirstVisibleIndexChange}>
        {null}
      </RecyclingList>
    );
    expect(nativeProps()).toMatchObject({
      itemCount: 100,
      itemSize: 64,
      slotIndices: [4, 5, 2, 3],
      scrollToIndex: 30,
      scrollAnimationDuration: 0.5,
      scrollAnimationCurve: 'easeOut',
      modifiers: [opacity(0.5)],
    });
    expect(nativeProps().onGlobalEvent).toBeInstanceOf(Function);
    act(() => nativeProps().onFirstVisibleIndexChange({ nativeEvent: { index: 12 } }));
    expect(onFirstVisibleIndexChange).toHaveBeenCalledWith(12);
    expect(onFirstVisibleIndexChange).toHaveBeenCalledTimes(1);
  });

  it('accepts an empty list and omits an unused event handler', () => {
    render(
      <RecyclingList itemCount={0} itemSize={1} slotIndices={[]}>
        {null}
      </RecyclingList>
    );
    expect(nativeProps().slotIndices).toEqual([]);
    expect(nativeProps().onFirstVisibleIndexChange).toBeUndefined();
    expect(nativeProps().onGlobalEvent).toBeUndefined();
  });

  it.each([
    { itemCount: -1 },
    { itemCount: 1.5 },
    { itemCount: Number.MAX_SAFE_INTEGER + 1 },
    { itemSize: 0 },
    { itemSize: -1 },
    { itemSize: Infinity },
    { itemSize: NaN },
    { scrollToIndex: -1 },
    { scrollToIndex: 0.5 },
    { scrollToIndex: Infinity },
    { scrollToIndex: Number.MAX_SAFE_INTEGER + 1 },
    { scrollAnimationDuration: -1 },
    { scrollAnimationDuration: Infinity },
    { scrollAnimationDuration: NaN },
    { slotIndices: [0, 0] },
    { slotIndices: [-1] },
    { slotIndices: [10] },
    { slotIndices: [0.5] },
    { slotIndices: [NaN] },
  ])('rejects invalid native props %j', (invalidProps) => {
    expect(() =>
      render(
        <RecyclingList itemCount={10} itemSize={64} slotIndices={[0]} {...invalidProps}>
          {null}
        </RecyclingList>
      )
    ).toThrow(RangeError);
  });

  it('rejects an unsupported animation curve', () => {
    expect(() =>
      render(
        <RecyclingList
          itemCount={10}
          itemSize={64}
          slotIndices={[0]}
          // @ts-expect-error Runtime callers can supply invalid strings.
          scrollAnimationCurve="spring">
          {null}
        </RecyclingList>
      )
    ).toThrow();
  });

  it('requires iOS 18 or newer', () => {
    jest.spyOn(Platform, 'Version', 'get').mockReturnValue('17.5');
    expect(() =>
      render(
        <RecyclingList itemCount={0} itemSize={64} slotIndices={[]}>
          {null}
        </RecyclingList>
      )
    ).toThrow(/iOS 18/);
  });

  it('rejects platforms other than iOS', () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    expect(() =>
      render(
        <RecyclingList itemCount={0} itemSize={64} slotIndices={[]}>
          {null}
        </RecyclingList>
      )
    ).toThrow(/iOS/);
  });
});
