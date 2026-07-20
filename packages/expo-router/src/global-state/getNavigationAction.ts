import { NOT_FOUND_ROUTE_NAME, SITEMAP_ROUTE_NAME } from '../constants';
import { applyRedirects } from '../getRoutesRedirects';
import { resolveHrefStringWithSegments } from '../link/href';
import {
  INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME,
  type InternalExpoRouterParams,
} from '../navigationParams';
import type { SingularOptions } from '../useScreens';
import {
  collapseToFocusedPath,
  findDivergentState,
  getNavigationPayloadFromStateRoute,
} from './stateUtils';
import { store } from './store';
import type { LinkToOptions } from './types';

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

  // Tab navigator keys are captured in React by the caller (see `useNextScreenId`) and threaded
  // through the internal option so the traversal can look through tabs. They are passed whenever
  // present, regardless of event type. Each target navigator's own router interprets the base action.
  const tabNavigatorKeys = options.__internal__tabNavigatorKeys
    ? new Set(options.__internal__tabNavigatorKeys)
    : undefined;

  // The root state is the committed seed and may contain navigators that aren't currently mounted;
  // `hasReducer` lets the traversal stop at the nearest mounted navigator so the rest of the target
  // subtree is carried as `payload.state` (installed by the container) rather than aimed at a
  // navigator that has no reducer to handle it.
  const hasReducer = (navigationRef as { hasReducer?: (key: string) => boolean }).hasReducer;

  const { actionStateRoute, navigationState } = findDivergentState(
    state,
    rootState,
    tabNavigatorKeys,
    hasReducer
  );

  /*
   * We found the target navigator, but the payload is in the incorrect format
   * We need to convert the action state to a payload that can be dispatched
   */
  const expoParams: InternalExpoRouterParams = isPreviewNavigation
    ? {
        [INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME]: true,
        [INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME]: true,
      }
    : {};
  // The transient `+not-found` / `_sitemap` routes mount as siblings of the real `__root` slot in the
  // root container. Navigating away from them pops the transient route (`pop`) and reuses the buried
  // real route (kept mounted by the root container), so its full stack is preserved and no duplicate
  // route is stacked. A `push` from a transient route can't honor `pop` (the stack router only pops on
  // NAVIGATE), and stacking a duplicate root is never what's wanted from an error/sitemap screen — so a
  // push resolves to the target via NAVIGATE instead. `navigate`/`replace` keep their own semantics.
  //
  // TODO: Replace the push→NAVIGATE downgrade with `router.batch` once that API lands. Batching will
  // group multiple navigation operations into a single transition, so a push away from a transient
  // route can be expressed as [pop the transient, push the target] in one batch — preserving true push
  // semantics instead of degrading to NAVIGATE.
  const currentTargetRoute = navigationState.routes[navigationState.index ?? 0];
  const isLeavingTransientRoute =
    currentTargetRoute?.name === NOT_FOUND_ROUTE_NAME ||
    currentTargetRoute?.name === SITEMAP_ROUTE_NAME;
  const effectiveType = isLeavingTransientRoute && type === 'PUSH' ? 'NAVIGATE' : type;

  const subtreePayload = getNavigationPayloadFromStateRoute(
    actionStateRoute || {},
    navigationState,
    expoParams,
    // A push always appends a new route; a navigate reuses one already present in the target
    // navigator (a sibling tab, a preloaded tab), so its subtree must adopt that route's key.
    effectiveType !== 'PUSH'
  );

  // The nested target is carried entirely as `payload.state` (the compiled, live-keyed subtree the
  // container installs at the boundary); the action itself is a plain navigate to the divergent
  // route. A plain `push` must skip a nested navigator's `initialRouteName` anchor, so collapse the
  // subtree to its focused path; `withAnchor` keeps the full subtree so the anchor loads.
  const payloadState =
    effectiveType === 'PUSH' && subtreePayload.state != null && !withAnchor
      ? collapseToFocusedPath(subtreePayload.state)
      : subtreePayload.state;

  const payload = {
    name: subtreePayload.name,
    params: subtreePayload.params,
    singular,
    ...(isLeavingTransientRoute ? { pop: true } : null),
    ...(payloadState ? { state: payloadState } : null),
  };

  return {
    type: effectiveType,
    target: navigationState.key,
    payload,
  };
}

// Find the sub-state whose key matches `stateKey` anywhere in a (compiled) tree. Keys are structural
// and deterministic (see `getRouteKey`), so a navigator's live state key locates the same level in a
// freshly compiled state.
function findSubStateByKey(
  state: { key?: string; routes: readonly { state?: any }[] } | undefined,
  stateKey: string
): { index?: number; routes: readonly any[] } | undefined {
  if (state == null) {
    return undefined;
  }
  if (state.key === stateKey) {
    return state as { index?: number; routes: readonly any[] };
  }
  for (const route of state.routes) {
    const found = findSubStateByKey(route.state, stateKey);
    if (found != null) {
      return found;
    }
  }
  return undefined;
}

// Build a PRELOAD (or FRONT_PRELOAD) action for a route named `routeName` inside the navigator whose
// state key is `navigatorStateKey`, carrying that route's full compiled subtree as `payload.state`.
//
// Unlike `getNavigateAction`, this does NOT resolve a divergent target from the live tree — it aims
// at the calling navigator (the dispatcher tags the action with that navigator's `originKey`) and
// extracts the subtree by the navigator's own state key. That keeps preload correct at mount time,
// when it runs before intermediate ancestors have registered their reducers (so a divergence-based
// target would stop too high). Returns `undefined` when the href can't be compiled or the route
// isn't present in the compiled level (e.g. a redirect already consumed it).
export function getPreloadAction(
  navigatorStateKey: string,
  baseHref: string,
  routeName: string,
  front: boolean
) {
  const navigationRef = store.navigationRef.current;
  if (navigationRef == null || !store.linking) {
    return undefined;
  }

  let href: string | undefined = resolveHrefStringWithSegments(baseHref, store.getRouteInfo(), {});
  href = applyRedirects(href, store.redirects) ?? undefined;
  if (!href) {
    return undefined;
  }

  const compiled = store.linking.getStateFromPath!(href, store.linking.config);
  if (!compiled || compiled.routes.length === 0) {
    return undefined;
  }

  const level = findSubStateByKey(compiled, navigatorStateKey);
  const route = level?.routes.find((candidate) => candidate.name === routeName);
  if (route == null) {
    return undefined;
  }

  return {
    type: front ? 'FRONT_PRELOAD' : 'PRELOAD',
    payload: {
      name: routeName,
      params: route.params,
      ...(route.state != null ? { state: route.state } : null),
    },
  };
}
