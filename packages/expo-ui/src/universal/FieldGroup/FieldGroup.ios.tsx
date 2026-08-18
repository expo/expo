import { Form } from '@expo/ui/swift-ui';

import { transformToModifiers } from '../transformStyle';
import type { FieldGroupProps } from './types';

/**
 * A scrollable container for grouped settings-style rows. On iOS this wraps
 * SwiftUI's [`Form`](https://developer.apple.com/documentation/swiftui/form).
 */
export function FieldGroup({
  children,
  style,
  onAppear,
  onDisappear,
  disabled,
  hidden,
  testID,
  modifiers: extraModifiers,
}: FieldGroupProps) {
  const modifiers = transformToModifiers(
    style,
    { onAppear, onDisappear, disabled, hidden, testID },
    extraModifiers
  );

  return <Form modifiers={modifiers}>{children}</Form>;
}
