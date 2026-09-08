import type { ColorValue } from 'react-native';
import { type ModifierConfig } from '../../types';
/**
 * Colors for the radio button in different states.
 */
export type RadioButtonColors = {
    selectedColor?: ColorValue;
    unselectedColor?: ColorValue;
    disabledSelectedColor?: ColorValue;
    disabledUnselectedColor?: ColorValue;
};
export interface RadioButtonProps {
    /**
     * Whether the radio button is selected.
     */
    selected: boolean;
    /**
     * Whether the radio button is enabled.
     * @default true
     */
    enabled?: boolean;
    /**
     * Callback that is called when the radio button is clicked.
     */
    onClick?: () => void;
    /**
     * Colors for the radio button in different states.
     */
    colors?: RadioButtonColors;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
}
/**
 * A Material Design radio button.
 */
export declare function RadioButton(props: RadioButtonProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map