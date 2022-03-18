import React from 'react';

import { AppProviders } from './components/AppProviders';
import { Main } from './components/Main';
import { Onboarding } from './components/Onboarding';
import { AppInfo, DevSettings, MenuPreferences } from './native-modules/DevMenu';

type DevMenuInitialProps = {
  appInfo: AppInfo;
  devSettings: DevSettings;
  menuPreferences: MenuPreferences;
  isDevice?: boolean;
};

export function App({ devSettings, appInfo, menuPreferences, isDevice }: DevMenuInitialProps) {
  return (
    <AppProviders appInfo={appInfo} devSettings={devSettings} menuPreferences={menuPreferences}>
      <Main />
      <Onboarding isDevice={isDevice} />
    </AppProviders>
  );
}
