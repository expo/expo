import { useMemo } from 'react';
import { type NavigatorState } from 'standard-navigation';

import { type NavigationState, type RenderState } from '../react-navigation/core';
import { useBuildHref } from './useBuildHref';

export function useStandardState(builderState: RenderState<NavigationState>): NavigatorState {
  const buildHref = useBuildHref();
  return useMemo<NavigatorState>(() => {
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
