import { Ref } from 'react';
import { TextFieldKeyboardType } from '../TextField';
import { type CommonViewModifierProps } from '../types';
/**
 * Can be used for imperatively setting text on the SecureField component.
 */
export type SecureFieldRef = {
    setText: (newText: string) => Promise<void>;
    focus: () => Promise<void>;
    blur: () => Promise<void>;
};
export type SecureFieldProps = {
    ref?: Ref<SecureFieldRef>;
    /**
     * Initial value that the SecureField displays when being mounted. As the SecureField is an uncontrolled component, change the key prop if you need to change the text value.
     */
    defaultValue?: string;
    /**
     * A text that is displayed when the field is empty.
     */
    placeholder?: string;
    /**
     * A callback triggered when user types in text into the SecureField.
     */
    onChangeText?: (value: string) => void;
    /**
     * A callback triggered when user submits the TextField by pressing the return key.
     */
    onSubmit?: (value: string) => void;
    /**
     * A callback triggered when user focuses or blurs the SecureField.
     */
    onChangeFocus?: (focused: boolean) => void;
    keyboardType?: TextFieldKeyboardType;
    /**
     * If true, the text input will be focused automatically when the component is mounted.
     * @default false
     */
    autoFocus?: boolean;
} & CommonViewModifierProps;
/**
 * Renders a `SecureField` component. Should mostly be used for embedding text inputs inside of SwiftUI lists and sections. Is an uncontrolled component.
 */
export declare function SecureField(props: SecureFieldProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map