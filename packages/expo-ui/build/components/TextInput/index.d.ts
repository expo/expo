import { StyleProp, ViewStyle } from 'react-native';
import { ViewEvent } from '../../src/types';
/**
 * @hidden Not used anywhere yet.
 */
export type TextInputRole = 'default' | 'cancel' | 'destructive';
/**
 * Props for the TextInput component.
 */
export type TextInputProps = {
    /**
     * Additional styles to apply to the TextInput.
     */
    style?: StyleProp<ViewStyle>;
    /**
     * Initial value that the TextInput displays when being mounted. As the TextInput is an uncontrolled component, change the key prop if you need to change the text value.
     */
    defaultValue?: string;
    /**
     * A callback triggered when user types in text into the TextInput.
     */
    onChangeText: (value: string) => void;
    /**
     * If true, the text input can be multiple lines.
     * While the content will wrap, there's no keyboard button to insert a new line.
     */
    multiline?: boolean;
    /**
     * The number of lines to display when `multiline` is set to true.
     * If the number of lines in the view is above this number, the view scrolls.
     * @default undefined, which means unlimited lines.
     */
    numberOfLines?: number;
    /**
     * Determines which keyboard to open, e.g., numeric.
     *
     * Types that work on both platforms:
     * - default
     * - numeric
     * - email-address
     * - phone-pad
     * - decimal-pad
     * - ascii-capable
     * - url
     *
     * Types that only work on Android:
     * - password
     * - password-numeric
     *
     * Types that only work on iOS:
     * - numbers-and-punctuation
     * - name-phone-pad
     * - twitter
     * - web-search
     * - ascii-capable-number-pad
     *
     * @default default
     */
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'ascii-capable' | 'numbers-and-punctuation' | 'url' | 'name-phone-pad' | 'decimal-pad' | 'twitter' | 'web-search' | 'ascii-capable-number-pad';
    /**
     * If true, autocorrection is enabled.
     * @default true
     */
    autocorrection?: boolean;
};
export type NativeTextInputProps = Omit<TextInputProps, 'onChangeText'> & {} & ViewEvent<'onValueChanged', {
    value: string;
}>;
export declare function TextInput(props: TextInputProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map