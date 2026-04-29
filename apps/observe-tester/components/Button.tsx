import React from 'react';
import { Pressable, PressableProps, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/utils/theme';

type ButtonTheme = 'primary' | 'secondary' | 'tertiary';

type ButtonProps = {
  title: string;
  description?: string;
  onPress?: () => void;
  theme?: ButtonTheme;
  disabled?: boolean;
} & PressableProps;

export function Button({
  title,
  description,
  onPress,
  theme = 'primary',
  disabled,
  ...rest
}: ButtonProps) {
  const styleguide = useTheme();
  const tokens = styleguide.button[theme];
  const disabledTokens = tokens.disabled;

  const backgroundColor = disabled ? disabledTokens.background : tokens.background;
  const borderColor = disabled ? disabledTokens.border : tokens.border;
  const textColor = disabled ? disabledTokens.text : tokens.text;

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
          <Text style={[styles.description, { color: styleguide.text.tertiary }]}>
            {description}
          </Text>
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
