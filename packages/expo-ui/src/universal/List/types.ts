import type { ReactNode, Ref } from 'react';

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

  /**
   * Forwarded to the underlying native view: the SwiftUI view on iOS, the Jetpack
   * Compose view on Android, or the rendered React Native element on web. An escape
   * hatch for advanced cases that need the native handle; not part of the public API.
   * @hidden
   */
  ref?: Ref<any>;
}
