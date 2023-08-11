import { CommonActions, getActionFromState, StackActions } from '@react-navigation/core';
import { TabActions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import type { RouterStore } from './router-store';
import { Href, resolveHref } from '../link/href';
import { resolve } from '../link/path';
import {
  NavigateAction,
  findTopRouteForTarget,
  getEarliestMismatchedRoute,
  getQualifiedStateForTopOfTargetState,
  isMovingToSiblingRoute,
} from '../link/stateOperations';
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
  assertIsReady(this);
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

  if (!state) {
    console.error('Could not generate a valid navigation state for the given path: ' + href);
    return;
  }

  const rootState = navigationRef.getRootState();

  // Ensure simple operations are used when moving between siblings
  // in the same navigator. This ensures that the state is not reset.
  // TODO: We may need to apply this at a larger scale in the future.
  if (isMovingToSiblingRoute(rootState, state)) {
    // Can perform naive movements
    const knownOwnerState = getQualifiedStateForTopOfTargetState(rootState, state)!;
    const nextRoute = findTopRouteForTarget(state);
    // NOTE(EvanBacon): There's an issue where moving from "a -> b" is considered siblings:
    // a. index (initialRouteName="index")
    // b. stack/index
    // However, the preservation approach doesn't work because it would be moving to a route with the same name.
    // The next check will see if the current focused route has the same name as the next route, if so, then fallback on
    // the default React Navigation logic.
    if (
      findTopRouteForTarget(
        // @ts-expect-error: stale types don't matter here
        rootState
      )?.name !== nextRoute.name
    ) {
      if (event === 'REPLACE') {
        if (knownOwnerState.type === 'tab') {
          navigationRef.dispatch(TabActions.jumpTo(nextRoute.name, nextRoute.params));
        } else {
          navigationRef.dispatch(StackActions.replace(nextRoute.name, nextRoute.params));
        }
      } else {
        // NOTE: Not sure if we should pop or push here...
        navigationRef.dispatch(CommonActions.navigate(nextRoute.name, nextRoute.params));
      }
      return;
    }
  }

  // TODO: Advanced movements across multiple navigators

  const action = getActionFromState(state, this.linking.config);
  if (action) {
    // Here we have a navigation action to a nested screen, where we should ideally replace.
    // This request can only be fulfilled if the target is an initial route.
    // First, check if the action is fully initial routes.
    // Then find the nearest mismatched route in the existing state.
    // Finally, use the correct navigator-based action to replace the nested screens.
    // NOTE(EvanBacon): A future version of this will involve splitting the navigation request so we replace as much as possible, then push the remaining screens to fulfill the request.
    if (event === 'REPLACE' && isAbsoluteInitialRoute(action)) {
      const earliest = getEarliestMismatchedRoute(rootState, action.payload);
      if (earliest) {
        if (earliest.type === 'stack') {
          navigationRef.dispatch(StackActions.replace(earliest.name, earliest.params));
        } else {
          navigationRef.dispatch(TabActions.jumpTo(earliest.name, earliest.params));
        }
        return;
      } else {
        // This should never happen because moving to the same route would be handled earlier
        // in the sibling operations.
      }
    }

    // Ignore the replace event here since replace across
    // navigators is not supported.
    navigationRef.dispatch(action);
  } else {
    navigationRef.reset(state);
  }
}

/** @returns `true` if the action is moving to the first screen of all the navigators in the action. */
export function isAbsoluteInitialRoute(
  action: ReturnType<typeof getActionFromState>
): action is NavigateAction {
  if (action?.type !== 'NAVIGATE') {
    return false;
  }

  let next = action.payload.params;
  // iterate all child screens and bail out if any are not initial.
  while (next) {
    if (!isNavigationState(next)) {
      // Not sure when this would happen
      return false;
    }
    if (next.initial === true) {
      next = next.params;
      // return true;
    } else if (next.initial === false) {
      return false;
    }
  }

  return true;
}

type NavStateParams = {
  params?: NavStateParams;
  path: string;
  initial: boolean;
  screen: string;
  state: unknown;
};

function isNavigationState(obj: any): obj is NavStateParams {
  return 'initial' in obj;
}
