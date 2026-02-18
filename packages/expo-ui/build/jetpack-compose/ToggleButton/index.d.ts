import { type ColorValue } from 'react-native';
import { type ExpoModifier } from '../../types';
export type ToggleButtonProps = {
    /**
     * Whether the toggle button is checked.
     */
    checked: boolean;
    /**
     * Text to display in the button.
     */
    text?: string;
    /**
     * The variant of the toggle button.
     * - `'default'` - Material 3 ToggleButton
     * - `'icon'` - Icon toggle button
     * - `'filledIcon'` - Filled icon toggle button
     * - `'outlinedIcon'` - Outlined icon toggle button
     * @default 'default'
     */
    variant?: 'default' | 'icon' | 'filledIcon' | 'outlinedIcon';
    /**
     * The color of the toggle button when checked.
     */
    color?: ColorValue;
    /**
     * Whether the button is disabled.
     */
    disabled?: boolean;
    /**
     * Callback that is called when the checked state changes.
     */
    onCheckedChange?: (checked: boolean) => void;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
    /**
     * The content to display inside the toggle button.
     */
    children?: React.ReactNode;
};
/**
 * A toggle button component that can be toggled on and off.
 *
 * When `text` prop is provided, it displays the text.
 * Otherwise, custom children can be passed to render custom content.
 */
declare function ToggleButton(props: ToggleButtonProps): import("react").JSX.Element;
declare namespace ToggleButton {
    var DefaultIconSpacing: any;
    var DefaultIconSize: any;
}
export { ToggleButton };
//# sourceMappingURL=index.d.ts.map