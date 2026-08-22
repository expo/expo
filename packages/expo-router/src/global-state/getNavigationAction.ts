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
import { store } from './store';
import type { LinkToOptions } from './types';

export type NavigationResolution =
  | { status: 'action'; action: NavigationAction }
  | { status: 'invalid'; href: string };

export function getNavigateAction(
  baseHref: string,
  options: LinkToOptions,
  registry: RouterRegistry,
  type: string | undefined,
  withAnchor: boolean | undefined,
  singular: SingularOptions | undefined,
  isPreviewNavigation: boolean | undefined,
  navigationState: NavigationState
): NavigationResolution {
  if (!store.linking || !store.routeNode) {
    throw new Error('Attempted to link to route when no routes are present');
  }

  // TODO(@ubax): make sure calling getRouteInfoFromState is performant here
  const href = applyRedirects(
    resolveHrefStringWithSegments(baseHref, getRouteInfoFromState(navigationState), options),
    store.redirects
  )!;

  const state = store.linking.getStateFromPath!(href, store.linking.config);
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
    routeNode: store.routeNode,
    registry,
    action: { type: type ?? 'NAVIGATE', payload: { singular } },
    withAnchor,
    internalParams,
  });

  return { status: 'action', action };
}
