import { NavigationContainer } from '@react-navigation/native';
import {
  darkNavigationTheme,
  lightNavigationTheme,
  ThemeProvider,
} from 'expo-dev-client-components';
import * as React from 'react';
import { StatusBar, useColorScheme } from 'react-native';

import { UserData } from '../functions/getUserProfileAsync';
import { BuildInfoProvider } from '../hooks/useBuildInfo';
import { CrashReportProvider } from '../hooks/useCrashReport';
import { DevMenuSettingsProvider } from '../hooks/useDevMenuSettings';
import { DevSessionsProvider } from '../hooks/useDevSessions';
import { ModalProvider } from '../hooks/useModalStack';
import { PendingDeepLinkProvider } from '../hooks/usePendingDeepLink';
import { RecentApp, RecentlyOpenedAppsProvider } from '../hooks/useRecentlyOpenedApps';
import { UserContextProvider } from '../hooks/useUser';
import { BuildInfo, CrashReport } from '../native-modules/DevLauncherInternal';
import { DevMenuSettingsType } from '../native-modules/DevMenuInternal';
import { DevSession } from '../types';

export type AppProvidersProps = {
  children?: React.ReactNode;
  initialUserData?: UserData;
  initialDevMenuSettings?: DevMenuSettingsType;
  initialDevSessions?: DevSession[];
  initialBuildInfo?: BuildInfo;
  initialPendingDeepLink?: string;
  initialRecentlyOpenedApps?: RecentApp[];
  initialCrashReport?: CrashReport;
};

export function AppProviders({
  children,
  initialUserData,
  initialDevMenuSettings,
  initialDevSessions,
  initialBuildInfo,
  initialPendingDeepLink,
  initialRecentlyOpenedApps,
  initialCrashReport,
}: AppProvidersProps) {
  const theme = useColorScheme();
  const isDark = theme === 'dark';
  const statusBarContent = isDark ? 'light-content' : 'dark-content';

  return (
    <ThemeProvider themePreference="no-preference">
      <UserContextProvider initialUserData={initialUserData}>
        <DevMenuSettingsProvider initialSettings={initialDevMenuSettings}>
          <DevSessionsProvider initialDevSessions={initialDevSessions}>
            <RecentlyOpenedAppsProvider initialApps={initialRecentlyOpenedApps}>
              <BuildInfoProvider initialBuildInfo={initialBuildInfo}>
                <CrashReportProvider initialCrashReport={initialCrashReport}>
                  <ModalProvider>
                    <PendingDeepLinkProvider initialPendingDeepLink={initialPendingDeepLink}>
                      <NavigationContainer
                        theme={isDark ? darkNavigationTheme : lightNavigationTheme}>
                        <StatusBar barStyle={statusBarContent} />
                        {children}
                      </NavigationContainer>
                    </PendingDeepLinkProvider>
                  </ModalProvider>
                </CrashReportProvider>
              </BuildInfoProvider>
            </RecentlyOpenedAppsProvider>
          </DevSessionsProvider>
        </DevMenuSettingsProvider>
      </UserContextProvider>
    </ThemeProvider>
  );
}
