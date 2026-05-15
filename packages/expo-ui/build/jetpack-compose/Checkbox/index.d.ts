import type { ColorValue } from 'react-native';
import type { ModifierConfig } from '../../types';
/**
 * Colors for checkbox core elements.
 */
export type CheckboxColors = {
    checkedColor?: ColorValue;
    disabledCheckedColor?: ColorValue;
    uncheckedColor?: ColorValue;
    disabledUncheckedColor?: ColorValue;
    checkmarkColor?: ColorValue;
    disabledIndeterminateColor?: ColorValue;
};
export type CheckboxProps = {
    /**
     * Indicates whether the checkbox is checked.
     */
    value: boolean;
    /**
     * Whether the checkbox is enabled.
     * @default true
     */
    enabled?: boolean;
    /**
     * Callback function that is called when the checked state changes.
     */
    onCheckedChange?: (value: boolean) => void;
    /**
     * Colors for checkbox core elements.
     */
    colors?: CheckboxColors;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
};
/**
 * A checkbox component.
 */
export declare function Checkbox(props: CheckboxProps): import("react/jsx-runtime").JSX.Element;
/**
 * The toggleable state of a tri-state checkbox.
 */
export type ToggleableState = 'on' | 'off' | 'indeterminate';
export type TriStateCheckboxProps = {
    /**
     * The toggleable state of the checkbox: `'on'`, `'off'`, or `'indeterminate'`.
     */
    state: ToggleableState;
    /**
     * Whether the checkbox is enabled.
     * @default true
     */
    enabled?: boolean;
    /**
     * Callback function that is called when the checkbox is clicked.
     */
    onClick?: () => void;
    /**
     * Colors for checkbox core elements.
     */
    colors?: CheckboxColors;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
};
/**
 * A tri-state checkbox component that supports `'on'`, `'off'`, and `'indeterminate'` states.
 * Useful for "select all" patterns where the parent checkbox reflects the state of its children.
 */
export declare function TriStateCheckbox(props: TriStateCheckboxProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map