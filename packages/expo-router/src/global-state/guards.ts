import type { RouteNode } from '../Route';
import type { ResultState } from '../fork/getStateFromPath';
import { resolveHref } from '../link/href';
import type { NavigationAction, NavigationState, PartialState } from '../react-navigation/routers';
import { isActionHandled } from '../react-navigation/routers/utils';
import { getValidInitialRoute } from '../routeNode';
import { sortRoutesWithInitial } from '../sortRoutes';
import type { Href } from '../types';
import type { SingularOptions } from '../useScreens';
import {
  getNavigateAction,
  type NavigateActionConfig,
  type NavigationResolution,
} from './getNavigationAction';
import { getRouteInfoFromState, type UrlObject } from './getRouteInfoFromState';
import type { RouterRegistryEntry } from './routerRegistry';
import type { LinkToOptions } from './types';

// Route name to the `redirectTo` of the outermost failing guard. A missing name is accessible.
export type GuardedRedirects = ReadonlyMap<string, Href | undefined>;
export type Guard = { redirectTo: Href | undefined };

// A relative `redirectTo` can change params on every step, so a chain can grow without repeating.
const MAX_REDIRECT_CHAIN_LENGTH = 20;

type GuardedNavigation =
  | NavigationResolution
  | { status: 'blocked' }
  | { status: 'redirect-loop'; hrefs: string[] };

type GuardDecision =
  | { type: 'action'; action: NavigationAction }
  | { type: 'redirect-loop'; hrefs: string[] }
  | { type: 'all-routes-protected' };

export function normalizeRouteName(routeName: string): string {
  return routeName.replace(/\/index$/, '');
}

export function getGuard(guards: GuardedRedirects, routeName: string): Guard | undefined {
  const name = guards.has(routeName) ? routeName : normalizeRouteName(routeName);
  return guards.has(name) ? { redirectTo: guards.get(name) } : undefined;
}

/**
 * Resolves `href` like `getNavigateAction`. When a mounted navigator blocks the destination,
 * returns `blocked`, or follows the `redirectTo` of the outermost blocking guard.
 */
export function getGuardedNavigateAction(
  baseHref: string,
  options: LinkToOptions,
  config: NavigateActionConfig,
  type: string | undefined,
  withAnchor: boolean | undefined,
  singular: SingularOptions | undefined,
  previewKey: string | undefined,
  navigationState: NavigationState,
  redirectFrom?: UrlObject
): GuardedNavigation {
  // A guard change starts at a blocked route, which counts like the first route of a push.
  const chain = redirectFrom
    ? [{ href: redirectFrom.pathnameWithParams, route: getRouteIdentity(redirectFrom) }]
    : [];
  let href = baseHref;
  let from = redirectFrom;
  for (;;) {
    const resolution = getNavigateAction(
      href,
      options,
      config,
      type,
      withAnchor,
      singular,
      previewKey,
      navigationState,
      from
    );
    if (resolution.status !== 'action') {
      return resolution;
    }
    const blocking = findBlockingGuard(resolution.action, config, navigationState);
    if (!blocking) {
      return resolution;
    }
    if (blocking.guard.redirectTo === undefined) {
      return { status: 'blocked' };
    }
    // Like on a guard change, a relative `redirectTo` resolves against the blocked route.
    from = getRouteInfoFromState(cutAtDepth(resolution.targetState, blocking.depth));
    const route = getRouteIdentity(from);
    const isLoop = chain.some((blocked) => blocked.route === route);
    chain.push({ href: getRouteInfoFromState(resolution.targetState).pathnameWithParams, route });
    if (isLoop || chain.length > MAX_REDIRECT_CHAIN_LENGTH) {
      return { status: 'redirect-loop', hrefs: chain.map((blocked) => blocked.href) };
    }
    href = resolveHref(blocking.guard.redirectTo);
  }
}

// Groups are part of the identity, because one href can open a route in another group.
function getRouteIdentity(route: UrlObject): string {
  return JSON.stringify([route.segments, route.params]);
}

export function createRedirectLoopError(hrefs: string[]) {
  return new Error(
    `Expo Router could not open "${hrefs[0]}" because the \`redirectTo\` targets of protected routes form a loop or a chain longer than ${MAX_REDIRECT_CHAIN_LENGTH} routes: ${hrefs.join(' -> ')}. ` +
      'Change `redirectTo` on a `Protected` component so that the redirects end at an accessible route.'
  );
}

// Checks the destination route in each mounted navigator, outermost first.
// Guards of a navigator that is not mounted yet are unknown, so its routes are not checked.
// `depth` is the level of the blocked route in the destination state, where the root is 0.
function findBlockingGuard(
  action: NavigationAction,
  { registry }: NavigateActionConfig,
  navigationState: NavigationState
): { guard: Guard; depth: number } | undefined {
  let navigatorKey = action.target;
  // The routes that hold the target navigator can be blocked too, for example by a redirect into a blocked layout.
  const holders = navigatorKey === undefined ? [] : getHolders(navigationState, navigatorKey);
  for (const [depth, { state, route }] of holders.entries()) {
    const guard = registry.get(state.key)?.getGuard?.(route.name);
    if (guard) {
      return { guard, depth };
    }
  }
  let depth = holders.length;
  // Destination actions carry the route name and its nested state in the payload.
  let route = action.payload as
    | { name?: string; state?: NavigationState | PartialState<NavigationState> }
    | undefined;
  while (navigatorKey !== undefined && route?.name !== undefined) {
    const guard = registry.get(navigatorKey)?.getGuard?.(route.name);
    if (guard) {
      return { guard, depth };
    }
    const state = route.state;
    navigatorKey = state?.key;
    route = state?.routes[state.index ?? 0];
    depth++;
  }
  return undefined;
}

// The navigators and routes from the root down to the navigator with `stateKey`, outermost first.
function getHolders(
  state: NavigationState,
  stateKey: string
): { state: NavigationState; route: NavigationState['routes'][number] }[] {
  for (const route of state.routes) {
    if (route.state?.stale !== false) {
      continue;
    }
    if (route.state.key === stateKey) {
      return [{ state, route }];
    }
    const holders = getHolders(route.state, stateKey);
    if (holders.length > 0) {
      return [{ state, route }, ...holders];
    }
  }
  return [];
}

// Drops the nested state of the focused route at `depth`.
function cutAtDepth(state: ResultState, depth: number): ResultState {
  const index = state.index ?? 0;
  return {
    ...state,
    routes: state.routes.map((route, routeIndex) => {
      if (routeIndex !== index) {
        return route;
      }
      if (depth === 0) {
        const { state: _nested, ...blockedRoute } = route;
        return blockedRoute;
      }
      // Linking builds every nested state as a `ResultState`.
      return route.state
        ? { ...route, state: cutAtDepth(route.state as ResultState, depth - 1) }
        : route;
    }),
  };
}

/**
 * Returns `true` when an action added a route that a mounted navigator blocks without `redirectTo`.
 * Such an action is rejected, like navigation to a blocked href.
 */
export function addsBlockedRoute(
  previous: NavigationState,
  next: NavigationState,
  routeKey: string | undefined,
  { registry }: NavigateActionConfig
): boolean {
  if (routeKey === undefined || findRouteOwner(previous, routeKey)) {
    return false;
  }
  const owner = findRouteOwner(next, routeKey);
  const route = owner?.routes.find((item) => item.key === routeKey);
  if (!owner || !route) {
    return false;
  }
  const guard = registry.get(owner.key)?.getGuard?.(route.name);
  return guard !== undefined && guard.redirectTo === undefined;
}

function findRouteOwner(state: NavigationState, routeKey: string): NavigationState | undefined {
  for (const route of state.routes) {
    if (route.key === routeKey) {
      return state;
    }
    const owner = route.state?.stale === false ? findRouteOwner(route.state, routeKey) : undefined;
    if (owner) {
      return owner;
    }
  }
  return undefined;
}

type NavigatorNode = {
  state: NavigationState;
  parent?: NavigatorNode;
  // Index of the route that holds this navigator in `parent`.
  routeIndex?: number;
  focused: boolean;
};

/**
 * Returns the next change that removes blocked routes from mounted navigators, outermost first,
 * or `undefined` when no change is needed. `noVisibleTabKey` names a tab navigator that has no
 * visible tab, so it counts as a navigator without an accessible route.
 */
export function getGuardDecision(
  root: NavigationState,
  config: NavigateActionConfig,
  noVisibleTabKey?: string
): GuardDecision | undefined {
  let allRoutesProtected = false;
  const visit = (node: NavigatorNode): GuardDecision | undefined => {
    const entry = config.registry.get(node.state.key);
    if (entry?.getGuard) {
      const decision = decideNavigator(root, node, entry, entry.getGuard, config, noVisibleTabKey);
      if (decision?.type === 'all-routes-protected') {
        allRoutesProtected = true;
      } else if (decision) {
        return decision;
      }
    }
    for (const [routeIndex, route] of node.state.routes.entries()) {
      if (route.state?.stale === false) {
        const decision = visit({
          state: route.state,
          parent: node,
          routeIndex,
          focused: node.focused && routeIndex === node.state.index,
        });
        if (decision) {
          return decision;
        }
      }
    }
    return undefined;
  };
  return (
    visit({ state: root, focused: true }) ??
    (allRoutesProtected ? { type: 'all-routes-protected' } : undefined)
  );
}

function decideNavigator(
  root: NavigationState,
  node: NavigatorNode,
  entry: RouterRegistryEntry,
  getGuard: (routeName: string) => Guard | undefined,
  config: NavigateActionConfig,
  noVisibleTabKey: string | undefined
): GuardDecision | undefined {
  const { state } = node;
  const redirectTo = getGuard(state.routes[state.index]!.name)?.redirectTo;
  if (node.focused && redirectTo !== undefined) {
    const resolution = getGuardedNavigateAction(
      resolveHref(redirectTo),
      {},
      config,
      'REPLACE',
      undefined,
      undefined,
      undefined,
      root,
      getRouteInfoFromState(cutFocusedPathAt(root, state.key))
    );
    if (resolution.status === 'action') {
      return { type: 'action', action: resolution.action };
    }
    if (resolution.status === 'redirect-loop') {
      return { type: 'redirect-loop', hrefs: resolution.hrefs };
    }
    // A chain that ends at a blocked route without `redirectTo`, or at an invalid href, removes the route like below.
  }

  const blockedRouteKeys = state.routes
    .filter((route) => getGuard(route.name))
    .map((route) => route.key);
  const fallback =
    state.key === noVisibleTabKey ? undefined : findFallback(entry.routeNode, getGuard);
  if (!fallback) {
    const removal = getAncestorRemoval(node, config);
    if (removal) {
      return { type: 'action', action: removal };
    }
  }
  if (blockedRouteKeys.length > 0) {
    const action = {
      type: 'REMOVE_ROUTES',
      payload: {
        routeKeys: blockedRouteKeys,
        fallback: fallback && { name: fallback.route, params: getHolderParams(node) },
      },
      target: state.key,
    };
    // Tab routers keep every route. Their views hide blocked tabs and move the focus.
    const result = entry.reduce(state, action);
    if (isActionHandled(result) && result.state !== state) {
      return { type: 'action', action };
    }
  }
  return !fallback && node.focused ? { type: 'all-routes-protected' } : undefined;
}

// Removes the route that holds a navigator without an accessible route from the nearest ancestor with a fallback.
function getAncestorRemoval(
  node: NavigatorNode,
  { registry }: NavigateActionConfig
): NavigationAction | undefined {
  for (
    let child = node, ancestor = node.parent;
    ancestor;
    child = ancestor, ancestor = ancestor.parent
  ) {
    const entry = registry.get(ancestor.state.key);
    const holder = ancestor.state.routes[child.routeIndex!]!;
    const fallback = entry && findFallback(entry.routeNode, entry.getGuard);
    // A fallback that opens the route being removed would show the same navigator again.
    if (!entry || !fallback || fallback.route === holder.name) {
      continue;
    }
    const payload = { name: fallback.route, params: getHolderParams(ancestor) };
    const removal = {
      type: 'REMOVE_ROUTES',
      payload: { routeKeys: [holder.key], fallback: payload },
      target: ancestor.state.key,
    };
    if (isActionHandled(entry.reduce(ancestor.state, removal))) {
      return removal;
    }
    // A tab router cannot remove a tab, so the fallback replaces the focused tab.
    return child.routeIndex === ancestor.state.index
      ? { type: 'REPLACE', payload, target: ancestor.state.key }
      : undefined;
  }
  return undefined;
}

// The anchor when it is accessible, else the first accessible route.
function findFallback(
  node: RouteNode | undefined,
  getGuard: ((routeName: string) => Guard | undefined) | undefined
): RouteNode | undefined {
  if (!node) {
    return undefined;
  }
  const isAccessible = (route: RouteNode) => !getGuard?.(route.route);
  const anchor = getValidInitialRoute(node);
  if (anchor && isAccessible(anchor)) {
    return anchor;
  }
  // A redirect route has no screen to show, so it cannot be the fallback.
  return [...node.children]
    .sort(sortRoutesWithInitial(anchor?.route))
    .find((child) => child.type !== 'redirect' && isAccessible(child));
}

// The params of the route that holds the navigator carry the values of its dynamic segments.
function getHolderParams(node: NavigatorNode): object | undefined {
  const params = node.parent?.state.routes[node.routeIndex!]?.params;
  return params && Object.keys(params).length > 0 ? params : undefined;
}

// Drops the nested state of the focused route in `stateKey`, so a relative `redirectTo`
// resolves against the blocked route and keeps the params of its parent routes.
function cutFocusedPathAt(state: NavigationState, stateKey: string): NavigationState {
  return {
    ...state,
    routes: state.routes.map((route, index) => {
      if (index !== state.index) {
        return route;
      }
      if (state.key === stateKey) {
        const { state: _nested, ...blockedRoute } = route;
        return blockedRoute;
      }
      // The policy reaches `stateKey` only through complete focused states.
      return { ...route, state: cutFocusedPathAt(route.state as NavigationState, stateKey) };
    }),
  };
}
