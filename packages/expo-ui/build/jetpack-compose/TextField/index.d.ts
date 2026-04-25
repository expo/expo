import type { Ref } from 'react';
import type { ColorValue } from 'react-native';
import type { ModifierConfig } from '../../types';
/**
 * Can be used for imperatively setting text and focus on the `TextField` component.
 */
export type TextFieldRef = {
    setText: (newText: string) => Promise<void>;
    focus: () => Promise<void>;
    blur: () => Promise<void>;
};
export type TextFieldCapitalization = 'none' | 'characters' | 'words' | 'sentences';
export type TextFieldKeyboardType = 'text' | 'number' | 'email' | 'phone' | 'decimal' | 'password' | 'ascii' | 'uri' | 'numberPassword';
export type TextFieldImeAction = 'default' | 'none' | 'go' | 'search' | 'send' | 'previous' | 'next' | 'done';
/**
 * Keyboard options matching Compose `KeyboardOptions`.
 */
export type TextFieldKeyboardOptions = {
    /** @default 'none' */
    capitalization?: TextFieldCapitalization;
    /** @default true */
    autoCorrectEnabled?: boolean;
    /** @default 'text' */
    keyboardType?: TextFieldKeyboardType;
    /** @default 'default' */
    imeAction?: TextFieldImeAction;
};
/**
 * Keyboard actions matching Compose `KeyboardActions`.
 * The triggered callback depends on the `imeAction` in `keyboardOptions`.
 */
export type TextFieldKeyboardActions = {
    onDone?: (value: string) => void;
    onGo?: (value: string) => void;
    onNext?: (value: string) => void;
    onPrevious?: (value: string) => void;
    onSearch?: (value: string) => void;
    onSend?: (value: string) => void;
};
/**
 * Colors for `TextField` and `OutlinedTextField`.
 * Maps to `TextFieldColors` in Compose, shared by both variants.
 */
export type TextFieldColors = {
    focusedTextColor?: ColorValue;
    unfocusedTextColor?: ColorValue;
    disabledTextColor?: ColorValue;
    errorTextColor?: ColorValue;
    focusedContainerColor?: ColorValue;
    unfocusedContainerColor?: ColorValue;
    disabledContainerColor?: ColorValue;
    errorContainerColor?: ColorValue;
    cursorColor?: ColorValue;
    errorCursorColor?: ColorValue;
    focusedIndicatorColor?: ColorValue;
    unfocusedIndicatorColor?: ColorValue;
    disabledIndicatorColor?: ColorValue;
    errorIndicatorColor?: ColorValue;
    focusedLeadingIconColor?: ColorValue;
    unfocusedLeadingIconColor?: ColorValue;
    disabledLeadingIconColor?: ColorValue;
    errorLeadingIconColor?: ColorValue;
    focusedTrailingIconColor?: ColorValue;
    unfocusedTrailingIconColor?: ColorValue;
    disabledTrailingIconColor?: ColorValue;
    errorTrailingIconColor?: ColorValue;
    focusedLabelColor?: ColorValue;
    unfocusedLabelColor?: ColorValue;
    disabledLabelColor?: ColorValue;
    errorLabelColor?: ColorValue;
    focusedPlaceholderColor?: ColorValue;
    unfocusedPlaceholderColor?: ColorValue;
    disabledPlaceholderColor?: ColorValue;
    errorPlaceholderColor?: ColorValue;
    focusedSupportingTextColor?: ColorValue;
    unfocusedSupportingTextColor?: ColorValue;
    disabledSupportingTextColor?: ColorValue;
    errorSupportingTextColor?: ColorValue;
    focusedPrefixColor?: ColorValue;
    unfocusedPrefixColor?: ColorValue;
    disabledPrefixColor?: ColorValue;
    errorPrefixColor?: ColorValue;
    focusedSuffixColor?: ColorValue;
    unfocusedSuffixColor?: ColorValue;
    disabledSuffixColor?: ColorValue;
    errorSuffixColor?: ColorValue;
};
/** Shared props between `TextField` and `OutlinedTextField`. */
type BaseTextFieldProps = {
    ref?: Ref<TextFieldRef>;
    /** Initial value displayed when mounted. Uncontrolled — change `key` to reset. */
    defaultValue?: string;
    /** If true, the text field will be focused automatically when mounted. @default false */
    autoFocus?: boolean;
    /** @default true */
    enabled?: boolean;
    /** @default false */
    readOnly?: boolean;
    /** @default false */
    isError?: boolean;
    /** @default false */
    singleLine?: boolean;
    maxLines?: number;
    minLines?: number;
    keyboardOptions?: TextFieldKeyboardOptions;
    keyboardActions?: TextFieldKeyboardActions;
    /** A callback triggered when user types text. */
    onValueChange?: (value: string) => void;
    /** A callback triggered when the field gains or loses focus. */
    onFocusChanged?: (focused: boolean) => void;
    shape?: object;
    modifiers?: ModifierConfig[];
    /** Slot children (e.g. `TextField.Label`, `TextField.Placeholder`). */
    children?: React.ReactNode;
};
export type TextFieldProps = BaseTextFieldProps & {
    colors?: TextFieldColors;
};
export type OutlinedTextFieldProps = BaseTextFieldProps & {
    colors?: TextFieldColors;
};
/**
 * A Material3 `TextField`.
 */
declare function TextFieldComponent(props: TextFieldProps): import("react/jsx-runtime").JSX.Element;
declare namespace TextFieldComponent {
    var Label: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    var Placeholder: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    var LeadingIcon: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    var TrailingIcon: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    var Prefix: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    var Suffix: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    var SupportingText: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
}
/**
 * A Material3 `OutlinedTextField` with a transparent background and border outline.
 */
declare function OutlinedTextFieldComponent(props: OutlinedTextFieldProps): import("react/jsx-runtime").JSX.Element;
declare namespace OutlinedTextFieldComponent {
    var Label: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    var Placeholder: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    var LeadingIcon: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    var TrailingIcon: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    var Prefix: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    var Suffix: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    var SupportingText: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
}
export { TextFieldComponent as TextField, OutlinedTextFieldComponent as OutlinedTextField };
//# sourceMappingURL=index.d.ts.map