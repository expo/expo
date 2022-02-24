import { useExpoTheme } from 'expo-dev-client-components';
import { useThemePreference } from 'expo-dev-client-components/build/ThemeProvider';
import { useColorScheme } from 'react-native';

export function useTheme(): {
  theme: ReturnType<typeof useExpoTheme>;
  themeType: 'light' | 'dark';
} {
  const preference = useThemePreference();
  const colorScheme = useColorScheme();
  const theme = useExpoTheme();

  let themeType = preference;

  if (themeType === 'no-preference' && colorScheme != null) {
    themeType = colorScheme;
  }

  if (themeType === 'dark') {
    return { theme, themeType: 'dark' };
  }

  return { theme, themeType: 'light' };
}
