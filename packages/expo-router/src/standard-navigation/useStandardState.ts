import { useMemo } from 'react';
import { type NavigatorState } from 'standard-navigation';

import { getPreloadedRoutes } from './getPreloadedRoutes';
import { useBuildHref } from './useBuildHref';
import { type NavigationState } from '../react-navigation/core';

export function useStandardState(builderState: NavigationState): NavigatorState {
  const buildHref = useBuildHref();
  return useMemo<NavigatorState>(() => {
    // TODO(@ubax): https://linear.app/expo/issue/ENG-21638/merge-preloaded-and-active-routes-into-single-array
    // Stack states keep preloaded routes in a separate `preloadedRoutes` array. The standard
    // contract has no such concept, so they are projected as regular routes positioned after
    // `index`
    const routes = [...builderState.routes, ...getPreloadedRoutes(builderState)];
    return {
      index: builderState.index,
      routes: routes.map<NavigatorState['routes'][number]>((route) => ({
        href: buildHref(route),
        key: route.key,
        name: route.name,
        params: route.params,
      })),
    };
  }, [builderState, buildHref]);
}
