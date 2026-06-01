import { requireNativeView } from 'expo';
import type { ColorValue } from 'react-native';

import type { CommonTextFieldProperties } from './shared';
import { getStateId, type ObservableState, useWorkletProp, worklets } from '../../State';
import type { ViewEvent } from '../../types';
import { parseJSXShape, type ShapeJSXElement, type ShapeRecordProps } from '../Shape';
import { Slot } from '../SlotView';
import { createViewModifierEventListener } from '../modifiers/utils';

// region Types

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

// Material props inlined per variant (not a shared named base) so docs render them directly.
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

// endregion Types

// region Native

type NativeTextFieldProps = Omit<
  TextFieldProps,
  | 'value'
  | 'selection'
  | 'onValueChange'
  | 'onFocusChanged'
  | 'onSelectionChange'
  | 'keyboardActions'
  | 'children'
  | 'shape'
> & {
  variant: 'filled' | 'outlined';
  colors?: TextFieldColors;
  shape?: ShapeRecordProps;
  children?: React.ReactNode;
  value?: number | null;
  selection?: number | null;
  onValueChangeSync?: number | null;
} & ViewEvent<'onValueChange', { text: string; selection: { start: number; end: number } }> &
  ViewEvent<'onFocusChanged', { value: boolean }> &
  ViewEvent<'onSelectionChange', { start: number; end: number }> &
  ViewEvent<'onKeyboardAction', { action: string; value: string }>;

const TextFieldNativeView: React.ComponentType<NativeTextFieldProps> = requireNativeView(
  'ExpoUI',
  'TextFieldView'
);

function useTransformedProps(
  props: TextFieldProps | OutlinedTextFieldProps,
  variant: 'filled' | 'outlined'
): NativeTextFieldProps {
  const {
    value,
    selection,
    modifiers,
    children,
    keyboardActions,
    onValueChange,
    onFocusChanged,
    onSelectionChange,
    shape,
    ...restProps
  } = props;

  const isWorklet = !!onValueChange && !!worklets?.isWorkletFunction?.(onValueChange);
  const workletCallback = useWorkletProp(isWorklet ? onValueChange : undefined, 'onValueChange');

  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    variant,
    shape: parseJSXShape(shape),
    children,
    value: getStateId(value),
    selection: getStateId(selection),
    onValueChangeSync: getStateId(workletCallback),
    onValueChange:
      !isWorklet && onValueChange ? (event) => onValueChange(event.nativeEvent.text) : undefined,
    onFocusChanged: onFocusChanged ? (event) => onFocusChanged(event.nativeEvent.value) : undefined,
    onSelectionChange: onSelectionChange
      ? (event) => onSelectionChange({ start: event.nativeEvent.start, end: event.nativeEvent.end })
      : undefined,
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
function TextFieldComponent(props: TextFieldProps) {
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
function OutlinedTextFieldComponent(props: OutlinedTextFieldProps) {
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

// Exported for docs api data
export { type ObservableState };
