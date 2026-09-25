import { createContext, type PropsWithChildren, useEffect, useRef, useState } from 'react';

import { initListeners, isInitialized } from './init';
import { optionalRouter } from './router';
import { createRouterIntegrationStorage, type RouterIntegrationStorage } from './storage';

export const ObserveRouterIntegrationContext = createContext<RouterIntegrationStorage | null>(null);

export function ObserveRouterIntegrationProvider({ children }: PropsWithChildren) {
  const [storage] = useState<RouterIntegrationStorage | null>(() =>
    isInitialized() ? createRouterIntegrationStorage() : null
  );
  const [listenersCleanup] = useState(() => {
    // Listeners are attached during render so they exist before child effects emit the first
    // `pageFocused`. Server rendering never runs the effect cleanup below, so subscribing there
    // would leak a listener per request; navigation never happens on the server anyway.
    if (!storage || !optionalRouter || typeof window === 'undefined') return;
    return initListeners(storage, optionalRouter.unstable_navigationEvents);
  });

  const prevInitialized = useRef(isInitialized());
  if (prevInitialized.current !== isInitialized()) {
    throw new Error(
      `[expo-observe] Router integration was ${isInitialized() ? 'enabled' : 'disabled'} after application mounted. Call Observe.configure() before mounting AppMetricsRoot.`
    );
  }

  useEffect(() => listenersCleanup, [listenersCleanup]);

  return (
    <ObserveRouterIntegrationContext.Provider value={storage}>
      {children}
    </ObserveRouterIntegrationContext.Provider>
  );
}
