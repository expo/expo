import { requireNativeView } from 'expo';
import { type ReactElement } from 'react';

import {
  useRecycledRows,
  type RecycledSlotProps,
  type WindowChangeEvent,
} from '../../recycling/useRecycledRows';
import { type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface ListForEachProps<ItemT> extends CommonViewModifierProps {
  /** Called with deleted indices from this group's `data` array. */
  onDelete?: (indices: number[]) => void;
  /**
   * Called with the source indices and the destination index. The destination index counts
   * positions before the moved items are removed, so it can equal `data.length`.
   */
  onMove?: (sourceIndices: number[], destination: number) => void;
  /** Items to display. Replace the array when updating data. */
  data: readonly ItemT[];
  /** Returns a stable, unique string key, also used for `List` selection. */
  keyExtractor: (item: ItemT, index: number) => string;
  /**
   * Renders a row. When `recycling` is `true`, wrap it in `useCallback`, or every row
   * re-renders on each parent render.
   * Recycled rows are reused for other items, so their local state (`useState`) carries over.
   * Reset it when the item changes, or keep the state outside the row.
   */
  children: (info: { item: ItemT; index: number }) => ReactElement;
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
   * Placeholder height in points, excluding `List` insets, until a row is measured.
   * Must be positive. Measurements reset when `data` or width changes.
   * Ignored when `recycling` is `false`.
   * @default 64
   */
  estimatedItemSize?: number;
}

type NativeProps = CommonViewModifierProps &
  ViewEvent<'onWindowChange', WindowChangeEvent> &
  ViewEvent<'onDelete', { indices: number[]; revision: number }> &
  ViewEvent<'onMove', { sourceIndices: number[]; destination: number; revision: number }> & {
    deleteEnabled: boolean;
    moveEnabled: boolean;
    itemKeys: string[];
    revision: number;
    estimatedItemSize: number;
    children: ReactElement;
  };

const NativeList = requireNativeView<NativeProps>('ExpoUI', 'DataListForEachView');
export const NativeSlot = requireNativeView<RecycledSlotProps>('ExpoUI', 'DataListForEachItemView');
const NativePool = requireNativeView<{ children: ReactElement[] }>(
  'ExpoUI',
  'DataListForEachPoolView'
);

/**
 * Renders a window of recycled rows inside List or Section.
 * Rows show placeholders while JS prepares content. Native keys still cover the full data set.
 * @platform ios
 */
export function DataListForEach<ItemT>({
  data,
  keyExtractor,
  children: renderItem,
  overscanCount,
  estimatedItemSize = 64,
  modifiers,
  onDelete,
  onMove,
  ...props
}: ListForEachProps<ItemT>) {
  const { itemKeys, revision, rows, onWindowChange, isCurrentRevision } = useRecycledRows({
    componentName: 'List.ForEach',
    Slot: NativeSlot,
    data,
    keyExtractor,
    renderItem,
    overscanCount,
    estimatedItemSize,
  });

  return (
    <NativeList
      {...props}
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      deleteEnabled={!!onDelete}
      moveEnabled={!!onMove}
      onDelete={
        onDelete
          ? ({ nativeEvent }) => {
              if (isCurrentRevision(nativeEvent.revision)) onDelete(nativeEvent.indices);
            }
          : undefined
      }
      onMove={
        onMove
          ? ({ nativeEvent }) => {
              if (isCurrentRevision(nativeEvent.revision)) {
                onMove(nativeEvent.sourceIndices, nativeEvent.destination);
              }
            }
          : undefined
      }
      itemKeys={itemKeys}
      revision={revision}
      estimatedItemSize={estimatedItemSize}
      onWindowChange={({ nativeEvent }) => onWindowChange(nativeEvent)}>
      <NativePool>{rows}</NativePool>
    </NativeList>
  );
}
