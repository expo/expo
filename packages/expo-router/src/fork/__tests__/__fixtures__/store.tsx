import {
  render as renderWithoutStore,
  renderHook as renderHookWithoutStore,
} from '@testing-library/react-native';
import { useMemo, useState, type ReactElement, type ReactNode } from 'react';

import { routingQueue, type RoutingIntent } from '../../../global-state/routingQueue';
import {
  PendingIntentsContext,
  RoutingQueueApiContext,
  type RoutingQueueApi,
} from '../../../global-state/routingQueueContext';
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

export function StoreProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<RoutingIntent[]>([]);
  const api = useMemo<RoutingQueueApi>(
    () => ({
      enqueue: (intent) => {
        routingQueue.queue = [...routingQueue.queue, intent];
        setQueue((previous) => [...previous, intent]);
      },
      dequeue: (processed) =>
        setQueue((previous) =>
          previous === processed ? [] : previous.slice(processed.length)
        ),
    }),
    []
  );

  return (
    <RoutingQueueApiContext.Provider value={api}>
      <PendingIntentsContext.Provider value={queue}>
        <StoreContext.Provider value={storeValue}>{children}</StoreContext.Provider>
      </PendingIntentsContext.Provider>
    </RoutingQueueApiContext.Provider>
  );
}

export function render(element: ReactElement): ReturnType<typeof renderWithoutStore> {
  return renderWithoutStore(element, { wrapper: StoreProvider });
}

export function renderHook<Result>(callback: () => Result) {
  return renderHookWithoutStore(callback, { wrapper: StoreProvider });
}
