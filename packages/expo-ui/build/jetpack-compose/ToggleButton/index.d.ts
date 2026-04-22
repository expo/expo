import { type ColorValue } from 'react-native';
import type { ModifierConfig, ViewEvent } from '../../types';
/**
 * Colors for toggle button elements.
 */
export type ToggleButtonColors = {
    containerColor?: ColorValue;
    contentColor?: ColorValue;
    checkedContainerColor?: ColorValue;
    checkedContentColor?: ColorValue;
    disabledContainerColor?: ColorValue;
    disabledContentColor?: ColorValue;
};
export type ToggleButtonProps = {
    /**
     * Whether the toggle button is checked.
     */
    checked: boolean;
    /**
     * Callback that is called when the checked state changes.
     */
    onCheckedChange?: (checked: boolean) => void;
    /**
     * Whether the button is enabled for user interaction.
     * @default true
     */
    enabled?: boolean;
    /**
     * Colors for toggle button elements.
     */
    colors?: ToggleButtonColors;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Content to display inside the toggle button.
     */
    children: React.ReactNode;
};
type NativeToggleButtonProps = Omit<ToggleButtonProps, 'onCheckedChange' | 'children'> & {
    children?: React.ReactNode;
} & ViewEvent<'onCheckedChange', {
    checked: boolean;
}>;
/**
 * @hidden
 */
export declare function transformToggleButtonProps(props: Omit<ToggleButtonProps, 'children'>): NativeToggleButtonProps;
/**
 * A toggle button component that can be toggled on and off.
 */
declare const ToggleButton: {
    (props: ToggleButtonProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
} & {
    DefaultIconSpacing: number;
    DefaultIconSize: number;
};
/**
 * An icon toggle button with no background.
 */
declare const IconToggleButton: {
    (props: ToggleButtonProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
/**
 * A filled icon toggle button with a solid background.
 */
declare const FilledIconToggleButton: {
    (props: ToggleButtonProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
/**
 * An outlined icon toggle button with a border and no fill.
 */
declare const OutlinedIconToggleButton: {
    (props: ToggleButtonProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export { ToggleButton, IconToggleButton, FilledIconToggleButton, OutlinedIconToggleButton };
//# sourceMappingURL=index.d.ts.map