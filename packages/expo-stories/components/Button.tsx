import { spacing, lightTheme, shadows } from '@expo/styleguide-native';
import * as React from 'react';
import { Text, TouchableOpacity, StyleSheet, TouchableOpacityProps, TextProps } from 'react-native';

type ButtonProps = TouchableOpacityProps & {
  style?: Pick<TouchableOpacityProps, 'style'>;
  children?: React.ReactNode;
  labelProps?: TextProps;
  label?: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'transparent' | 'ghost';
};

export function Button({
  onPress,
  children,
  variant = 'primary',
  label,
  labelProps,
  style,
  ...rest
}: ButtonProps) {
  const backgroundColor = lightTheme.button[variant].background;
  const foregroundColor = lightTheme.button[variant].foreground;

  return (
    <TouchableOpacity
      style={[styles.buttonContainer, { backgroundColor }, style]}
      onPress={onPress}
      {...rest}>
      {Boolean(label) && (
        <Text style={[styles.buttonText, { color: foregroundColor }]} {...labelProps}>
          {label}
        </Text>
      )}
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: 4,
    paddingVertical: spacing[4],
    marginVertical: spacing[2],
    ...shadows.button,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});
