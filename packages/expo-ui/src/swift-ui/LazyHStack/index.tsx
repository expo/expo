import { requireNativeView } from 'expo';
import { type ReactElement } from 'react';

import { createLazyStackForEach } from '../LazyStackForEach';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface LazyHStackForEachProps<T> {
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

export interface LazyHStackProps extends CommonViewModifierProps {
  children: React.ReactNode;
  /**
   * The spacing between children.
   */
  spacing?: number;
  /**
   * The vertical alignment of children within the stack.
   */
  alignment?: 'top' | 'center' | 'bottom' | 'firstTextBaseline' | 'lastTextBaseline';
}

const LazyHStackNativeView: React.ComponentType<LazyHStackProps> = requireNativeView(
  'ExpoUI',
  'LazyHStackView'
);

export function LazyHStack(props: LazyHStackProps) {
  const { modifiers, ...restProps } = props;
  return (
    <LazyHStackNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
    />
  );
}

/**
 * A block of recycled items inside `LazyHStack`. Only a small pool of items around the visible
 * range is mounted. Items that are not ready yet show a placeholder of `estimatedItemSize`, or of
 * the size last measured for that item.
 *
 * Mount it as a direct child of `LazyHStack`.
 * @platform ios
 */
export const LazyHStackForEach: <T>(props: LazyHStackForEachProps<T>) => ReactElement =
  createLazyStackForEach('LazyHStack.ForEach', 'horizontal');

LazyHStack.ForEach = LazyHStackForEach;
