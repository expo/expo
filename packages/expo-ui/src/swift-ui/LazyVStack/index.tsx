import { requireNativeView } from 'expo';
import { type ReactElement } from 'react';

import { createLazyStackForEach } from '../LazyStackForEach';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface LazyVStackForEachProps<T> {
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

export interface LazyVStackProps extends CommonViewModifierProps {
  children: React.ReactNode;
  /**
   * The horizontal alignment of children within the stack.
   */
  alignment?: 'leading' | 'center' | 'trailing';
  /**
   * The spacing between children.
   */
  spacing?: number;
}

const LazyVStackNativeView: React.ComponentType<LazyVStackProps> = requireNativeView(
  'ExpoUI',
  'LazyVStackView'
);

export function LazyVStack(props: LazyVStackProps) {
  const { modifiers, ...restProps } = props;
  return (
    <LazyVStackNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
    />
  );
}

/**
 * A block of recycled rows inside `LazyVStack`. Only a small pool of rows around the visible
 * range is mounted. Rows that are not ready yet show a placeholder of `estimatedItemSize`, or of
 * the size last measured for that row.
 *
 * Mount it as a direct child of `LazyVStack`.
 * @platform ios
 */
export const LazyVStackForEach: <T>(props: LazyVStackForEachProps<T>) => ReactElement =
  createLazyStackForEach('LazyVStack.ForEach', 'vertical');

LazyVStack.ForEach = LazyVStackForEach;
