import { requireNativeView } from 'expo';
import type { Ref } from 'react';

import type { ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import type { CommonViewModifierProps } from '../types';

/**
 * Can be used for imperatively setting text and focus on the `TextField` component.
 */
export type TextFieldRef = {
  setText: (newText: string) => Promise<void>;
  focus: () => Promise<void>;
  blur: () => Promise<void>;
  /**
   * Programmatically select text using start and end indices.
   * @platform ios 18.0+ tvos 18.0+
   */
  setSelection: (start: number, end: number) => Promise<void>;
};

export type TextFieldProps = {
  ref?: Ref<TextFieldRef>;
  /** Initial value displayed when mounted. Uncontrolled — change `key` to reset. */
  defaultValue?: string;
  /** If true, the text field will be focused automatically when mounted. @default false */
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
  /**
   * A callback triggered when user selects text in the TextField.
   * @platform ios 18.0+ tvos 18.0+
   */
  onSelectionChange?: ({ start, end }: { start: number; end: number }) => void;
  /**
   * The axis along which the text field grows when content exceeds a single line.
   * - `'horizontal'` — single line (default).
   * - `'vertical'` — expands vertically for multiline content. Use `lineLimit` modifier to cap visible lines.
   * @default 'horizontal'
   */
  axis?: 'horizontal' | 'vertical';
} & CommonViewModifierProps;

export type NativeTextFieldProps = Omit<
  TextFieldProps,
  'onValueChange' | 'onFocusChange' | 'onSelectionChange'
> &
  ViewEvent<'onValueChange', { value: string }> &
  ViewEvent<'onFocusChange', { value: boolean }> &
  ViewEvent<'onSelectionChange', { start: number; end: number }>;

const TextFieldNativeView: React.ComponentType<NativeTextFieldProps> = requireNativeView(
  'ExpoUI',
  'TextFieldView'
);

function transformTextFieldProps(props: TextFieldProps): NativeTextFieldProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    onValueChange: props.onValueChange
      ? (event) => props.onValueChange?.(event.nativeEvent.value)
      : undefined,
    onFocusChange: props.onFocusChange
      ? (event) => props.onFocusChange?.(event.nativeEvent.value)
      : undefined,
    onSelectionChange: props.onSelectionChange
      ? (event) =>
          props.onSelectionChange?.({ start: event.nativeEvent.start, end: event.nativeEvent.end })
      : undefined,
  };
}

/**
 * Renders a SwiftUI `TextField`.
 */
export function TextField(props: TextFieldProps) {
  return <TextFieldNativeView {...transformTextFieldProps(props)} />;
}
