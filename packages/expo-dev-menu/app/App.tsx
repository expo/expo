import React from 'react';
import { View } from 'react-native';

import { AppProviders } from './components/AppProviders';
import { LoadInitialData } from './components/LoadInitialData';
import { Main } from './components/Main';
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
    <View style={{ flex: 1, direction: 'ltr' }}>
      <AppProviders appInfo={appInfo} devSettings={devSettings} menuPreferences={menuPreferences}>
        <LoadInitialData loader={<Splash />}>
          <Main registeredCallbacks={registeredCallbacks} isDevice={isDevice} />
        </LoadInitialData>
      </AppProviders>
    </View>
  );
}
