import { useRef } from 'react';

import { isArrayEqual } from '../react-navigation/core/isArrayEqual';
import { isSetEqual } from '../react-navigation/core/isSetEqual';
import { useClientLayoutEffect } from '../react-navigation/core/useClientLayoutEffect';

export function useSyncRouteNamesOrder({
  backBehavior,
  routeNames,
  state,
  dispatch,
}: {
  backBehavior: string | undefined;
  routeNames: string[];
  state: { key: string; routeNames: string[] };
  dispatch: (action: {
    type: 'ROUTE_NAMES_ORDER_CHANGED';
    payload: { routeNames: string[] };
    target: string;
  }) => void;
}) {
  const previousRouteNamesRef = useRef(routeNames);

  useClientLayoutEffect(() => {
    const previousRouteNames = previousRouteNamesRef.current;
    previousRouteNamesRef.current = routeNames;
    // The router registry is not available during this component's first layout effect.
    if (
      backBehavior === 'order' &&
      !isArrayEqual(previousRouteNames, routeNames) &&
      isSetEqual(state.routeNames, routeNames) &&
      !isArrayEqual(state.routeNames, routeNames)
    ) {
      dispatch({
        type: 'ROUTE_NAMES_ORDER_CHANGED',
        payload: { routeNames },
        target: state.key,
      });
    }
  }, [backBehavior, dispatch, routeNames, state.key, state.routeNames]);
}
