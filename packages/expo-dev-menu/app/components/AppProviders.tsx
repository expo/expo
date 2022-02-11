import * as React from 'react';

import { AppInfoContextProvider, AppInfoContextProviderProps } from '../hooks/useAppInfo';
import { BottomSheetProvider } from '../hooks/useBottomSheet';
import { DevSettingsProviderProps, DevSettingsProvider } from '../hooks/useDevSettings';

export type AppProvidersProps = {
  children?: React.ReactNode;
  appInfo?: AppInfoContextProviderProps['appInfo'];
  devSettings?: DevSettingsProviderProps['devSettings'];
};

export function AppProviders({ children, appInfo, devSettings }: AppProvidersProps) {
  return (
    <DevSettingsProvider devSettings={devSettings}>
      <AppInfoContextProvider appInfo={appInfo}>
        <BottomSheetProvider>{children}</BottomSheetProvider>
      </AppInfoContextProvider>
    </DevSettingsProvider>
  );
}
