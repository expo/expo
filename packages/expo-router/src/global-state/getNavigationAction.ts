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
import { getRouteInfoFromState } from './getRouteInfoFromState';
import { resolveNavigationDestination } from './resolveNavigationDestination';
import type { RouterRegistry } from './routerRegistry';
import type { LinkToOptions, StoreRedirects } from './types';

export type NavigationResolution =
  | { status: 'action'; action: NavigationAction }
  | { status: 'invalid'; href: string }
  | { status: 'blocked' }
  | { status: 'redirect-loop' };

export type NavigateActionConfig = {
  registry: RouterRegistry;
  routeNode?: RouteNode | null;
  linking?: Pick<ExpoLinkingOptions, 'config' | 'getStateFromPath'>;
  redirects?: StoreRedirects[];
};

// A relative `redirectTo` can change params on every step, so a chain can grow without repeating.
export const MAX_GUARD_REDIRECTS = 20;

export function getNavigateAction(
  baseHref: string,
  options: LinkToOptions,
  config: NavigateActionConfig,
  type: string | undefined,
  withAnchor: boolean | undefined,
  singular: SingularOptions | undefined,
  previewKey: string | undefined,
  navigationState: NavigationState
): NavigationResolution {
  if (!config.linking || !config.routeNode) {
    throw new Error('Attempted to link to route when no routes are present');
  }

  let routeInfo = getRouteInfoFromState(navigationState);
  let href = applyRedirects(
    resolveHrefStringWithSegments(baseHref, routeInfo, options),
    config.redirects
  )!;

  const internalParams: InternalExpoRouterParams = {
    ...(options.__internal__previewId !== undefined
      ? {
          [INTERNAL_EXPO_ROUTER_PREVIEW_ID_PARAM_NAME]: options.__internal__previewId,
        }
      : {}),
  };

  // Each pass after the first opens the `redirectTo` of the route that the pass before found blocked.
  for (let redirects = 0; redirects <= MAX_GUARD_REDIRECTS; redirects++) {
    const state = config.linking.getStateFromPath!(href, config.linking.config, routeInfo.segments);
    if (!state || state.routes.length === 0) {
      return { status: 'invalid', href };
    }

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
    if (guard.type !== 'redirect') {
      return { status: 'blocked' };
    }
    const redirectHref = resolveHref(guard.href);
    // The blocked screen's `Redirect` opens external URLs through the router.
    if (shouldLinkExternally(redirectHref)) {
      return { status: 'action', action };
    }
    // `redirectTo` resolves from the blocked route, with no options, like `Redirect` on the blocked screen.
    routeInfo = getRouteInfoFromState(state);
    href = applyRedirects(
      resolveHrefStringWithSegments(redirectHref, routeInfo),
      config.redirects
    )!;
  }

  return { status: 'redirect-loop' };
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
