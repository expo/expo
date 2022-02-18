import * as React from 'react';

import { AppInfoContextProvider, AppInfoContextProviderProps } from '../hooks/useAppInfo';
import { BottomSheetProvider } from '../hooks/useBottomSheet';

export type AppProvidersProps = {
  children?: React.ReactNode;
  appInfo?: AppInfoContextProviderProps['appInfo'];
};

export function AppProviders({ children, appInfo }: AppProvidersProps) {
  return (
    <AppInfoContextProvider appInfo={appInfo}>
      <BottomSheetProvider>{children}</BottomSheetProvider>
    </AppInfoContextProvider>
  );
}
