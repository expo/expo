import { NavigationContainer } from '@react-navigation/native';
import { darkNavigationTheme, lightNavigationTheme } from 'expo-dev-client-components';
import * as React from 'react';
import { StatusBar, useColorScheme } from 'react-native';

import { Packager } from '../../functions/getLocalPackagersAsync';
import { UserData } from '../../functions/getUserProfileAsync';
import { BuildInfoProvider } from '../../hooks/useBuildInfo';
import { DevMenuSettingsProvider } from '../../hooks/useDevMenuSettings';
import { LocalPackagersProvider } from '../../hooks/useLocalPackagers';
import { PendingDeepLinkProvider } from '../../hooks/usePendingDeepLink';
import { UserContextProvider } from '../../hooks/useUser';
import { BuildInfo } from '../../native-modules/DevLauncherInternal';
import { DevMenuSettingsType } from '../../native-modules/DevMenuInternal';

export type AppProvidersProps = {
  children?: React.ReactNode;
  initialUserData?: UserData;
  initialDevMenuSettings?: DevMenuSettingsType;
  initialPackagers?: Packager[];
  initialBuildInfo?: BuildInfo;
  initialPendingDeepLink?: string;
};

export function AppProviders({
  children,
  initialUserData,
  initialDevMenuSettings,
  initialPackagers,
  initialBuildInfo,
  initialPendingDeepLink,
}: AppProvidersProps) {
  const theme = useColorScheme();
  const isDark = theme === 'dark';
  const statusBarContent = isDark ? 'light-content' : 'dark-content';

  return (
    <UserContextProvider initialUserData={initialUserData}>
      <DevMenuSettingsProvider initialSettings={initialDevMenuSettings}>
        <LocalPackagersProvider initialPackagers={initialPackagers}>
          <BuildInfoProvider initialBuildInfo={initialBuildInfo}>
            <PendingDeepLinkProvider initialPendingDeepLink={initialPendingDeepLink}>
              <NavigationContainer theme={isDark ? darkNavigationTheme : lightNavigationTheme}>
                <StatusBar barStyle={statusBarContent} />
                {children}
              </NavigationContainer>
            </PendingDeepLinkProvider>
          </BuildInfoProvider>
        </LocalPackagersProvider>
      </DevMenuSettingsProvider>
    </UserContextProvider>
  );
}
