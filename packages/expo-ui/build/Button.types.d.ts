import type { StyleProp, ViewStyle } from 'react-native';
/**
 * The role of the button.
 * - `default` - The default button role.
 * - `cancel` - A button that cancels the current operation.
 * - `destructive` - A button that deletes data or performs a destructive action.
 * @platform ios
 */
export type ButtonRole = 'default' | 'cancel' | 'destructive';
export type ButtonStyle = 'default' | 'bordered' | 'plain' | 'borderedProminent' | 'borderless' | 'accessoryBar' | 'accessoryBarAction' | 'card' | 'link' | 'outlined' | 'elevated';
export type ButtonProps = {
    /**
     * The text to display inside the button.
     */
    text: string;
    /**
     * A callback that is called when the button is pressed.
     */
    onButtonPressed?: () => void;
    /**
     * A string describing the system image to display in the button.
     * @platform ios
     */
    systemImage?: string;
    /**
     * Indicated the role of the button.
     * @platform ios
     */
    buttonRole?: ButtonRole;
    /**
     * The button variant.
     */
    buttonStyle?: ButtonStyle;
    /**
     * Additional styles to apply to the button.
     */
    style?: StyleProp<ViewStyle>;
};
//# sourceMappingURL=Button.types.d.ts.map