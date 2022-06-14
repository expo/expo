import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppProviders } from './components/AppProviders';
import { LoadInitialData } from './components/LoadInitialData';
import { Main } from './components/Main';
import { Onboarding } from './components/Onboarding';
import { Splash } from './components/Splash';
import { AppInfo, DevSettings, MenuPreferences } from './native-modules/DevMenu';

type DevMenuInitialProps = {
  appInfo: AppInfo;
  devSettings: DevSettings;
  menuPreferences: MenuPreferences;
  isDevice?: boolean;
  registeredCallbacks: string[];
};

export function App({
  devSettings,
  appInfo,
  menuPreferences,
  isDevice,
  registeredCallbacks,
}: DevMenuInitialProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders appInfo={appInfo} devSettings={devSettings} menuPreferences={menuPreferences}>
        <LoadInitialData loader={<Splash />}>
          <Main registeredCallbacks={registeredCallbacks} />
          <Onboarding isDevice={isDevice} />
        </LoadInitialData>
      </AppProviders>
    </GestureHandlerRootView>
  );
}
