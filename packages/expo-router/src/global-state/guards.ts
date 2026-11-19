import type { ResultState } from '../fork/getStateFromPath';
import { resolveHref } from '../link/href';
import type { NavigationAction, NavigationState, PartialState } from '../react-navigation/routers';
import type { Href } from '../types';
import type { SingularOptions } from '../useScreens';
import {
  getNavigateAction,
  type NavigateActionConfig,
  type NavigationResolution,
} from './getNavigationAction';
import { getRouteInfoFromState, type UrlObject } from './getRouteInfoFromState';
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
