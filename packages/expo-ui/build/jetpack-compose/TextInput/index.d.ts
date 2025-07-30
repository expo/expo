import React from 'react';
import { ViewEvent } from '../../types';
import { StyleProp, ViewStyle } from "react-native";
/**
 * @hidden Not used anywhere yet.
 */
export type TextInputRole = 'default' | 'cancel' | 'destructive';
interface TextStyleProps {
    color?: string;
    size?: number;
    lineHeight?: number;
    letterSpacing?: number;
    height?: number;
    fontFamily?: string;
    fontWeight?: string;
}
export type TextInputProps = {
    /**
     * Additional styles to apply to the TextInput.
     */
    style?: StyleProp<ViewStyle>;
    /**
     * Additional styles to apply to the TextInput.
     */
    textStyle?: TextStyleProps;
    /**
     * Initial value that the TextInput displays when being mounted. As the TextInput is an uncontrolled component, change the key prop if you need to change the text value.
     */
    defaultValue?: string;
    /**
     * The string that will be rendered before text input has been entered.
     */
    placeholder?: string;
    /**
     * A callback triggered when user types in text into the TextInput.
     */
    onChangeText?: (value: string) => void;
    /**
     * A callback triggered when user focus TextInput.
     */
    onTextFieldFocus?: () => void;
    /**
     * A callback triggered when user blur TextInput.
     */
    onTextFieldBlur?: () => void;
    /**
     * The string that will be rendered before text input has been entered.
     */
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
     * Determines which keyboard to open. For example, `'numeric'`.
     *
     * Available options:
     * - default
     * - numeric
     * - email-address
     * - phone-pad
     * - decimal-pad
     * - ascii-capable
     * - url
     * - password
     * - password-numeric
     *
     * @default default
     */
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'ascii-capable' | 'url' | 'decimal-pad';
    /**
     * If true, autocorrection is enabled.
     * @default true
     */
    autocorrection?: boolean;
    /**
     * If true, the text input is editable.
     */
    editable?: boolean;
    /**
     * The string with the testId for E2E tests.
     */
    testID?: string;
    /**
     * If true, password text field will be showed.
     */
    secureEntry?: boolean;
    /**
     * The mask that should be aplied to the field. Please follow the following pattern:
     * [0]: mandatory digit. For instance, [000] will allow entering three digits: 123.
       [9]: optional digit.For instance, [00099] will allow entering up to five digits, but at least three.
       [A]: mandatory letter. For instance, [AAA] will allow entering three letters: ABC.
       [a]: optional letter. [АААааа] will allow entering from three to six letters.
       [_]: mandatory symbol (digit or letter).
       [-]: optional symbol (digit or letter).
       […]: ellipsis. Allows to enter endless count of symbols.
     */
    mask?: string;
};
export type NativeTextInputProps = Omit<TextInputProps, 'onChangeText'> & {} & ViewEvent<'onValueChanged', {
    value: string;
}>;
/**
 * Renders a `TextInput` component.
 */
export declare function TextInput(props: TextInputProps): React.JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map