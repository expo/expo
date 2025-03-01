import { requireNativeView } from 'expo';
import { Platform, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { MaterialIcon } from './types';
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
   * A callback that is called when the button is pressed.
   */
  onPress?: () => void;
  /**
   * A string describing the system image to display in the button.
   * Uses SF Symbols on iOS and Material Icons on Android.
   */
  systemImage?: {
    ios?: string;
    android?: MaterialIcon;
  };
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
  elementColors?: {
    containerColor?: string;
    contentColor?: string;
    disabledContainerColor?: string;
    disabledContentColor?: string;
  };
  /**
   * Button color.
   */
  color?: string;
  /**
   * Disabled state of the button.
   */
  disabled?: boolean;
};

export type NativeButtonProps = Omit<
  ButtonProps,
  'role' | 'onPress' | 'children' | 'systemImage'
> & {
  buttonRole?: ButtonRole;
  text: string;
  systemImage?: string;
} & ViewEvent<'onButtonPressed', void>;

// We have to work around the `role` and `onPress` props being reserved by React Native.
const ButtonNativeView: React.ComponentType<NativeButtonProps> = requireNativeView(
  'ExpoUI',
  'Button'
);

export function transformButtonProps(props: ButtonProps): NativeButtonProps {
  const { role, children, onPress, systemImage, ...restProps } = props;
  return {
    ...restProps,
    children,
    text: 'hi',
    buttonRole: role,
    systemImage: systemImage?.[Platform.OS as 'ios' | 'android'],
    onButtonPressed: onPress,
    elementColors: props.elementColors
      ? props.elementColors
      : props.color
        ? {
            containerColor: props.color,
          }
        : undefined,
  };
}

export function Button(props: ButtonProps) {
  // Min height from https://m3.material.io/components/buttons/specs, minWidth
  return (
    <ButtonNativeView
      {...transformButtonProps(props)}
      style={StyleSheet.compose(
        Platform.OS === 'android' ? { minWidth: 80, minHeight: 40 } : {},
        props.style
      )}
    />
  );
}
