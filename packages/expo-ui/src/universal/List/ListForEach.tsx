import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';

import {
  useItemKeys,
  useRecycledRows,
  type RecycledSlotProps,
} from '../../recycling/useRecycledRows';
import { ListScrollContext } from './ListScrollContext';
import type { ListForEachProps } from './types';

type RowSizes = {
  measureAll: () => void;
  register: (measure: () => void) => () => void;
  report: (itemKey: string, height: number) => void;
};

const RowSizesContext = createContext<RowSizes | null>(null);

function asHTMLElement(value: unknown): HTMLElement | null {
  return typeof HTMLElement !== 'undefined' && value instanceof HTMLElement ? value : null;
}

// Index of the item at `offset`, clamped to the data.
function getIndexAt(offsets: Float64Array, offset: number): number {
  let low = 0;
  let high = offsets.length - 2;
  while (low < high) {
    const middle = (low + high + 1) >> 1;
    if (offsets[middle]! <= offset) low = middle;
    else high = middle - 1;
  }
  return low;
}

/**
 * Renders one row for each item of `data`, and reuses rows while the list scrolls.
 */
export function ListForEach<T>({ recycling = true, ...props }: ListForEachProps<T>) {
  return recycling ? <RecycledListForEach {...props} /> : <StaticListForEach {...props} />;
}

function StaticListForEach<T>({
  data,
  keyExtractor,
  children: renderItem,
}: Omit<ListForEachProps<T>, 'recycling'>) {
  const itemKeys = useItemKeys('List.ForEach', data, keyExtractor);
  return (
    <>
      {data.map((item, index) => (
        <Fragment key={itemKeys[index]}>{renderItem({ item, index })}</Fragment>
      ))}
    </>
  );
}

function RecycledListForEach<T>({
  data,
  keyExtractor,
  children: renderItem,
  overscanCount,
  estimatedItemSize = 64,
}: Omit<ListForEachProps<T>, 'recycling'>) {
  const { itemKeys, revision, rows, start, onWindowChange } = useRecycledRows({
    componentName: 'List.ForEach',
    Slot,
    data,
    keyExtractor,
    renderItem,
    overscanCount,
    estimatedItemSize,
  });
  const listRef = useContext(ListScrollContext);
  const containerRef = useRef(null);
  const heights = useRef(new Map<string, number>()).current;
  const [heightsVersion, setHeightsVersion] = useState(0);

  const rowSizes = useMemo<RowSizes>(() => {
    const measures = new Set<() => void>();
    return {
      measureAll: () => measures.forEach((measure) => measure()),
      register: (measure) => {
        measures.add(measure);
        return () => measures.delete(measure);
      },
      report: (itemKey, height) => {
        if (!(height > 0) || heights.get(itemKey) === height) return;
        heights.set(itemKey, height);
        setHeightsVersion((version) => version + 1);
      },
    };
  }, [heights]);

  // `offsets[i]` is the top of item `i`; the last entry is the total height.
  const offsets = useMemo(() => {
    const result = new Float64Array(itemKeys.length + 1);
    itemKeys.forEach((itemKey, index) => {
      result[index + 1] = result[index]! + (heights.get(itemKey) ?? estimatedItemSize);
    });
    return result;
    // `heightsVersion` tracks changes to `heights`.
  }, [itemKeys, estimatedItemSize, heights, heightsVersion]);

  const latest = useRef({ offsets, revision, onWindowChange });
  latest.current = { offsets, revision, onWindowChange };

  const updateWindow = useCallback(() => {
    const container = asHTMLElement(containerRef.current);
    const { offsets, revision, onWindowChange } = latest.current;
    if (!container || offsets.length < 2) return;
    const containerTop = container.getBoundingClientRect().top;
    let top = 0;
    let bottom = window.innerHeight;
    const list = asHTMLElement(listRef?.current);
    if (list) {
      const listRect = list.getBoundingClientRect();
      top = Math.max(top, listRect.top);
      bottom = Math.min(bottom, listRect.bottom);
    }
    const first = getIndexAt(offsets, top - containerTop);
    const last = getIndexAt(offsets, bottom - containerTop);
    onWindowChange({ first, last: Math.max(first, last), revision });
  }, [listRef]);

  useLayoutEffect(updateWindow, [updateWindow, offsets, revision]);

  useEffect(() => {
    if (!asHTMLElement(containerRef.current)) return;
    const options = { capture: true, passive: true };
    window.addEventListener('scroll', updateWindow, options);
    window.addEventListener('resize', updateWindow);
    return () => {
      window.removeEventListener('scroll', updateWindow, options);
      window.removeEventListener('resize', updateWindow);
    };
  }, [updateWindow]);

  // Row heights depend on the width.
  useEffect(() => {
    const container = asHTMLElement(containerRef.current);
    if (!container || typeof ResizeObserver === 'undefined') return;
    let width = container.getBoundingClientRect().width;
    const observer = new ResizeObserver(() => {
      const nextWidth = container.getBoundingClientRect().width;
      if (nextWidth === width) return;
      width = nextWidth;
      heights.clear();
      setHeightsVersion((version) => version + 1);
      rowSizes.measureAll();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [heights, rowSizes]);

  // Rotate the pool from slot order to item order, so the DOM order matches the screen.
  const pivot = rows.length === 0 ? 0 : start % rows.length;
  const orderedRows = [...rows.slice(pivot), ...rows.slice(0, pivot)];
  const end = start + rows.length;

  return (
    <RowSizesContext.Provider value={rowSizes}>
      <View ref={containerRef}>
        <View style={{ height: offsets[start] }} />
        {orderedRows}
        <View style={{ height: offsets[itemKeys.length]! - offsets[end]! }} />
      </View>
    </RowSizesContext.Provider>
  );
}

function Slot({ itemKey, children }: RecycledSlotProps) {
  const rowSizes = useContext(RowSizesContext);
  const ref = useRef(null);
  const itemKeyRef = useRef(itemKey);
  itemKeyRef.current = itemKey;

  const measure = useCallback(() => {
    const node = asHTMLElement(ref.current);
    if (node) rowSizes?.report(itemKeyRef.current, node.getBoundingClientRect().height);
  }, [rowSizes]);

  useLayoutEffect(measure, [measure, itemKey]);

  useEffect(() => {
    const node = asHTMLElement(ref.current);
    if (!node || !rowSizes || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    const unregister = rowSizes.register(measure);
    return () => {
      observer.disconnect();
      unregister();
    };
  }, [measure, rowSizes]);

  return <View ref={ref}>{children}</View>;
}
