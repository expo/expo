import { requireNativeView } from 'expo';
import { memo, useLayoutEffect, useMemo, useRef, useState, type ReactElement } from 'react';

import { type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';
import { getSlotIndices, getWindow } from './window';

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

type WindowEvent = { first: number; last: number; revision: number };
type NativeProps = CommonViewModifierProps &
  ViewEvent<'onWindowChange', WindowEvent> &
  ViewEvent<'onDelete', { indices: number[]; revision: number }> &
  ViewEvent<'onMove', { sourceIndices: number[]; destination: number; revision: number }> & {
    deleteEnabled: boolean;
    moveEnabled: boolean;
    itemKeys: string[];
    revision: number;
    estimatedItemSize: number;
    children: ReactElement;
  };
type SlotProps = {
  itemKey: string;
  index: number;
  revision: number;
  children: ReactElement;
};

const NativeList = requireNativeView<NativeProps>('ExpoUI', 'DataListForEachView');
export const NativeSlot = requireNativeView<SlotProps>('ExpoUI', 'DataListForEachItemView');
const NativePool = requireNativeView<{ children: ReactElement[] }>(
  'ExpoUI',
  'DataListForEachPoolView'
);

// Skip unchanged rows when the window moves.
const RecycledRow = memo(function RecycledRow<ItemT>({
  item,
  index,
  itemKey,
  revision,
  renderItem,
}: SlotPropsWithoutChildren & {
  item: ItemT;
  renderItem: ListForEachProps<ItemT>['children'];
}) {
  return (
    <NativeSlot itemKey={itemKey} index={index} revision={revision}>
      {renderItem({ item, index })}
    </NativeSlot>
  );
}) as <ItemT>(
  props: SlotPropsWithoutChildren & {
    item: ItemT;
    renderItem: ListForEachProps<ItemT>['children'];
  }
) => ReactElement;
type SlotPropsWithoutChildren = Omit<SlotProps, 'children'>;

export function useItemKeys<ItemT>(
  data: readonly ItemT[],
  keyExtractor: ListForEachProps<ItemT>['keyExtractor']
): string[] {
  const keyExtractorRef = useRef(keyExtractor);
  keyExtractorRef.current = keyExtractor;
  return useMemo(() => {
    const keys = data.map((item, index) => keyExtractorRef.current(item, index));
    if (keys.some((key) => typeof key !== 'string') || new Set(keys).size !== keys.length) {
      throw new Error('List.ForEach keyExtractor must return a unique string for every item.');
    }
    return keys;
  }, [data]);
}

/**
 * Renders a window of recycled rows inside List or Section.
 * Rows show placeholders while JS prepares content. Native keys still cover the full data set.
 * @platform ios
 */
export function DataListForEach<ItemT>({
  data,
  keyExtractor,
  children: renderItem,
  overscanCount = 10,
  estimatedItemSize = 64,
  modifiers,
  onDelete,
  onMove,
  ...props
}: ListForEachProps<ItemT>) {
  if (!Number.isSafeInteger(overscanCount) || overscanCount < 0) {
    throw new Error('List.ForEach overscanCount must be a non-negative integer.');
  }
  if (!Number.isFinite(estimatedItemSize) || estimatedItemSize <= 0) {
    throw new Error('List.ForEach estimatedItemSize must be a positive finite number.');
  }
  const itemKeys = useItemKeys(data, keyExtractor);
  const [state, setState] = useState({
    keys: itemKeys,
    first: 0,
    last: 0,
    revision: 0,
    capacity: 0,
    overscanCount,
  });
  let current = state;
  if (state.keys !== itemKeys) {
    const previousKey = state.keys[state.first];
    const anchor = previousKey === undefined ? 0 : Math.max(0, itemKeys.indexOf(previousKey));
    current = {
      ...state,
      keys: itemKeys,
      first: Math.min(anchor, Math.max(0, data.length - 1)),
      last: Math.min(anchor + state.last - state.first, Math.max(0, data.length - 1)),
      revision: state.revision + 1,
    };
  }
  if (current.overscanCount !== overscanCount) {
    current = { ...current, overscanCount, capacity: 0 };
  }
  if (current !== state) setState(current);
  const { start, capacity } = getWindow(
    data.length,
    current.first,
    current.last,
    overscanCount,
    current.capacity
  );
  const committedRevision = useRef(current.revision);
  useLayoutEffect(() => {
    committedRevision.current = current.revision;
  }, [current.revision]);
  const indices = getSlotIndices(start, capacity);

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
              if (nativeEvent.revision === committedRevision.current) onDelete(nativeEvent.indices);
            }
          : undefined
      }
      onMove={
        onMove
          ? ({ nativeEvent }) => {
              if (nativeEvent.revision === committedRevision.current) {
                onMove(nativeEvent.sourceIndices, nativeEvent.destination);
              }
            }
          : undefined
      }
      itemKeys={itemKeys}
      revision={current.revision}
      estimatedItemSize={estimatedItemSize}
      onWindowChange={({ nativeEvent: event }) => {
        if (
          !Number.isSafeInteger(event.first) ||
          !Number.isSafeInteger(event.last) ||
          event.last < event.first
        ) {
          return;
        }
        setState((previous) => {
          // Ignore requests from before a data change.
          if (event.revision !== previous.revision) return previous;
          const maximum = Math.max(0, previous.keys.length - 1);
          const first = Math.max(0, Math.min(event.first, maximum));
          const last = Math.max(first, Math.min(event.last, maximum));
          const { capacity } = getWindow(
            previous.keys.length,
            first,
            last,
            previous.overscanCount,
            previous.capacity
          );
          return first === previous.first &&
            last === previous.last &&
            capacity === previous.capacity
            ? previous
            : { ...previous, first, last, capacity };
        });
      }}>
      <NativePool>
        {indices.map((index, slot) => {
          const item = data[index];
          const itemKey = itemKeys[index];
          if (item === undefined || itemKey === undefined) {
            throw new Error(`List.ForEach could not resolve the item at index ${index}.`);
          }
          return (
            <RecycledRow
              key={slot}
              item={item}
              index={index}
              itemKey={itemKey}
              revision={current.revision}
              renderItem={renderItem}
            />
          );
        })}
      </NativePool>
    </NativeList>
  );
}
