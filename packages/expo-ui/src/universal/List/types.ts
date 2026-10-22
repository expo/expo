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
 */
export interface ListForEachProps<T> {
  /**
   * Items to display. Pass a new array to update.
   */
  data: readonly T[];

  /**
   * Returns a stable, unique string key for each item.
   */
  keyExtractor: (item: T, index: number) => string;

  /**
   * Renders a row. Wrap it in `useCallback`, or every row re-renders on each parent render.
   * A recycled row keeps its local state (`useState`) when it shows another item.
   */
  children: (info: { item: T; index: number }) => ReactElement;

  /**
   * Renders only the rows near the visible range. Set to `false` to render every row.
   * Changing it remounts the rows.
   *
   * @default true
   */
  recycling?: boolean;

  /**
   * Extra rows to render above and below the visible rows.
   *
   * @default 10
   */
  overscanCount?: number;

  /**
   * Row height to use until a row is measured: dp on Android, points on iOS (without the row
   * insets), and pixels on web.
   *
   * @default 64
   */
  estimatedItemSize?: number;
}
