import { requireNativeView } from 'expo';
import {
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';

import { Slot } from '../SlotView';

type KeyEvent = { nativeEvent: { key: string } };

type NativeLazyListProps = {
  itemKeys: string[];
  estimatedItemSize?: number;
  onItemAppear?: (event: KeyEvent) => void;
  onItemAppearSync?: (event: KeyEvent) => void;
  onItemDisappear?: (event: KeyEvent) => void;
  onSelectItem?: (event: KeyEvent) => void;
  onDeleteItems?: (event: { nativeEvent: { indices: number[] } }) => void;
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
   * Number of extra items to keep mounted on each side of the visible range. A small buffer keeps
   * the rows just outside the viewport mounted with real content, which avoids layout glitches when
   * content shifts (for example the row below a deleted item popping in from a placeholder).
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
 * all `count` items up front. It is backed by a native SwiftUI `List`: each row reports when it
 * appears and disappears, and only the items within the visible range (padded by `overscan`) are
 * rendered on the JS side. Rows are identified by `keyExtractor` so edits animate the correct row.
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

  // Windowing stays index-based; native reports keys, which we map back to indices here.
  const visible = useRef<Set<number>>(new Set());
  const [range, setRange] = useState({ start: 0, end: -1 });

  // Cache the rendered element per index so an appear only renders the newly-added row (React bails
  // on the reused element refs). Cleared when `renderItem` changes, keeping content in sync.
  const elements = useRef<Map<number, ReactElement>>(new Map());
  const renderItemRef = useRef(renderItem);
  if (renderItemRef.current !== renderItem) {
    renderItemRef.current = renderItem;
    elements.current.clear();
  }

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

    const start = Math.max(0, first - overscan);
    const end = Math.min(count - 1, last + overscan);
    setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  };

  const appear = (key: string) => {
    const index = indexByKey.get(key);
    if (index !== undefined) {
      visible.current.add(index);
      updateWindow();
    }
  };
  const disappear = (key: string) => {
    const index = indexByKey.get(key);
    if (index !== undefined) {
      visible.current.delete(index);
      updateWindow();
    }
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
      onItemAppear={({ nativeEvent: { key } }) => appear(key)}
      onItemAppearSync={({ nativeEvent: { key } }) => appear(key)}
      onItemDisappear={({ nativeEvent: { key } }) => disappear(key)}
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
