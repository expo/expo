import type { Ref } from 'react';
import type { ColorValue, KeyboardTypeOptions, ReturnKeyTypeOptions } from 'react-native';
import type { ObservableState } from '../State';
/**
 * Imperative methods exposed via the `TextInput` ref.
 */
export type TextInputRef = {
    /** Programmatically focus the input. */
    focus: () => Promise<void>;
    /** Programmatically blur the input. */
    blur: () => Promise<void>;
    /** Clear the current text. */
    clear: () => void;
};
/**
 * Props for the `TextInput` component.
 */
export interface TextInputProps {
    /**
     * Ref exposing imperative methods (`focus`, `blur`, `clear`).
     */
    ref?: Ref<TextInputRef>;
    /**
     * An observable state holding the current text. Create one with
     * `useNativeState('initial value')` from `@expo/ui`.
     * Omit to let the field manage its own internal state.
     */
    value?: ObservableState<string>;
    /**
     * Called every time the text value changes. Receives the new string,
     */
    onChangeText?: (text: string) => void;
    /**
     * Placeholder text shown when the field is empty.
     */
    placeholder?: string;
    /**
     * If true, focuses the input on mount.
     * @default false
     */
    autoFocus?: boolean;
    /**
     * If false, the input cannot be edited. Selection is still allowed so the
     * user can copy text out of the field.
     * @default true
     */
    editable?: boolean;
    /**
     * If true, the field accepts multiple lines of input and grows vertically
     * as the user types.
     * @default false
     */
    multiline?: boolean;
    /**
     * Determines which keyboard variant is shown.
     *
     * Lacking native support:
     * - iOS: `'visible-password'` falls back to the default keyboard.
     * - Android: iOS-specific values (`'ascii-capable'`,
     *   `'numbers-and-punctuation'`, `'name-phone-pad'`, `'twitter'`,
     *   `'web-search'`) fall back to the text keyboard.
     *
     * @default 'default'
     */
    keyboardType?: KeyboardTypeOptions;
    /**
     * Controls automatic capitalization of input.
     * @default 'sentences'
     */
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    /**
     * If false, disables autocorrect / spellcheck suggestions.
     * @default true
     */
    autoCorrect?: boolean;
    /**
     * Determines the label of the keyboard return key.
     *
     * Lacking native support:
     * - iOS: `'emergency-call'` falls back to the default Return key.
     * - Android: `'join'`, `'route'`, `'emergency-call'` fall back to the
     *   default action.
     */
    returnKeyType?: ReturnKeyTypeOptions;
    /**
     * Called when the user taps the keyboard return key. Receives the current
     * text in the input.
     */
    onSubmitEditing?: (text: string) => void;
    /**
     * Called when the field gains focus.
     */
    onFocus?: () => void;
    /**
     * Called when the field loses focus.
     */
    onBlur?: () => void;
    /**
     * Color of the text cursor.
     */
    cursorColor?: ColorValue;
}
//# sourceMappingURL=types.d.ts.map