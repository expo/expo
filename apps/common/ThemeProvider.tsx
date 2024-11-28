import { darkTheme, lightTheme } from '@expo/styleguide-base';
import React, { createContext, useState, useContext, PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

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
  const defaultTheme = useColorScheme() ?? 'light';
  const [currentThemeName, setCurrentThemeName] = useState<ThemeName>(defaultTheme);
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(
    defaultTheme === 'dark' ? darkTheme : lightTheme
  );

  function setTheme(name: ThemeName) {
    setCurrentThemeName(name);
    setCurrentTheme(name === 'dark' ? darkTheme : lightTheme);
  }

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
