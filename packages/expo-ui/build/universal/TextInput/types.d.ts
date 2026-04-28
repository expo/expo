import type { KeyboardTypeOptions } from 'react-native';
import type { ObservableState } from '../State';
/**
 * Props for the `TextInput` component.
 */
export interface TextInputProps {
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
}
//# sourceMappingURL=types.d.ts.map