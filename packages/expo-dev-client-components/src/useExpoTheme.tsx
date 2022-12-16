import { lightTheme, darkTheme, palette } from '@expo/styleguide-native';
import * as React from 'react';
import { useColorScheme } from 'react-native';

export type ThemePreference = 'light' | 'dark' | 'no-preference';
type Theme = 'light' | 'dark';

const ThemeContext = React.createContext<Theme>('light');
export const useTheme = () => React.useContext(ThemeContext);

type ThemeProviderProps = {
  children: React.ReactNode;
  themePreference?: ThemePreference;
};

export function ThemeProvider({ children, themePreference = 'no-preference' }: ThemeProviderProps) {
  const systemTheme = useColorScheme();

  const theme = React.useMemo(() => {
    if (themePreference !== 'no-preference') {
      return themePreference;
    }

    return systemTheme ?? 'light';
  }, [themePreference, systemTheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export type ExpoTheme = typeof lightTheme;

export function useCurrentTheme(): 'light' | 'dark' {
  const theme = useTheme();
  return theme;
}

export function useExpoTheme(): ExpoTheme {
  const theme = useTheme();

  if (theme === 'dark') {
    return darkTheme;
  }

  return lightTheme;
}

export function useExpoPalette() {
  const theme = useTheme();
  return palette[theme];
}
