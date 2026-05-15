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
 * Can be used for imperatively setting text and focus on the `SecureField` component.
 */
export type SecureFieldRef = {
  setText: (newText: string) => Promise<void>;
  /** Clear the current text. */
  clear: () => Promise<void>;
  focus: () => Promise<void>;
  blur: () => Promise<void>;
};

export type SecureFieldProps = {
  ref?: Ref<SecureFieldRef>;
  /**
   * An observable state that holds the current text.
   * Create one with `useNativeState('')` or `useNativeState('initial value')`.
   * If omitted, the field manages its own internal state.
   */
  text?: ObservableState<string>;
  /** Maximum number of characters allowed. Truncates natively as the user types. */
  maxLength?: number;
  /** If true, the secure field will be focused automatically when mounted. @default false */
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
   * Slot children - supports `<SecureField.Placeholder>` with a `<Text>` child
   */
  children?: React.ReactNode;
} & CommonViewModifierProps;

export type NativeSecureFieldProps = Omit<
  SecureFieldProps,
  'text' | 'onTextChange' | 'onFocusChange'
> &
  ViewEvent<'onTextChange', { value: string }> &
  ViewEvent<'onFocusChange', { value: boolean }> & {
    text?: number | null;
    onTextChangeSync?: number | null;
  };

const SecureFieldNativeView: React.ComponentType<NativeSecureFieldProps> = requireNativeView(
  'ExpoUI',
  'SecureFieldView'
);

function Placeholder({ children }: { children: React.ReactNode }) {
  return <Slot name="placeholder">{children}</Slot>;
}

/**
 * Renders a SwiftUI `SecureField` for password input.
 */
export function SecureField(props: SecureFieldProps) {
  const { text, onTextChange, onFocusChange, modifiers, ...restProps } = props;

  const isWorklet = !!onTextChange && !!worklets?.isWorkletFunction?.(onTextChange);
  const workletCallback = useWorkletProp(isWorklet ? onTextChange : undefined, 'onTextChange');

  return (
    <SecureFieldNativeView
      {...restProps}
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      text={getStateId(text)}
      onTextChangeSync={getStateId(workletCallback)}
      onTextChange={
        !isWorklet && onTextChange ? (event) => onTextChange(event.nativeEvent.value) : undefined
      }
      onFocusChange={onFocusChange ? (event) => onFocusChange(event.nativeEvent.value) : undefined}
    />
  );
}

SecureField.Placeholder = Placeholder;
