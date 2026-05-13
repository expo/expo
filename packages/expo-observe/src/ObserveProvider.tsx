import { type PropsWithChildren } from 'react';

import { ObserveRouterIntegrationProvider } from './integrations/expo-router/ObserveRouterIntegrationProvider';

export function ObserveProvider({ children }: PropsWithChildren) {
  return <ObserveRouterIntegrationProvider>{children}</ObserveRouterIntegrationProvider>;
}
