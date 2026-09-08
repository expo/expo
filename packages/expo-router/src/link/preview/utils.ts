import isEqual from 'fast-deep-equal';

import {
  getInternalExpoRouterParams,
  INTERNAL_EXPO_ROUTER_PREVIEW_ID_PARAM_NAME,
  removeInternalExpoRouterParams,
} from '../../navigationParams';
import type { NavigationState } from '../../react-navigation/native';
import type { PreviewActivationRoute } from './native';

export function findPreviewActivationPath(
  state: NavigationState,
  routeKey: string,
  previewId: string
): PreviewActivationRoute[] | undefined {
  const routeIndex = state.routes.findIndex((route) => route.key === routeKey);
  if (routeIndex !== -1) {
    const route = state.routes[routeIndex]!;
    if (
      getInternalExpoRouterParams(route.params)[INTERNAL_EXPO_ROUTER_PREVIEW_ID_PARAM_NAME] !==
        previewId ||
      isDuplicateOfFocusedRoute(state, routeIndex)
    ) {
      return undefined;
    }
    return [{ key: route.key, name: route.name }];
  }

  for (const route of state.routes) {
    if (route.state?.stale === false) {
      const childPath = findPreviewActivationPath(route.state, routeKey, previewId);
      if (childPath) {
        return [{ key: route.key, name: route.name }, ...childPath];
      }
    }
  }
  return undefined;
}

function isDuplicateOfFocusedRoute(state: NavigationState, routeIndex: number): boolean {
  const route = state.routes[routeIndex]!;
  const focusedRoute = state.routes[state.index];
  return (
    routeIndex !== state.index &&
    focusedRoute?.name === route.name &&
    isEqual(
      removeInternalExpoRouterParams(focusedRoute.params ?? {}),
      removeInternalExpoRouterParams(route.params ?? {})
    )
  );
}
