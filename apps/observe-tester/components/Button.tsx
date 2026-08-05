import React from 'react';
import { Pressable, PressableProps, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/utils/theme';

type ButtonTheme = 'primary' | 'secondary' | 'tertiary';

type ButtonColors = {
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  descriptionColor?: string;
};

type ButtonProps = {
  title: string;
  description?: string;
  onPress?: () => void;
  theme?: ButtonTheme;
  disabled?: boolean;
  /**
   * Optional per-call color overrides. Each key falls back to the value derived
   * from `theme`, so callers can override only the colors they care about.
   */
  colors?: ButtonColors;
} & PressableProps;

export function Button({
  title,
  description,
  onPress,
  theme = 'primary',
  disabled,
  colors,
  ...rest
}: ButtonProps) {
  const styleguide = useTheme();
  const tokens = styleguide.button[theme];
  const disabledTokens = tokens.disabled;

  const backgroundColor = disabled
    ? disabledTokens.background
    : (colors?.backgroundColor ?? tokens.background);
  const borderColor = disabled ? disabledTokens.border : (colors?.borderColor ?? tokens.border);
  const textColor = disabled ? disabledTokens.text : (colors?.textColor ?? tokens.text);
  // text.tertiary reads as muted on light button backgrounds, but disappears on the dark primary
  // fill. Default the description to a translucent shade of the title color for primary.
  const descriptionColor =
    colors?.descriptionColor ??
    (theme === 'primary' ? 'rgba(255, 255, 255, 0.85)' : styleguide.text.tertiary);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, borderColor },
        pressed ? styles.buttonFocused : null,
      ]}
      disabled={disabled}
      {...rest}>
      <View style={styles.labelContainer}>
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
        {description ? (
          <Text style={[styles.description, { color: descriptionColor }]}>{description}</Text>
        ) : null}
      </View>
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
  labelContainer: {
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.3,
  },
});
