import { type CommonViewModifierProps } from '../types';
export type SwitchProps = {
    /**
     * Indicates whether the switch is checked.
     */
    value: boolean;
    /**
     * Label for the switch.
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
     * Picker color. On iOS, it only applies to the `menu` variant.
     */
    color?: string;
} & (SwitchSwitchVariantProps | SwitchCheckboxVariantProps | SwitchButtonVariantProps) & CommonViewModifierProps;
export type SwitchSwitchVariantProps = {
    variant?: 'switch';
};
export type SwitchCheckboxVariantProps = {
    variant: 'checkbox';
};
export type SwitchButtonVariantProps = {
    variant: 'button';
    elementColors?: undefined;
};
/**
 * Displays a native switch component.
 */
export declare function Switch(props: SwitchProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map