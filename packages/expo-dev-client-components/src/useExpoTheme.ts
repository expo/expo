import { lightTheme, darkTheme } from '@expo/styleguide-native';
import { useColorScheme } from 'react-native';

import { useThemePreference } from './ThemeProvider';

type ExpoTheme = typeof lightTheme;

export function useCurrentTheme(): 'light' | 'dark' {
  const colorScheme = useColorScheme();
  const preference = useThemePreference();

  let theme: 'light' | 'dark' = 'light';

  if (preference !== 'no-preference') {
    theme = preference;
  }

  if (preference === 'no-preference' && colorScheme != null) {
    theme = colorScheme;
  }

  return theme;
}

export function useExpoTheme(): ExpoTheme {
  const theme = useCurrentTheme();

  if (theme === 'dark') {
    return darkTheme;
  }

  return lightTheme;
}
