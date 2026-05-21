import { Pressable, StyleSheet, Text } from 'react-native';

import type { ButtonProps } from './types';
import { useFocusVisible, useUniversalLifecycle } from '../hooks';
import { colors, durations, easings, shadows } from '../web';

const buttonStyles = StyleSheet.create({
  base: {
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    borderRadius: 8,
    boxShadow: shadows.button,
    display: 'inline-flex',
    height: 40,
    justifyContent: 'center',
    outlineStyle: 'solid',
    outlineWidth: 0,
    paddingHorizontal: 16,
    transitionDuration: durations.fast,
    transitionProperty: 'background-color, color, box-shadow, transform',
    transitionTimingFunction: easings.standard,
    whiteSpace: 'nowrap',
  },
  outlined: {
    backgroundColor: 'transparent',
    boxShadow: `inset 0 0 0 1px ${colors.gray[300]}`,
  },
  text: {
    backgroundColor: 'transparent',
    boxShadow: 'none',
  },
  focused: { boxShadow: shadows.focus },
  disabled: { opacity: 0.5 },
  hidden: { display: 'none' },
  hovered: { backgroundColor: colors.primary[600] },
  hoveredOutlined: { backgroundColor: colors.gray[50] },
  hoveredText: { backgroundColor: colors.primary[50] },
  pressed: {
    backgroundColor: colors.primary[700],
    transform: 'translateY(0.5px)',
  },
  pressedOutlined: { backgroundColor: colors.gray[100] },
  pressedText: { backgroundColor: colors.primary[100] },
});

const textStyles = StyleSheet.create({
  base: {
    color: colors.primary.foreground,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 14,
    textAlign: 'center',
    userSelect: 'none',
  },
  outlined: { color: colors.gray[900] },
  text: { color: colors.primary[600] },
});

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

  const { focusVisible, onFocus, onBlur } = useFocusVisible();

  return (
    <Pressable
      role="button"
      onFocus={onFocus}
      onBlur={onBlur}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={({ hovered, pressed }) => [
        buttonStyles.base,
        variant === 'outlined' && buttonStyles.outlined,
        variant === 'text' && buttonStyles.text,

        hovered && [
          buttonStyles.hovered,
          variant === 'outlined' && buttonStyles.hoveredOutlined,
          variant === 'text' && buttonStyles.hoveredText,
        ],

        pressed && [
          buttonStyles.pressed,
          variant === 'outlined' && buttonStyles.pressedOutlined,
          variant === 'text' && buttonStyles.pressedText,
        ],

        style,

        focusVisible && buttonStyles.focused,
        hidden && buttonStyles.hidden,
        disabled && buttonStyles.disabled,
      ]}>
      {children ?? (
        <Text
          style={[
            textStyles.base,
            variant === 'outlined' && textStyles.outlined,
            variant === 'text' && textStyles.text,
          ]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export * from './types';
