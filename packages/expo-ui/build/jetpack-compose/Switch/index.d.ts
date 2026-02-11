import { NativeSyntheticEvent, type ColorValue } from 'react-native';
import { ExpoModifier } from '../../types';
/**
 * Only for switch.
 */
type SwitchElementColors = {
    checkedThumbColor?: ColorValue;
    checkedTrackColor?: ColorValue;
    uncheckedThumbColor?: ColorValue;
    uncheckedTrackColor?: ColorValue;
};
/**
 * Only for checkbox.
 */
type CheckboxElementColors = {
    checkedColor?: ColorValue;
    disabledCheckedColor?: ColorValue;
    uncheckedColor?: ColorValue;
    disabledUncheckedColor?: ColorValue;
    checkmarkColor?: ColorValue;
    disabledIndeterminateColor?: ColorValue;
};
export type SwitchProps = {
    /**
     * Indicates whether the switch is checked.
     */
    value: boolean;
    /**
     * Label for the switch.
     *
     * > On Android, the label has an effect only when the `Switch` is used inside a `ContextMenu`.
     */
    label?: string;
    /**
     * Type of the switch component. Can be `'checkbox'`, `'switch'`, or `'button'`.
     * @default 'switch'
     */
    variant?: 'checkbox' | 'switch' | 'button';
    /**
     * Callback function that is called when the checked state changes.
     */
    onValueChange?: (value: boolean) => void;
    /**
     * Picker color.
     */
    color?: ColorValue;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
} & (SwitchSwitchVariantProps | SwitchCheckboxVariantProps | SwitchButtonVariantProps);
export type SwitchSwitchVariantProps = {
    variant?: 'switch';
    /**
     * Colors for switch's core elements.
     * @platform android
     */
    elementColors?: SwitchElementColors;
};
export type SwitchCheckboxVariantProps = {
    variant: 'checkbox';
    /**
     * Colors for checkbox core elements.
     * @platform android
     */
    elementColors?: CheckboxElementColors;
};
export type SwitchButtonVariantProps = {
    variant: 'button';
    elementColors?: undefined;
};
type NativeSwitchProps = Omit<SwitchProps, 'onValueChange'> & {
    onValueChange: (event: NativeSyntheticEvent<{
        value: boolean;
    }>) => void;
};
/**
 * @hidden
 */
export declare function transformSwitchProps(props: SwitchProps): NativeSwitchProps;
export declare function Switch(props: SwitchProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map