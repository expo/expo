'use client';
import type { NativeStackHeaderItemButton } from '@react-navigation/native-stack';
import type { ImageRef } from 'expo-image';
import type { ReactNode } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import { NativeToolbarButton } from './bottom-toolbar-native-elements';
import { useToolbarPlacement } from './context';
import {
  convertStackHeaderSharedPropsToRNSharedHeaderItem,
  type StackHeaderItemSharedProps,
} from '../shared';

export interface StackToolbarButtonProps {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /**
   * There are two ways to specify the content of the button:
   *
   * @example
   * ```tsx
   * import { Stack } from 'expo-router';
   *
   * export default function Page() {
   *   return (
   *     <>
   *       <Stack.Toolbar placement="left">
   *         <Stack.Toolbar.Button icon="star.fill">As text passed as children</Stack.Toolbar.Button>
   *       </Stack.Toolbar>
   *       <ScreenContent />
   *     </>
   *   );
   * }
   * ```
   *
   * @example
   * ```tsx
   * import { Stack } from 'expo-router';
   *
   * export default function Page() {
   *   return (
   *     <>
   *       <Stack.Toolbar placement="left">
   *         <Stack.Toolbar.Button>
   *           <Stack.Toolbar.Icon sf="star.fill" />
   *           <Stack.Toolbar.Label>As components</Stack.Toolbar.Label>
   *           <Stack.Toolbar.Badge>3</Stack.Toolbar.Badge>
   *         </Stack.Toolbar.Button>
   *       </Stack.Toolbar>
   *       <ScreenContent />
   *     </>
   *   );
   * }
   * ```
   *
   * > **Note**: When icon is used, the label will not be shown and will be used for accessibility purposes only. Badge is only supported in left/right placements, not in bottom (iOS toolbar limitation).
   */
  children?: ReactNode;
  disabled?: boolean;
  /**
   * Whether the button should be hidden.
   *
   * @default false
   */
  hidden?: boolean;
  /**
   * Whether to hide the shared background.
   *
   * @platform iOS 26+
   */
  hidesSharedBackground?: boolean;
  /**
   * Icon to display in the button.
   *
   * Can be a string representing an SFSymbol or an image source.
   *
   * > **Note**: When used in `placement="bottom"`, only string SFSymbols are supported. Use the `image` prop to provide custom images.
   */
  icon?: StackHeaderItemSharedProps['icon'];
  // TODO(@ubax): Add useImage support in a follow-up PR.
  /**
   * Image to display in the button.
   *
   * > **Note**: This prop is only supported in toolbar with `placement="bottom"`.
   */
  image?: ImageRef;
  onPress?: () => void;
  /**
   * Whether to separate the background of this item from other header items.
   *
   * @default false
   */
  separateBackground?: boolean;
  /**
   * Whether the button is in a selected state
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/isselected) for more information
   */
  selected?: boolean;
  /**
   * Style for the label of the header item.
   */
  style?: StyleProp<TextStyle>;
  /**
   * The tint color to apply to the button item
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/tintcolor) for more information.
   */
  tintColor?: StackHeaderItemSharedProps['tintColor'];
  /**
   * @default 'plain'
   */
  variant?: StackHeaderItemSharedProps['variant'];
}

/**
 * A button used inside `Stack.Toolbar`.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Toolbar placement="left">
 *           <Stack.Toolbar.Button icon="arrow.left.circle" onPress={() => alert('Left pressed')} />
 *         </Stack.Toolbar>
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar placement="left">
 *         <Stack.Toolbar.Button icon="arrow.left.circle" onPress={() => alert('Left pressed')} />
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
export const StackToolbarButton: React.FC<StackToolbarButtonProps> = (props) => {
  const placement = useToolbarPlacement();

  if (placement === 'bottom') {
    // TODO(@ubax): Handle image loading using useImage in a follow-up PR.
    const icon = typeof props.icon === 'string' ? props.icon : undefined;
    return <NativeToolbarButton {...props} icon={icon} image={props.image} />;
  }

  return null;
};

export function convertStackToolbarButtonPropsToRNHeaderItem(
  props: StackToolbarButtonProps
): NativeStackHeaderItemButton | undefined {
  if (props.hidden) {
    return undefined;
  }

  return {
    ...convertStackHeaderSharedPropsToRNSharedHeaderItem(props),
    type: 'button',
    onPress: props.onPress ?? (() => {}),
    selected: !!props.selected,
  };
}
