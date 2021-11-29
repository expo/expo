import { NavigationContainer } from '@react-navigation/native';
import { darkNavigationTheme, lightNavigationTheme } from 'expo-dev-client-components';
import * as React from 'react';
import { StatusBar } from 'react-native';

import { Packager } from '../../functions/getLocalPackagersAsync';
import { UserData } from '../../functions/getUserProfileAsync';
import { AppInfoProvider } from '../../hooks/useAppInfo';
import { DevMenuSettingsProvider } from '../../hooks/useDevMenuSettings';
import { LocalPackagersProvider } from '../../hooks/useLocalPackagers';
import { useTheme } from '../../hooks/useThemeName';
import { UserContextProvider } from '../../hooks/useUser';
import { AppInfo } from '../../native-modules/DevLauncherInternal';
import { DevMenuSettingsType } from '../../native-modules/DevMenuInternal';

export type AppProvidersProps = {
  children?: React.ReactNode;
  initialUserData?: UserData;
  initialDevMenuSettings?: DevMenuSettingsType;
  initialPackagers?: Packager[];
  initialAppInfo?: AppInfo;
};

export function AppProviders({
  children,
  initialUserData,
  initialDevMenuSettings,
  initialPackagers,
  initialAppInfo,
}: AppProvidersProps) {
  const [, isDark] = useTheme();
  const statusBarContent = isDark ? 'light-content' : 'dark-content';

  return (
    <UserContextProvider initialUserData={initialUserData}>
      <DevMenuSettingsProvider initialSettings={initialDevMenuSettings}>
        <LocalPackagersProvider initialPackagers={initialPackagers}>
          <AppInfoProvider initialAppInfo={initialAppInfo}>
            <NavigationContainer theme={isDark ? darkNavigationTheme : lightNavigationTheme}>
              <StatusBar barStyle={statusBarContent} />
              {children}
            </NavigationContainer>
          </AppInfoProvider>
        </LocalPackagersProvider>
      </DevMenuSettingsProvider>
    </UserContextProvider>
  );
}
