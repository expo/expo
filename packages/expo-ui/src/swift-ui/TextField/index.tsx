import { requireNativeView } from 'expo';
import type { Ref } from 'react';

import { worklets } from '../../State/optionalWorklets';
import type { ObservableState } from '../../State/useNativeState';
import { useNativeState } from '../../State/useNativeState';
import { useWorkletProp } from '../../State/useWorkletProp';
import { getStateId } from '../../State/utils';
import type { ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import type { CommonViewModifierProps } from '../types';

/**
 * Can be used for imperatively focusing and selecting text on the `TextField` component.
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
  /**
   * An observable state that holds the current text.
   * Create one with `useNativeState('')` or `useNativeState('initial value')`.
   * If omitted, the field manages its own internal state.
   */
  text?: ObservableState<string>;
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
  'text' | 'onTextChange' | 'onFocusChange' | 'onSelectionChange'
> &
  ViewEvent<'onTextChange', { value: string }> &
  ViewEvent<'onFocusChange', { value: boolean }> &
  ViewEvent<'onSelectionChange', { start: number; end: number }> & {
    text?: number | null;
    onTextChangeSync?: number | null;
  };

const TextFieldNativeView: React.ComponentType<NativeTextFieldProps> = requireNativeView(
  'ExpoUI',
  'TextFieldView'
);

/**
 * Renders a SwiftUI `TextField`.
 */
export function TextField(props: TextFieldProps) {
  const { text, onTextChange, onFocusChange, onSelectionChange, modifiers, ...restProps } = props;

  const fallbackText = useNativeState('');
  const textState = text ?? fallbackText;

  const isWorklet = !!onTextChange && !!worklets?.isWorkletFunction?.(onTextChange);
  const workletCallback = useWorkletProp(isWorklet ? onTextChange : undefined, 'onTextChange');

  return (
    <TextFieldNativeView
      {...restProps}
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      text={getStateId(textState)}
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
