import { findDivergentState, getPayloadFromStateRoute } from './stateUtils';
import { store } from './store';
import type { LinkToOptions } from './types';
import { applyRedirects } from '../getRoutesRedirects';
import { resolveHrefStringWithSegments } from '../link/href';
import {
  appendInternalExpoRouterParams,
  INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME,
  type InternalExpoRouterParams,
} from '../navigationParams';
import { SingularOptions } from '../useScreens';

export function getNavigateAction(
  baseHref: string,
  options: LinkToOptions,
  type = 'NAVIGATE',
  withAnchor?: boolean,
  singular?: SingularOptions,
  isPreviewNavigation?: boolean
) {
  let href: string | undefined = baseHref;
  store.assertIsReady();
  const navigationRef = store.navigationRef.current;

  if (navigationRef == null) {
    throw new Error(
      "Couldn't find a navigation object. Is your component inside NavigationContainer?"
    );
  }
  if (!store.linking) {
    throw new Error('Attempted to link to route when no routes are present');
  }
  const rootState = navigationRef.getRootState();

  href = resolveHrefStringWithSegments(href, store.getRouteInfo(), options);
  href = applyRedirects(href, store.redirects) ?? undefined;

  // If the href is undefined, it means that the redirect has already been handled the navigation
  if (!href) {
    return;
  }

  const state = store.linking.getStateFromPath!(href, store.linking.config);

  if (!state || state.routes.length === 0) {
    console.error('Could not generate a valid navigation state for the given path: ' + href);
    return;
  }
  /**
   * We need to find the deepest navigator where the action and current state diverge, If they do not diverge, the
   * lowest navigator is the target.
   *
   * By default React Navigation will target the current navigator, but this doesn't work for all actions
   * For example:
   *  - /deeply/nested/route -> /top-level-route the target needs to be the top-level navigator
   *  - /stack/nestedStack/page -> /stack1/nestedStack/other-page needs to target the nestedStack navigator
   *
   * This matching needs to done by comparing the route names and the dynamic path, for example
   * - /1/page -> /2/anotherPage needs to target the /[id] navigator
   *
   * Other parameters such as search params and hash are not evaluated.
   */

  const { actionStateRoute, navigationState } = findDivergentState(
    state,
    rootState,
    type === 'PRELOAD'
  );

  /*
   * We found the target navigator, but the payload is in the incorrect format
   * We need to convert the action state to a payload that can be dispatched
   */
  const rootPayload = getPayloadFromStateRoute(actionStateRoute || {});

  if (type === 'PUSH' && navigationState.type !== 'stack') {
    type = 'NAVIGATE';
  } else if (navigationState.type === 'expo-tab') {
    type = 'JUMP_TO';
  } else if (type === 'REPLACE' && navigationState.type === 'drawer') {
    type = 'JUMP_TO';
  }

  if (withAnchor) {
    if (rootPayload.params.initial) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`The parameter 'initial' is a reserved parameter name in React Navigation`);
      }
    }
    /*
     * The logic for initial can seen backwards depending on your perspective
     *   True: The initialRouteName is not loaded. The incoming screen is the initial screen (default)
     *   False: The initialRouteName is loaded. THe incoming screen is placed after the initialRouteName
     *
     * withAnchor flips the perspective.
     *   True: You want the initialRouteName to load.
     *   False: You do not want the initialRouteName to load.
     */
    // Set initial on root and all nested params so anchors are loaded at every level
    let currentParams = rootPayload.params;
    while (currentParams) {
      currentParams.initial = !withAnchor;
      currentParams = currentParams.params;
    }
  }

  const expoParams: InternalExpoRouterParams = isPreviewNavigation
    ? {
        [INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME]: true,
        [INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME]: true,
      }
    : {};
  const params = appendInternalExpoRouterParams(rootPayload.params, expoParams);

  return {
    type,
    target: navigationState.key,
    payload: {
      // key: rootPayload.key,
      name: rootPayload.screen,
      params,
      singular,
    },
  };
}
