import { applyRedirects } from '../getRoutesRedirects';
import { resolveHrefStringWithSegments } from '../link/href';
import {
  INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME,
  type InternalExpoRouterParams,
} from '../navigationParams';
import type { NavigationAction } from '../react-navigation/native';
import type { SingularOptions } from '../useScreens';
import type { UrlObject } from './getRouteInfoFromState';
import { resolveNavigationDestination } from './resolveNavigationDestination';
import type { RouterRegistry } from './routerRegistry';
import { store } from './store';
import type { StoreContextValue } from './storeContext';
import type { LinkToOptions } from './types';

export type NavigationActionContext = Pick<
  StoreContextValue,
  'navigationRef' | 'linking' | 'redirects'
>;

export type NavigationResolution =
  | { status: 'action'; action: NavigationAction }
  | { status: 'invalid'; href: string };

export function getNavigateAction(
  baseHref: string,
  options: LinkToOptions,
  registry: RouterRegistry,
  type: string,
  withAnchor: boolean | undefined,
  singular: SingularOptions | undefined,
  isPreviewNavigation: boolean | undefined,
  { segments, params: routeParams }: Pick<UrlObject, 'segments' | 'params'>,
  { navigationRef, linking, redirects }: NavigationActionContext
): NavigationResolution {
  // TODO(@ubax): Check whether callers can guarantee a navigation ref.
  const ref = navigationRef.current;
  if (ref == null) {
    throw new Error(
      "Couldn't find a navigation object. Is your component inside NavigationContainer?"
    );
  }
  if (!linking || !store.routeNode) {
    throw new Error('Attempted to link to route when no routes are present');
  }

  const href = applyRedirects(
    resolveHrefStringWithSegments(baseHref, { segments, params: routeParams }, options),
    redirects
  )!;

  const state = linking.getStateFromPath!(href, linking.config, segments);
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
    navigationState: ref.getRootState(),
    routeNode: store.routeNode,
    registry,
    action: { type, payload: { singular } },
    withAnchor,
    internalParams,
  });

  return { status: 'action', action };
}
