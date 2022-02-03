import { lightTheme } from '@expo/styleguide-native';
import { Text as RNText, TextInput as RNTextInput } from 'react-native';
import { create } from 'react-native-primitives';

import { text, textDark } from './theme';

export const Heading = create(RNText, {
  base: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    color: lightTheme.text.default,
  },

  props: {
    accessibilityRole: 'header',
  },

  variants: {
    ...text,

    size: {
      small: {
        fontSize: 18,
        lineHeight: 20,
      },
      medium: {
        fontSize: 22,
        lineHeight: 28,
      },
      large: {
        fontSize: 28,
        lineHeight: 32,
      },
    },
  },

  selectors: {
    dark: textDark,
  },
});

export const Text = create(RNText, {
  base: {
    fontWeight: 'normal',
    color: lightTheme.text.default,
    fontSize: 16,
  },

  props: {
    accessibilityRole: 'text',
  },

  variants: {
    ...text,
  },

  selectors: {
    dark: textDark,
  },
});

export const TextInput = create(RNTextInput, {
  base: {
    fontWeight: 'normal',
    color: lightTheme.text.default,
    fontSize: 16,
    lineHeight: 18,
  },

  variants: {
    ...text,
  },

  selectors: {
    dark: textDark,
  },
});
