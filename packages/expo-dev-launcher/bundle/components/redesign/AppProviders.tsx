import { NavigationContainer } from '@react-navigation/native';
import * as React from 'react';
import { StatusBar } from 'react-native';

import { DevMenuSettingsProvider } from '../../hooks/useDevMenuSettings';
import { useTheme } from '../../hooks/useThemeName';
import { UserContextProvider } from '../../hooks/useUser';
import { darkNavigationTheme, lightNavigationTheme } from './theme';

type AppProvidersProps = {
  children?: React.ReactNode;
  startupScript?: Function;
};

export function AppProviders({ children, startupScript }: AppProvidersProps) {
  const [, isDark] = useTheme();
  const statusBarContent = isDark ? 'light-content' : 'dark-content';

  return (
    <UserContextProvider>
      <DevMenuSettingsProvider>
        <NavigationContainer theme={isDark ? darkNavigationTheme : lightNavigationTheme}>
          <StatusBar barStyle={statusBarContent} />
          {children}
        </NavigationContainer>
      </DevMenuSettingsProvider>
    </UserContextProvider>
  );
}
