import { type ColorValue } from 'react-native';
import { MaterialIcon } from '../Button/types';
import { ExpoModifier, ViewEvent } from '../../types';
import { ButtonElementColors } from '../Button';
import { ShapeJSXElement, ShapeRecordProps } from '../Shape';
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
     * A string describing the system image to display in the icon button.
     * Uses Material Icons on Android.
     */
    systemImage?: MaterialIcon;
    /**
     * The button variant.
     */
    variant?: IconButtonVariant;
    /**
     * The content to display inside the button.
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
export type NativeIconButtonProps = Omit<IconButtonProps, 'role' | 'onPress' | 'systemImage' | 'shape'> & {
    systemImage?: string;
    shape?: ShapeRecordProps;
} & ViewEvent<'onButtonPressed', void>;
/**
 * Displays a native button component.
 */
export declare function IconButton(props: IconButtonProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map