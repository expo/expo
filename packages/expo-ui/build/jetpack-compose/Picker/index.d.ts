import { type ColorValue } from 'react-native';
import { ExpoModifier } from '../../types';
/**
 * Colors for picker's core elements.
 */
export type PickerElementColors = {
    activeBorderColor?: ColorValue;
    activeContentColor?: ColorValue;
    inactiveBorderColor?: ColorValue;
    inactiveContentColor?: ColorValue;
    disabledActiveBorderColor?: ColorValue;
    disabledActiveContentColor?: ColorValue;
    disabledInactiveBorderColor?: ColorValue;
    disabledInactiveContentColor?: ColorValue;
    activeContainerColor?: ColorValue;
    inactiveContainerColor?: ColorValue;
    disabledActiveContainerColor?: ColorValue;
    disabledInactiveContainerColor?: ColorValue;
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
     * @default 'segmented'
     */
    variant?: 'segmented' | 'radio';
    /**
     * Colors for picker's core elements.
     */
    elementColors?: PickerElementColors;
    /**
     * Picker color.
     */
    color?: ColorValue;
    /**
     * Modifiers for the component.
     */
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