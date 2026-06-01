import type { ColorValue } from 'react-native';
import type { CommonTextFieldProperties, TextFieldRef } from './shared';
/**
 * Imperative methods for `BasicTextField`. Identical to {@link TextFieldRef}.
 */
export type BasicTextFieldRef = TextFieldRef;
/**
 * Props for `BasicTextField`. Mirrors Compose's `BasicTextField`: a bare,
 * unstyled text field with no Material chrome (no container, indicator, or
 * built-in padding). Shares {@link CommonTextFieldProperties} with `TextField` and
 * `OutlinedTextField`; use `BasicTextField.DecorationBox` to add your own
 * decoration.
 */
export type BasicTextFieldProps = CommonTextFieldProperties & {
    /**
     * Color of the text cursor. Maps to Compose's `cursorBrush` via
     * `SolidColor(color)`. Defaults to black.
     */
    cursorColor?: ColorValue;
};
/**
 * A bare, unstyled Compose `BasicTextField` with no Material decoration.
 */
declare function BasicTextFieldComponent(props: BasicTextFieldProps): import("react/jsx-runtime").JSX.Element;
declare namespace BasicTextFieldComponent {
    var DecorationBox: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    var InnerTextField: () => import("react/jsx-runtime").JSX.Element;
}
export { BasicTextFieldComponent as BasicTextField };
//# sourceMappingURL=BasicTextField.d.ts.map