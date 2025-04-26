import { StyleProp, ViewStyle } from 'react-native';
export type ColorPickerProps = {
    /**
     * The currently selected color in the format `#RRGGBB` or `#RRGGBBAA`.
     */
    selection: string | null;
    /**
     * A label displayed on the `ColorPicker`.
     */
    label?: string;
    /**
     * Callback function that is called when a new color is selected.
     */
    onValueChanged?: (value: string) => void;
    /**
     * Whether the color picker should support opacity.
     */
    supportsOpacity?: boolean;
};
/**
 * `<ColorPicker>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export declare function ColorPickerPrimitive({ selection, onValueChanged, ...restProps }: ColorPickerProps): import("react").JSX.Element;
/**
 * Renders a `ColorPicker` component using SwiftUI.
 * @platform ios
 */
export declare function ColorPicker(props: ColorPickerProps & {
    style?: StyleProp<ViewStyle>;
}): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map