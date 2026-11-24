import { requireNativeView } from 'expo';
import { Fragment, type ReactElement } from 'react';

import {
  useItemKeys,
  useRecycledRows,
  type RecycledSlotProps,
  type WindowChangeEvent,
} from '../../recycling/useRecycledRows';
import { type ViewEvent } from '../../types';

export interface LazyItemsProps<T> {
  /** Items to display. Replace the array when updating data. */
  data: readonly T[];
  /** Returns a stable, unique string key, also used as the lazy list item key. */
  keyExtractor: (item: T, index: number) => string;
  /**
   * Renders an item. Wrap it in `useCallback`, or every item re-renders on each parent render.
   * Recycled views are reused for other items, so their local state (`useState`) carries over.
   * Reset it when the item changes, or keep the state outside the view.
   */
  children: (info: { item: T; index: number }) => ReactElement;
  /**
   * Renders only the items near the visible range and reuses them while scrolling. Set to `false`
   * to render every item at once. Set it once; changing it remounts the items.
   * @default true
   */
  recycling?: boolean;
  /**
   * Extra items to prepare on each side of the visible items. Must be a non-negative integer.
   * Ignored when `recycling` is `false`.
   * @default 10
   */
  overscanCount?: number;
  /**
   * Placeholder size in dp along the scroll axis, until an item is measured. Must be positive.
   * Ignored when `recycling` is `false`.
   * @default 64
   */
  estimatedItemSize?: number;
}

type NativeLazyItemsProps = ViewEvent<'onWindowChange', WindowChangeEvent> & {
  itemKeys: string[];
  revision: number;
  estimatedItemSize: number;
  children: ReactElement;
};

const LazyItemsNativeView: React.ComponentType<NativeLazyItemsProps> =
  requireNativeView<NativeLazyItemsProps>('ExpoUI', 'LazyItemsView');
const LazyItemsSlotNativeView: React.ComponentType<RecycledSlotProps> =
  requireNativeView<RecycledSlotProps>('ExpoUI', 'LazyItemsSlotView');
const LazyItemsPoolNativeView: React.ComponentType<{ children: ReactElement[] }> =
  requireNativeView('ExpoUI', 'LazyItemsPoolView');

/**
 * A block of recycled rows inside `LazyColumn` or `LazyRow`, mirroring the Compose
 * `items(count, key)` builder. Only a small pool of rows around the visible range is mounted,
 * so large data sets stay cheap. Rows that are not ready yet show a placeholder of
 * `estimatedItemSize`, or of the size last measured for that item.
 *
 * Mount it as a direct child of `LazyColumn` or `LazyRow`.
 * @platform android
 */
export const LazyItems = createLazyItems('LazyColumn.Items');

/**
 * @hidden
 * Creates the `Items` component of one lazy list, so its errors name that list.
 */
export function createLazyItems(componentName: string) {
  function Items<T>({ recycling = true, ...props }: LazyItemsProps<T>) {
    return recycling ? <RecycledItems {...props} /> : <StaticItems {...props} />;
  }

  // Each row is a plain child of the lazy list, so it becomes one lazy item.
  function StaticItems<T>({
    data,
    keyExtractor,
    children: renderItem,
  }: Omit<LazyItemsProps<T>, 'recycling'>) {
    const itemKeys = useItemKeys(componentName, data, keyExtractor);
    return data.map((item, index) => (
      <Fragment key={itemKeys[index]}>{renderItem({ item, index })}</Fragment>
    ));
  }

  function RecycledItems<T>({
    data,
    keyExtractor,
    children: renderItem,
    overscanCount,
    estimatedItemSize = 64,
  }: Omit<LazyItemsProps<T>, 'recycling'>) {
    const { itemKeys, revision, rows, onWindowChange } = useRecycledRows({
      componentName,
      Slot: LazyItemsSlotNativeView,
      data,
      keyExtractor,
      renderItem,
      overscanCount,
      estimatedItemSize,
    });

    return (
      <LazyItemsNativeView
        itemKeys={itemKeys}
        revision={revision}
        estimatedItemSize={estimatedItemSize}
        onWindowChange={({ nativeEvent }) => onWindowChange(nativeEvent)}>
        <LazyItemsPoolNativeView>{rows}</LazyItemsPoolNativeView>
      </LazyItemsNativeView>
    );
  }
  Items.displayName = componentName;
  return Items;
}
