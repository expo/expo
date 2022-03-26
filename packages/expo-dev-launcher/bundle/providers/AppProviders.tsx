import { NavigationContainer } from '@react-navigation/native';
import {
  darkNavigationTheme,
  lightNavigationTheme,
  ThemeProvider,
} from 'expo-dev-client-components';
import * as React from 'react';
import { StatusBar, useColorScheme } from 'react-native';

import { UserData } from '../functions/getUserProfileAsync';
import { BuildInfo, CrashReport } from '../native-modules/DevLauncherInternal';
import { DevMenuPreferencesType } from '../native-modules/DevMenuPreferences';
import { DevSession } from '../types';
import { BuildInfoProvider } from './BuildInfoProvider';
import { CrashReportProvider } from './CrashReportProvider';
import { DevMenuPreferencesProvider } from './DevMenuPreferencesProvider';
import { DevSessionsProvider } from './DevSessionsProvider';
import { ModalStackProvider } from './ModalStackProvider';
import { PendingDeepLinkProvider } from './PendingDeepLinkProvider';
import { QueryProvider } from './QueryProvider';
import { RecentApp, RecentlyOpenedAppsProvider } from './RecentlyOpenedAppsProvider';
import { ToastStackProvider } from './ToastStackProvider';
import { UserContextProvider } from './UserContextProvider';

export type AppProvidersProps = {
  children?: React.ReactNode;
  initialUserData?: UserData;
  initialDevMenuPreferences?: DevMenuPreferencesType;
  initialDevSessions?: DevSession[];
  initialBuildInfo?: BuildInfo;
  initialPendingDeepLink?: string;
  initialRecentlyOpenedApps?: RecentApp[];
  initialCrashReport?: CrashReport;
};

export function AppProviders({
  children,
  initialUserData,
  initialDevMenuPreferences,
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
    <QueryProvider>
      <ThemeProvider themePreference="no-preference">
        <UserContextProvider initialUserData={initialUserData}>
          <DevMenuPreferencesProvider initialPreferences={initialDevMenuPreferences}>
            <DevSessionsProvider initialDevSessions={initialDevSessions}>
              <RecentlyOpenedAppsProvider initialApps={initialRecentlyOpenedApps}>
                <BuildInfoProvider initialBuildInfo={initialBuildInfo}>
                  <CrashReportProvider initialCrashReport={initialCrashReport}>
                    <ModalStackProvider>
                      <ToastStackProvider>
                        <PendingDeepLinkProvider initialPendingDeepLink={initialPendingDeepLink}>
                          <NavigationContainer
                            theme={isDark ? darkNavigationTheme : lightNavigationTheme}>
                            <StatusBar barStyle={statusBarContent} />
                            {children}
                          </NavigationContainer>
                        </PendingDeepLinkProvider>
                      </ToastStackProvider>
                    </ModalStackProvider>
                  </CrashReportProvider>
                </BuildInfoProvider>
              </RecentlyOpenedAppsProvider>
            </DevSessionsProvider>
          </DevMenuPreferencesProvider>
        </UserContextProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
