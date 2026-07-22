import type { ComponentType } from 'react';

import type { RouteNode } from '../Route';
import type { ExpoLinkingOptions } from '../getLinkingConfig';
import { resolveHref, resolveHrefStringWithSegments } from '../link/href';
import type { NavigationContainerRefWithCurrent } from '../react-navigation/native';
import type { Href } from '../types';
import { defaultRouteInfo, type UrlObject } from './getRouteInfoFromState';
import { getCachedRouteInfo, routeInfoSubscribers } from './routeInfoCache';
import type {
  FocusedRouteState,
  LinkToOptions,
  ReactNavigationState,
  StoreRedirects,
} from './types';

export type RouterStore = typeof store;

type StoreRef = {
  navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
  routeNode: RouteNode | null;
  rootComponent: ComponentType<any>;
  // Pre-mount seed only: the compiled initial state `useSyncState` initialises from (via
  // `getSeedState`). Once the container mounts, `store.state` reads the live committed state from
  // `navigationRef.getRootState()` and never consults this field again — it is not a state mirror.
  state?: ReactNavigationState;
  linking?: ExpoLinkingOptions;
  config: any;
  redirects: StoreRedirects[];
  routeInfo?: UrlObject;
  // True while `getInitialURL()` returned a promise that hasn't resolved yet, so no seed exists.
  hasPendingInitialURL?: boolean;
};

export const storeRef = {
  current: {} as StoreRef,
};

// Dev-only invariant: assert a committed state is complete at every level (stale: false, keyed,
// explicit in-range index, non-empty routeNames), recursing into every route's nested state. Throws
// on the first violation so the offending level is obvious. See the RFC's "state invariant".
function assertStateIsComplete(state: ReactNavigationState, path: string[] = []): void {
  // `ReactNavigationState` is a union with `PartialState`, whose completeness fields are optional;
  // read them structurally rather than narrowing the union.
  const { stale, key, index, routeNames, routes } = state as {
    stale?: boolean;
    key?: unknown;
    index?: unknown;
    routeNames?: unknown;
    routes: { name: string; state?: ReactNavigationState }[];
  };
  const at = path.length ? ` at ${path.join(' > ')}` : ' at the root';
  const fail = (reason: string): never => {
    throw new Error(
      `Incomplete navigation state${at}: ${reason}. Navigation state must be complete at every ` +
        `level (stale: false, a key, an in-range index, and full routeNames). This is a bug in ` +
        `Expo Router — the compiler builds complete state and reducers only rearrange it. Please ` +
        `report it with the route you navigated to.`
    );
  };

  if (stale !== false) {
    fail(`stale is ${String(stale)} (expected false)`);
  }
  if (typeof key !== 'string' || key.length === 0) {
    fail(`missing a key`);
  }
  if (!Array.isArray(routeNames) || routeNames.length === 0) {
    fail(`missing routeNames`);
  }
  if (typeof index !== 'number' || index < 0 || index >= routes.length) {
    fail(`index ${String(index)} is out of range for ${routes.length} routes`);
  }

  for (const route of routes) {
    if (route.state !== undefined) {
      assertStateIsComplete(route.state, [...path, route.name]);
    }
  }
}

// Depth-first search for the committed sub-state whose key matches, mirroring the old
// `getCachedSlice` lookup but against the imperative committed tree rather than the render store.
function findSliceByKey(
  state: ReactNavigationState | undefined,
  key: string
): ReactNavigationState | undefined {
  if (state == null || (state as { stale?: unknown }).stale !== false) {
    return undefined;
  }
  if (state.key === key) {
    return state;
  }
  for (const route of state.routes) {
    const slice = findSliceByKey(route.state as ReactNavigationState | undefined, key);
    if (slice != null) {
      return slice;
    }
  }
  return undefined;
}

export const store = {
  shouldShowTutorial() {
    return !storeRef.current.routeNode && process.env.NODE_ENV === 'development';
  },
  get state(): ReactNavigationState | undefined {
    // Single source of truth: the committed container store, read live through the navigation ref.
    // Before the container mounts (its ref isn't attached yet) there is nothing to read, so fall
    // back to the compiled seed — the state `useSyncState` will initialise the container from.
    const { navigationRef } = storeRef.current;
    if (navigationRef?.current != null) {
      return navigationRef.getRootState() as ReactNavigationState | undefined;
    }
    return storeRef.current.state;
  },
  // Readiness gate: while the initial URL is still resolving there is no seed to render, so
  // `ExpoRoot` renders nothing (matching the old `NavigationContainer` fallback) until it resolves.
  get hasPendingInitialURL() {
    return storeRef.current.hasPendingInitialURL ?? false;
  },
  get navigationRef() {
    return storeRef.current.navigationRef;
  },
  get routeNode() {
    return storeRef.current.routeNode;
  },
  getRouteInfo(): UrlObject {
    return storeRef.current.routeInfo || defaultRouteInfo;
  },
  // The committed slice for a navigator key, walked from the last committed tree. Used where a
  // navigator must distinguish "already committed" from the rendered tree, which — post the Step-5
  // transitions flip — can lead the committed tree during a pending navigation (e.g. a tab's
  // first-visit detection must not treat a speculatively-rendered tab as already visited).
  getCommittedSlice(key: string): ReactNavigationState | undefined {
    return findSliceByKey(store.state, key);
  },
  get redirects() {
    return storeRef.current.redirects || [];
  },
  get rootComponent() {
    return storeRef.current.rootComponent;
  },
  getStateForHref(href: Href | string, options?: LinkToOptions) {
    href = resolveHref(href);

    href = resolveHrefStringWithSegments(href, store.getRouteInfo(), options);
    return this.linking?.getStateFromPath!(href, this.linking.config);
  },
  get linking() {
    return storeRef.current.linking;
  },
  setFocusedState(state: FocusedRouteState) {
    const routeInfo = getCachedRouteInfo(state);
    storeRef.current.routeInfo = routeInfo;
  },
  onStateChange(newState: ReactNavigationState | undefined) {
    if (!newState) {
      return;
    }
    if (process.env.NODE_ENV === 'development') {
      // Every committed state must be complete at every level: the store is the single seed and
      // reducers only rearrange present routes, so a stale/keyless level is a bug in the compiler
      // or a router — a hard failure in dev, not a silent warning.
      assertStateIsComplete(newState);
    }

    // `store.state` reads the committed state live, so this only derives the route info off the new
    // commit (and notifies its subscribers) — it does not mirror the state.
    storeRef.current.routeInfo = getCachedRouteInfo(newState);

    for (const callback of routeInfoSubscribers) {
      callback();
    }
  },
  assertIsReady() {
    if (!storeRef.current.navigationRef.isReady()) {
      throw new Error(
        'Attempted to navigate before mounting the Root Layout component. Ensure the Root Layout component is rendering a Slot, or other navigator on the first render.'
      );
    }
  },
};
