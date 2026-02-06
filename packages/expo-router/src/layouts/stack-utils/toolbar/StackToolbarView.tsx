'use client';
import type { NativeStackHeaderItemCustom } from '@react-navigation/native-stack';
import { useId, type ReactNode } from 'react';

import { useToolbarPlacement } from './context';
import { RouterToolbarItem } from '../../../toolbar/native';

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

/**
 * A wrapper to render custom content in the toolbar.
 *
 * Use inside `Stack.Toolbar` to render a custom React element.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 * import { Text } from 'react-native';
 *
 * function CustomElement() {
 *   return <Text>Custom Element</Text>;
 * }
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar>
 *         <Stack.Toolbar.View>
 *           <CustomElement />
 *         </Stack.Toolbar.View>
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
export const StackToolbarView: React.FC<StackToolbarViewProps> = (props) => {
  const placement = useToolbarPlacement();

  if (placement !== 'bottom') {
    throw new Error('Stack.Toolbar.View must be used inside a Stack.Toolbar');
  }

  return <NativeToolbarView {...props}>{props.children}</NativeToolbarView>;
};

export function convertStackToolbarViewPropsToRNHeaderItem(
  props: StackToolbarViewProps
): NativeStackHeaderItemCustom | undefined {
  if (props.hidden) {
    return undefined;
  }
  const { children, hidesSharedBackground } = props;
  if (!children) {
    console.warn(
      'Stack.Toolbar.View requires a child element to render custom content in the toolbar.'
    );
  }
  const element = children ? children : <></>;
  return {
    type: 'custom',
    element,
    hidesSharedBackground,
  };
}

// #region NativeToolbarView

interface NativeToolbarViewProps {
  children?: ReactNode;
  hidden?: boolean;
  hidesSharedBackground?: boolean;
  separateBackground?: boolean;
}

/**
 * Native toolbar view component for bottom toolbar.
 * Renders as RouterToolbarItem with children.
 */
const NativeToolbarView: React.FC<NativeToolbarViewProps> = ({
  children,
  hidden,
  hidesSharedBackground,
  separateBackground,
}) => {
  const id = useId();
  return (
    <RouterToolbarItem
      hidesSharedBackground={hidesSharedBackground}
      hidden={hidden}
      identifier={id}
      sharesBackground={!separateBackground}>
      {children}
    </RouterToolbarItem>
  );
};

// #endregion
