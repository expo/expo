'use client';

import { createContext, use, type ReactNode } from 'react';

import { usePreviewInfo } from '../link/preview/PreviewRouteContext';
import type { UrlObject } from './getRouteInfoFromState';
import { getCachedRouteInfo } from './routeInfoCache';
import { store } from './store';
import type { ReactNavigationState } from './types';

// Route info delivered through context and derived from the container's committed `useReducer` tree,
// so `usePathname`/`useSegments`/`useLocalSearchParams`/`useGlobalSearchParams` update in the *same*
// render as the tree — no extra commit from a post-commit store notify (which double-rendered every
// pathname consumer on each navigation). During a pending transition the value reflects the committed
// route until the destination commits (the intended timing: pathname updates with the screen). This
// is the D4 conversion off the retired uSES read.
const RouteInfoContext = createContext<UrlObject | null>(null);

// Rendered by the container with the committed tree it renders from (passed as a prop rather than
// read from `NavigationStateContext`, so this module doesn't import core and form a load cycle).
// Derives route info from the tree, memoized on the tree object by `getCachedRouteInfo` (the value
// keeps identity while the tree is unchanged, so consumers bail out).
export function RouteInfoProvider({
  state,
  children,
}: {
  state: ReactNavigationState | undefined;
  children: ReactNode;
}) {
  const routeInfo = state ? getCachedRouteInfo(state) : undefined;

  return (
    <RouteInfoContext.Provider value={routeInfo ?? null}>{children}</RouteInfoContext.Provider>
  );
}

export function useRouteInfo(): UrlObject {
  const { isPreview, segments, params, pathname } = usePreviewInfo();
  const contextRouteInfo = use(RouteInfoContext);

  if (isPreview) {
    return {
      pathname: pathname ?? '',
      segments: segments ?? [],
      unstable_globalHref: '',
      params: params ?? {},
      searchParams: new URLSearchParams(),
      pathnameWithParams: pathname ?? '',
    };
  }
  // Under the container (always, in a real app and in `renderRouter`) context drives the value; the
  // fallback covers a consumer rendered with no container (imperative-only paths / bare tests).
  return contextRouteInfo ?? store.getRouteInfo();
}
