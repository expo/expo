import type { PropsWithChildren } from 'react';
import { createContext, use, useState, useCallback, useEffect, useSyncExternalStore } from 'react';

import type { ReactNavigationState } from '../../global-state/types';
import { unstable_navigationEvents } from '../../navigationEvents';

function containsActiveRoute(state: ReactNavigationState, key: string): boolean {
  // Preloaded routes are deliberately excluded, including their active children.
  const routes =
    state.type === 'stack' ? state.routes.slice(0, (state.index ?? 0) + 1) : state.routes;
  return routes.some(
    (route) => route.key === key || (route.state && containsActiveRoute(route.state, key))
  );
}

const LinkPreviewContext = createContext<
  | {
      isStackAnimationDisabled: boolean;
      openPreviewKey: string | undefined;
      getOpenPreviewKey: () => string | undefined;
      setOpenPreviewKey: (openPreviewKey: string | undefined) => void;
    }
  | undefined
>(undefined);

function createOpenPreviewKeyStore() {
  let key: string | undefined;
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => key,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set: (nextKey: string | undefined) => {
      if (key === nextKey) return;
      key = nextKey;
      listeners.forEach((listener) => listener());
    },
  };
}

export function LinkPreviewContextProvider({ children }: PropsWithChildren) {
  const [store] = useState(createOpenPreviewKeyStore);
  const openPreviewKey = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );
  const setOpenPreviewKey = useCallback(
    (key: string | undefined) => {
      store.set(key);
    },
    [store]
  );
  useEffect(
    () =>
      unstable_navigationEvents.addListener('actionDispatched', ({ payload, state }) => {
        const key = store.getSnapshot();
        if (
          key !== undefined &&
          payload &&
          '__internal__PreviewKey' in payload &&
          payload.__internal__PreviewKey === key &&
          !containsActiveRoute(state, key)
        ) {
          // A stale native key falls back to ordinary navigation and won't receive
          // the matching transitionEnd. Restore animations after that action commits.
          setOpenPreviewKey(undefined);
        }
      }),
    [setOpenPreviewKey, store]
  );
  const isStackAnimationDisabled = openPreviewKey !== undefined;
  return (
    <LinkPreviewContext.Provider
      value={{
        isStackAnimationDisabled,
        openPreviewKey,
        getOpenPreviewKey: store.getSnapshot,
        setOpenPreviewKey,
      }}>
      {children}
    </LinkPreviewContext.Provider>
  );
}

export const useLinkPreviewContext = () => {
  const context = use(LinkPreviewContext);
  if (context == null) {
    throw new Error(
      'useLinkPreviewContext must be used within a LinkPreviewContextProvider. This is likely a bug in Expo Router.'
    );
  }
  return context;
};
