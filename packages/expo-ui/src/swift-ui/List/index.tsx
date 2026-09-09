import { requireNativeView } from 'expo';
import { memo, startTransition, useMemo, useState } from 'react';

import { type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';
import { ListForEach } from './ListForEach';

export { ListForEach, type ListForEachProps } from './ListForEach';

const ListNativeView: React.ComponentType<NativeListProps> = requireNativeView<NativeListProps>(
  'ExpoUI',
  'ListView'
);

const ListItemNativeView = requireNativeView<{
  rowKey: string;
  children: React.ReactNode;
}>('ExpoUI', 'ListItemView');

function transformListProps(props: Omit<ListProps, 'children'>): Omit<NativeListProps, 'children'> {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    onSelectionChange: ({ nativeEvent: { selection } }) => props?.onSelectionChange?.(selection),
  };
}

export interface ListProps extends CommonViewModifierProps {
  /**
   * The children elements to be rendered inside the list.
   */
  children: React.ReactNode;

  /**
   * The currently selected item tags.
   */
  selection?: (string | number)[];

  /**
   * Callback triggered when the selection changes in a list.
   * Returns an array of selected item tags.
   */
  onSelectionChange?: (selection: (string | number)[]) => void;
}

/**
 * Experimental windowed rendering for flat data. Local row state is lost on eviction.
 * Stable keys preserve surviving rows across data updates. Replace data immutably and keep
 * keyExtractor/renderItem stable to reuse the item lookup and skip unchanged row renders.
 * Selection, sections, and editing are only supported by the existing children-based API for now.
 */
export interface ListDataProps<T> extends CommonViewModifierProps {
  data: readonly T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (info: { item: T; index: number }) => React.ReactNode;
  /** Height of unmounted row content (excluding native row insets). Defaults to 64. */
  estimatedRowHeight?: number;
  /** Rows prefetched/retained on each side of appearing rows. Defaults to 10. */
  overscanCount?: number;
  /** Initial rows to render and keep mounted for scroll-to-top. Defaults to 10. */
  initialNumToRender?: number;
  /** Change this marker to re-render memoized rows that depend on data outside `data`. */
  extraData?: unknown;
  children?: never;
}

/**
 * SelectItemEvent represents an event triggered when the selection changes in a list.
 */
type SelectItemEvent = ViewEvent<'onSelectionChange', { selection: (string | number)[] }>;

type NativeListProps = Omit<ListProps, 'onSelectionChange'> &
  SelectItemEvent & {
    children: React.ReactNode;
    rowKeys?: string[];
    estimatedRowHeight?: number;
    dataVersion?: number;
    onRequestItem?: (event: {
      nativeEvent: { key: string; keys: string[]; revision: number };
    }) => void;
    onRenderWindowChange?: (event: { nativeEvent: { keys: string[]; revision: number } }) => void;
  };

/**
 * A list component that renders its children using a native SwiftUI `List`.
 */
export function List<T>(props: ListProps | ListDataProps<T>) {
  if ('data' in props) {
    return <DataList {...props} />;
  }

  const { children, ...nativeProps } = props;
  return <ListNativeView {...transformListProps(nativeProps)}>{children}</ListNativeView>;
}

List.ForEach = ListForEach;

function DataList<T>({
  data,
  renderItem,
  keyExtractor,
  children: _children,
  estimatedRowHeight = 64,
  overscanCount = 10,
  initialNumToRender = 10,
  extraData,
  ...props
}: ListDataProps<T>) {
  // One dataset pass when its inputs change, not when native requests another row.
  const rows = useMemo(() => {
    const keys: string[] = [];
    const byKey = new Map<string, { item: T; index: number }>();
    data.forEach((item, index) => {
      const key = keyExtractor(item, index);
      if (typeof key !== 'string' || byKey.has(key)) {
        throw new Error('List keyExtractor must return a unique string for every item.');
      }
      keys.push(key);
      byKey.set(key, { item, index });
    });
    return { keys, byKey };
  }, [data, keyExtractor]);

  if (!Number.isFinite(estimatedRowHeight) || estimatedRowHeight <= 0) {
    throw new Error('List estimatedRowHeight must be a finite positive number.');
  }
  if (
    !Number.isSafeInteger(overscanCount) ||
    overscanCount < 0 ||
    !Number.isSafeInteger(initialNumToRender) ||
    initialNumToRender < 0
  ) {
    throw new Error(
      'List overscanCount and initialNumToRender must be non-negative safe integers.'
    );
  }

  const [mounted, setMounted] = useState(() => ({
    rows,
    activeKeys: new Set<string>(),
    keys: renderWindowKeys(rows, [], overscanCount, initialNumToRender),
    overscanCount,
    initialNumToRender,
    revision: 0,
    dataVersion: 0,
  }));
  if (
    mounted.rows !== rows ||
    mounted.overscanCount !== overscanCount ||
    mounted.initialNumToRender !== initialNumToRender
  ) {
    const activeKeys = new Set([...mounted.activeKeys].filter((key) => rows.byKey.has(key)));
    setMounted({
      ...mounted,
      rows,
      activeKeys,
      overscanCount,
      initialNumToRender,
      keys: renderWindowKeys(rows, activeKeys, overscanCount, initialNumToRender),
      dataVersion: mounted.dataVersion + (mounted.rows !== rows ? 1 : 0),
    });
  }

  return (
    <ListNativeView
      {...transformListProps(props)}
      rowKeys={rows.keys}
      estimatedRowHeight={estimatedRowHeight}
      dataVersion={mounted.dataVersion}
      onRequestItem={({ nativeEvent: { key, keys, revision } }) => {
        // Urgent update: deliberately not wrapped in startTransition.
        setMounted((current) => {
          // Read the current dataset, not one captured by an older event callback.
          if (revision <= current.revision || !current.rows.byKey.has(key)) return current;
          const activeKeys = new Set(keys.filter((key) => current.rows.byKey.has(key)));
          activeKeys.add(key);
          const allowed = renderWindowKeys(
            current.rows,
            activeKeys,
            current.overscanCount,
            current.initialNumToRender
          );
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
      onRenderWindowChange={({ nativeEvent: { keys, revision } }) => {
        startTransition(() => {
          setMounted((current) => {
            // This guard runs when React applies/rebases the update, not just on event receipt.
            if (revision <= current.revision) return current;
            const activeKeys = new Set(keys.filter((key) => current.rows.byKey.has(key)));
            return {
              ...current,
              revision,
              activeKeys,
              keys: renderWindowKeys(
                current.rows,
                activeKeys,
                current.overscanCount,
                current.initialNumToRender
              ),
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
            extraData={extraData}
          />
        ) : null;
      })}
    </ListNativeView>
  );
}

function ListItem<T>({
  rowKey,
  item,
  index,
  renderItem,
  extraData: _extraData,
}: {
  rowKey: string;
  item: T;
  index: number;
  renderItem: ListDataProps<T>['renderItem'];
  extraData: unknown;
}) {
  return <ListItemNativeView rowKey={rowKey}>{renderItem({ item, index })}</ListItemNativeView>;
}

// Preserve the generic item type through React.memo.
const MemoizedListItem = memo(ListItem) as typeof ListItem;

// Work is limited to active rows and their neighboring keys, not a scan over the dataset.
function renderWindowKeys(
  rows: { keys: string[]; byKey: ReadonlyMap<string, { index: number }> },
  activeKeys: Iterable<string>,
  overscanCount: number,
  initialNumToRender: number
): Set<string> {
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
