import type { ReactNode, Ref } from 'react';
import type { ColorValue } from 'react-native';
import { type ObservableState } from '../../State';
import type { ModifierConfig, ViewEvent } from '../../types';
/**
 * Can be used for imperatively focusing and setting text/selection on the
 * `TextField`, `OutlinedTextField`, and `BasicTextField` components.
 */
export type TextFieldRef = {
    setText: (newText: string) => Promise<void>;
    /** Clear the current text. */
    clear: () => Promise<void>;
    focus: () => Promise<void>;
    blur: () => Promise<void>;
    /**
     * Programmatically set the selection range.
     */
    setSelection: (start: number, end: number) => Promise<void>;
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
 * Text styling for a text field's content. Maps to Compose's `TextStyle`.
 * Shared by `TextField`, `OutlinedTextField`, and `BasicTextField`.
 */
export type TextFieldTextStyle = {
    textAlign?: 'left' | 'right' | 'center' | 'justify';
    color?: ColorValue;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'normal' | 'bold';
    lineHeight?: number;
    letterSpacing?: number;
};
/**
 * Props shared by every Compose text field variant — `TextField`,
 * `OutlinedTextField`, and `BasicTextField`. The Material variants add their
 * own decoration props (`isError`, `shape`, `colors`, slot children);
 * `BasicTextField` adds `cursorColor`.
 */
export type CommonTextFieldProperties = {
    ref?: Ref<TextFieldRef>;
    /**
     * An observable state that holds the current text value. Create one with
     * `useNativeState('initial text')`. If omitted, the field manages its own
     * internal state.
     */
    value?: ObservableState<string>;
    /** If true, the text field will be focused automatically when mounted. @default false */
    autoFocus?: boolean;
    /** @default true */
    enabled?: boolean;
    /** @default false */
    readOnly?: boolean;
    /** @default false */
    singleLine?: boolean;
    maxLines?: number;
    minLines?: number;
    /**
     * Display-time text transformation. `'password'` masks every character;
     * `'none'` (default) leaves the buffer as-is.
     */
    visualTransformation?: 'password' | 'none';
    /**
     * Observable state holding the current selection range. Create with
     * `useNativeState({ start: 0, end: 0 })`. The field writes user-driven
     * changes back to it, and writes from JS (or a worklet) update the
     * cursor/selection in the field. Use `ref.setSelection(start, end)` for
     * imperative one-shot updates.
     */
    selection?: ObservableState<{
        start: number;
        end: number;
    }>;
    /** Maximum number of characters allowed. Truncates natively as the user types. */
    maxLength?: number;
    /** Called when the selection range changes. */
    onSelectionChange?: (selection: {
        start: number;
        end: number;
    }) => void;
    /**
     * Selection-related colors. Maps to Compose's `TextSelectionColors` via
     * `LocalTextSelectionColors`. `handleColor` controls the drag handles (and
     * the caret's drag handle); `backgroundColor` is the highlighted-text
     * background (typically the same tint at lower alpha so the underlying text
     * stays readable). Independent of `cursorColor`, which tints the caret line.
     */
    textSelectionColors?: {
        handleColor?: ColorValue;
        backgroundColor?: ColorValue;
    };
    /**
     * Text styling for the field's content. Maps to Compose's `TextStyle`.
     */
    textStyle?: TextFieldTextStyle;
    keyboardOptions?: TextFieldKeyboardOptions;
    keyboardActions?: TextFieldKeyboardActions;
    /**
     * Fires whenever the text value changes. If marked with the `'worklet'`
     * directive, runs synchronously on the UI thread; otherwise delivered
     * asynchronously as a regular JS event. Use `onSelectionChange` (or read
     * the `selection` observable) to react to selection-only changes.
     */
    onValueChange?: (value: string) => void;
    /** A callback triggered when the field gains or loses focus. */
    onFocusChanged?: (focused: boolean) => void;
    modifiers?: ModifierConfig[];
    /** Slot children that configure the field's decoration. */
    children?: ReactNode;
};
/**
 * Keys consumed (and reshaped) by {@link useCommonTextFieldProps}. Everything
 * else on the props passes through untouched.
 */
type TransformedKeys = 'value' | 'selection' | 'modifiers' | 'children' | 'keyboardActions' | 'onValueChange' | 'onFocusChanged' | 'onSelectionChange';
/**
 * Native-facing prop shape shared by every Compose text field variant. The
 * observable-backed props collapse to shared-object ids, and the public
 * callbacks become `nativeEvent`-wrapped listeners.
 */
export type CommonNativeTextFieldProps = {
    modifiers?: ModifierConfig[];
    children?: ReactNode;
    value?: number | null;
    selection?: number | null;
    onValueChangeSync?: number | null;
} & ViewEvent<'onValueChange', {
    text: string;
    selection: {
        start: number;
        end: number;
    };
}> & ViewEvent<'onFocusChanged', {
    value: boolean;
}> & ViewEvent<'onSelectionChange', {
    start: number;
    end: number;
}> & ViewEvent<'onKeyboardAction', {
    action: string;
    value: string;
}>;
/**
 * Shared prop transform for the Compose text field variants. Resolves the
 * `value`/`selection` observables to ids, detects whether `onValueChange` is a
 * worklet (and routes it to `onValueChangeSync` if so), and adapts the public
 * callbacks to the native event shape. Variant-specific props (`variant`,
 * `shape`, `cursorColor`, the placeholder slot, ...) pass through untouched, so
 * each component layers its extras on the result. Keeping this in one place
 * stops the worklet detection and event plumbing from drifting between
 * `TextField` and `BasicTextField`.
 */
export declare function useCommonTextFieldProps<T extends CommonTextFieldProperties>(props: T): CommonNativeTextFieldProps & Omit<T, TransformedKeys>;
export {};
//# sourceMappingURL=shared.d.ts.map