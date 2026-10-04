import { useMemo } from 'react';
import { type NavigatorState } from 'standard-navigation';

import { type NavigationState } from '../react-navigation/core';
import { useBuildHref } from './useBuildHref';

export function useStandardState(builderState: NavigationState): NavigatorState {
  const buildHref = useBuildHref();
  return useMemo<NavigatorState>(() => {
    return {
      index: builderState.index,
      routes: builderState.routes.map((route) => ({
        href: buildHref(route),
        key: route.key,
        name: route.name,
        params: route.params,
        // `makeRestoreRouteAction` needs these to restore cancelled nested transitions.
        path: route.path,
        state: route.state,
      })),
    };
  }, [builderState, buildHref]);
}
