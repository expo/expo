import { applyRedirects } from '../getRoutesRedirects';
import { resolveHrefStringWithSegments } from '../link/href';
import {
  INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME,
  type InternalExpoRouterParams,
} from '../navigationParams';
import type { NavigationAction } from '../react-navigation/native';
import type { SingularOptions } from '../useScreens';
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
  type = 'NAVIGATE',
  withAnchor?: boolean,
  singular?: SingularOptions,
  isPreviewNavigation?: boolean
): NavigationResolution {
  store.assertIsReady();
  const navigationRef = store.navigationRef.current;

  if (navigationRef == null) {
    throw new Error(
      "Couldn't find a navigation object. Is your component inside NavigationContainer?"
    );
  }
  if (!store.linking || !store.routeNode) {
    throw new Error('Attempted to link to route when no routes are present');
  }

  const href = applyRedirects(
    resolveHrefStringWithSegments(baseHref, store.getRouteInfo(), options),
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
    navigationState: navigationRef.getRootState(),
    routeNode: store.routeNode,
    registry,
    action: { type, payload: { singular } },
    withAnchor,
    internalParams,
  });

  return { status: 'action', action };
}
