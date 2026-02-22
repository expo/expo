import { type ExpoModifier } from '../../types';
export type RadioButtonProps = {
    /**
     * Whether the radio button is selected.
     */
    selected: boolean;
    /**
     * Callback that is called when the radio button is clicked.
     */
    onClick?: () => void;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
};
/**
 * A Material Design radio button.
 */
export declare function RadioButton(props: RadioButtonProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map