import { getRouteInfoFromState, type UrlObject } from './getRouteInfoFromState';
import type { FocusedRouteState, ReactNavigationState } from './types';

const routeInfoCache = new WeakMap<FocusedRouteState | ReactNavigationState, UrlObject>();
const routeInfoValuesCache = new Map<string, UrlObject>();

export function getCachedRouteInfo(state: ReactNavigationState) {
  let routeInfo = routeInfoCache.get(state);

  if (!routeInfo) {
    routeInfo = getRouteInfoFromState(state);

    const routeInfoString = JSON.stringify(routeInfo);
    // Using cached values to avoid re-renders, to increase the chance that the object reference is the same
    const cachedRouteInfo = routeInfoValuesCache.get(routeInfoString);

    if (cachedRouteInfo) {
      routeInfo = cachedRouteInfo;
    } else {
      routeInfoValuesCache.set(routeInfoString, routeInfo);
    }

    routeInfoCache.set(state, routeInfo);
  }

  return routeInfo;
}

export function setCachedRouteInfo(
  state: FocusedRouteState | ReactNavigationState,
  routeInfo: UrlObject
) {
  routeInfoCache.set(state, routeInfo);
  routeInfoValuesCache.set(JSON.stringify(routeInfo), routeInfo);
}

// Route info is a *derived projection* of the navigation tree, finalized (with leaf-accurate focused
// params via setFocusedState) when the tree commits. Consumers subscribe to be re-rendered when it
// changes. This is intentionally a plain pub/sub, not `useSyncExternalStore` — `useRouteInfo`
// consumes it with useEffect + a reducer tick. (Flowing route info purely through context is a
// larger follow-up; see the RouteInfoContext design.)
export const routeInfoSubscribers = new Set<() => void>();

export const routeInfoSubscribe = (callback: () => void) => {
  routeInfoSubscribers.add(callback);
  return () => {
    routeInfoSubscribers.delete(callback);
  };
};

export const notifyRouteInfoSubscribers = () => {
  for (const callback of routeInfoSubscribers) {
    callback();
  }
};
