import { NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';
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
} & (SwitchSwitchVariantProps | SwitchCheckboxVariantProps | SwitchButtonVariantProps);
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
type NativeSwitchProps = Omit<SwitchProps, 'onValueChange'> & {
    onValueChange: (event: NativeSyntheticEvent<{
        value: boolean;
    }>) => void;
};
/**
 * @hidden
 */
export declare function transformSwitchProps(props: SwitchProps): NativeSwitchProps;
/**
 * `<Switch>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export declare function SwitchPrimitive(props: SwitchProps): import("react").JSX.Element;
/**
 * Displays a native switch component.
 */
export declare function Switch(props: SwitchProps & {
    style?: StyleProp<ViewStyle>;
}): import("react").JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map