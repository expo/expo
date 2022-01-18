import React from 'react';

import { AppProviders } from './components/redesign/AppProviders';
import { BottomSheetContainer } from './components/redesign/BottomSheetContainer';
import { MainScreen } from './screens/MainScreen';

export function App() {
  return (
    <AppProviders>
      <BottomSheetContainer>
        <MainScreen />
      </BottomSheetContainer>
    </AppProviders>
  );
}
