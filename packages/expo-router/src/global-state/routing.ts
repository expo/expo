import { StackActions, type NavigationState } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { nanoid } from 'nanoid/non-secure';

import { type RouterStore } from './router-store';
import { ExpoRouter } from '../../types/expo-router';
import { ResultState } from '../fork/getStateFromPath';
import { resolveHref } from '../link/href';
import { resolve } from '../link/path';
import { shouldLinkExternally } from '../utils/url';

function assertIsReady(store: RouterStore) {
  if (!store.navigationRef.isReady()) {
    throw new Error(
      'Attempted to navigate before mounting the Root Layout component. Ensure the Root Layout component is rendering a Slot, or other navigator on the first render.'
    );
  }
}

export function navigate(this: RouterStore, url: ExpoRouter.Href) {
  return this.linkTo(resolveHref(url), 'NAVIGATE');
}

export function push(this: RouterStore, url: ExpoRouter.Href) {
  return this.linkTo(resolveHref(url), 'PUSH');
}

export function dismiss(this: RouterStore, count?: number) {
  this.navigationRef?.dispatch(StackActions.pop(count));
}

export function replace(this: RouterStore, url: ExpoRouter.Href) {
  return this.linkTo(resolveHref(url), 'REPLACE');
}

export function dismissAll(this: RouterStore) {
  this.navigationRef?.dispatch(StackActions.popToTop());
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

export function canDismiss(this: RouterStore): boolean {
  let state = this.rootState;

  // Keep traversing down the state tree until we find a stack navigator that we can pop
  while (state) {
    if (state.type === 'stack' && state.routes.length > 1) {
      return true;
    }
    if (state.index === undefined) return false;

    state = state.routes?.[state.index]?.state as any;
  }

  return false;
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
  key?: string;
}>;

function rewriteNavigationStateToParams(
  state: { routes: ResultState['routes'] } | NavigationState | undefined,
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
  const { screen, params } = rewriteNavigationStateToParams(state);

  let key: string | undefined;

  if (type === 'PUSH') {
    /*
     * The StackAction.PUSH does not work correctly with Expo Router.
     *
     * Expo Router provides a getId() function for every route, altering how React Navigation handles stack routing.
     * Ordinarily, PUSH always adds a new screen to the stack. However, with getId() present, it navigates to the screen with the matching ID instead (by moving the screen to the top of the stack)
     * When you try and push to a screen with the same ID, no navigation will occur
     * Refer to: https://github.com/react-navigation/react-navigation/blob/13d4aa270b301faf07960b4cd861ffc91e9b2c46/packages/routers/src/StackRouter.tsx#L279-L290
     *
     * Expo Router needs to retain the default behavior of PUSH, consistently adding new screens to the stack, even if their IDs are identical.
     *
     * To resolve this issue, we switch to using a NAVIGATE action with a new key. In the navigate action, screens are matched by either key or getId() function.
     * By generating a unique new key, we ensure that the screen is always pushed onto the stack.
     *
     */
    type = 'NAVIGATE';

    if (parentState.type === 'stack') {
      key = `${screen}-${nanoid()}`; // @see https://github.com/react-navigation/react-navigation/blob/13d4aa270b301faf07960b4cd861ffc91e9b2c46/packages/routers/src/StackRouter.tsx#L406-L407
    }
  } else if (type === 'REPLACE' && parentState.type === 'tab') {
    type = 'JUMP_TO';
  }

  return {
    type,
    target: parentState.key,
    payload: {
      key,
      name: screen,
      params,
    },
  };
}
