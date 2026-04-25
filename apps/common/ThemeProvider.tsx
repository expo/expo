import { darkTheme, lightTheme } from '@expo/styleguide-base';
import React, { createContext, useContext, PropsWithChildren } from 'react';
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
  const currentThemeName = systemColorScheme !== 'unspecified' ? systemColorScheme : 'light';
  const currentTheme = currentThemeName === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        name: currentThemeName,
        theme: currentTheme,
        setTheme: Appearance.setColorScheme,
      }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
