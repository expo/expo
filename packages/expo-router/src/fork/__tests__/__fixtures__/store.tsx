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
import { storeRef } from '../../../global-state/store';
import { StoreContext, type StoreContextValue } from '../../../global-state/storeContext';

function EmptyScreen() {
  return null;
}

export const storeValue: StoreContextValue = {
  get navigationRef() {
    return storeRef.current.navigationRef;
  },
  linking: undefined,
  get state() {
    return storeRef.current.state;
  },
  rootComponent: EmptyScreen,
  get routeNode() {
    return storeRef.current.routeNode;
  },
  redirects: [],
};

let pendingIntents: RoutingIntent[] = [];

function PendingIntentsProbe() {
  pendingIntents = use(PendingIntentsContext);
  return null;
}

export function getPendingIntents() {
  return pendingIntents;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  return (
    <RoutingQueueProvider>
      <StoreContext.Provider value={storeValue}>{children}</StoreContext.Provider>
      <PendingIntentsProbe />
    </RoutingQueueProvider>
  );
}

export function render(element: ReactElement): ReturnType<typeof renderWithoutStore> {
  return renderWithoutStore(element, { wrapper: StoreProvider });
}

export function renderHook<Result>(callback: () => Result) {
  return renderHookWithoutStore(callback, { wrapper: StoreProvider });
}
