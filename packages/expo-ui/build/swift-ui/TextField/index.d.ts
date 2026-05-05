import type { Ref } from 'react';
import type { ObservableState } from '../../State/useNativeState';
import type { ViewEvent } from '../../types';
import type { CommonViewModifierProps } from '../types';
/**
 * Can be used for imperatively focusing and setting text/selection on the `TextField` component.
 */
export type TextFieldRef = {
    setText: (newText: string) => Promise<void>;
    /** Clear the current text. */
    clear: () => Promise<void>;
    focus: () => Promise<void>;
    blur: () => Promise<void>;
    /**
     * Programmatically set the selection range.
     * @platform ios 18.0+ tvos 18.0+
     */
    setSelection: (start: number, end: number) => Promise<void>;
};
/**
 * Selection range — `start` and `end` are character offsets into the field's text.
 */
export type TextFieldSelection = {
    start: number;
    end: number;
};
export type TextFieldProps = {
    ref?: Ref<TextFieldRef>;
    /**
     * An observable state that holds the current text.
     * Create one with `useNativeState('')` or `useNativeState('initial value')`.
     * If omitted, the field manages its own internal state.
     */
    text?: ObservableState<string>;
    /**
     * Observable state the field writes the current selection to.
     * Create with `useNativeState<TextFieldSelection>({ start: 0, end: 0 })`.
     * Use `ref.setSelection(start, end)` to set programmatically.
     * @platform ios 18.0+ tvos 18.0+
     */
    selection?: ObservableState<TextFieldSelection>;
    /** Maximum number of characters allowed. Truncates natively as the user types. */
    maxLength?: number;
    /** If true, the text field will be focused automatically when mounted. @default false */
    autoFocus?: boolean;
    /**
     * A text that is displayed when the field is empty.
     */
    placeholder?: string;
    /**
     * A callback triggered when the text value changes.
     *
     * If the callback is marked with the `'worklet'` directive, it runs synchronously
     * on the UI thread; otherwise it is delivered asynchronously as a regular JS event.
     */
    onTextChange?: (text: string) => void;
    /**
     * A callback triggered when the field gains or loses focus.
     */
    onFocusChange?: (focused: boolean) => void;
    /**
     * A callback triggered when the text selection range changes.
     * @platform ios 18.0+ tvos 18.0+
     */
    onSelectionChange?: (selection: {
        start: number;
        end: number;
    }) => void;
    /**
     * The axis along which the text field grows when content exceeds a single line.
     * - `'horizontal'` — single line (default).
     * - `'vertical'` — expands vertically for multiline content. Use `lineLimit` modifier to cap visible lines.
     * @default 'horizontal'
     */
    axis?: 'horizontal' | 'vertical';
    /**
     * Slot children — supports `<TextField.Placeholder>` with a `<Text>` child
     * (any text-styling modifiers on that `Text` are preserved as the
     * placeholder's styling).
     */
    children?: React.ReactNode;
} & CommonViewModifierProps;
export type NativeTextFieldProps = Omit<TextFieldProps, 'text' | 'selection' | 'onTextChange' | 'onFocusChange' | 'onSelectionChange'> & ViewEvent<'onTextChange', {
    value: string;
}> & ViewEvent<'onFocusChange', {
    value: boolean;
}> & ViewEvent<'onSelectionChange', {
    start: number;
    end: number;
}> & {
    text?: number | null;
    selection?: number | null;
    onTextChangeSync?: number | null;
};
/**
 * Renders a SwiftUI `TextField`.
 */
export declare function TextField(props: TextFieldProps): import("react/jsx-runtime").JSX.Element;
export declare namespace TextField {
    var Placeholder: ({ children }: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
}
//# sourceMappingURL=index.d.ts.map