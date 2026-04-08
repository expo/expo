import type { ReactNode } from 'react';

import type { NativeStackHeaderItemCustom } from '../../../../react-navigation/native-stack';

export interface StackToolbarViewProps {
  /**
   * Can be any React node.
   */
  children?: NativeStackHeaderItemCustom['element'];
  /**
   * Whether the view should be hidden.
   *
   * @default false
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
   */
  separateBackground?: boolean;
}

export interface NativeToolbarViewProps {
  children?: ReactNode;
  hidden?: boolean;
  hidesSharedBackground?: boolean;
  separateBackground?: boolean;
}
