import { requireNativeView } from 'expo';
import { type ReactElement } from 'react';

import {
  useRecycledRows,
  type RecycledSlotProps,
  type WindowChangeEvent,
} from '../../recycling/useRecycledRows';
import { type ViewEvent } from '../../types';

export interface LazyItemsProps<ItemT> {
  children?: never;
  /** Items to display. Replace the array when updating data. */
  data: readonly ItemT[];
  /** Returns a stable, unique string key, also used as the lazy list item key. */
  keyExtractor: (item: ItemT, index: number) => string;
  /**
   * Renders a Compose row. Rows are reused, so local state (useState) can carry over to another
   * item. Reset it when the item key changes. Keep persistent state outside the row, stored by
   * item key.
   */
  renderItem: (info: { item: ItemT; index: number }) => ReactElement;
  /**
   * Extra rows to prepare on each side of the visible rows. Must be a non-negative integer.
   * @default 10
   */
  overscanCount?: number;
  /**
   * Placeholder size in dp along the scroll axis, until a row is measured. Must be positive.
   * Measurements reset when the data changes. In `LazyColumn.Items` they also reset when the list
   * width changes.
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
 * Mount it as a direct child of `LazyColumn` or `LazyRow`. Plain children of the same list stay
 * single items, so static and recycled content can be mixed in order.
 * @platform android
 */
export const LazyItems = createLazyItems('LazyColumn.Items');

/**
 * @hidden
 * Creates the `Items` component of one lazy list, so its errors name that list.
 */
export function createLazyItems(componentName: string) {
  function Items<ItemT>({
    data,
    keyExtractor,
    renderItem,
    overscanCount,
    estimatedItemSize = 64,
  }: LazyItemsProps<ItemT>) {
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
