import type { PropsWithChildren, RefObject } from 'react';
import { createContext, use, useState, useRef, useCallback, useEffect } from 'react';

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
      openPreviewKeyRef: RefObject<string | undefined>;
      setOpenPreviewKey: (openPreviewKey: string | undefined) => void;
    }
  | undefined
>(undefined);

export function LinkPreviewContextProvider({ children }: PropsWithChildren) {
  const [openPreviewKey, setRenderedPreviewKey] = useState<string | undefined>(undefined);
  const openPreviewKeyRef = useRef<string | undefined>(undefined);
  const setOpenPreviewKey = useCallback((key: string | undefined) => {
    // Native transition events can arrive before the state update is rendered.
    openPreviewKeyRef.current = key;
    setRenderedPreviewKey(key);
  }, []);
  useEffect(
    () =>
      unstable_navigationEvents.addListener('actionDispatched', ({ payload, state }) => {
        const key = openPreviewKeyRef.current;
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
    [setOpenPreviewKey]
  );
  const isStackAnimationDisabled = openPreviewKey !== undefined;
  return (
    <LinkPreviewContext.Provider
      value={{ isStackAnimationDisabled, openPreviewKey, openPreviewKeyRef, setOpenPreviewKey }}>
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
