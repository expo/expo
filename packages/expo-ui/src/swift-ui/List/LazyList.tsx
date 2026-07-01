import { requireNativeView } from 'expo';
import { useRef, useState, type ComponentType, type ReactElement, type ReactNode } from 'react';

import { Slot } from '../SlotView';

type VisibilityEvent = { nativeEvent: { index: number } };

type NativeLazyListProps = {
  count: number;
  estimatedItemSize?: number;
  onItemAppear?: (event: VisibilityEvent) => void;
  onItemDisappear?: (event: VisibilityEvent) => void;
  children?: ReactNode;
};

const LazyListNativeView: ComponentType<NativeLazyListProps> =
  requireNativeView<NativeLazyListProps>('ExpoUI', 'LazyListView');

export interface LazyListProps {
  /**
   * The total number of items in the list.
   */
  count: number;
  /**
   * Approximate height, in points, of an item before it is mounted. It sizes the placeholder for
   * rows that have not been mounted yet so the native list can lay out and virtualize correctly.
   * Keep it close to the real item height to minimize scroll position adjustments as items mount.
   * @default 44
   */
  estimatedItemSize?: number;
  /**
   * Number of extra items to keep mounted on each side of the visible range. Because items mount
   * through a round trip to the JS thread, mounting a few rows ahead of the scroll hides the blank
   * flash that would otherwise appear during a fast scroll. Larger values keep more items mounted.
   * @default 5
   */
  overscan?: number;
  /**
   * Renders the item at the given index. Called only for items within the mounted window, not for
   * every item up front.
   */
  renderItem: (index: number) => ReactElement;
}

/**
 * An experimental `List` that mounts its items lazily as they scroll into view instead of mounting
 * all `count` items up front. It is backed by a native SwiftUI `List`: each row reports when it
 * appears and disappears, and only items within the visible range (padded by `overscan`) are
 * rendered on the JS side.
 *
 * Very fast flings may still briefly show blank rows while items mount, similar to `FlashList`,
 * because mounting an item requires a round trip to the JS thread.
 */
export function LazyList({
  count,
  estimatedItemSize = 44,
  overscan = 5,
  renderItem,
}: LazyListProps) {
  // Native reports which rows are on screen; we own the mount policy. We mount the visible range
  // padded by `overscan` on each side, so a row is already mounted before it scrolls into view.
  const visible = useRef<Set<number>>(new Set());
  const bounds = useRef({ first: 0, last: -1 });
  const [range, setRange] = useState({ start: 0, end: -1 });

  const updateWindow = () => {
    if (visible.current.size === 0) {
      return;
    }
    let first = Infinity;
    let last = -Infinity;
    visible.current.forEach((index) => {
      first = Math.min(first, index);
      last = Math.max(last, index);
    });

    // `onItemAppear` fires only once a row is already at the edge of the screen, so there is no lead
    // time to mount ahead of a fling. Bias the buffer toward the scroll direction: infer direction
    // from how the visible range moved, then pad more on the leading side and less on the trailing.
    const direction =
      last !== bounds.current.last
        ? Math.sign(last - bounds.current.last)
        : Math.sign(first - bounds.current.first);
    bounds.current = { first, last };
    const lead = overscan * 3;
    const start = Math.max(0, first - (direction < 0 ? lead : overscan));
    const end = Math.min(count - 1, last + (direction > 0 ? lead : overscan));

    // Bail out of the render when the window is unchanged (scrolling within the padded band).
    setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  };

  console.log('LazyList render', { count, range });

  return (
    <LazyListNativeView
      count={count}
      estimatedItemSize={estimatedItemSize}
      onItemAppear={({ nativeEvent: { index } }) => {
        visible.current.add(index);
        updateWindow();
      }}
      onItemDisappear={({ nativeEvent: { index } }) => {
        visible.current.delete(index);
        updateWindow();
      }}>
      {range.end >= range.start &&
        Array.from(
          { length: range.end - range.start + 1 },
          (_, offset) => range.start + offset
        ).map((index) => (
          <Slot key={index} name={String(index)}>
            {renderItem(index)}
          </Slot>
        ))}
    </LazyListNativeView>
  );
}
