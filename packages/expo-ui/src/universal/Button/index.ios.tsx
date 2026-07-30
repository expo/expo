import { Button as SwiftUIButton } from '@expo/ui/swift-ui';
import { buttonStyle } from '@expo/ui/swift-ui/modifiers';
import type { ModifierConfig } from '@expo/ui/swift-ui/modifiers';

import { omitUserOverridden } from '../modifierUtils';
import { transformToModifiers } from '../transformStyle';
import type { ButtonProps, ButtonVariant } from './types';

const variantButtonStyle: Record<ButtonVariant, 'borderedProminent' | 'bordered' | 'plain'> = {
  filled: 'borderedProminent',
  outlined: 'bordered',
  text: 'plain',
};

export function Button({
  children,
  label,
  onPress,
  variant = 'filled',
  style,
  onAppear,
  onDisappear,
  disabled,
  hidden,
  testID,
  modifiers: extraModifiers,
}: ButtonProps) {
  // A user-supplied buttonStyle modifier replaces the variant's.
  const buttonSpecificModifiers: ModifierConfig[] = omitUserOverridden(
    [buttonStyle(variantButtonStyle[variant])],
    extraModifiers
  );

  const universalModifiers = transformToModifiers(
    style,
    { onAppear, onDisappear, disabled, hidden, testID },
    extraModifiers
  );

  const modifiers = [...buttonSpecificModifiers, ...universalModifiers];

  return (
    <SwiftUIButton
      onPress={onPress}
      label={!children ? label : undefined}
      modifiers={modifiers}
      testID={testID}>
      {children as React.ReactElement | undefined}
    </SwiftUIButton>
  );
}

export * from './types';
