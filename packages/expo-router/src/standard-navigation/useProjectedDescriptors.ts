import { useMemo } from 'react';

import { getPreloadedRoutes } from './getPreloadedRoutes';
import type { NavigationState, ParamListBase, RouteProp } from '../react-navigation/core';

/**
 * Extends the descriptors map with descriptors for the preloaded routes.
 *
 * The standard state projects stack preloaded routes as regular routes after `index`
 * (see `useStandardState`), but `useNavigationBuilder` only describes `state.routes`.
 * Describing the preloaded routes here makes the standard `descriptors` cover every projected
 * route — `describe` stays private to the integration.
 *
 * @internal
 */
export function useProjectedDescriptors<Descriptor>(
  state: NavigationState,
  descriptors: Record<string, Descriptor>,
  describe: (route: RouteProp<ParamListBase>, placeholder: boolean) => Descriptor
): Record<string, Descriptor> {
  const preloadedRoutes = getPreloadedRoutes(state);
  return useMemo(() => {
    if (preloadedRoutes.length === 0) {
      return descriptors;
    }
    const result = { ...descriptors };
    for (const route of preloadedRoutes) {
      result[route.key] = result[route.key] ?? describe(route, true);
    }
    return result;
  }, [descriptors, preloadedRoutes, describe]);
}
