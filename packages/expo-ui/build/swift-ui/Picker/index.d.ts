import { type CommonViewModifierProps } from '../types';
export type PickerProps = {
    /**
     * A label displayed on the picker.
     */
    label?: string | React.ReactNode;
    /**
     * The selected optio `tag` value.
     */
    selection?: string;
    /**
     * Callback function that is called when an option is selected.
     * Gets called with the selected `tag` value.
     */
    onSelectionChange?: (event: {
        nativeEvent: {
            selection: string;
        };
    }) => void;
    /**
     * The content of the picker.
     */
    children?: React.ReactNode;
} & CommonViewModifierProps;
export declare const PickerContentNativeView: React.ComponentType<PickerProps>;
/**
 * Displays a native picker component
 */
export declare function Picker(props: PickerProps): import("react").JSX.Element;
export declare namespace Picker {
    const Content: import("react").ComponentType<PickerProps>;
}
//# sourceMappingURL=index.d.ts.map