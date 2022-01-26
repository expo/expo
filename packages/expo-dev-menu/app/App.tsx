import React from 'react';

import { AppProviders } from './components/redesign/AppProviders';
import { MainScreen } from './screens/MainScreen';

export function App() {
  return (
    <AppProviders>
      <MainScreen />
    </AppProviders>
  );
}
