import { Platform } from 'react-native';

import type { Theme } from '../types';

const WEB_FONT_STACK =
  'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';

export const fonts = Platform.select({
  web: {
    regular: {
      fontFamily: WEB_FONT_STACK,
      fontWeight: '400',
    },
    medium: {
      fontFamily: WEB_FONT_STACK,
      fontWeight: '500',
    },
    bold: {
      fontFamily: WEB_FONT_STACK,
      fontWeight: '600',
    },
    heavy: {
      fontFamily: WEB_FONT_STACK,
      fontWeight: '700',
    },
  },
  ios: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '600',
    },
    heavy: {
      fontFamily: 'System',
      fontWeight: '700',
    },
  },
  default: {
    regular: {
      fontFamily: 'sans-serif',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'sans-serif-medium',
      fontWeight: 'normal',
    },
    bold: {
      fontFamily: 'sans-serif',
      fontWeight: '600',
    },
    heavy: {
      fontFamily: 'sans-serif',
      fontWeight: '700',
    },
  },
} as const satisfies Record<string, Theme['fonts']>);
