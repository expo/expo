import type {
  NavigationAction,
  NavigationState,
  Router,
} from '@react-navigation/routers';
import * as React from 'react';

import { NavigationBuilderContext } from './NavigationBuilderContext';

type Options<State extends NavigationState, Action extends NavigationAction> = {
  router: Router<State, Action>;
  getState: () => State;
  setState: (state: State) => void;
  key?: string;
};

/**
 * Hook to handle focus actions for a route.
 * Focus action needs to be treated specially, coz when a nested route is focused,
 * the parent navigators also needs to be focused.
 */
export function useOnRouteFocus<
  State extends NavigationState,
  Action extends NavigationAction,
>({ router, getState, key: sourceRouteKey, setState }: Options<State, Action>) {
  const { onRouteFocus: onRouteFocusParent } = React.useContext(
    NavigationBuilderContext
  );

  return React.useCallback(
    (key: string) => {
      const state = getState();
      const result = router.getStateForRouteFocus(state, key);

      if (result !== state) {
        setState(result);
      }

      if (onRouteFocusParent !== undefined && sourceRouteKey !== undefined) {
        onRouteFocusParent(sourceRouteKey);
      }
    },
    [getState, onRouteFocusParent, router, setState, sourceRouteKey]
  );
}
