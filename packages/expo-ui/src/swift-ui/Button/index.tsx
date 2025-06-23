import { requireNativeView } from 'expo';
import { StyleProp, ViewStyle } from 'react-native';

import { ViewEvent } from '../../types';
import { Host } from '../Host';

/**
 * The role of the button.
 * - `default` - The default button role.
 * - `cancel` - A button that cancels the current operation.
 * - `destructive` - A button that deletes data or performs a destructive action.
 */
export type ButtonRole = 'default' | 'cancel' | 'destructive';

/**
 * The built-in button styles available on iOS.
 *
 * Common styles:
 * - `default` - The default system button style.
 * - `bordered` - A button with a light fill. On Android, equivalent to `FilledTonalButton`.
 * - `borderless` - A button with no background or border. On Android, equivalent to `TextButton`.
 * - `borderedProminent` - A bordered button with a prominent appearance.
 * - `plain` - A button with no border or background and a less prominent text.
 * macOS-only styles:
 * - `glass` – A liquid glass button effect – (available only since iOS 26, for now only when built with beta version of Xcode)
 * - `accessoryBar` - A button style for accessory bars.
 * - `accessoryBarAction` - A button style for accessory bar actions.
 * - `card` - A button style for cards.
 * - `link` - A button style for links.
 */
export type ButtonVariant =
  // Common
  | 'default'
  | 'bordered'
  | 'plain'
  | 'glass'
  | 'borderedProminent'
  | 'borderless'
  // MacOS-only;
  | 'accessoryBar'
  | 'accessoryBarAction'
  | 'card'
  | 'link';

export type ButtonProps = {
  /**
   * A callback that is called when the button is pressed.
   */
  onPress?: () => void;
  /**
   * A string describing the system image to display in the button.
   * This is only used if `children` is a string.
   * Uses Material Icons on Android and SF Symbols on iOS.
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
   * The text or React node to display inside the button.
   */
  children: string | React.ReactNode;
  /**
   * Button color.
   */
  color?: string;
  /**
   * Disabled state of the button.
   */
  disabled?: boolean;
};

/**
 * @hidden
 */
export type NativeButtonProps = Omit<
  ButtonProps,
  'role' | 'onPress' | 'children' | 'systemImage'
> & {
  buttonRole?: ButtonRole;
  text: string | undefined;
  systemImage?: string;
} & ViewEvent<'onButtonPressed', void>;

// We have to work around the `role` and `onPress` props being reserved by React Native.
const ButtonNativeView: React.ComponentType<NativeButtonProps> = requireNativeView(
  'ExpoUI',
  'Button'
);

/**
 * @hidden
 */
export function transformButtonProps(
  props: Omit<ButtonProps, 'children'>,
  text: string | undefined
): NativeButtonProps {
  const { role, onPress, systemImage, ...restProps } = props;
  return {
    ...restProps,
    text,
    systemImage,
    buttonRole: role,
    onButtonPressed: onPress,
  };
}

/**
 * `<Button>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function ButtonPrimitive(props: ButtonProps) {
  const { children, ...restProps } = props;
  const text = typeof children === 'string' ? children : undefined;
  if (text !== undefined) {
    return <ButtonNativeView {...transformButtonProps(restProps, text)} />;
  }
  return <ButtonNativeView {...transformButtonProps(restProps, text)}>{children}</ButtonNativeView>;
}

/**
 * Displays a native button component.
 */
export function Button(props: ButtonProps & { style?: StyleProp<ViewStyle> }) {
  const useViewportSizeMeasurement = props.style == null;
  return (
    <Host style={props.style} matchContents useViewportSizeMeasurement={useViewportSizeMeasurement}>
      <ButtonPrimitive {...props} />
    </Host>
  );
}
