import { requireNativeView } from 'expo';
import { memo, startTransition, useMemo, useState } from 'react';

import { type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

const ListForEachNativeView: React.ComponentType<NativeListForEachProps> =
  requireNativeView<NativeListForEachProps>('ExpoUI', 'ListForEachView');

type DeleteEvent = ViewEvent<'onDelete', { indices: number[]; dataVersion?: number }>;

type MoveEvent = ViewEvent<
  'onMove',
  { sourceIndices: number[]; destination: number; dataVersion?: number }
>;

type NativeListForEachProps = CommonViewModifierProps &
  Partial<DeleteEvent & MoveEvent> & {
    children: React.ReactNode;
    rowKeys?: string[];
    estimatedRowHeight?: number;
    dataVersion?: number;
    deleteEnabled?: boolean;
    moveEnabled?: boolean;
    onRequestItem?: (event: {
      nativeEvent: { key: string; keys: string[]; revision: number; dataVersion: number };
    }) => void;
    onRenderWindowChange?: (event: {
      nativeEvent: { keys: string[]; revision: number; dataVersion: number };
    }) => void;
  };

export interface ListForEachProps extends CommonViewModifierProps {
  /**
   * The children elements to be rendered inside the `List.ForEach`.
   */
  children: React.ReactNode;

  /**
   * Callback triggered when items are deleted.
   * Receives an array of indices that were deleted.
   * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/dynamicviewcontent/ondelete(perform:)).
   */
  onDelete?: (indices: number[]) => void;

  /**
   * Callback triggered when items are moved.
   * Receives the source indices and destination index.
   * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/dynamicviewcontent/onmove(perform:)).
   */
  onMove?: (sourceIndices: number[], destination: number) => void;
}

/**
 * Repeated content inside List, with deletion and reordering callbacks.
 * The data form windows React children.
 * This component must be used as a child of `List` (as `List.ForEach`).
 */
export function ListForEach<T>(input: ListForEachProps | ListForEachDataProps<T>) {
  if ('data' in input) return <WindowedForEach {...input} />;
  const { children, ...props } = input;
  return <ListForEachNativeView {...transformProps(props)}>{children}</ListForEachNativeView>;
}

function transformProps(
  { modifiers, onDelete, onMove, ...props }: Omit<ListForEachProps, 'children'>,
  dataVersion?: number
): Omit<NativeListForEachProps, 'children'> {
  return {
    ...props,
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    deleteEnabled: !!onDelete,
    moveEnabled: !!onMove,
    onDelete: onDelete
      ? ({ nativeEvent }) => {
          // Windowed events describe the dataset SwiftUI was displaying when editing began.
          if (dataVersion === undefined || nativeEvent.dataVersion === dataVersion) {
            onDelete(nativeEvent.indices);
          }
        }
      : undefined,
    onMove: onMove
      ? ({ nativeEvent }) => {
          if (dataVersion === undefined || nativeEvent.dataVersion === dataVersion) {
            onMove(nativeEvent.sourceIndices, nativeEvent.destination);
          }
        }
      : undefined,
  };
}

/**
 * Windowed React content for use inside List. One root view per item.
 * Local state is lost on eviction. Replace data immutably and keep keys stable.
 * Update the render callback when captured values change.
 * Editing callbacks use indices in the full data array; update data in response.
 * Selection is not supported by this form yet.
 */
export interface ListForEachDataProps<T> extends Omit<ListForEachProps, 'children'> {
  data: readonly T[];
  keyExtractor: (item: T, index: number) => string;
  children: (item: T, index: number) => React.ReactNode;
  /** Estimated content height before a row is measured. Defaults to 64. */
  estimatedRowHeight?: number;
}
const ListItemNativeView = requireNativeView<{ rowKey: string; children: React.ReactNode }>(
  'ExpoUI',
  'ListItemView'
);
function WindowedForEach<T>({
  data,
  keyExtractor,
  children: renderItem,
  estimatedRowHeight = 64,
  ...props
}: ListForEachDataProps<T>) {
  // One dataset pass when its inputs change, not when native requests another row.
  const rows = useMemo(() => {
    const keys: string[] = [];
    const byKey = new Map<string, { item: T; index: number }>();
    data.forEach((item, index) => {
      const key = keyExtractor(item, index);
      if (typeof key !== 'string' || byKey.has(key)) {
        throw new Error('List.ForEach keyExtractor must return a unique string for every item.');
      }
      keys.push(key);
      byKey.set(key, { item, index });
    });
    return { keys, byKey };
  }, [data, keyExtractor]);

  if (!Number.isFinite(estimatedRowHeight) || estimatedRowHeight <= 0) {
    throw new Error('List.ForEach estimatedRowHeight must be a finite positive number.');
  }
  const [mounted, setMounted] = useState(() => ({
    rows,
    activeKeys: new Set<string>(),
    keys: renderWindowKeys(rows, []),
    revision: 0,
    dataVersion: 0,
  }));
  if (mounted.rows !== rows) {
    const activeKeys = new Set([...mounted.activeKeys].filter((key) => rows.byKey.has(key)));
    setMounted({
      ...mounted,
      rows,
      activeKeys,
      keys: renderWindowKeys(rows, activeKeys),
      dataVersion: mounted.dataVersion + 1,
    });
  }

  return (
    <ListForEachNativeView
      {...transformProps(props, mounted.dataVersion)}
      rowKeys={rows.keys}
      estimatedRowHeight={estimatedRowHeight}
      dataVersion={mounted.dataVersion}
      onRequestItem={({ nativeEvent: { key, keys, revision, dataVersion } }) => {
        // Urgent update: deliberately not wrapped in startTransition.
        setMounted((current) => {
          // Read current state at application time. A newer event can still describe old data.
          if (
            dataVersion !== current.dataVersion ||
            revision <= current.revision ||
            !current.rows.byKey.has(key)
          )
            return current;
          const activeKeys = new Set(keys.filter((key) => current.rows.byKey.has(key)));
          activeKeys.add(key);
          const allowed = renderWindowKeys(current.rows, activeKeys);
          // Trim old content even if background work is starved during a fling. Only mount active
          // content urgently; missing neighbors are still mounted by the asynchronous window event.
          const retained = new Set([...current.keys].filter((key) => allowed.has(key)));
          for (const activeKey of activeKeys) retained.add(activeKey);
          // Advance the revision even if already mounted: a queued eviction may still remove it.
          return {
            ...current,
            revision,
            activeKeys,
            keys: retained,
          };
        });
      }}
      onRenderWindowChange={({ nativeEvent: { keys, revision, dataVersion } }) => {
        startTransition(() => {
          setMounted((current) => {
            // This guard runs when React applies/rebases the update, not just on event receipt.
            if (dataVersion !== current.dataVersion || revision <= current.revision) return current;
            const activeKeys = new Set(keys.filter((key) => current.rows.byKey.has(key)));
            return {
              ...current,
              revision,
              activeKeys,
              keys: renderWindowKeys(current.rows, activeKeys),
            };
          });
        });
      }}>
      {Array.from(mounted.keys, (key) => {
        const row = rows.byKey.get(key);
        return row ? (
          <MemoizedListItem
            key={key}
            rowKey={key}
            item={row.item}
            index={row.index}
            renderItem={renderItem}
          />
        ) : null;
      })}
    </ListForEachNativeView>
  );
}

function ListItem<T>({
  rowKey,
  item,
  index,
  renderItem,
}: {
  rowKey: string;
  item: T;
  index: number;
  renderItem: ListForEachDataProps<T>['children'];
}) {
  return <ListItemNativeView rowKey={rowKey}>{renderItem(item, index)}</ListItemNativeView>;
}

// Preserve the generic item type through React.memo.
const MemoizedListItem = memo(ListItem) as typeof ListItem;

// Work is limited to active rows and their neighboring keys, not a scan over the dataset.
function renderWindowKeys(
  rows: { keys: string[]; byKey: ReadonlyMap<string, { index: number }> },
  activeKeys: Iterable<string>
): Set<string> {
  const overscanCount = 10;
  const initialNumToRender = 10;
  const result = new Set(rows.keys.slice(0, initialNumToRender));
  for (const key of activeKeys) {
    const row = rows.byKey.get(key);
    if (!row) continue;
    const first = Math.max(0, row.index - overscanCount);
    const last = Math.min(rows.keys.length - 1, row.index + overscanCount);
    for (let index = first; index <= last; index++) result.add(rows.keys[index]!);
  }
  return result;
}
