import {
  Button as ComposeButton,
  OutlinedButton,
  Text,
  TextButton,
} from '@expo/ui/jetpack-compose';

import { transformToModifiers } from '../transformStyle';
import type { ButtonProps, ButtonVariant } from './types';
import { useUniversalLifecycle } from '../hooks';

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
  useUniversalLifecycle(onAppear, onDisappear);

  if (hidden) return null;

  const modifiers = transformToModifiers(style, { disabled, hidden, testID }, extraModifiers);

  const content = children ?? <Text>{label ?? ''}</Text>;
  const commonProps = {
    onClick: disabled ? undefined : onPress,
    enabled: !disabled,
    modifiers,
  };

  const ButtonComponent = variantComponentMap[variant];

  return <ButtonComponent {...commonProps}>{content}</ButtonComponent>;
}

const variantComponentMap: Record<
  ButtonVariant,
  typeof ComposeButton | typeof OutlinedButton | typeof TextButton
> = {
  filled: ComposeButton,
  outlined: OutlinedButton,
  text: TextButton,
};

export * from './types';
