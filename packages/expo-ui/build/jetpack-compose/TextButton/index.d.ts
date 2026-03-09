import { type ColorValue } from 'react-native';
import { ExpoModifier } from '../../types';
export type TextButtonProps = {
    /**
     * The text content to display in the button.
     */
    children?: string | string[] | React.JSX.Element;
    /**
     * The color of the button text.
     */
    color?: ColorValue;
    /**
     * Whether the button is disabled.
     */
    disabled?: boolean;
    /**
     * Callback that is called when the button is pressed.
     */
    onPress?: () => void;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
};
/**
 * A text button component that displays a clickable text label.
 */
export declare function TextButton(props: TextButtonProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map