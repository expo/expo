import { NavigationContainer } from '@react-navigation/native';
import * as React from 'react';
import { StatusBar } from 'react-native';

import { useTheme } from '../hooks/useThemeName';
import { UserContextProvider } from '../hooks/useUser';
import { darkNavigationTheme, lightNavigationTheme } from './redesign/theme';

export function AppProviders({ children }: { children?: React.ReactNode }) {
  const [, isDark] = useTheme();
  const statusBarContent = isDark ? 'light-content' : 'dark-content';

  return (
    <UserContextProvider>
      <StatusBar barStyle={statusBarContent} />
      <NavigationContainer theme={isDark ? darkNavigationTheme : lightNavigationTheme}>
        {children}
      </NavigationContainer>
    </UserContextProvider>
  );
}
