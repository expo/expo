import { StyleProp, ViewStyle } from 'react-native';
/**
 * Props for the Picker component.
 */
export type PickerProps = {
    /**
     * An array of options to be displayed in the picker.
     */
    options: string[];
    /**
     * The index of the currently selected option.
     */
    selectedIndex: number | null;
    /**
     * A label displayed on the picker when in `menu` variant inside a form section on iOS.
     * @platform iOS
     */
    label?: string;
    /**
     * Callback function that is called when an option is selected.
     */
    onOptionSelected?: (event: {
        nativeEvent: {
            index: number;
            label: string;
        };
    }) => void;
    /**
     * The variant of the picker, which determines its appearance and behavior.
     * The 'wheel' and 'menu' variants are iOS only.
     * @default 'segmented'
     */
    variant?: 'wheel' | 'segmented' | 'menu';
    /**
     * Optional style to apply to the picker component.
     */
    style?: StyleProp<ViewStyle>;
    /**
     * Colors for picker's core elements.
     * @platform android
     */
    elementColors?: {
        activeBorderColor?: string;
        activeContentColor?: string;
        inactiveBorderColor?: string;
        inactiveContentColor?: string;
        disabledActiveBorderColor?: string;
        disabledActiveContentColor?: string;
        disabledInactiveBorderColor?: string;
        disabledInactiveContentColor?: string;
        activeContainerColor?: string;
        inactiveContainerColor?: string;
        disabledActiveContainerColor?: string;
        disabledInactiveContainerColor?: string;
    };
    /**
     * Picker color. On iOS it only applies to the `menu` variant.
     */
    color?: string;
};
type NativePickerProps = PickerProps;
export declare function transformPickerProps(props: PickerProps): NativePickerProps;
export declare function Picker(props: PickerProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map