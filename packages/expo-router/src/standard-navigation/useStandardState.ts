import { useMemo } from 'react';
import { type NavigatorState } from 'standard-navigation';

import { useBuildHref } from './useBuildHref';
import { type NavigationState } from '../react-navigation/core';

export function useStandardState(builderState: NavigationState): NavigatorState {
  const buildHref = useBuildHref();
  return useMemo<NavigatorState>(() => {
    // Preloaded/inactive stack routes already live in `routes` after `index`, which matches the
    // standard contract, so the state projects directly.
    return {
      index: builderState.index,
      routes: builderState.routes.map<NavigatorState['routes'][number]>((route) => ({
        href: buildHref(route),
        key: route.key,
        name: route.name,
        params: route.params,
      })),
    };
  }, [builderState, buildHref]);
}
