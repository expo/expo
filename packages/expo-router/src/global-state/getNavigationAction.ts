import type { RouteNode } from '../Route';
import type { ExpoLinkingOptions } from '../getLinkingConfig';
import { applyRedirects } from '../getRoutesRedirects';
import { resolveHrefStringWithSegments } from '../link/href';
import {
  INTERNAL_EXPO_ROUTER_PREVIEW_ID_PARAM_NAME,
  type InternalExpoRouterParams,
} from '../navigationParams';
import type { NavigationAction } from '../react-navigation/native';
import type { NavigationState } from '../react-navigation/routers';
import type { SingularOptions } from '../useScreens';
import { getRouteInfoFromState } from './getRouteInfoFromState';
import { resolveGuardedNavigation, type GuardRedirect } from './resolveGuardedNavigation';
import { resolveNavigationDestination } from './resolveNavigationDestination';
import type { RouterRegistry } from './routerRegistry';
import type { LinkToOptions, StoreRedirects } from './types';

export type NavigationResolution =
  | { status: 'action'; action: NavigationAction }
  | { status: 'invalid'; href: string }
  | { status: 'blocked' }
  | { status: 'redirect-loop'; hrefs: string[] };

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
  // Set when `baseHref` is the `redirectTo` of a blocked route.
  redirect?: GuardRedirect
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

  const guarded = resolveGuardedNavigation({
    action,
    href,
    targetState: state,
    registry: config.registry,
    redirect,
  });
  if (guarded.status === 'allowed') {
    return { status: 'action', action };
  }
  if (guarded.status !== 'redirect') {
    return guarded;
  }
  return getNavigateAction(
    guarded.href,
    options,
    config,
    type,
    withAnchor,
    singular,
    previewKey,
    navigationState,
    guarded.redirect
  );
}
