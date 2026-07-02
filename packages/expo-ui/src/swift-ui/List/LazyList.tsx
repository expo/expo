import { requireNativeView } from 'expo';
import {
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Dimensions } from 'react-native';

import { Slot } from '../SlotView';

type KeyEvent = { nativeEvent: { key: string } };
type RangeEvent = { nativeEvent: { first: number; last: number; velocity: number } };

type NativeLazyListProps = {
  itemKeys: string[];
  estimatedItemSize?: number;
  onVisibleRangeChange?: (event: RangeEvent) => void;
  onSelectItem?: (event: KeyEvent) => void;
  onDeleteItems?: (event: { nativeEvent: { indices: number[] } }) => void;
  children?: ReactNode;
};

const LazyListNativeView: ComponentType<NativeLazyListProps> =
  requireNativeView<NativeLazyListProps>('ExpoUI', 'LazyListView');

// Native realize → JS render → commit → Fabric mount round trip the directional lead has to cover,
// in seconds. Overshooting just mounts a few extra rows, so err on the generous side.
const LEAD_LATENCY_SECONDS = 0.15;
// Upper bound for the velocity lead so a violent fling can't queue unbounded render work.
const MAX_LEAD_ROWS = 24;
// Below this speed (rows/second) the scroll direction is ambiguous; keep the window symmetric.
const DIRECTIONAL_MIN_ROWS_PER_SECOND = 2;
// Above this speed mounting cannot keep up with the scroll (the status-bar scroll-to-top animation
// traverses the whole list in ~half a second — ~10× a hard fling). Chasing the window would mount
// hundreds of rows only to discard them frames later, dropping frames and backing the JS thread up
// past the arrival. Sit the sweep out on skeletons; the window snaps once the scroll slows.
const MAX_CHASE_ROWS_PER_SECOND = 250;

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
   * Base number of extra items to keep mounted on each side of the realized range. During a fast
   * scroll the window is extended further in the scroll direction, scaled by velocity, so rows are
   * mounted before they reach the viewport.
   * @default 4
   */
  overscan?: number;
  /**
   * Returns a stable, unique key for the item at `index` — the identity the native list uses to
   * track each row. Provide keys tied to your data (not the position) so inserts, deletes, and
   * reorders animate the correct row instead of reshuffling content. Defaults to the index.
   */
  keyExtractor?: (index: number) => string;
  /**
   * Called when a row is tapped, with its index.
   */
  onSelect?: (index: number) => void;
  /**
   * Called when rows are deleted via swipe-to-delete, with the deleted indices. Update your data so
   * `count` reflects the removal.
   */
  onDelete?: (indices: number[]) => void;
  /**
   * Renders the item at the given index. Called only for items within the mounted window, not for
   * every item up front.
   */
  renderItem: (index: number) => ReactElement;
}

/**
 * An experimental `List` that mounts its items lazily as they scroll into view instead of mounting
 * all `count` items up front. It is backed by a native SwiftUI `List`: the native side batches row
 * realization and scroll velocity into one event per frame, and only the items within the reported
 * range (padded by `overscan` plus a velocity-scaled lead in the scroll direction) are rendered on
 * the JS side. Rows are identified by `keyExtractor` so edits animate the correct row.
 */
export function LazyList({
  count,
  estimatedItemSize = 44,
  overscan = 4,
  keyExtractor,
  onSelect,
  onDelete,
  renderItem,
}: LazyListProps) {
  const keyOf = keyExtractor ?? ((index: number) => String(index));

  // Stable per-item keys for the whole list — the identity the native ForEach uses, so deletes and
  // moves animate the correct row. Recomputed only when the count or extractor changes.
  const itemKeys = useMemo(() => Array.from({ length: count }, (_, i) => keyOf(i)), [count, keyOf]);
  const indexByKey = useMemo(() => {
    const map = new Map<string, number>();
    itemKeys.forEach((key, index) => map.set(key, index));
    return map;
  }, [itemKeys]);

  const [range, setRange] = useState({ start: 0, end: -1 });

  // Cache the rendered element per index so a window move only renders the newly-added rows (React
  // bails on the reused element refs). Cleared when `renderItem` changes, keeping content in sync.
  const elements = useRef<Map<number, ReactElement>>(new Map());
  const renderItemRef = useRef(renderItem);
  if (renderItemRef.current !== renderItem) {
    renderItemRef.current = renderItem;
    elements.current.clear();
  }

  const onVisibleRangeChange = ({ nativeEvent: { first, last, velocity } }: RangeEvent) => {
    // Velocity is points/second, positive toward the end of the list. Convert to rows and extend
    // the window in the scroll direction by the rows the scroll will cover during the mount latency.
    const rowsPerSecond = velocity / estimatedItemSize;
    if (Math.abs(rowsPerSecond) > MAX_CHASE_ROWS_PER_SECOND) {
      // Only the status-bar scroll-to-top animation moves this fast toward the start — no human
      // fling reaches this speed — so the destination is known to be row 0. Mount the first
      // viewport of rows during the animation so arrival lands on real content instead of
      // skeletons waiting out a mount round trip.
      if (rowsPerSecond < 0) {
        const viewportRows = Math.ceil(Dimensions.get('window').height / estimatedItemSize);
        const end = Math.min(count - 1, viewportRows + overscan);
        setRange((prev) => (prev.start === 0 && prev.end === end ? prev : { start: 0, end }));
      }
      return;
    }
    const lead = Math.min(MAX_LEAD_ROWS, Math.abs(rowsPerSecond) * LEAD_LATENCY_SECONDS);
    let behind = overscan;
    let ahead = overscan;
    if (rowsPerSecond > DIRECTIONAL_MIN_ROWS_PER_SECOND) {
      ahead += lead;
    } else if (rowsPerSecond < -DIRECTIONAL_MIN_ROWS_PER_SECOND) {
      behind += lead;
    }
    const start = Math.max(0, Math.floor(first - behind));
    const end = Math.min(count - 1, Math.ceil(last + ahead));
    setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  };

  const items: ReactElement[] = [];
  for (let index = range.start; index <= range.end; index++) {
    let element = elements.current.get(index);
    if (!element) {
      const key = itemKeys[index];
      if (key === undefined) {
        continue;
      }
      element = (
        <Slot key={key} name={key}>
          {renderItem(index)}
        </Slot>
      );
      elements.current.set(index, element);
    }
    items.push(element);
  }
  // Drop cached rows outside the window so the cache can't grow unbounded.
  elements.current.forEach((_, index) => {
    if (index < range.start || index > range.end) {
      elements.current.delete(index);
    }
  });

  return (
    <LazyListNativeView
      itemKeys={itemKeys}
      estimatedItemSize={estimatedItemSize}
      onVisibleRangeChange={onVisibleRangeChange}
      onSelectItem={({ nativeEvent: { key } }) => {
        const index = indexByKey.get(key);
        if (index !== undefined) {
          onSelect?.(index);
        }
      }}
      onDeleteItems={({ nativeEvent: { indices } }) => onDelete?.(indices)}>
      {items}
    </LazyListNativeView>
  );
}
