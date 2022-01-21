import * as React from 'react';

import { BottomSheetProvider } from '../../hooks/useBottomSheet';
import { BuildInfoContextProvider, BuildInfoContextProviderProps } from '../../hooks/useBuildInfo';

export type AppProvidersProps = {
  children?: React.ReactNode;
  initialBuildInfo?: BuildInfoContextProviderProps['initialBuildInfo'];
};

export function AppProviders({ children, initialBuildInfo }: AppProvidersProps) {
  return (
    <BuildInfoContextProvider initialBuildInfo={initialBuildInfo}>
      <BottomSheetProvider>{children}</BottomSheetProvider>
    </BuildInfoContextProvider>
  );
}
