import type { NativeStackHeaderItemButton } from '@react-navigation/native-stack';
import type { ReactNode } from 'react';

import {
  convertStackHeaderSharedPropsToRNSharedHeaderItem,
  type StackHeaderItemSharedProps,
} from './shared';

export interface StackHeaderButtonProps {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /**
   * There are two ways to specify the content of the header item:
   *
   * @example
   * ```tsx
   * import { Stack } from 'expo-router';
   *
   * ...
   * <Stack.Header.Button icon="star.fill">As text passed as children</Stack.Header.Button>
   * ```
   *
   * @example
   * ```tsx
   * import { Stack } from 'expo-router';
   *
   * ...
   * <Stack.Header.Button>
   *   <Stack.Header.Icon sf="star.fill" />
   *   <Stack.Header.Label>As components</Stack.Header.Label>
   *   <Stack.Header.Badge>3</Stack.Header.Badge>
   * </Stack.Header.Button>
   * ```
   *
   * **Note**: When icon is used, the label will not be shown and will be used for accessibility purposes only.
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
   * @see [Official Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/hidessharedbackground) for more information.
   *
   * @platform iOS 26+
   */
  hidesSharedBackground?: boolean;
  /**
   * Icon to display in the button.
   *
   * Can be a string representing an SFSymbol or an image source.
   */
  icon?: StackHeaderItemSharedProps['icon'];
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
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/isselected) for more information.
   */
  selected?: boolean;
  /**
   * Style for the label of the header item.
   */
  style?: StackHeaderItemSharedProps['style'];
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
 * A header button used inside `Stack.Header.Left` or `Stack.Header.Right`.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Screen() {
 *   return (
 *     <>
 *       <ScreenContent />
 *       <Stack.Screen>
 *         <Stack.Header>
 *           <Stack.Header.Left>
 *             <Stack.Header.Button tintColor="blue" icon="arrow.left.circle" onPress={() => alert('Left pressed')} />
 *             <Stack.Header.Button style={{ color: 'green' }} onPress={() => alert('2 pressed')}>
 *               <Stack.Header.Label>2</Stack.Header.Label>
 *             </Stack.Header.Button>
 *           </Stack.Header.Left>
 *         </Stack.Header>
 *       </Stack.Screen>
 *     </>
 *   );
 * }
 * ```
 *
 * @see [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/toolbars) for more information about navigation bar items on iOS.
 *
 * @platform ios
 */
export const StackHeaderButton: React.FC<StackHeaderButtonProps> = () => null;

export function convertStackHeaderButtonPropsToRNHeaderItem(
  props: StackHeaderButtonProps
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
