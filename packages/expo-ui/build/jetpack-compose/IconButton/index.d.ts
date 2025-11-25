import { ExpoModifier, ViewEvent } from '../../types';
import { ButtonElementColors } from '../Button';
import { ShapeJSXElement, ShapeProps } from '../Shape';
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
/**
 * @hidden
 */
export declare function transformIconButtonProps(props: IconButtonProps): NativeIconButtonProps;
/**
 * Displays a native button component.
 */
export declare function IconButton(props: IconButtonProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map