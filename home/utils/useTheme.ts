import { useCurrentTheme, useExpoTheme } from 'expo-dev-client-components';
export function useTheme(): {
  theme: ReturnType<typeof useExpoTheme>;
  themeType: 'light' | 'dark';
} {
  const theme = useExpoTheme();
  const themeType = useCurrentTheme();

  return { theme, themeType };
}
