import type { ReactNode } from 'react';

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
