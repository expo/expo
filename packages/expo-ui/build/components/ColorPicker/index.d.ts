import { StyleProp, ViewStyle } from 'react-native';
/**
 * Props for the ColorPicker component.
 */
export type ColorPickerProps = {
    /**
     * The currently selected color in the format `#RRGGBB` or `#RRGGBBAA`.
     */
    selection: string | null;
    /**
     * A label displayed on the ColorPicker.
     */
    label?: string;
    /**
     * Callback function that is called when a new color is selected.
     */
    onValueChanged?: (value: string) => void;
    /**
     * Optional style to apply to the ColorPicker component.
     */
    style?: StyleProp<ViewStyle>;
    /**
     * Whether the color picker should support opacity.
     */
    supportsOpacity?: boolean;
};
export declare function ColorPicker({ selection, onValueChanged, ...restProps }: ColorPickerProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map