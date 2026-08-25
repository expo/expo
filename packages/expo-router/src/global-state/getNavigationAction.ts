import type { RouteNode } from '../Route';
import type { ExpoLinkingOptions } from '../getLinkingConfig';
import { applyRedirects } from '../getRoutesRedirects';
import { resolveHrefStringWithSegments } from '../link/href';
import {
  INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME,
  type InternalExpoRouterParams,
} from '../navigationParams';
import type { NavigationAction } from '../react-navigation/native';
import type { NavigationState } from '../react-navigation/routers';
import type { SingularOptions } from '../useScreens';
import { getRouteInfoFromState } from './getRouteInfoFromState';
import { resolveNavigationDestination } from './resolveNavigationDestination';
import type { RouterRegistry } from './routerRegistry';
import type { LinkToOptions, StoreRedirects } from './types';

export type NavigationResolution =
  | { status: 'action'; action: NavigationAction }
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
  isPreviewNavigation: boolean | undefined,
  navigationState: NavigationState
): NavigationResolution {
  if (!config.linking || !config.routeNode) {
    throw new Error('Attempted to link to route when no routes are present');
  }

  const routeInfo = getRouteInfoFromState(navigationState);
  const href = applyRedirects(
    resolveHrefStringWithSegments(baseHref, routeInfo, options),
    config.redirects
  )!;

  const state = config.linking.getStateFromPath!(href, config.linking.config, routeInfo.segments);
  if (!state || state.routes.length === 0) {
    return { status: 'invalid', href };
  }

  const internalParams: InternalExpoRouterParams = isPreviewNavigation
    ? {
        [INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME]: true,
        [INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME]: true,
      }
    : {};
  const action = resolveNavigationDestination({
    targetState: state,
    navigationState,
    routeNode: config.routeNode,
    registry: config.registry,
    action: { type: type ?? 'NAVIGATE', payload: { singular } },
    withAnchor,
    internalParams,
  });

  return { status: 'action', action };
}
