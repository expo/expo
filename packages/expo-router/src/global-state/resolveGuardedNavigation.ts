import type { ResultState } from '../fork/getStateFromPath';
import type { ResolvedGuard } from '../layouts/GuardContext';
import { resolveHref } from '../link/href';
import type { NavigationState, PartialState } from '../react-navigation/routers';
import { shouldLinkExternally } from '../utils/url';
import { getRouteInfoFromState, type UrlObject } from './getRouteInfoFromState';
import type { resolveNavigationDestination } from './resolveNavigationDestination';
import type { RouterRegistry } from './routerRegistry';

// A relative `redirectTo` can change params on every step, so a chain can grow without repeating.
export const MAX_REDIRECT_CHAIN_LENGTH = 20;

// The blocked routes so far, and the last one, which the next `redirectTo` resolves from.
export type GuardRedirect = { chain: { href: string; route: string }[]; from: UrlObject };

type GuardedNavigation =
  | { status: 'allowed' }
  | { status: 'blocked' }
  | { status: 'redirect'; href: string; redirect: GuardRedirect }
  | { status: 'redirect-loop'; hrefs: string[] };

// Decides whether the protected routes of mounted navigators let `action` open `href`.
export function resolveGuardedNavigation({
  action,
  href,
  targetState,
  registry,
  redirect,
}: {
  action: ReturnType<typeof resolveNavigationDestination>;
  href: string;
  targetState: ResultState;
  registry: RouterRegistry;
  // Set when `href` is the `redirectTo` of a blocked route.
  redirect?: GuardRedirect;
}): GuardedNavigation {
  const guard = findBlockingGuard(action, registry);
  if (!guard) {
    return { status: 'allowed' };
  }
  if (guard.redirectTo === undefined) {
    return { status: 'blocked' };
  }
  const redirectHref = resolveHref(guard.redirectTo);
  // The blocked screen's `Redirect` opens external URLs through the router.
  if (shouldLinkExternally(redirectHref)) {
    return { status: 'allowed' };
  }
  const from = getRouteInfoFromState(targetState);
  // Groups are part of the identity, because one href can open a route in another group.
  const route = JSON.stringify([from.segments, from.params]);
  const chain = [...(redirect?.chain ?? []), { href, route }];
  if (
    redirect?.chain.some((blocked) => blocked.route === route) ||
    chain.length > MAX_REDIRECT_CHAIN_LENGTH
  ) {
    return { status: 'redirect-loop', hrefs: chain.map((blocked) => blocked.href) };
  }
  return { status: 'redirect', href: redirectHref, redirect: { chain, from } };
}

// Checks the destination route in each mounted navigator, outermost first.
// Guards of a navigator that is not mounted yet are unknown, so its routes are not checked.
function findBlockingGuard(
  action: ReturnType<typeof resolveNavigationDestination>,
  registry: RouterRegistry
): ResolvedGuard | undefined {
  let navigatorKey = action.target;
  let route:
    | { name?: string; state?: NavigationState | PartialState<NavigationState> }
    | undefined = action.payload;
  while (navigatorKey !== undefined && route?.name !== undefined) {
    const guard = registry.get(navigatorKey)?.getGuard?.(route.name);
    if (guard) {
      return guard;
    }
    const state: NavigationState | PartialState<NavigationState> | undefined = route.state;
    navigatorKey = state?.key;
    route = state?.routes[state.index ?? 0];
  }
  return undefined;
}
