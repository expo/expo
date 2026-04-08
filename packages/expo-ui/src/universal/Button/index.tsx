import { Pressable, Text, type ViewStyle } from 'react-native';

import type { ButtonProps, ButtonVariant } from './types';
import { useUniversalLifecycle } from '../hooks';

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  filled: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  outlined: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  text: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
};

const variantTextColors: Record<ButtonVariant, string> = {
  filled: '#FFFFFF',
  outlined: '#007AFF',
  text: '#007AFF',
};

/**
 * A pressable button that supports multiple visual variants.
 */
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
}: ButtonProps) {
  useUniversalLifecycle(onAppear, onDisappear);

  const pressableStyle: ViewStyle = {
    ...variantStyles[variant],
    ...style,
    ...(hidden ? { display: 'none' } : undefined),
    ...(disabled ? { opacity: 0.5 } : undefined),
  };

  return (
    <Pressable style={pressableStyle} onPress={onPress} disabled={disabled} testID={testID}>
      {children ?? (
        <Text style={{ color: variantTextColors[variant], textAlign: 'center' }}>{label}</Text>
      )}
    </Pressable>
  );
}
