import React from 'react';

import { AppProviders } from './components/AppProviders';
import { Main } from './components/Main';
import { AppInfo, DevSettings } from './native-modules/DevMenu';

type DevMenuInitialProps = {
  appInfo: AppInfo;
  devSettings: DevSettings;
};

export function App({ devSettings, appInfo }: DevMenuInitialProps) {
  return (
    <AppProviders appInfo={appInfo} devSettings={devSettings}>
      <Main />
    </AppProviders>
  );
}
