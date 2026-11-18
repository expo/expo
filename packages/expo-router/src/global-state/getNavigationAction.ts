import type { RouteNode } from '../Route';
import type { ExpoLinkingOptions } from '../getLinkingConfig';
import { applyRedirects } from '../getRoutesRedirects';
import { resolveHref, resolveHrefStringWithSegments } from '../link/href';
import {
  INTERNAL_EXPO_ROUTER_PREVIEW_ID_PARAM_NAME,
  type InternalExpoRouterParams,
} from '../navigationParams';
import type { NavigationAction } from '../react-navigation/native';
import type { NavigationState } from '../react-navigation/routers';
import type { SingularOptions } from '../useScreens';
import { getRouteInfoFromState } from './getRouteInfoFromState';
import { findDestinationGuard, resolveNavigationDestination } from './resolveNavigationDestination';
import type { RouterRegistry } from './routerRegistry';
import type { LinkToOptions, StoreRedirects } from './types';

export type NavigationResolution =
  | { status: 'action'; action: NavigationAction }
  // A failed guard without a redirect blocks the request. The current history stays unchanged.
  | { status: 'blocked' }
  | { status: 'redirect-loop'; href: string }
  | { status: 'invalid'; href: string };

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
  navigationState: NavigationState
): NavigationResolution {
  if (!config.linking || !config.routeNode) {
    throw new Error('Attempted to link to route when no routes are present');
  }

  const { linking } = config;
  const parse = (destination: string, routeInfo: ReturnType<typeof getRouteInfoFromState>) => {
    const href = applyRedirects(
      resolveHrefStringWithSegments(destination, routeInfo, options),
      config.redirects
    )!;
    return { href, state: linking.getStateFromPath!(href, linking.config, routeInfo.segments) };
  };
  let { href, state } = parse(baseHref, getRouteInfoFromState(navigationState));
  // Follow explicit guard redirects. A relative redirect resolves from the guarded destination.
  const visited = new Set<string>();
  while (state?.routes.length) {
    const guard = findDestinationGuard(state, navigationState, config.registry);
    if (!guard) {
      break;
    }
    if (guard.redirectTo === undefined) {
      return { status: 'blocked' };
    }
    const identity = JSON.stringify([guard.navigatorKey, guard.name]);
    if (visited.has(identity)) {
      return { status: 'redirect-loop', href };
    }
    visited.add(identity);
    ({ href, state } = parse(resolveHref(guard.redirectTo), getRouteInfoFromState(state)));
  }
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

  return { status: 'action', action };
}
