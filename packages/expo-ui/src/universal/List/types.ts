import type { ReactElement, ReactNode } from 'react';

/**
 * Props for the [`List`](#list) component.
 * A virtualized vertical container of rows.
 * Typically populated with [`ListItem`](#listitem) children, though any node is accepted.
 */
export interface ListProps {
  /**
   * The list rows. Usually `<ListItem>` elements.
   */
  children?: ReactNode;

  /**
   * Optional pull-to-refresh handler.
   * When provided, the list shows the platform-native refresh affordance.
   * The returned promise drives the indicator's visibility.
   *
   * @platform android
   * @platform ios
   */
  onRefresh?: () => Promise<void>;

  /**
   * Identifier used to locate the component in end-to-end tests.
   */
  testID?: string;
}

/**
 * Props for the `List.ForEach` component.
 * Renders one row for each item of `data`, and reuses rows while the list scrolls.
 */
export interface ListForEachProps<T> {
  /**
   * Items to display. Replace the array when updating data.
   */
  data: readonly T[];

  /**
   * Returns a stable, unique string key for each item.
   */
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
   *
   * @default true
   */
  recycling?: boolean;

  /**
   * Extra rows to prepare on each side of the visible rows. Must be a non-negative integer.
   * Ignored when `recycling` is `false`.
   *
   * @default 10
   */
  overscanCount?: number;

  /**
   * Placeholder height until a row is measured. Must be positive.
   * Ignored when `recycling` is `false`.
   * On Android, the value is in dp and is the full row height.
   * On iOS, the value is in points and excludes the `List` row insets.
   * On web, the value is in pixels and is the full row height.
   *
   * @default 64
   */
  estimatedItemSize?: number;
}
