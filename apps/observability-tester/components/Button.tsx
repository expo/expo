import React from 'react';
import { Pressable, PressableProps, StyleSheet, Text, useColorScheme } from 'react-native';

type ButtonProps = {
  title: string;
  onPress?: () => void;
  theme?: 'primary' | 'secondary' | 'tertiary';
  disabled?: boolean;
} & PressableProps;

export function Button({ title, onPress, theme = 'primary', disabled, ...rest }: ButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const buttonStyle = [
    styles.button,
    theme === 'primary' && styles.buttonPrimary,
    theme === 'secondary' &&
      (isDark ? { backgroundColor: '#1F1F1F', borderColor: '#404040' } : styles.buttonSecondary),
    theme === 'tertiary' && styles.buttonTertiary,
    disabled && styles.buttonDisabled,
  ];

  const textStyle = [
    styles.text,
    theme === 'primary' && styles.textPrimary,
    theme === 'secondary' && (isDark ? { color: '#FFFFFF' } : styles.textSecondary),
    theme === 'tertiary' && (isDark ? { color: '#E5E5E5' } : styles.textTertiary),
  ];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [buttonStyle, pressed ? styles.buttonFocused : null]}
      disabled={disabled}
      {...rest}>
      <Text style={textStyle}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  buttonFocused: {
    opacity: 0.5,
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
  },
  buttonTertiary: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  textPrimary: {
    color: '#FFFFFF',
  },
  textSecondary: {
    color: '#000000',
  },
  textTertiary: {
    color: '#1F2937',
  },
});
