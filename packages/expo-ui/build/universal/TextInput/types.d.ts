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
}
//# sourceMappingURL=types.d.ts.map