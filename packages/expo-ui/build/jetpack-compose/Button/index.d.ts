import { StyleProp, ViewStyle } from 'react-native';
import { MaterialIcon } from './types';
import { ViewEvent } from '../../types';
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
     * A string describing the system image to display in the button.
     * Uses Material Icons on Android.
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
    children: string;
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
};
/**
 * @hidden
 */
export type NativeButtonProps = Omit<ButtonProps, 'role' | 'onPress' | 'children' | 'systemImage'> & {
    text: string;
    systemImage?: string;
} & ViewEvent<'onButtonPressed', void>;
/**
 * @hidden
 */
export declare function transformButtonProps(props: ButtonProps): NativeButtonProps;
/**
 * Displays a native button component.
 */
export declare function Button(props: ButtonProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map