import { requireNativeView } from 'expo';
import { memo, useLayoutEffect, useMemo, useRef, useState, type ReactElement } from 'react';

import { type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';
import { getSlotIndices, getWindow } from './window';

export interface DataListForEachProps<ItemT> extends CommonViewModifierProps {
  children?: never;
  /** Called with deleted indices from this group’s data array. */
  onDelete?: (indices: number[]) => void;
  /** Called with source indices and a destination before removal (up to data.length). */
  onMove?: (sourceIndices: number[], destination: number) => void;
  /** Items to display. Replace the array when updating data. */
  data: readonly ItemT[];
  /** Returns a stable, unique string key, also used for List selection. */
  keyExtractor: (item: ItemT, index: number) => string;
  /**
   * Renders a SwiftUI row. Rows are reused, so local state (useState) can carry over to another item.
   * Reset it when the item key changes. Keep persistent state outside the row, stored by item key.
   */
  renderItem: (info: { item: ItemT; index: number }) => ReactElement;
  /**
   * Extra rows to prepare on each side of the visible rows. Must be a non-negative integer.
   * @default 10
   */
  overscanCount?: number;
  /**
   * Placeholder height in points, excluding List insets, until a row is measured.
   * Must be positive. Measurements reset when data or width changes.
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
    children: ReactElement[];
  };
type SlotProps = {
  itemKey: string;
  index: number;
  revision: number;
  children: ReactElement;
};

const NativeList = requireNativeView<NativeProps>('ExpoUI', 'DataListForEachView');
const NativeSlot = requireNativeView<SlotProps>('ExpoUI', 'DataListForEachItemView');

// Skip unchanged rows when the window moves.
const RecycledRow = memo(function RecycledRow<ItemT>({
  item,
  index,
  itemKey,
  revision,
  renderItem,
}: SlotPropsWithoutChildren & {
  item: ItemT;
  renderItem: DataListForEachProps<ItemT>['renderItem'];
}) {
  return (
    <NativeSlot itemKey={itemKey} index={index} revision={revision}>
      {renderItem({ item, index })}
    </NativeSlot>
  );
}) as <ItemT>(
  props: SlotPropsWithoutChildren & {
    item: ItemT;
    renderItem: DataListForEachProps<ItemT>['renderItem'];
  }
) => ReactElement;
type SlotPropsWithoutChildren = Omit<SlotProps, 'children'>;

/**
 * Renders a window of recycled rows inside List or Section.
 * Rows show placeholders while JS prepares content. Native keys still cover the full data set.
 * @platform ios
 */
export function DataListForEach<ItemT>({
  data,
  keyExtractor,
  renderItem,
  overscanCount = 10,
  estimatedItemSize = 64,
  modifiers,
  onDelete,
  onMove,
  ...props
}: DataListForEachProps<ItemT>) {
  if (!Number.isSafeInteger(overscanCount) || overscanCount < 0) {
    throw new Error('List.ForEach overscanCount must be a non-negative integer.');
  }
  if (!Number.isFinite(estimatedItemSize) || estimatedItemSize <= 0) {
    throw new Error('List.ForEach estimatedItemSize must be a positive finite number.');
  }
  const itemKeys = useMemo(() => {
    const keys = data.map(keyExtractor);
    if (keys.some((key) => typeof key !== 'string') || new Set(keys).size !== keys.length) {
      throw new Error('List.ForEach keyExtractor must return a unique string for every item.');
    }
    return keys;
  }, [data, keyExtractor]);
  const [state, setState] = useState({
    keys: itemKeys,
    first: 0,
    last: 0,
    revision: 0,
  });
  let current = state;
  if (state.keys !== itemKeys) {
    const previousKey = state.keys[state.first];
    const anchor = previousKey === undefined ? 0 : Math.max(0, itemKeys.indexOf(previousKey));
    current = {
      keys: itemKeys,
      first: Math.min(anchor, Math.max(0, data.length - 1)),
      last: Math.min(anchor + state.last - state.first, Math.max(0, data.length - 1)),
      revision: state.revision + 1,
    };
    setState(current);
  }
  const { start, capacity } = getWindow(data.length, current.first, current.last, overscanCount);
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
          return first === previous.first && last === previous.last
            ? previous
            : { ...previous, first, last };
        });
      }}>
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
    </NativeList>
  );
}
