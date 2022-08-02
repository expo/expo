import { lightTheme, darkTheme, typography } from '@expo/styleguide-native';
import React, { useState } from 'react';
import { Platform, StatusBar } from 'react-native';

export const ThemeContext = React.createContext({
  theme: lightTheme,
  typography,
  toggleTheme: () => {},
});

type ThemeProviderProps = React.PropsWithChildren<object>;

const setStatusBarStyle = (isLightTheme: boolean) => {
  if (Platform.OS === 'ios') {
    if (isLightTheme) {
      StatusBar.setBarStyle('light-content', false);
    } else {
      StatusBar.setBarStyle('dark-content', false);
    }
  }
};

const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [isLightTheme, setLightTheme] = useState(true);

  const toggleTheme = () => {
    setStatusBarStyle(isLightTheme);
    setLightTheme((prevState) => !prevState);
  };

  const theme = {
    theme: isLightTheme ? lightTheme : darkTheme,
    typography,
    toggleTheme,
  };

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;
