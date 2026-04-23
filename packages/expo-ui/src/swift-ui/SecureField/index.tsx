import { requireNativeView } from 'expo';
import type { Ref } from 'react';

import type { ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import type { CommonViewModifierProps } from '../types';

/**
 * Can be used for imperatively setting text and focus on the `SecureField` component.
 */
export type SecureFieldRef = {
  setText: (newText: string) => Promise<void>;
  focus: () => Promise<void>;
  blur: () => Promise<void>;
};

export type SecureFieldProps = {
  ref?: Ref<SecureFieldRef>;
  /** Initial value displayed when mounted. Uncontrolled — change `key` to reset. */
  defaultValue?: string;
  /** If true, the field will be focused automatically when mounted. @default false */
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
} & CommonViewModifierProps;

type NativeSecureFieldProps = Omit<SecureFieldProps, 'onValueChange' | 'onFocusChange'> &
  ViewEvent<'onValueChange', { value: string }> &
  ViewEvent<'onFocusChange', { value: boolean }>;

const SecureFieldNativeView: React.ComponentType<NativeSecureFieldProps> = requireNativeView(
  'ExpoUI',
  'SecureFieldView'
);

function transformSecureFieldProps(props: SecureFieldProps): NativeSecureFieldProps {
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
  };
}

/**
 * Renders a SwiftUI `SecureField` for password input.
 */
export function SecureField(props: SecureFieldProps) {
  return <SecureFieldNativeView {...transformSecureFieldProps(props)} />;
}
