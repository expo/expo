import { Button as SwiftUIButton } from '@expo/ui/swift-ui';
import { buttonStyle } from '@expo/ui/swift-ui/modifiers';
import type { ModifierConfig } from '@expo/ui/swift-ui/modifiers';

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
  const buttonSpecificModifiers: ModifierConfig[] = [buttonStyle(variantButtonStyle[variant])];

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
