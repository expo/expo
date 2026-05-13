import { Pressable, StyleSheet, Text, type TextStyle, type ViewStyle } from 'react-native';

import type { ButtonProps, ButtonVariant } from './types';
import { useUniversalLifecycle } from '../hooks';

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    userSelect: 'none',
  },
  disabled: { opacity: 0.5 },
  hidden: { display: 'none' },
  label: { textAlign: 'center' },
});

const variantStyles = StyleSheet.create({
  filled: { backgroundColor: '#007AFF' },
  outlined: {
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  text: {},
} satisfies Record<ButtonVariant, ViewStyle>);

const variantHoverStyles = StyleSheet.create({
  filled: { backgroundColor: '#0066DB' },
  outlined: { backgroundColor: 'rgba(0, 122, 255, 0.08)' },
  text: { backgroundColor: 'rgba(0, 122, 255, 0.08)' },
} satisfies Record<ButtonVariant, ViewStyle>);

const variantLabelStyles = StyleSheet.create({
  filled: { color: '#FFFFFF' },
  outlined: { color: '#007AFF' },
  text: { color: '#007AFF' },
} satisfies Record<ButtonVariant, TextStyle>);

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
  disabled = false,
  hidden = false,
  testID,
}: ButtonProps) {
  useUniversalLifecycle(onAppear, onDisappear);

  return (
    <Pressable
      role="button"
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={({ hovered }) => [
        styles.button,
        variantStyles[variant],
        style,
        hovered && !disabled && variantHoverStyles[variant],
        hidden && styles.hidden,
        disabled && styles.disabled,
      ]}>
      {children ?? <Text style={[styles.label, variantLabelStyles[variant]]}>{label}</Text>}
    </Pressable>
  );
}

export * from './types';
