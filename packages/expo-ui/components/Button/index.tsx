import { requireNativeView } from 'expo';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { ViewEvent } from '../../src';

/**
 * The role of the button.
 * - `default` - The default button role.
 * - `cancel` - A button that cancels the current operation.
 * - `destructive` - A button that deletes data or performs a destructive action.
 * @platform ios
 */
export type ButtonRole = 'default' | 'cancel' | 'destructive';

/**
 * The built-in button styles available on iOS and Android.
 * Common styles:
 * - `default` - The default system button style.
 * - `bordered` - A button with a light fill. On Android equivalent to `FilledTonalButton`.
 * - `borderless` - A button with no background or border. On Android equivalent to `TextButton`.
 * Apple-only styles:
 * - `borderedProminent` - A bordered button with a prominent appearance.
 * - `plain` - A button with no border or background and a less prominent text.
 * MacOS-only styles:
 * - `accessoryBar` - A button style for accessory bars.
 * - `accessoryBarAction` - A button style for accessory bar actions.
 * - `card` - A button style for cards.
 * - `link` - A button style for links.
 * Android-only styles:
 * - `outlined` - A button with an outline.
 * - `elevated` - A filled button with a shadow.
 *
 * @platform android
 * @platform ios
 */
export type ButtonVariant =
  // Common
  | 'default'
  | 'bordered'
  | 'plain'
  // Apple-only
  | 'borderedProminent'
  | 'borderless'
  // MacOS-only;
  | 'accessoryBar'
  | 'accessoryBarAction'
  | 'card'
  | 'link'
  // Android-only;
  | 'outlined'
  | 'elevated';

export type ButtonProps = {
  /**
   * The text to display inside the button.
   */
  text: string;
  /**
   * A callback that is called when the button is pressed.
   */
  onPress?: () => void;
  /**
   * A string describing the system image to display in the button.
   * @platform ios
   */
  systemImage?: string;
  /**
   * Indicated the role of the button.
   * @platform ios
   */
  role?: ButtonRole;
  /**
   * The button variant.
   */
  variant?: ButtonVariant;
  /**
   * Additional styles to apply to the button.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * The text to display inside the button.
   */
  children: string;
  /**
   * Colors for button's core elements.
   * @platform android
   */
  colors?: {
    containerColor?: string;
    contentColor?: string;
    disabledContainerColor?: string;
    disabledContentColor?: string;
  };
};

export type NativeButtonProps = Omit<ButtonProps, 'children'> & {
  buttonRole?: ButtonRole;
  text: string;
  role?: null;
  onPress?: null;
} & ViewEvent<'onButtonPressed', void>;

// We have to work around the `role` and `onPress` props being reserved by React Native.
const ButtonNativeView: React.ComponentType<NativeButtonProps> = requireNativeView(
  'ExpoUI',
  'Button'
);

// We have to work around the `role` and `onPress` props being reserved by React Native.
export function transformButtonProps(props: ButtonProps): NativeButtonProps {
  return {
    ...props,
    text: props.children ?? '',
    buttonRole: props.role,
    onButtonPressed: props.onPress,
    role: null,
    onPress: null,
  };
}

export function Button(props: ButtonProps) {
  // Min height from https://m3.material.io/components/buttons/specs, minWidth
  return (
    <ButtonNativeView
      style={StyleSheet.compose({ minWidth: 80, minHeight: 40 }, props.style)}
      {...transformButtonProps(props)}
    />
  );
}
