import type { ColorValue } from 'react-native';
import type { CommonTextFieldProperties } from './shared';
import { type ObservableState } from '../../State';
import { type ShapeJSXElement } from '../Shape';
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
export type TextFieldProps = CommonTextFieldProperties & {
    /** @default false */
    isError?: boolean;
    /**
     * Shape used for the field's container outline/fill. Use the helpers from
     * `Shape` (for example, `<Shape.Pill />` or `<Shape.RoundedCorner cornerRadii={...} />`).
     * Defaults to the Material `OutlinedTextFieldDefaults.shape`/`TextFieldDefaults.shape`.
     */
    shape?: ShapeJSXElement;
    colors?: TextFieldColors;
};
export type OutlinedTextFieldProps = CommonTextFieldProperties & {
    /** @default false */
    isError?: boolean;
    /**
     * Shape used for the field's container outline/fill. Use the helpers from
     * `Shape` (for example, `<Shape.Pill />` or `<Shape.RoundedCorner cornerRadii={...} />`).
     * Defaults to the Material `OutlinedTextFieldDefaults.shape`/`TextFieldDefaults.shape`.
     */
    shape?: ShapeJSXElement;
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
export { type ObservableState };
//# sourceMappingURL=TextField.d.ts.map