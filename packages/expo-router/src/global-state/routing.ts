import { type NavigationAction, type NavigationState } from '@react-navigation/native';
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
  return this.linkTo(resolveHref(url));
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

  switch (event) {
    case 'REPLACE':
      return navigationRef.dispatch(getNavigateReplaceAction(state, rootState));
    case 'PUSH':
      return navigationRef.dispatch(getNavigatePushAction(state, rootState));
    default:
      return navigationRef.dispatch(getNavigateAction(state, rootState));
  }
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

function getNavigateAction(state: ResultState, rootState: NavigationState) {
  const { screen, params } = rewriteNavigationStateToParams(state);
  return {
    type: 'NAVIGATE',
    target: rootState.key,
    payload: {
      name: screen,
      params,
    },
  };
}

function getNavigatePushAction(desiredState: ResultState, rootState: NavigationState) {
  const sharedParents = getSharedNavigators(desiredState, rootState, false);
  const lastSharedParent = sharedParents.at(-1);

  if (lastSharedParent?.type === 'stack') {
    const { screen, params } = rewriteNavigationStateToParams(desiredState);
    return {
      type: 'PUSH',
      target: lastSharedParent.key,
      payload: {
        name: screen,
        params,
      },
    };
  } else {
    return getNavigateAction(desiredState, rootState);
  }
}

function getNavigateReplaceAction(
  desiredState: ResultState,
  navigationState: NavigationState
): NavigationAction {
  const sharedParents = getSharedNavigators(desiredState, navigationState);
  const lastNavigatorSupportingReplace =
    sharedParents?.findLast((parent) => parent.type === 'stack' || parent.type === 'tab') ?? -1;

  if (lastNavigatorSupportingReplace === -1) {
    throw new Error();
  }

  const { screen, params } = rewriteNavigationStateToParams(desiredState);

  return {
    type: lastNavigatorSupportingReplace.type === 'stack' ? 'REPLACE' : 'JUMP_TO',
    target: lastNavigatorSupportingReplace?.key,
    payload: {
      name: screen,
      params,
    },
  };
}

function getSharedNavigators(
  left: ResultState,
  right: NavigationState,
  allowPartial = true,
  shared: NavigationState[] = []
) {
  shared.push(right);

  const leftRoute = left.routes.at(-1)!;
  const matchedRoute = right.routes.find((route) => route.name === leftRoute.name);
  const routesShareNavigator = right.routes[right.index] === matchedRoute;

  if (routesShareNavigator && leftRoute.state && matchedRoute.state) {
    return getSharedNavigators(
      leftRoute.state,
      matchedRoute.state as NavigationState,
      allowPartial,
      shared
    );
  }

  const isPartialMatch = shared.length > 1 || leftRoute.state || matchedRoute?.state;

  if (allowPartial && isPartialMatch) {
    return shared;
  } else if (!isPartialMatch) {
    return shared;
  }

  return [];
}
