import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useMemo } from 'react';
import { Platform, useColorScheme } from 'react-native';

import { Color } from './';

export function usePlatformTheme() {
  const scheme = useColorScheme();
  return useMemo(
    () =>
      Platform.select({
        ios: {
          dark: scheme === 'dark',
          fonts: DarkTheme.fonts,
          colors: {
            primary: Color.ios.systemBlue,
            background: Color.ios.systemBackground,
            card: Color.ios.systemGray6,
            text: Color.ios.label,
            border: Color.ios.separator,
            notification: Color.ios.systemRed,
          },
        },
        android: {
          dark: scheme === 'dark',
          fonts: DarkTheme.fonts,
          colors: {
            primary: Color.android.dynamic.primary,
            background: Color.android.dynamic.surface,
            card: Color.android.dynamic.surfaceContainer,
            text: Color.android.dynamic.onSurface,
            border: Color.android.dynamic.outline,
            notification: Color.android.dynamic.error,
          },
        },
        default: scheme === 'dark' ? DarkTheme : DefaultTheme,
      }),
    [scheme]
  );
}
