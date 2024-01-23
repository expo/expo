import { type NavigationState } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import type { RouterStore } from './router-store';
import { ResultState } from '../fork/getStateFromPath';
import { Href, resolveHref } from '../link/href';
import { resolve } from '../link/path';
import { shouldLinkExternally } from '../utils/url';

function assertIsReady(store: RouterStore) {
  if (!store.navigationRef.isReady()) {
    throw new Error(
      'Attempted to navigate before mounting the Root Layout component. Ensure the Root Layout component is rendering a Slot, or other navigator on the first render.'
    );
  }
}

export function navigate(this: RouterStore, url: Href) {
  return this.linkTo(resolveHref(url), 'NAVIGATE');
}

export function push(this: RouterStore, url: Href) {
  return this.linkTo(resolveHref(url), 'PUSH');
}

export function replace(this: RouterStore, url: Href) {
  return this.linkTo(resolveHref(url), 'REPLACE');
}

export function goBack(this: RouterStore) {
  assertIsReady(this);
  this.navigationRef?.current?.goBack();
}

export function canGoBack(this: RouterStore): boolean {
  // Return a default value here if the navigation hasn't mounted yet.
  // This can happen if the user calls `canGoBack` from the Root Layout route
  // before mounting a navigator. This behavior exists due to React Navigation being dynamically
  // constructed at runtime. We can get rid of this in the future if we use
  // the static configuration internally.
  if (!this.navigationRef.isReady()) {
    return false;
  }
  return this.navigationRef?.current?.canGoBack() ?? false;
}

export function setParams(this: RouterStore, params: Record<string, string | number> = {}) {
  assertIsReady(this);
  return (this.navigationRef?.current?.setParams as any)(params);
}

export function linkTo(this: RouterStore, href: string, event?: string) {
  if (shouldLinkExternally(href)) {
    Linking.openURL(href);
    return;
  }

  assertIsReady(this);
  const navigationRef = this.navigationRef.current;

  if (navigationRef == null) {
    throw new Error(
      "Couldn't find a navigation object. Is your component inside NavigationContainer?"
    );
  }

  if (!this.linking) {
    throw new Error('Attempted to link to route when no routes are present');
  }

  if (href === '..' || href === '../') {
    navigationRef.goBack();
    return;
  }

  const rootState = navigationRef.getRootState();

  if (href.startsWith('.')) {
    // Resolve base path by merging the current segments with the params
    let base =
      this.routeInfo?.segments
        ?.map((segment) => {
          if (!segment.startsWith('[')) return segment;

          if (segment.startsWith('[...')) {
            segment = segment.slice(4, -1);
            const params = this.routeInfo?.params?.[segment];
            if (Array.isArray(params)) {
              return params.join('/');
            } else {
              return params?.split(',')?.join('/') ?? '';
            }
          } else {
            segment = segment.slice(1, -1);
            return this.routeInfo?.params?.[segment];
          }
        })
        .filter(Boolean)
        .join('/') ?? '/';

    if (!this.routeInfo?.isIndex) {
      base += '/..';
    }

    href = resolve(base, href);
  }

  const state = this.linking.getStateFromPath!(href, this.linking.config);

  if (!state || state.routes.length === 0) {
    console.error('Could not generate a valid navigation state for the given path: ' + href);
    return;
  }

  return navigationRef.dispatch(getNavigateAction(state, rootState, event));
}

type NavigationParams = Partial<{
  screen: string;
  params: NavigationParams;
}>;

function rewriteNavigationStateToParams(
  state?: { routes: ResultState['routes'] } | NavigationState,
  params: NavigationParams = {}
) {
  if (!state) return params;
  // We Should always have at least one route in the state
  const lastRoute = state.routes[state.routes.length - 1]!;
  params.screen = lastRoute.name;
  // Weirdly, this always needs to be an object. If it's undefined, it won't work.
  params.params = lastRoute.params ? JSON.parse(JSON.stringify(lastRoute.params)) : {};

  if (lastRoute.state) {
    rewriteNavigationStateToParams(lastRoute.state, params.params);
  }

  return JSON.parse(JSON.stringify(params));
}

function getNavigateAction(state, parentState, type = 'NAVIGATE') {
    const route = state.routes[state.routes.length - 1];
    const currentRoute = parentState.routes.reverse().find((parentRoute) => parentRoute.name === route.name);
    const routesAreEqual = areObjectsEqual(route, currentRoute,["key", "screen","state"], ["params"]);
    const routesParamsAreEqual = areObjectsEqual(route.params, currentRoute.params,["key","screen","params"], ["params"]);

    // If there is nested state and the routes and params are equal, we should keep going down the tree
    if (route.state && routesAreEqual && routesParamsAreEqual && currentRoute.state) {
        return getNavigateAction(route.state, currentRoute.state, type);
    }
    // Either we reached the bottom of the state or the point where the routes diverged
    const { screen, params } = rewriteNavigationStateToParams(state);
    if (type === 'PUSH' && parentState.type !== 'stack') {
        type = 'NAVIGATE';
    }
    else if (type === 'REPLACE' && parentState.type === 'tab') {
        type = 'JUMP_TO';
    }
    return {
        type,
        target: parentState.key,
        payload: {
            name: screen,
            params,
        },
    };
}
function areObjectsEqual(obj1, obj2, keysToSkip = [], subKeysToSkip = []) {
    // Base case checks
    if (obj1 === obj2) {
        return true;
    }

    if (obj1 == null || obj2 == null || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
        return false;
    }

    // Prepare the keys list, excluding any keys that should be skipped
    const keys1 = Object.keys(obj1).filter(key => !keysToSkip.includes(key));
    const keys2 = Object.keys(obj2).filter(key => !keysToSkip.includes(key));

    // Check if both objects have the same number of keys
    if (keys1.length !== keys2.length) {
        return false;
    }

    // Recursively compare each key in the objects
    for (let key of keys1) {
        if (!keys2.includes(key)) {
            return false;
        }

        if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
            // If it's a nested object, and the key should be skipped in the nested object, skip the comparison
            if (!subKeysToSkip.includes(key) && !areObjectsEqual(obj1[key], obj2[key], keysToSkip, subKeysToSkip)) {
                return false;
            }
        } else if (obj1[key] !== obj2[key]) {
            return false;
        }
    }

    return true;
}
