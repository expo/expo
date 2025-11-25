import { requireNativeView } from 'expo';

import { ExpoModifier, ViewEvent } from '../../types';
import { ButtonElementColors } from '../Button';
import { parseJSXShape, ShapeJSXElement, ShapeProps } from '../Shape';

/**
 * The built-in button styles available on Android.
 * - `outlined` - A button with an outline.
 * - `elevated` - A filled button with a shadow.
 */
export type IconButtonVariant = 'default' | 'bordered' | 'outlined';

export type IconButtonProps = {
  /**
   * A callback that is called when the button is pressed.
   */
  onPress?: () => void;
  /**
   * The button variant.
   */
  variant?: IconButtonVariant;
  /**
   * The text to display inside the button.
   */
  children?: React.JSX.Element;
  /**
   * Colors for button's core elements.
   * @platform android
   */
  elementColors?: ButtonElementColors;
  /**
   * Button color.
   */
  color?: string;
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
export type NativeIconButtonProps = Omit<IconButtonProps, 'role' | 'onPress' | 'shape'> & {
  shape: ShapeProps;
} & ViewEvent<'onButtonPressed', void>;

// We have to work around the `role` and `onPress` props being reserved by React Native.
const IconButtonNativeView: React.ComponentType<NativeIconButtonProps> = requireNativeView(
  'ExpoUI',
  'IconButton'
);

/**
 * @hidden
 */
export function transformIconButtonProps(props: IconButtonProps): NativeIconButtonProps {
  const { children, onPress, shape, ...restProps } = props;

  return {
    ...restProps,
    children,
    shape: parseJSXShape(shape),
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
export function IconButton(props: IconButtonProps) {
  return <IconButtonNativeView {...transformIconButtonProps(props)} />;
}
