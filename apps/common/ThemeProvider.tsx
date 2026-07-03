import { darkTheme, lightTheme } from '@expo/styleguide-base';
import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColorScheme, Appearance } from 'react-native';

export type ThemeName = 'light' | 'dark';
export type ThemeType = typeof lightTheme | typeof darkTheme;

type ThemeContextType = {
  name: ThemeName;
  theme: ThemeType;
  setTheme: (themeName: 'light' | 'dark') => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  name: 'light',
  theme: lightTheme,
  setTheme: () => undefined,
});

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  // react-native-web's Appearance has no setColorScheme, so keep an override in state.
  const [themeOverride, setThemeOverride] = useState<ThemeName | null>(null);
  const currentThemeName =
    themeOverride ?? (systemColorScheme !== 'unspecified' ? systemColorScheme : 'light');
  const currentTheme = currentThemeName === 'dark' ? darkTheme : lightTheme;

  const setTheme = useCallback((themeName: ThemeName) => {
    if (typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(themeName);
    } else {
      setThemeOverride(themeName);
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        name: currentThemeName,
        theme: currentTheme,
        setTheme,
      }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
