import {
  CommonActions,
  type NavigationAction,
  type NavigationState,
} from '@react-navigation/native';
import * as Linking from 'expo-linking';

import type { RouterStore } from './router-store';
import { ResultState } from '../fork/getStateFromPath';
import { Href, resolveHref } from '../link/href';
import { resolve } from '../link/path';
import { hasUrlProtocolPrefix } from '../utils/url';

function assertIsReady(store: RouterStore) {
  if (!store.navigationRef.isReady()) {
    throw new Error(
      'Attempted to navigate before mounting the Root Layout component. Ensure the Root Layout component is rendering a Slot, or other navigator on the first render.'
    );
  }
}

export function push(this: RouterStore, url: Href) {
  return this.linkTo(resolveHref(url));
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
  if (hasUrlProtocolPrefix(href)) {
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

  if (href.startsWith('.')) {
    let base =
      this.linking.getPathFromState?.(navigationRef.getRootState(), {
        screens: [],
        preserveGroups: true,
      }) ?? '';

    if (base && !base.endsWith('/')) {
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
      return navigationRef.dispatch(getNavigateReplaceAction(state, navigationRef.getRootState()));
    default:
      return navigationRef.dispatch(getNavigatePushAction(state));
  }
}

type NavigationParams = Partial<{
  screen: string;
  params: NavigationParams;
}>;

function rewriteNavigationStateToParams(
  state?: { routes: ResultState['routes'] },
  params: NavigationParams = {}
) {
  if (!state) return params;
  const lastRoute = state.routes.at(-1)!;
  params.screen = lastRoute.name;
  params.params = lastRoute.params ?? {};

  if (lastRoute.state) {
    rewriteNavigationStateToParams(lastRoute.state, params.params);
  }

  return params;
}

function getNavigatePushAction(state: ResultState) {
  const { screen, params } = rewriteNavigationStateToParams(state);
  return {
    type: 'NAVIGATE',
    payload: {
      name: screen,
      params,
    },
  };
}

function getNavigateReplaceAction(
  previousState: ResultState,
  parentState: NavigationState,
  lastNavigatorSupportingReplace: NavigationState = parentState
): NavigationAction {
  const state = previousState.routes.at(-1)!;

  // Only these navigators support replace
  if (parentState.type === 'stack' || parentState.type === 'tab') {
    lastNavigatorSupportingReplace = parentState;
  }

  const currentRoute = parentState.routes.find((route) => route.name === state.name);
  const routesDiverged = parentState.routes[parentState.index] !== currentRoute;

  // The routes has diverged or we reached the bottom route, so
  // we should navigate from the lastNavigatorSupportingReplace
  if (routesDiverged || !state.state) {
    const { screen, params } = rewriteNavigationStateToParams(previousState);
    return {
      type: lastNavigatorSupportingReplace.type === 'stack' ? 'REPLACE' : 'JUMP_TO',
      payload: {
        name: screen,
        params,
        source: lastNavigatorSupportingReplace?.key,
      },
    };
  }

  return getNavigateReplaceAction(
    state.state,
    currentRoute.state as any,
    lastNavigatorSupportingReplace
  );
}
