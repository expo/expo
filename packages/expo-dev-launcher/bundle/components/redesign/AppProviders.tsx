import { NavigationContainer } from '@react-navigation/native';
import { darkNavigationTheme, lightNavigationTheme } from 'expo-dev-client-components';
import * as React from 'react';
import { StatusBar, useColorScheme } from 'react-native';

import { UserData } from '../../functions/getUserProfileAsync';
import { BuildInfoProvider } from '../../hooks/useBuildInfo';
import { DevMenuSettingsProvider } from '../../hooks/useDevMenuSettings';
import { DevSessionsProvider } from '../../hooks/useDevSessions';
import { ModalProvider } from '../../hooks/useModalStack';
import { PendingDeepLinkProvider } from '../../hooks/usePendingDeepLink';
import { RecentApp, RecentlyOpenedAppsProvider } from '../../hooks/useRecentlyOpenedApps';
import { UserContextProvider } from '../../hooks/useUser';
import { BuildInfo } from '../../native-modules/DevLauncherInternal';
import { DevMenuSettingsType } from '../../native-modules/DevMenuInternal';
import { DevSession } from '../../types';

export type AppProvidersProps = {
  children?: React.ReactNode;
  initialUserData?: UserData;
  initialDevMenuSettings?: DevMenuSettingsType;
  initialDevSessions?: DevSession[];
  initialBuildInfo?: BuildInfo;
  initialPendingDeepLink?: string;
  initialRecentlyOpenedApps?: RecentApp[];
};

export function AppProviders({
  children,
  initialUserData,
  initialDevMenuSettings,
  initialDevSessions,
  initialBuildInfo,
  initialPendingDeepLink,
  initialRecentlyOpenedApps,
}: AppProvidersProps) {
  const theme = useColorScheme();
  const isDark = theme === 'dark';
  const statusBarContent = isDark ? 'light-content' : 'dark-content';

  return (
    <UserContextProvider initialUserData={initialUserData}>
      <DevMenuSettingsProvider initialSettings={initialDevMenuSettings}>
        <DevSessionsProvider initialDevSessions={initialDevSessions}>
          <RecentlyOpenedAppsProvider initialApps={initialRecentlyOpenedApps}>
            <BuildInfoProvider initialBuildInfo={initialBuildInfo}>
              <ModalProvider>
                <PendingDeepLinkProvider initialPendingDeepLink={initialPendingDeepLink}>
                  <NavigationContainer theme={isDark ? darkNavigationTheme : lightNavigationTheme}>
                    <StatusBar barStyle={statusBarContent} />
                    {children}
                  </NavigationContainer>
                </PendingDeepLinkProvider>
              </ModalProvider>
            </BuildInfoProvider>
          </RecentlyOpenedAppsProvider>
        </DevSessionsProvider>
      </DevMenuSettingsProvider>
    </UserContextProvider>
  );
}
