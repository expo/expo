import { use } from 'react';

import { RouterRegistryContext } from '../global-state/routerRegistry';
import { isArrayEqual } from '../react-navigation/core/isArrayEqual';
import { useClientLayoutEffect } from '../react-navigation/core/useClientLayoutEffect';

export function useSyncRouteNamesOrder({
  backBehavior,
  routeNames,
  state,
  dispatch,
}: {
  backBehavior: string | undefined;
  routeNames: string[];
  state: { key: string; routes: { name: string }[] };
  dispatch: (action: {
    type: 'ROUTE_NAMES_ORDER_CHANGED';
    payload: { routeNames: string[] };
    target: string;
  }) => void;
}) {
  const registry = backBehavior === 'order' ? use(RouterRegistryContext) : undefined;

  useClientLayoutEffect(() => {
    const currentRouteNames = state.routes.map((route) => route.name);
    const declaredRouteNames = routeNames.filter((name) => currentRouteNames.includes(name));
    if (
      backBehavior === 'order' &&
      registry?.has(state.key) &&
      !isArrayEqual(currentRouteNames, declaredRouteNames)
    ) {
      dispatch({
        type: 'ROUTE_NAMES_ORDER_CHANGED',
        payload: { routeNames: declaredRouteNames },
        target: state.key,
      });
    }
  }, [backBehavior, dispatch, registry, routeNames, state.key, state.routes]);
}
