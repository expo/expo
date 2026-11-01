import type { ReactNode } from 'react';
import type { ColorValue } from 'react-native';

import type { NativeStackHeaderItemCustom } from '../../../../react-navigation/native-stack';

export interface StackToolbarViewProps {
  /**
   * Can be any React node.
   *
   * @platform android
   * @platform ios
   */
  children?: NativeStackHeaderItemCustom['element'];
  /**
   * Whether the view should be hidden.
   *
   * @default false
   *
   * @platform android
   * @platform ios
   */
  hidden?: boolean;
  /**
   * Whether to hide the shared background.
   *
   * @see [Official Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/hidessharedbackground) for more information.
   *
   * @platform iOS 26+
   */
  hidesSharedBackground?: boolean;
  // TODO(@ubax): implement missing props in react-native-screens
  /**
   * Whether to separate the background of this item from other items.
   *
   * Only available in bottom placement.
   *
   * @default false
   * @platform ios
   */
  separateBackground?: boolean;
  /**
   * The item's tint. A `prominent` item uses it as its background.
   *
   * Only available in bottom placement.
   *
   * @platform ios
   */
  tintColor?: ColorValue;
  /**
   * The item's style. A `prominent` item has a tinted background, like a `Stack.Toolbar.Button`
   * with the same variant.
   *
   * Only available in bottom placement.
   *
   * @default 'plain'
   * @platform ios
   */
  variant?: 'plain' | 'prominent';
}

export interface NativeToolbarViewProps {
  children?: ReactNode;
  hidden?: boolean;
  hidesSharedBackground?: boolean;
  separateBackground?: boolean;
  tintColor?: ColorValue;
  variant?: 'plain' | 'prominent';
}
