import * as React from 'react';

import { BuildInfoContextProvider } from '../../hooks/useBuildInfo';

export type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return <BuildInfoContextProvider>{children}</BuildInfoContextProvider>;
}
