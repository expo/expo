import { type CommonViewModifierProps } from '../types';
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
} & CommonViewModifierProps;
/**
 * Renders a `ColorPicker` component using SwiftUI.
 * @platform ios
 */
export declare function ColorPicker({ selection, onValueChanged, modifiers, ...restProps }: ColorPickerProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map