import { requireNativeView } from 'expo';
import { Fragment, type ReactElement } from 'react';

import {
  useItemKeys,
  useRecycledRows,
  type WindowChangeEvent,
} from '../../recycling/useRecycledRows';
import { type ViewEvent } from '../../types';
import { NativeSlot } from '../List/DataListForEach';

export interface LazyStackForEachProps<T> {
  /** Items to display. Replace the array when updating data. */
  data: readonly T[];
  /** Returns a stable, unique string key for each item. */
  keyExtractor: (item: T, index: number) => string;
  /**
   * Renders a row. Wrap it in `useCallback`, or every row re-renders on each parent render.
   * Recycled rows are reused for other items, so their local state (`useState`) carries over.
   * Reset it when the item changes, or keep the state outside the row.
   */
  children: (info: { item: T; index: number }) => ReactElement;
  /**
   * Renders only the rows near the visible range and reuses them while scrolling. Set to `false` to
   * render every row at once. Set it once; changing it remounts the rows.
   * @default true
   */
  recycling?: boolean;
  /**
   * Extra rows to prepare on each side of the visible rows. Must be a non-negative integer.
   * Ignored when `recycling` is `false`.
   * @default 10
   */
  overscanCount?: number;
  /**
   * Placeholder size in points along the stack axis, until a row is measured. Must be positive.
   * Ignored when `recycling` is `false`.
   * @default 64
   */
  estimatedItemSize?: number;
}

type Axis = 'vertical' | 'horizontal';

type NativeProps = ViewEvent<'onWindowChange', WindowChangeEvent> & {
  axis: Axis;
  itemKeys: string[];
  revision: number;
  estimatedItemSize: number;
  children: ReactElement;
};

const NativeForEach = requireNativeView<NativeProps>('ExpoUI', 'DataListForEachView');
const NativePool = requireNativeView<{ children: ReactElement[] }>(
  'ExpoUI',
  'DataListForEachPoolView'
);

/**
 * @hidden
 * Creates the `ForEach` component of one lazy stack, so its errors name that stack.
 */
export function createLazyStackForEach(componentName: string, axis: Axis) {
  function ForEach<T>({ recycling = true, ...props }: LazyStackForEachProps<T>) {
    return recycling ? <RecycledForEach {...props} /> : <StaticForEach {...props} />;
  }

  // Each row is a plain child of the lazy stack.
  function StaticForEach<T>({
    data,
    keyExtractor,
    children: renderItem,
  }: Omit<LazyStackForEachProps<T>, 'recycling'>) {
    const itemKeys = useItemKeys(componentName, data, keyExtractor);
    return data.map((item, index) => (
      <Fragment key={itemKeys[index]}>{renderItem({ item, index })}</Fragment>
    ));
  }

  function RecycledForEach<T>({
    data,
    keyExtractor,
    children: renderItem,
    overscanCount,
    estimatedItemSize = 64,
  }: Omit<LazyStackForEachProps<T>, 'recycling'>) {
    const { itemKeys, revision, rows, onWindowChange } = useRecycledRows({
      componentName,
      Slot: NativeSlot,
      data,
      keyExtractor,
      renderItem,
      overscanCount,
      estimatedItemSize,
    });

    return (
      <NativeForEach
        axis={axis}
        itemKeys={itemKeys}
        revision={revision}
        estimatedItemSize={estimatedItemSize}
        onWindowChange={({ nativeEvent }) => onWindowChange(nativeEvent)}>
        <NativePool>{rows}</NativePool>
      </NativeForEach>
    );
  }
  ForEach.displayName = componentName;
  return ForEach;
}
