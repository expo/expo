import { findDivergentState, getPayloadFromStateRoute } from './stateUtils';
import { store } from './store';
import type { LinkToOptions } from './types';
import type { RouteNode } from '../Route';
import type { ResultState } from '../fork/getStateFromPath';
import { applyRedirects } from '../getRoutesRedirects';
import { resolveHrefStringWithSegments } from '../link/href';
import {
  appendInternalExpoRouterParams,
  INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME,
  type InternalExpoRouterParams,
} from '../navigationParams';
import type { PartialRoute, PartialState, NavigationState } from '../react-navigation/native';
import { sortRoutesWithInitial } from '../sortRoutes';
import type { SingularOptions } from '../useScreens';

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
    // Load anchors at every nested level, but skip levels where the navigator's
    // initial route is the target itself: anchoring a route to itself seeds a
    // duplicate (param-less for dynamic routes). See #47114.
    let navigatorNode = findNavigatorNodeForRoute(state, actionStateRoute, store.routeNode);
    let currentParams = rootPayload.params;
    while (currentParams) {
      const initialRouteName = getInitialRouteName(navigatorNode);
      const isSelfAnchor =
        initialRouteName !== undefined && initialRouteName === currentParams.screen;

      if (!isSelfAnchor) {
        currentParams.initial = !withAnchor;
      }

      // Descend into the navigator targeted by this level.
      navigatorNode =
        currentParams.screen != null
          ? navigatorNode?.children.find((child) => child.route === currentParams!.screen)
          : undefined;
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

/**
 * Route tree node for the navigator containing the divergence route. The root
 * node maps to the action state's top (`__root`) level; deeper levels descend
 * through its children.
 */
function findNavigatorNodeForRoute(
  state: ResultState | undefined,
  actionStateRoute: PartialRoute<any> | undefined,
  rootNode: RouteNode | null
): RouteNode | undefined {
  let navigatorNode: RouteNode | undefined = rootNode ?? undefined;
  let navigatorState: PartialState<NavigationState> | undefined = state;
  let isRoot = true;
  while (navigatorState?.routes?.length) {
    const route = navigatorState.routes[navigatorState.routes.length - 1]!;
    if (!isRoot) {
      navigatorNode = navigatorNode?.children.find((child) => child.route === route.name);
    }
    isRoot = false;
    // actionStateRoute is a reference into state; identity marks the divergence.
    if (route === actionStateRoute) {
      break;
    }
    navigatorState = route.state;
  }
  return navigatorNode;
}

/**
 * A navigator's effective initial route: explicit `initialRouteName`, else the
 * runtime-sorted first child (matching `routeNames[0]`).
 */
function getInitialRouteName(node: RouteNode | undefined): string | undefined {
  if (!node?.children.length) {
    return undefined;
  }
  if (node.initialRouteName) {
    return node.initialRouteName;
  }
  // Copy first: sort mutates.
  return [...node.children].sort(sortRoutesWithInitial(node.initialRouteName))[0]?.route;
}
