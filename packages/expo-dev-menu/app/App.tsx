import React from 'react';

import { AppProviders } from './components/AppProviders';
import { Main } from './components/Main';
import { AppInfo } from './native-modules/DevMenu';

type DevMenuInitialProps = {
  appInfo: AppInfo;
};

export function App({ appInfo }: DevMenuInitialProps) {
  return (
    <AppProviders appInfo={appInfo}>
      <Main />
    </AppProviders>
  );
}
