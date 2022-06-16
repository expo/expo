import { borderRadius } from '@expo/styleguide-native';
import { ExpoTheme, scale, Text, useExpoTheme } from 'expo-dev-client-components';
import React from 'react';
import { ActivityIndicator, TouchableOpacity, ViewStyle } from 'react-native';

type Theme = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'error';

type Props = {
  label: string;
  onPress: () => void;
  theme?: Theme;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

function getThemeColors(
  theme: Theme,
  expoTheme: ExpoTheme
): { backgroundColor: string; borderColor?: string; borderWidth?: 1; color: string } {
  switch (theme) {
    case 'primary':
      return {
        backgroundColor: expoTheme.button.primary.background,
        color: expoTheme.button.primary.foreground,
      };
    case 'secondary':
      return {
        backgroundColor: expoTheme.button.secondary.background,
        color: expoTheme.button.secondary.foreground,
      };
    case 'tertiary':
      return {
        backgroundColor: expoTheme.button.tertiary.background,
        color: expoTheme.button.tertiary.foreground,
      };
    case 'ghost':
      return {
        backgroundColor: expoTheme.button.ghost.background,
        color: expoTheme.button.ghost.foreground,
        borderColor: expoTheme.button.ghost.border,
        borderWidth: 1,
      };
    case 'error':
      return {
        backgroundColor: expoTheme.background.error,
        color: expoTheme.text.error,
        borderColor: expoTheme.border.error,
        borderWidth: 1,
      };
  }
}

export function Button({ label, theme = 'tertiary', onPress, loading, disabled, style }: Props) {
  const expoTheme = useExpoTheme();

  const { backgroundColor, borderColor, borderWidth, color } = getThemeColors(theme, expoTheme);

  return (
    <TouchableOpacity
      style={[
        {
          backgroundColor,
          borderRadius: borderRadius.medium,
          paddingVertical: scale.small,
          borderColor,
          borderWidth,
          paddingHorizontal: scale.medium,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      disabled={disabled}
      onPress={onPress}>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text type="InterSemiBold" style={{ color }}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
