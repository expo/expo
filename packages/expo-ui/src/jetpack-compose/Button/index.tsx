import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { MaterialIcon } from './types';
import { ExpoModifier, ViewEvent } from '../../types';
import { getTextFromChildren } from '../../utils';
import { parseJSXShape, ShapeJSXElement, ShapeRecordProps } from '../Shape';

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
  containerColor?: ColorValue;
  contentColor?: ColorValue;
  disabledContainerColor?: ColorValue;
  disabledContentColor?: ColorValue;
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
   * The text to display inside the button.
   */
  children?: string | string[] | React.JSX.Element;
  /**
   * Colors for button's core elements.
   * @platform android
   */
  elementColors?: ButtonElementColors;
  /**
   * Button color.
   */
  color?: ColorValue;
  shape?: ShapeJSXElement;
  /**
   * Disabled state of the button.
   */
  disabled?: boolean;

  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
};

/**
 * @hidden
 */
export type NativeButtonProps = Omit<
  ButtonProps,
  'role' | 'onPress' | 'leadingIcon' | 'trailingIcon' | 'systemImage' | 'shape'
> & {
  text: string;
  leadingIcon?: string;
  trailingIcon?: string;
  shape?: ShapeRecordProps;
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
  const { children, onPress, leadingIcon, trailingIcon, systemImage, shape, ...restProps } = props;

  // Handle backward compatibility: systemImage maps to leadingIcon
  const finalLeadingIcon = leadingIcon ?? systemImage;

  return {
    ...restProps,
    text: getTextFromChildren(children) ?? '',
    children: getTextFromChildren(children) !== undefined ? undefined : children,
    leadingIcon: finalLeadingIcon,
    shape: parseJSXShape(shape),
    trailingIcon,
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

/**
 * Displays a native button component.
 */
export function Button(props: ButtonProps) {
  return <ButtonNativeView {...transformButtonProps(props)} />;
}
