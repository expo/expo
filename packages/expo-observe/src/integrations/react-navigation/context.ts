import { createContext } from 'react';

import type { ReactNavigationIntegrationStorage } from './storage';
import type { GetPathname } from './types';

export interface ReactNavigationIntegrationContextValue {
  storage: ReactNavigationIntegrationStorage;
  getPathname: GetPathname;
}

export const ObserveReactNavigationIntegrationContext =
  createContext<ReactNavigationIntegrationContextValue | null>(null);
