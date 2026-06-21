import { createContext } from 'react';

import type { ReactNavigationIntegrationStorage } from './storage';

export interface ReactNavigationIntegrationContextValue {
  storage: ReactNavigationIntegrationStorage;
}

export const ObserveReactNavigationIntegrationContext =
  createContext<ReactNavigationIntegrationContextValue | null>(null);
