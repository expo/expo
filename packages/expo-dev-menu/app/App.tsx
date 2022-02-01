import React from 'react';

import { AppProviders } from './components/AppProviders';
import { Main } from './components/Main';

export function App() {
  return (
    <AppProviders>
      <Main />
    </AppProviders>
  );
}
