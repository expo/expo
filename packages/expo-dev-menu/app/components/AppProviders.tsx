import * as React from 'react';

import { AppInfoContextProvider, AppInfoContextProviderProps } from '../hooks/useAppInfo';
import { BottomSheetProvider } from '../hooks/useBottomSheet';

export type AppProvidersProps = {
  children?: React.ReactNode;
  initialAppInfo?: AppInfoContextProviderProps['initialAppInfo'];
};

export function AppProviders({ children, initialAppInfo }: AppProvidersProps) {
  return (
    <AppInfoContextProvider initialAppInfo={initialAppInfo}>
      <BottomSheetProvider>{children}</BottomSheetProvider>
    </AppInfoContextProvider>
  );
}
