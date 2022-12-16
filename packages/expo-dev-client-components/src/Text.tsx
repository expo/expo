import { darkTheme, lightTheme, shadows, typography } from '@expo/styleguide-native';
import { Text as RNText, TextInput as RNTextInput } from 'react-native';

import { create } from './create-primitive';
import { text, textDark, padding, rounded } from './theme';

export const Heading = create(RNText, {
  base: {
    fontFamily: 'Inter-SemiBold',
    color: lightTheme.text.default,
    ...typography.fontSizes[18],
  },

  props: {
    accessibilityRole: 'header',
  },

  variants: {
    ...text,

    size: {
      large: typography.fontSizes[22],
      small: typography.fontSizes[13],
    },
  },

  selectors: {
    dark: textDark,
  },
});

export const Text = create(RNText, {
  base: {
    fontFamily: 'Inter-Regular',
    color: lightTheme.text.default,
    fontSize: 16,
    lineHeight: 18,
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
    fontFamily: 'Inter-Regular',
    color: lightTheme.text.default,
    fontSize: 16,
    lineHeight: 18,
  },

  variants: {
    ...text,

    border: {
      default: {
        borderWidth: 1,
        borderColor: lightTheme.border.default,
      },
    },

    ...rounded,

    ...padding,

    shadow: {
      input: shadows.input,
    },
  },

  selectors: {
    dark: {
      ...textDark,

      border: {
        default: {
          borderColor: darkTheme.border.default,
          borderWidth: 1,
        },
      },
    },
  },
});
