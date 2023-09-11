import type { NavigationAction, NavigationState } from '@react-navigation/native';
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
  if (!event) {
    const { screen, params } = rewriteNavigationStateToParams(state);
    // TODO: Not sure how to type screen/params here
    return (navigationRef as any).navigate(screen, params);
  } else if (event === 'REPLACE') {
    const dispatch = getNavigateRefDispatchReplaceParams(state, navigationRef.getRootState());

    if (!dispatch) {
      // This shouldn't occur, as the the root navigator is a stack
      throw new Error(
        'No rendered navigators support replace navigation. Please use a <Stack /> or a <Tabs /> navigator.'
      );
    }

    navigationRef.dispatch(dispatch);
  } else {
    throw new Error('Unknown navigation event type: ' + event);
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

function getNavigateRefDispatchReplaceParams(
  previousState: ResultState,
  parentState: NavigationState,
  lastReplaceableNavigator: NavigationState | undefined = undefined
): NavigationAction | null {
  const state = previousState.routes.at(-1)!;

  if (parentState.type === 'stack' || parentState.type === 'tab') {
    lastReplaceableNavigator = parentState;
  }

  const loadedNavigator = parentState.routes.find((route: any) => route.name === state.name);

  const isNavigatingToDifferentNavigator =
    parentState.routes[parentState.index] !== loadedNavigator;

  if (isNavigatingToDifferentNavigator || !loadedNavigator?.state || !state.state) {
    if (!lastReplaceableNavigator) return null;

    const { screen: name, params } = rewriteNavigationStateToParams(previousState);

    return {
      type: lastReplaceableNavigator.type === 'stack' ? 'REPLACE' : 'JUMP_TO',
      payload: {
        name,
        params,
        source: lastReplaceableNavigator?.key,
      },
    };
  }

  return getNavigateRefDispatchReplaceParams(
    state.state,
    loadedNavigator.state as any,
    lastReplaceableNavigator
  );
}
