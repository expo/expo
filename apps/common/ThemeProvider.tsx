import { darkTheme, lightTheme } from '@expo/styleguide-base';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
  type Theme as NavigationTheme,
} from 'expo-router';
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
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

// The navigation theme is derived from the styleguide theme, so headers, tab bars and screen
// backgrounds stay in sync with the rest of the app.
function createNavigationTheme(themeName: ThemeName, theme: ThemeType): NavigationTheme {
  return {
    ...(themeName === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      primary: theme.icon.info,
      background: theme.background.default,
      card: theme.background.default,
      text: theme.text.default,
      border: theme.border.default,
      notification: theme.icon.danger,
    },
  };
}

// `NativeTabs` styles its web tab bar from CSS variables that fall back to a dark palette, and it
// never reads the navigation theme, so web has to be given the colors.
export function getWebNativeTabsTheme(theme: ThemeType) {
  return {
    backgroundColor: theme.background.element,
    indicatorColor: theme.background.selected,
    labelStyle: {
      default: { color: theme.text.secondary },
      selected: { color: theme.text.default },
    },
  };
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  // react-native-web's Appearance has no setColorScheme, so keep an override in state.
  const [themeOverride, setThemeOverride] = useState<ThemeName | null>(null);
  const currentThemeName = themeOverride ?? systemColorScheme ?? 'light';
  const currentTheme = currentThemeName === 'dark' ? darkTheme : lightTheme;
  const navigationTheme = useMemo(
    () => createNavigationTheme(currentThemeName, currentTheme),
    [currentThemeName, currentTheme]
  );

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
      <NavigationThemeProvider value={navigationTheme}>{children}</NavigationThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
