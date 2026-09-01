import {
  render as renderWithoutStore,
  renderHook as renderHookWithoutStore,
} from '@testing-library/react-native';
import { use, type ReactElement, type ReactNode } from 'react';

import {
  PendingIntentsContext,
  RoutingQueueProvider,
} from '../../../global-state/routingQueueContext';
import type { RoutingIntent } from '../../../global-state/routingQueue';
import type { RouteNode } from '../../../Route';
import { defaultRouteInfo, getRouteInfoFromState } from '../../../global-state/getRouteInfoFromState';
import { RouteInfoContext } from '../../../global-state/routeInfoContext';
import { RemovalPreventionProvider } from '../../../global-state/removalPrevention';
import { RouterConfigContext } from '../../../global-state/routerConfigContext';
import { RouterRegistryProvider } from '../../../global-state/routerRegistry';
import type { NavigationState } from '../../../react-navigation/routers';

let routeNode: RouteNode | null = null;
let navigationState: NavigationState | undefined;

export function setRouteNode(value: RouteNode | null) {
  routeNode = value;
}

export function setNavigationState(value: NavigationState | undefined) {
  navigationState = value;
}

let pendingIntents: RoutingIntent[] = [];

function PendingIntentsProbe() {
  pendingIntents = use(PendingIntentsContext);
  return null;
}

export function getPendingIntents() {
  return pendingIntents;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const routeInfo =
    navigationState?.routes[0]?.name === '__root'
      ? getRouteInfoFromState(navigationState)
      : defaultRouteInfo;
  return (
    <RoutingQueueProvider>
      <RouterConfigContext.Provider value={{ linking: undefined, redirects: [], routeNode }}>
        <RouterRegistryProvider>
          <RemovalPreventionProvider>
            <RouteInfoContext.Provider value={routeInfo}>{children}</RouteInfoContext.Provider>
          </RemovalPreventionProvider>
        </RouterRegistryProvider>
        <PendingIntentsProbe />
      </RouterConfigContext.Provider>
    </RoutingQueueProvider>
  );
}

export function render(element: ReactElement): ReturnType<typeof renderWithoutStore> {
  return renderWithoutStore(element, { wrapper: StoreProvider });
}

export function renderHook<Result>(callback: () => Result) {
  return renderHookWithoutStore(callback, { wrapper: StoreProvider });
}
