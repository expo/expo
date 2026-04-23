import type { Ref } from 'react';
import type { CommonViewModifierProps } from '../types';
/**
 * Can be used for imperatively setting text and focus on the `SecureField` component.
 */
export type SecureFieldRef = {
    setText: (newText: string) => Promise<void>;
    focus: () => Promise<void>;
    blur: () => Promise<void>;
};
export type SecureFieldProps = {
    ref?: Ref<SecureFieldRef>;
    /** Initial value displayed when mounted. Uncontrolled — change `key` to reset. */
    defaultValue?: string;
    /** If true, the field will be focused automatically when mounted. @default false */
    autoFocus?: boolean;
    /**
     * A text that is displayed when the field is empty.
     */
    placeholder?: string;
    /**
     * A callback triggered when the text value changes.
     */
    onValueChange?: (value: string) => void;
    /**
     * A callback triggered when the field gains or loses focus.
     */
    onFocusChange?: (focused: boolean) => void;
} & CommonViewModifierProps;
/**
 * Renders a SwiftUI `SecureField` for password input.
 */
export declare function SecureField(props: SecureFieldProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map