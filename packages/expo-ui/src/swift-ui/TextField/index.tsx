import { requireNativeView } from 'expo';
import type { Ref } from 'react';

import { worklets } from '../../State/optionalWorklets';
import type { ObservableState } from '../../State/useNativeState';
import { useWorkletProp } from '../../State/useWorkletProp';
import { getStateId } from '../../State/utils';
import type { ViewEvent } from '../../types';
import { Slot } from '../SlotView';
import { createViewModifierEventListener } from '../modifiers/utils';
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
export type TextFieldSelection = { start: number; end: number };

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
  onSelectionChange?: (selection: { start: number; end: number }) => void;
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

export type NativeTextFieldProps = Omit<
  TextFieldProps,
  'text' | 'selection' | 'onTextChange' | 'onFocusChange' | 'onSelectionChange'
> &
  ViewEvent<'onTextChange', { value: string }> &
  ViewEvent<'onFocusChange', { value: boolean }> &
  ViewEvent<'onSelectionChange', { start: number; end: number }> & {
    text?: number | null;
    selection?: number | null;
    onTextChangeSync?: number | null;
  };

const TextFieldNativeView: React.ComponentType<NativeTextFieldProps> = requireNativeView(
  'ExpoUI',
  'TextFieldView'
);

function Placeholder({ children }: { children: React.ReactNode }) {
  return <Slot name="placeholder">{children}</Slot>;
}

/**
 * Renders a SwiftUI `TextField`.
 */
export function TextField(props: TextFieldProps) {
  const {
    text,
    selection,
    onTextChange,
    onFocusChange,
    onSelectionChange,
    modifiers,
    ...restProps
  } = props;

  const isWorklet = !!onTextChange && !!worklets?.isWorkletFunction?.(onTextChange);
  const workletCallback = useWorkletProp(isWorklet ? onTextChange : undefined, 'onTextChange');

  return (
    <TextFieldNativeView
      {...restProps}
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      text={getStateId(text)}
      selection={getStateId(selection)}
      onTextChangeSync={getStateId(workletCallback)}
      onTextChange={
        !isWorklet && onTextChange ? (event) => onTextChange(event.nativeEvent.value) : undefined
      }
      onFocusChange={onFocusChange ? (event) => onFocusChange(event.nativeEvent.value) : undefined}
      onSelectionChange={
        onSelectionChange
          ? (event) =>
              onSelectionChange({ start: event.nativeEvent.start, end: event.nativeEvent.end })
          : undefined
      }
    />
  );
}

TextField.Placeholder = Placeholder;
