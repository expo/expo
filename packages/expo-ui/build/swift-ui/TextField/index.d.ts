import { Ref } from 'react';
import { type ViewEvent } from '../../types';
import { type CommonViewModifierProps } from '../types';
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
 * - numbers-and-punctuation
 * - name-phone-pad
 * - twitter
 * - web-search
 * - ascii-capable-number-pad
 *
 * @default default
 */
export type TextFieldKeyboardType = 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'ascii-capable' | 'numbers-and-punctuation' | 'url' | 'name-phone-pad' | 'decimal-pad' | 'twitter' | 'web-search' | 'ascii-capable-number-pad';
/**
 * Can be used for imperatively setting text and focus on the TextField component.
 */
export type TextFieldRef = {
    setText: (newText: string) => Promise<void>;
    focus: () => Promise<void>;
    blur: () => Promise<void>;
    /**
     * Programmatically select text using start and end indices.
     * @platform ios 18.0+ tvos 18.0+
     */
    setSelection: (start: number, end: number) => Promise<void>;
};
export type TextFieldProps = {
    ref?: Ref<TextFieldRef>;
    /**
     * Initial value that the TextField displays when being mounted. As the TextField is an uncontrolled component, change the key prop if you need to change the text value.
     */
    defaultValue?: string;
    /**
     * A text that is displayed when the field is empty.
     */
    placeholder?: string;
    /**
     * A callback triggered when user types in text into the TextField.
     */
    onChangeText?: (value: string) => void;
    /**
     * A callback triggered when user focuses or blurs the TextField.
     */
    onChangeFocus?: (focused: boolean) => void;
    /**
     * A callback triggered when user submits the TextField by pressing the return key.
     */
    onSubmit?: (value: string) => void;
    /**
     * A callback triggered when user selects text in the TextField.
     * @platform ios 18.0+ tvos 18.0+
     */
    onChangeSelection?: ({ start, end }: {
        start: number;
        end: number;
    }) => void;
    /**
     * If true, the text input can be multiple lines.
     * While the content will wrap, there's no keyboard button to insert a new line.
     */
    multiline?: boolean;
    /**
     * If true, the text input will add new lines when the user presses the return key.
     * @default true
     */
    allowNewlines?: boolean;
    /**
     * The number of lines to display when `multiline` is set to true.
     * If the number of lines in the view is above this number, the view scrolls.
     * @default undefined, which means unlimited lines.
     */
    numberOfLines?: number;
    keyboardType?: TextFieldKeyboardType;
    /**
     * If true, autocorrection is enabled.
     * @default true
     */
    autocorrection?: boolean;
    /**
     * If true, the text input will be focused automatically when the component is mounted.
     * @default false
     */
    autoFocus?: boolean;
} & CommonViewModifierProps;
export type NativeTextFieldProps = Omit<TextFieldProps, 'onChangeText' | 'onSubmit'> & {} & ViewEvent<'onValueChanged', {
    value: string;
}> & ViewEvent<'onFocusChanged', {
    value: boolean;
}> & ViewEvent<'onSelectionChanged', {
    start: number;
    end: number;
}> & ViewEvent<'onSubmit', {
    value: string;
}>;
/**
 * Renders a `TextField` component. Should mostly be used for embedding text inputs inside of SwiftUI lists and sections. Is an uncontrolled component.
 */
export declare function TextField(props: TextFieldProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map