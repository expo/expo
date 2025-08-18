import { StyleProp, ViewStyle } from 'react-native';
import { ExpoModifier } from '../../types';
/**
 * Colors for picker's core elements.
 */
export type PickerElementColors = {
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
     * The `'wheel'`, `'inline'`, `'palette'` and `'menu'` variants are iOS only, the `'radio'` variant is Android only. The `'inline'` variant can only be used inside sections or lists. The `'palette'` variant displays differently inside menus.
     * @default 'segmented'
     */
    variant?: 'segmented' | 'radio';
    /**
     * Optional style to apply to the picker component.
     */
    style?: StyleProp<ViewStyle>;
    /**
     * Colors for picker's core elements.
     */
    elementColors?: PickerElementColors;
    /**
     * Picker color.
     */
    color?: string;
    /** Modifiers for the component */
    modifiers?: ExpoModifier[];
    /** Modifiers for the individual buttons */
    buttonModifiers?: ExpoModifier[];
};
type NativePickerProps = PickerProps;
/**
 * @hidden
 */
export declare function transformPickerProps(props: PickerProps): NativePickerProps;
/**
 * Displays a native picker component. Depending on the variant it can be a segmented button, an inline picker, a list of choices or a radio button.
 */
export declare function Picker(props: PickerProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map