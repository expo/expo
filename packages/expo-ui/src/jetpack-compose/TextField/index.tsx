import { requireNativeView } from 'expo';
import type { Ref } from 'react';
import type { ColorValue } from 'react-native';

import { worklets } from '../../State/optionalWorklets';
import { type ObservableState, useNativeState } from '../../State/useNativeState';
import { useWorkletProp } from '../../State/useWorkletProp';
import { getStateId } from '../../State/utils';
import type { ModifierConfig, ViewEvent } from '../../types';
import { Slot } from '../SlotView';
import { createViewModifierEventListener } from '../modifiers/utils';

// region Types

/**
 * Can be used for imperatively setting text and focus on the `TextField` component.
 */
export type TextFieldRef = {
  setText: (newText: string) => Promise<void>;
  focus: () => Promise<void>;
  blur: () => Promise<void>;
};

export type TextFieldCapitalization = 'none' | 'characters' | 'words' | 'sentences';

export type TextFieldKeyboardType =
  | 'text'
  | 'number'
  | 'email'
  | 'phone'
  | 'decimal'
  | 'password'
  | 'ascii'
  | 'uri'
  | 'numberPassword';

export type TextFieldImeAction =
  | 'default'
  | 'none'
  | 'go'
  | 'search'
  | 'send'
  | 'previous'
  | 'next'
  | 'done';

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

export type TextFieldValue = {
  text: string;
  selection: { start: number; end: number };
};

export type TextFieldValueLike = string | TextFieldValue;

/** Shared props between `TextField` and `OutlinedTextField`. */
type BaseTextFieldProps<T extends TextFieldValueLike = string> = {
  ref?: Ref<TextFieldRef>;
  /**
   * An observable state that holds the current value. Create one with either:
   * - `useNativeState('initial text')`.
   * - `useNativeState<TextFieldValue>({ text: '', selection: { start: 0, end: 0 } })`
   * If omitted, the field manages its own internal state.
   */
  value?: ObservableState<T>;
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
  /**
   * Fires whenever the value changes. The callback receives the same shape as `value`:
   * - `string` when `value` is a string observable (typing events only).
   * - `TextFieldValue` when `value` is a TextFieldValue observable (every gesture:
   *   typing, tap-to-place, drag, select-all, arrow keys).
   *
   * If marked with the `'worklet'` directive, runs synchronously on the UI thread;
   * otherwise delivered asynchronously as a regular JS event.
   */
  onValueChange?: (value: T) => void;
  /** A callback triggered when the field gains or loses focus. */
  onFocusChanged?: (focused: boolean) => void;
  shape?: object;
  modifiers?: ModifierConfig[];
  /** Slot children (e.g. `TextField.Label`, `TextField.Placeholder`). */
  children?: React.ReactNode;
};

export type TextFieldProps<T extends TextFieldValueLike = string> = BaseTextFieldProps<T> & {
  colors?: TextFieldColors;
};

export type OutlinedTextFieldProps<T extends TextFieldValueLike = string> =
  BaseTextFieldProps<T> & {
    colors?: TextFieldColors;
  };

// endregion Types

// region Native

type NativeTextFieldProps = Omit<
  BaseTextFieldProps,
  'value' | 'onValueChange' | 'onFocusChanged' | 'keyboardActions' | 'children' | 'shape'
> & {
  variant: 'filled' | 'outlined';
  colors?: TextFieldColors;
  shape?: object;
  children?: React.ReactNode;
  value?: number | null;
  onValueChangeSync?: number | null;
} & ViewEvent<'onValueChange', TextFieldValue> &
  ViewEvent<'onFocusChanged', { value: boolean }> &
  ViewEvent<'onKeyboardAction', { action: string; value: string }>;

const TextFieldNativeView: React.ComponentType<NativeTextFieldProps> = requireNativeView(
  'ExpoUI',
  'TextFieldView'
);

function useTransformedProps<T extends TextFieldValueLike>(
  props: TextFieldProps<T> | OutlinedTextFieldProps<T>,
  variant: 'filled' | 'outlined'
): NativeTextFieldProps {
  const {
    value,
    modifiers,
    children,
    keyboardActions,
    onValueChange,
    onFocusChanged,
    ...restProps
  } = props;

  const internalValue = useNativeState<string>('');
  const state: ObservableState<TextFieldValueLike> =
    (value as ObservableState<TextFieldValueLike> | undefined) ?? internalValue;

  const isStringMode = typeof state.value === 'string';

  const isWorklet = !!onValueChange && !!worklets?.isWorkletFunction?.(onValueChange);
  const workletCallback = useWorkletProp(isWorklet ? onValueChange : undefined, 'onValueChange');

  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    variant,
    children,
    value: getStateId(state),
    onValueChangeSync: getStateId(workletCallback),
    onValueChange:
      !isWorklet && onValueChange
        ? (event) => {
            const payload = event.nativeEvent;
            onValueChange((isStringMode ? payload.text : payload) as T);
          }
        : undefined,
    onFocusChanged: onFocusChanged ? (event) => onFocusChanged(event.nativeEvent.value) : undefined,
    onKeyboardAction: keyboardActions
      ? (event) => {
          const { action, value } = event.nativeEvent;
          const actionMap: Record<string, ((v: string) => void) | undefined> = {
            done: keyboardActions.onDone,
            go: keyboardActions.onGo,
            next: keyboardActions.onNext,
            previous: keyboardActions.onPrevious,
            search: keyboardActions.onSearch,
            send: keyboardActions.onSend,
          };
          actionMap[action]?.(value);
        }
      : undefined,
  };
}

// endregion Native

// region Slot components

function Label(props: { children: React.ReactNode }) {
  return <Slot slotName="label">{props.children}</Slot>;
}

function Placeholder(props: { children: React.ReactNode }) {
  return <Slot slotName="placeholder">{props.children}</Slot>;
}

function LeadingIcon(props: { children: React.ReactNode }) {
  return <Slot slotName="leadingIcon">{props.children}</Slot>;
}

function TrailingIcon(props: { children: React.ReactNode }) {
  return <Slot slotName="trailingIcon">{props.children}</Slot>;
}

function Prefix(props: { children: React.ReactNode }) {
  return <Slot slotName="prefix">{props.children}</Slot>;
}

function Suffix(props: { children: React.ReactNode }) {
  return <Slot slotName="suffix">{props.children}</Slot>;
}

function SupportingText(props: { children: React.ReactNode }) {
  return <Slot slotName="supportingText">{props.children}</Slot>;
}

// endregion Slot components

// region Components

/**
 * A Material3 `TextField`.
 */
function TextFieldComponent<T extends TextFieldValueLike = string>(props: TextFieldProps<T>) {
  return <TextFieldNativeView {...useTransformedProps(props, 'filled')} />;
}

TextFieldComponent.Label = Label;
TextFieldComponent.Placeholder = Placeholder;
TextFieldComponent.LeadingIcon = LeadingIcon;
TextFieldComponent.TrailingIcon = TrailingIcon;
TextFieldComponent.Prefix = Prefix;
TextFieldComponent.Suffix = Suffix;
TextFieldComponent.SupportingText = SupportingText;

/**
 * A Material3 `OutlinedTextField` with a transparent background and border outline.
 */
function OutlinedTextFieldComponent<T extends TextFieldValueLike = string>(
  props: OutlinedTextFieldProps<T>
) {
  return <TextFieldNativeView {...useTransformedProps(props, 'outlined')} />;
}

OutlinedTextFieldComponent.Label = Label;
OutlinedTextFieldComponent.Placeholder = Placeholder;
OutlinedTextFieldComponent.LeadingIcon = LeadingIcon;
OutlinedTextFieldComponent.TrailingIcon = TrailingIcon;
OutlinedTextFieldComponent.Prefix = Prefix;
OutlinedTextFieldComponent.Suffix = Suffix;
OutlinedTextFieldComponent.SupportingText = SupportingText;

// endregion Components

export { TextFieldComponent as TextField, OutlinedTextFieldComponent as OutlinedTextField };
