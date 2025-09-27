import { requireNativeView } from 'expo';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { MaterialIcon } from './types';
import { ExpoModifier, ViewEvent } from '../../types';
import { getTextFromChildren } from '../../utils';

/**
 * The built-in button styles available on Android.
 * - `outlined` - A button with an outline.
 * - `elevated` - A filled button with a shadow.
 */
export type ButtonVariant = 'default' | 'bordered' | 'borderless' | 'outlined' | 'elevated';

/**
 * Colors for button's core elements.
 */
export type ButtonElementColors = {
  containerColor?: string;
  contentColor?: string;
  disabledContainerColor?: string;
  disabledContentColor?: string;
};

export type ButtonProps = {
  /**
   * A callback that is called when the button is pressed.
   */
  onPress?: () => void;
  /**
   * A string describing the leading icon to display in the button.
   * Uses Material Icons on Android.
   */
  leadingIcon?: MaterialIcon;
  /**
   * A string describing the trailing icon to display in the button.
   * Uses Material Icons on Android.
   */
  trailingIcon?: MaterialIcon;
  /**
   * A string describing the system image to display in the button.
   * Uses Material Icons on Android.
   * @deprecated Use `leadingIcon` instead.
   */
  systemImage?: MaterialIcon;
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
  children: string | string[];
  /**
   * Colors for button's core elements.
   * @platform android
   */
  elementColors?: ButtonElementColors;
  /**
   * Button color.
   */
  color?: string;
  /**
   * Disabled state of the button.
   */
  disabled?: boolean;

  /** Modifiers for the component */
  modifiers?: ExpoModifier[];
};

/**
 * @hidden
 */
export type NativeButtonProps = Omit<
  ButtonProps,
  'role' | 'onPress' | 'children' | 'leadingIcon' | 'trailingIcon' | 'systemImage'
> & {
  text: string;
  leadingIcon?: string;
  trailingIcon?: string;
} & ViewEvent<'onButtonPressed', void>;

// We have to work around the `role` and `onPress` props being reserved by React Native.
const ButtonNativeView: React.ComponentType<NativeButtonProps> = requireNativeView(
  'ExpoUI',
  'Button'
);

/**
 * @hidden
 */
export function transformButtonProps(props: ButtonProps): NativeButtonProps {
  const { children, onPress, leadingIcon, trailingIcon, systemImage, ...restProps } = props;

  // Handle backward compatibility: systemImage maps to leadingIcon
  const finalLeadingIcon = leadingIcon ?? systemImage;

  return {
    ...restProps,
    text: getTextFromChildren(children) ?? '',
    leadingIcon: finalLeadingIcon,
    trailingIcon,
    onButtonPressed: onPress,
    // @ts-expect-error
    modifiers: props.modifiers?.map((m) => m.__expo_shared_object_id__),
    elementColors: props.elementColors
      ? props.elementColors
      : props.color
        ? {
            containerColor: props.color,
          }
        : undefined,
  };
}

/**
 * Displays a native button component.
 */
export function Button(props: ButtonProps) {
  // Min height from https://m3.material.io/components/buttons/specs, minWidth
  return (
    <ButtonNativeView
      {...transformButtonProps(props)}
      style={StyleSheet.compose({ minWidth: 80, minHeight: 40 }, props.style)}
    />
  );
}
