import { ThemeProvider } from 'expo-dev-client-components';
import * as React from 'react';

import { SafeAreaProvider } from '../../vendored/react-native-safe-area-context/src';
import { AppInfoContextProvider, AppInfoContextProviderProps } from '../hooks/useAppInfo';
import { DevSettingsProviderProps, DevSettingsProvider } from '../hooks/useDevSettings';
import { MenuPreferencesProvider, MenuPreferencesProviderProps } from '../hooks/useMenuPreferences';

export type AppProvidersProps = {
  children?: React.ReactNode;
  appInfo?: AppInfoContextProviderProps['appInfo'];
  devSettings?: DevSettingsProviderProps['devSettings'];
  menuPreferences?: MenuPreferencesProviderProps['menuPreferences'];
};

export function AppProviders({
  children,
  appInfo,
  devSettings,
  menuPreferences,
}: AppProvidersProps) {
  return (
    <DevSettingsProvider devSettings={devSettings}>
      <SafeAreaProvider>
        <AppInfoContextProvider appInfo={appInfo}>
          <MenuPreferencesProvider menuPreferences={menuPreferences}>
            <ThemeProvider themePreference="no-preference">{children}</ThemeProvider>
          </MenuPreferencesProvider>
        </AppInfoContextProvider>
      </SafeAreaProvider>
    </DevSettingsProvider>
  );
}
