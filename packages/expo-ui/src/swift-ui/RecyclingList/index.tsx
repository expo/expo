import { requireNativeView } from 'expo';
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

/**
 * A data-driven list that recycles its row views.
 *
 * `LazyVStack` is lazy on SwiftUI's side only: it defers evaluating the bodies
 * of children React has already built. Every row still becomes a native view
 * before SwiftUI sees it, so a long list pays for all of them up front.
 *
 * Windowing that in JS helps, but it cannot recycle. In a linear stack the
 * child order has to match the visual order, so advancing the window by one row
 * reassigns every slot to a different item and all of them push new props.
 * Recycling needs `slot = index % windowSize`, which produces a child order
 * that deliberately does not match the visual order — and that only works if
 * the native side positions each child by its own index instead of by its
 * position among its siblings.
 *
 * That is what this view does. JS owns which item each slot shows; native owns
 * where each slot sits. Advancing the window by one row then changes exactly
 * one slot, and therefore re-renders exactly one row.
 */
export interface RecyclingListProps extends CommonViewModifierProps {
  /** Total number of items, including the ones not currently rendered. */
  itemCount: number;
  /** Fixed row pitch in points, including any separator or gap. */
  itemSize: number;
  /** The data index represented by each child, in child order. */
  slotIndices: number[];
  /** Scroll to this row index. Resolved to an offset natively. */
  scrollToIndex?: number;
  /** Seconds. Zero scrolls immediately. */
  scrollAnimationDuration?: number;
  /** Timing curve for programmatic scrolling. Defaults to linear. */
  scrollAnimationCurve?: 'linear' | 'easeOut';
  /** Called when the first visible index changes. */
  onFirstVisibleIndexChange?: (index: number) => void;
  /** One child for each slotIndices entry, in the same order. */
  children: React.ReactNode;
}

type NativeProps = Omit<RecyclingListProps, 'onFirstVisibleIndexChange'> & {
  onFirstVisibleIndexChange?: (event: { nativeEvent: { index: number } }) => void;
};

const RecyclingListNativeView: React.ComponentType<NativeProps> = requireNativeView(
  'ExpoUI',
  'RecyclingListView'
);

/** The unique index in `[first, first + windowSize)` congruent to `slot`. */
export function indexForSlot(slot: number, first: number, windowSize: number): number {
  const firstSlot = ((first % windowSize) + windowSize) % windowSize;
  return first + ((((slot - firstSlot) % windowSize) + windowSize) % windowSize);
}

function nonnegativeInteger(value: number, name: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a nonnegative safe integer`);
  }
}

/**
 * Keeps a fixed pool of slots around the first visible row.
 * Allocate enough slots for the viewport plus buffers in both directions.
 * `overscanRows` reserves part of that pool before the visible row; it does not
 * increase the number of mounted children. It must be smaller than `windowSize`.
 */
export function useRecyclingWindow(itemCount: number, windowSize: number, overscanRows = 0) {
  nonnegativeInteger(itemCount, 'itemCount');
  nonnegativeInteger(windowSize, 'windowSize');
  nonnegativeInteger(overscanRows, 'overscanRows');
  if (windowSize === 0 || overscanRows >= windowSize) {
    throw new RangeError('windowSize must be positive and greater than overscanRows');
  }
  const [visibleIndex, setVisibleIndex] = useState(0);
  const visible = Math.min(visibleIndex, Math.max(0, itemCount - 1));
  // Correct retained state before committing children after a dataset shrink.
  // Waiting for a native geometry event can expose out-of-bounds rows first.
  if (visible !== visibleIndex) {
    setVisibleIndex(visible);
  }
  const first = Math.max(0, Math.min(visible - overscanRows, Math.max(0, itemCount - windowSize)));
  const onFirstVisibleIndexChange = useCallback((index: number) => {
    if (Number.isFinite(index)) {
      setVisibleIndex(Math.max(0, Math.floor(index)));
    }
  }, []);
  const slots = useMemo(() => {
    const count = Math.min(windowSize, itemCount);
    return Array.from({ length: count }, (_, slot) => indexForSlot(slot, first, count));
  }, [first, windowSize, itemCount]);

  return { first, slots, onFirstVisibleIndexChange };
}

/**
 * A fixed-height recycling list for iOS and tvOS 18 or later.
 *
 * Children are keyed by pool slot, not item ID. Reset item-specific local state
 * when a slot receives a different item. The pool must cover the viewport and
 * enough overscan for JS updates to complete during a fling.
 *
 * @example
 * const { slots, onFirstVisibleIndexChange } = useRecyclingWindow(items.length, 40, 10);
 * return (
 *   <RecyclingList itemCount={items.length} itemSize={60} slotIndices={slots}
 *     onFirstVisibleIndexChange={onFirstVisibleIndexChange}>
 *     {slots.map((index, slot) => <Row key={slot} item={items[index]} />)}
 *   </RecyclingList>
 * );
 */

export function RecyclingList(props: RecyclingListProps) {
  if (Platform.OS !== 'ios' || !(Number.parseInt(String(Platform.Version), 10) >= 18)) {
    throw new Error('RecyclingList requires iOS 18+ or tvOS 18+');
  }
  nonnegativeInteger(props.itemCount, 'itemCount');
  if (
    !Number.isFinite(props.itemSize) ||
    props.itemSize <= 0 ||
    !Number.isFinite(props.itemSize * props.itemCount)
  ) {
    throw new RangeError('itemSize must be positive and finite');
  }
  if (props.scrollToIndex !== undefined) nonnegativeInteger(props.scrollToIndex, 'scrollToIndex');
  if (
    props.scrollAnimationDuration !== undefined &&
    (!Number.isFinite(props.scrollAnimationDuration) || props.scrollAnimationDuration < 0)
  ) {
    throw new RangeError('scrollAnimationDuration must be nonnegative and finite');
  }
  if (
    props.scrollAnimationCurve !== undefined &&
    props.scrollAnimationCurve !== 'linear' &&
    props.scrollAnimationCurve !== 'easeOut'
  ) {
    throw new RangeError('scrollAnimationCurve must be linear or easeOut');
  }
  if (
    props.slotIndices.some(
      (index) => !Number.isSafeInteger(index) || index < 0 || index >= props.itemCount
    ) ||
    new Set(props.slotIndices).size !== props.slotIndices.length
  ) {
    throw new RangeError('slotIndices must contain unique indices within itemCount');
  }
  const { modifiers, children, onFirstVisibleIndexChange, ...restProps } = props;

  return (
    <RecyclingListNativeView
      {...restProps}
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      onFirstVisibleIndexChange={
        onFirstVisibleIndexChange
          ? ({ nativeEvent: { index } }) => onFirstVisibleIndexChange(index)
          : undefined
      }>
      {children}
    </RecyclingListNativeView>
  );
}
