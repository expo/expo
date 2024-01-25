import { PartialRoute, Route, type NavigationState } from '@react-navigation/native';
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

function getNavigateAction(state: ResultState, parentState: NavigationState, type = 'NAVIGATE') {
  // Get the current route, which will be the last in the stack
  const route = state.routes[state.routes.length - 1]!;

  // Find the previous route in the parent state
  const previousRoute = parentState.routes.findLast((parentRoute) => {
    return areRoutesEqual(route, parentRoute);
  });

  if (previousRoute) {
    const routesAreEqual = areRoutesEqual(parentState.routes[parentState.index], previousRoute);
    // If there is nested state and the routes are equal, we should keep going down the tree
    if (route.state && routesAreEqual && previousRoute?.state) {
      return getNavigateAction(route.state, previousRoute.state as NavigationState, type);
    }
  }

  // Either we reached the bottom of the state or the point where the routes diverged
  const { screen, params } = rewriteNavigationStateToParams(state);

  if (type === 'PUSH' && parentState.type !== 'stack') {
    type = 'NAVIGATE';
  } else if (type === 'REPLACE' && parentState.type === 'tab') {
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

function areRoutesEqual(
  a: PartialRoute<any> | Route<any> = {},
  b: PartialRoute<any> | Route<any> = {}
) {
  // If params if the names are different
  if (a.name !== b.name) return false;

  const paramsA = a.params;
  const paramsB = b.params;

  // If both null return true
  if (paramsA === paramsB) return true;
  // If one is null, return false
  if (!paramsA || !paramsB) return false;

  // Otherwise compare both params objects
  const keysA = Object.keys(paramsA);

  return keysA.every((key) => {
    const valueA = paramsA[key];
    const valueB = paramsB[key];
    return valueA === valueB || valueA?.toString?.() === valueB?.toString?.();
  });
}
