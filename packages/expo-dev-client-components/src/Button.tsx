import { lightTheme, darkTheme, borderRadius, shadows } from '@expo/styleguide-native';
import { Pressable as RNPressable } from 'react-native';
import { create } from 'react-native-primitives';

import { scale } from './theme';

export const Button = create(RNPressable, {
  base: {},

  props: {
    accessibilityRole: 'button',
  },

  variants: {
    bg: {
      primary: { backgroundColor: lightTheme.button.primary.background },
      secondary: { backgroundColor: lightTheme.button.secondary.background },
      tertiary: { backgroundColor: lightTheme.button.tertiary.background },
      ghost: { backgroundColor: lightTheme.button.ghost.background },
      transparent: { backgroundColor: lightTheme.button.transparent.background },
      disabled: { backgroundColor: lightTheme.status.default },
    },

    border: {
      ghost: { borderColor: lightTheme.button.ghost.border, borderWidth: 1 },
    },

    shadow: {
      button: shadows.button,
    },

    rounded: {
      small: { borderRadius: borderRadius.small },
      medium: { borderRadius: borderRadius.medium },
      large: { borderRadius: borderRadius.large },
      full: { borderRadius: 99999 },
    },

    padding: {
      tiny: { padding: scale.tiny },
      small: { padding: scale.small },
      medium: { padding: scale.medium },
      large: { padding: scale.large },
    },

    px: {
      tiny: { paddingHorizontal: scale.tiny },
      small: { paddingHorizontal: scale.small },
      medium: { paddingHorizontal: scale.medium },
      large: { paddingHorizontal: scale.large },
    },

    py: {
      tiny: { paddingVertical: scale.tiny },
      small: { paddingVertical: scale.small },
      medium: { paddingVertical: scale.medium },
      large: { paddingVertical: scale.large },
    },
  },

  selectors: {
    dark: {
      bg: {
        primary: { backgroundColor: darkTheme.button.primary.background },
        secondary: { backgroundColor: darkTheme.button.secondary.background },
        tertiary: { backgroundColor: darkTheme.button.tertiary.background },
        ghost: { backgroundColor: darkTheme.button.ghost.background },
        transparent: { backgroundColor: darkTheme.button.transparent.background },
        disabled: { backgroundColor: darkTheme.status.default },
      },
    },
  },
});
