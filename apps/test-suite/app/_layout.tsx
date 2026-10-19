import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
} from 'expo-router';
import * as React from 'react';

import { ThemeProvider, useTheme } from '../../common/ThemeProvider';
import { getTestSuiteStackScreenOptions } from '../navigationConfig';

function RootLayout() {
  const { theme, name: themeName } = useTheme();
  return (
    <NavigationThemeProvider value={themeName === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={getTestSuiteStackScreenOptions(theme)} />
    </NavigationThemeProvider>
  );
}

export default function Layout() {
  return (
    <ThemeProvider>
      <RootLayout />
    </ThemeProvider>
  );
}
