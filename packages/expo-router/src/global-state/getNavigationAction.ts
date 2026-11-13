import type { RouteNode } from '../Route';
import type { ExpoLinkingOptions } from '../getLinkingConfig';
import { applyRedirects } from '../getRoutesRedirects';
import type { ResolvedGuard } from '../layouts/GuardContext';
import { resolveHref, resolveHrefStringWithSegments } from '../link/href';
import {
  INTERNAL_EXPO_ROUTER_PREVIEW_ID_PARAM_NAME,
  type InternalExpoRouterParams,
} from '../navigationParams';
import type { NavigationAction } from '../react-navigation/native';
import type { NavigationState, PartialState } from '../react-navigation/routers';
import type { SingularOptions } from '../useScreens';
import { shouldLinkExternally } from '../utils/url';
import { getRouteInfoFromState, type UrlObject } from './getRouteInfoFromState';
import { resolveNavigationDestination } from './resolveNavigationDestination';
import type { RouterRegistry } from './routerRegistry';
import type { LinkToOptions, StoreRedirects } from './types';

export type NavigationResolution =
  | { status: 'action'; action: NavigationAction }
  | { status: 'invalid'; href: string }
  | { status: 'blocked' }
  | { status: 'redirect-loop'; hrefs: string[] };

// A relative `redirectTo` can change params on every step, so a chain can grow without repeating.
export const MAX_REDIRECT_CHAIN_LENGTH = 20;

export type NavigateActionConfig = {
  registry: RouterRegistry;
  routeNode?: RouteNode | null;
  linking?: Pick<ExpoLinkingOptions, 'config' | 'getStateFromPath'>;
  redirects?: StoreRedirects[];
};

export function getNavigateAction(
  baseHref: string,
  options: LinkToOptions,
  config: NavigateActionConfig,
  type: string | undefined,
  withAnchor: boolean | undefined,
  singular: SingularOptions | undefined,
  previewKey: string | undefined,
  navigationState: NavigationState,
  // Set when `baseHref` is the `redirectTo` of a blocked route. `chain` lists the blocked routes so far.
  redirect?: { chain: { href: string; route: string }[]; from: UrlObject }
): NavigationResolution {
  if (!config.linking || !config.routeNode) {
    throw new Error('Attempted to link to route when no routes are present');
  }

  // A redirect resolves from the blocked route, with no options, like `Redirect` on the blocked screen.
  const routeInfo = redirect?.from ?? getRouteInfoFromState(navigationState);
  const href = applyRedirects(
    resolveHrefStringWithSegments(baseHref, routeInfo, redirect ? undefined : options),
    config.redirects
  )!;

  const state = config.linking.getStateFromPath!(href, config.linking.config, routeInfo.segments);
  if (!state || state.routes.length === 0) {
    return { status: 'invalid', href };
  }

  const internalParams: InternalExpoRouterParams = {
    ...(options.__internal__previewId !== undefined
      ? {
          [INTERNAL_EXPO_ROUTER_PREVIEW_ID_PARAM_NAME]: options.__internal__previewId,
        }
      : {}),
  };
  const action = resolveNavigationDestination({
    targetState: state,
    navigationState,
    routeNode: config.routeNode,
    registry: config.registry,
    action: {
      type: type ?? 'NAVIGATE',
      payload: {
        singular,
        __internal__PreviewKey: previewKey,
        ...(options.__internal__popToNavigator ? { pop: true } : undefined),
      },
    },
    withAnchor,
    internalParams,
  });

  const guard = findBlockingGuard(action, config.registry);
  if (!guard) {
    return { status: 'action', action };
  }
  if (guard.redirectTo === undefined) {
    return { status: 'blocked' };
  }
  const redirectHref = resolveHref(guard.redirectTo);
  // The blocked screen's `Redirect` opens external URLs through the router.
  if (shouldLinkExternally(redirectHref)) {
    return { status: 'action', action };
  }
  const from = getRouteInfoFromState(state);
  // Groups are part of the identity, because one href can open a route in another group.
  const route = JSON.stringify([from.segments, from.params]);
  const chain = [...(redirect?.chain ?? []), { href, route }];
  if (
    redirect?.chain.some((blocked) => blocked.route === route) ||
    chain.length > MAX_REDIRECT_CHAIN_LENGTH
  ) {
    return { status: 'redirect-loop', hrefs: chain.map((blocked) => blocked.href) };
  }
  return getNavigateAction(
    redirectHref,
    options,
    config,
    type,
    withAnchor,
    singular,
    previewKey,
    navigationState,
    { chain, from }
  );
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
