import {
  memo,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactElement,
} from 'react';

import { getSlotIndices, getWindow } from './window';

/** Payload of the native event asking for the rows around the visible range. */
export type WindowChangeEvent = { first: number; last: number; revision: number };

/** Props of the native view that holds one recycled row. */
export type RecycledSlotProps = {
  itemKey: string;
  index: number;
  revision: number;
  children: ReactElement;
};

/** Renders one row of the data set. */
export type RenderItem<ItemT> = (info: { item: ItemT; index: number }) => ReactElement;

type RecycledRowProps<ItemT> = Omit<RecycledSlotProps, 'children'> & {
  Slot: ComponentType<RecycledSlotProps>;
  item: ItemT;
  renderItem: RenderItem<ItemT>;
};

// Skip unchanged rows when the window moves.
const RecycledRow = memo(function RecycledRow<ItemT>({
  Slot,
  item,
  index,
  itemKey,
  revision,
  renderItem,
}: RecycledRowProps<ItemT>) {
  return (
    <Slot itemKey={itemKey} index={index} revision={revision}>
      {renderItem({ item, index })}
    </Slot>
  );
}) as <ItemT>(props: RecycledRowProps<ItemT>) => ReactElement;

export type RecycledRows = {
  /** Keys of every item, so the native list can size and identify the full data set. */
  itemKeys: string[];
  /** Increases whenever the data changes, so late native events can be dropped. */
  revision: number;
  /** The pooled rows to mount, one per slot. */
  rows: ReactElement[];
  /** Applies a native window request. */
  onWindowChange: (event: WindowChangeEvent) => void;
  /** Whether a native event was sent for the data currently committed to native. */
  isCurrentRevision: (revision: number) => boolean;
};

/**
 * Keeps a fixed pool of rows centered on the range the native list asks for.
 * Item `index` always renders in slot `index % capacity`, so moving the window
 * only re-renders the slots whose item changed.
 */
export function useRecycledRows<ItemT>({
  componentName,
  Slot,
  data,
  keyExtractor,
  renderItem,
  overscanCount = 10,
  estimatedItemSize = 64,
}: {
  /** Name used in error messages, for example `List.ForEach`. */
  componentName: string;
  /** Native view that holds one recycled row. */
  Slot: ComponentType<RecycledSlotProps>;
  data: readonly ItemT[];
  keyExtractor: (item: ItemT, index: number) => string;
  renderItem: RenderItem<ItemT>;
  overscanCount?: number;
  estimatedItemSize?: number;
}): RecycledRows {
  if (!Number.isSafeInteger(overscanCount) || overscanCount < 0) {
    throw new Error(`${componentName} overscanCount must be a non-negative integer.`);
  }
  if (!Number.isFinite(estimatedItemSize) || estimatedItemSize <= 0) {
    throw new Error(`${componentName} estimatedItemSize must be a positive finite number.`);
  }
  // Keys follow `data` only. An inline `keyExtractor` changes identity on every parent render, and
  // recomputing keys for it would bump the revision and re-render every pooled row.
  const keyExtractorRef = useRef(keyExtractor);
  keyExtractorRef.current = keyExtractor;
  const itemKeys = useMemo(() => {
    const keys = data.map((item, index) => keyExtractorRef.current(item, index));
    if (keys.some((key) => typeof key !== 'string') || new Set(keys).size !== keys.length) {
      throw new Error(`${componentName} keyExtractor must return a unique string for every item.`);
    }
    return keys;
  }, [data]);
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

  const rows = getSlotIndices(start, capacity).map((index, slot) => {
    const item = data[index];
    const itemKey = itemKeys[index];
    if (item === undefined || itemKey === undefined) {
      throw new Error(`${componentName} could not resolve the item at index ${index}.`);
    }
    return (
      <RecycledRow
        key={slot}
        Slot={Slot}
        item={item}
        index={index}
        itemKey={itemKey}
        revision={current.revision}
        renderItem={renderItem}
      />
    );
  });

  return {
    itemKeys,
    revision: current.revision,
    rows,
    isCurrentRevision: (revision) => revision === committedRevision.current,
    onWindowChange: (event) => {
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
        return first === previous.first && last === previous.last && capacity === previous.capacity
          ? previous
          : { ...previous, first, last, capacity };
      });
    },
  };
}
